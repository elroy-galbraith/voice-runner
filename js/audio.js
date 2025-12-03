/**
 * audio.js - Audio capture and voice activity detection for Voice Runner
 * Handles microphone permissions, recording, and basic audio analysis
 */

const Audio = (function() {
    let audioContext = null;
    let analyser = null;
    let mediaStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    
    // State
    let isInitialized = false;
    let isRecording = false;
    let isSpeaking = false;
    
    // Configuration
    const CONFIG = {
        fftSize: 256,
        smoothingTimeConstant: 0.8,
        silenceThreshold: 0.02,      // Below this = silence
        speechThreshold: 0.05,       // Above this = speech
        silenceDebounceMs: 300,      // How long silence before considered stopped
        minSpeechDurationMs: 200,    // Minimum speech to count as valid
        sampleRate: 44100
    };
    
    // Callbacks
    let onSpeechStart = null;
    let onSpeechEnd = null;
    let onVolumeChange = null;
    let onError = null;
    
    // Timing
    let speechStartTime = null;
    let lastSpeechTime = null;
    let silenceTimer = null;
    
    // Audio analysis
    let dataArray = null;
    let animationFrameId = null;
    let peakAmplitude = 0;
    let clippingDetected = false;
    
    /**
     * Request microphone permission and initialize audio
     */
    async function init() {
        try {
            // Request microphone access
            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: CONFIG.sampleRate
                }
            });
            
            // Create audio context
            audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: CONFIG.sampleRate
            });
            
            // Create analyser for volume detection
            analyser = audioContext.createAnalyser();
            analyser.fftSize = CONFIG.fftSize;
            analyser.smoothingTimeConstant = CONFIG.smoothingTimeConstant;
            
            // Connect microphone to analyser
            const source = audioContext.createMediaStreamSource(mediaStream);
            source.connect(analyser);
            
            // Create data array for analysis
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            isInitialized = true;
            console.log('Audio initialized successfully');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            if (onError) {
                onError(error);
            }
            return false;
        }
    }
    
    /**
     * Check if microphone permission is granted
     */
    async function checkPermission() {
        try {
            const result = await navigator.permissions.query({ name: 'microphone' });
            return result.state;
        } catch {
            // Firefox doesn't support permissions query for microphone
            return 'prompt';
        }
    }
    
    /**
     * Start recording and voice activity detection
     */
    function startRecording() {
        if (!isInitialized) {
            console.error('Audio not initialized');
            return false;
        }
        
        if (isRecording) {
            console.warn('Already recording');
            return true;
        }
        
        // Reset state
        recordedChunks = [];
        peakAmplitude = 0;
        clippingDetected = false;
        speechStartTime = null;
        lastSpeechTime = null;
        isSpeaking = false;
        
        // Create media recorder
        const options = { mimeType: 'audio/webm;codecs=opus' };
        
        // Fallback for Safari
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/mp4';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = '';
                }
            }
        }
        
        try {
            mediaRecorder = new MediaRecorder(mediaStream, options);
        } catch (e) {
            mediaRecorder = new MediaRecorder(mediaStream);
        }
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.start(100); // Collect data every 100ms
        isRecording = true;
        
        // Start volume monitoring
        startVolumeMonitoring();
        
        console.log('Recording started');
        return true;
    }
    
    /**
     * Stop recording and return the audio blob
     */
    async function stopRecording() {
        if (!isRecording) {
            return null;
        }
        
        // Stop volume monitoring
        stopVolumeMonitoring();
        
        // Clear silence timer
        if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
        }
        
        return new Promise((resolve) => {
            mediaRecorder.onstop = () => {
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const blob = new Blob(recordedChunks, { type: mimeType });
                
                isRecording = false;
                
                resolve({
                    blob: blob,
                    duration: speechStartTime ? (lastSpeechTime || Date.now()) - speechStartTime : 0,
                    peakAmplitude: peakAmplitude,
                    clipping: clippingDetected,
                    hadSpeech: speechStartTime !== null
                });
            };
            
            mediaRecorder.stop();
        });
    }
    
    /**
     * Monitor volume levels for voice activity detection
     */
    function startVolumeMonitoring() {
        const checkVolume = () => {
            if (!isRecording) return;
            
            analyser.getByteTimeDomainData(dataArray);
            
            // Calculate RMS volume
            let sum = 0;
            let max = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const normalized = (dataArray[i] - 128) / 128;
                sum += normalized * normalized;
                max = Math.max(max, Math.abs(normalized));
            }
            const rms = Math.sqrt(sum / dataArray.length);
            
            // Track peak
            if (rms > peakAmplitude) {
                peakAmplitude = rms;
            }
            
            // Check for clipping
            if (max > 0.95) {
                clippingDetected = true;
            }
            
            // Send volume to callback
            if (onVolumeChange) {
                onVolumeChange(rms);
            }
            
            // Voice activity detection
            const now = Date.now();
            
            if (rms > CONFIG.speechThreshold) {
                // Speech detected
                lastSpeechTime = now;
                
                if (!isSpeaking) {
                    // Speech just started
                    isSpeaking = true;
                    speechStartTime = now;
                    
                    if (silenceTimer) {
                        clearTimeout(silenceTimer);
                        silenceTimer = null;
                    }
                    
                    if (onSpeechStart) {
                        onSpeechStart();
                    }
                }
            } else if (isSpeaking && rms < CONFIG.silenceThreshold) {
                // Potential end of speech
                if (!silenceTimer) {
                    silenceTimer = setTimeout(() => {
                        if (isSpeaking) {
                            isSpeaking = false;
                            
                            // Check if speech was long enough
                            const duration = lastSpeechTime - speechStartTime;
                            
                            if (onSpeechEnd && duration >= CONFIG.minSpeechDurationMs) {
                                onSpeechEnd({
                                    duration: duration,
                                    peakAmplitude: peakAmplitude
                                });
                            }
                        }
                    }, CONFIG.silenceDebounceMs);
                }
            }
            
            animationFrameId = requestAnimationFrame(checkVolume);
        };
        
        checkVolume();
    }
    
    /**
     * Stop volume monitoring
     */
    function stopVolumeMonitoring() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
    
    /**
     * Get current volume level (0-1)
     */
    function getVolume() {
        if (!analyser || !dataArray) return 0;
        
        analyser.getByteTimeDomainData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
        }
        
        return Math.sqrt(sum / dataArray.length);
    }
    
    /**
     * Set callbacks
     */
    function setCallbacks({ speechStart, speechEnd, volumeChange, error }) {
        if (speechStart) onSpeechStart = speechStart;
        if (speechEnd) onSpeechEnd = speechEnd;
        if (volumeChange) onVolumeChange = volumeChange;
        if (error) onError = error;
    }
    
    /**
     * Check if phrase was likely spoken (permissive matching)
     * Returns confidence score 0-1
     */
    function evaluateSpeech(expectedPhrase, recordingResult) {
        if (!recordingResult.hadSpeech) {
            return { accepted: false, confidence: 0, reason: 'no_speech' };
        }
        
        const expectedDuration = Phrases.estimateDuration(expectedPhrase);
        const actualDuration = recordingResult.duration;
        
        // Duration check (very permissive)
        const durationRatio = actualDuration / expectedDuration;
        
        if (durationRatio < 0.3) {
            return { accepted: false, confidence: 0.2, reason: 'too_short' };
        }
        
        if (durationRatio > 3.0) {
            return { accepted: false, confidence: 0.3, reason: 'too_long' };
        }
        
        // Volume check
        if (recordingResult.peakAmplitude < 0.02) {
            return { accepted: false, confidence: 0.3, reason: 'too_quiet' };
        }
        
        // Calculate confidence based on duration match
        let confidence = 1.0;
        
        if (durationRatio < 0.5) {
            confidence = 0.5 + (durationRatio - 0.3) * 2.5; // 0.5 - 1.0
        } else if (durationRatio > 2.0) {
            confidence = 1.0 - (durationRatio - 2.0) * 0.5; // 0.5 - 1.0
        }
        
        // Boost confidence for good amplitude
        if (recordingResult.peakAmplitude > 0.1) {
            confidence = Math.min(1.0, confidence + 0.1);
        }
        
        return { 
            accepted: true, 
            confidence: confidence,
            reason: 'accepted'
        };
    }
    
    /**
     * Resume audio context (needed after user interaction on mobile)
     */
    async function resume() {
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }
    }
    
    /**
     * Clean up resources
     */
    function destroy() {
        stopVolumeMonitoring();
        
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
        }
        
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        
        if (audioContext) {
            audioContext.close();
        }
        
        isInitialized = false;
        isRecording = false;
    }
    
    /**
     * Get current state
     */
    function getState() {
        return {
            initialized: isInitialized,
            recording: isRecording,
            speaking: isSpeaking
        };
    }
    
    // Public API
    return {
        init,
        checkPermission,
        startRecording,
        stopRecording,
        getVolume,
        setCallbacks,
        evaluateSpeech,
        resume,
        destroy,
        getState
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Audio;
}
