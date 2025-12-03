/**
 * app.js - Main Voice Runner Application Controller
 * Manages screen flow, user interactions, and ties all modules together
 */

(function() {
    // Screen elements
    const screens = {
        loading: document.getElementById('loading-screen'),
        landing: document.getElementById('landing-screen'),
        permissions: document.getElementById('permissions-screen'),
        profile: document.getElementById('profile-screen'),
        tutorial: document.getElementById('tutorial-screen'),
        calibration: document.getElementById('calibration-screen'),
        game: document.getElementById('game-screen'),
        gameover: document.getElementById('gameover-screen')
    };
    
    // UI elements
    const ui = {
        // Landing
        startBtn: document.getElementById('start-btn'),
        
        // Permissions
        allowMicBtn: document.getElementById('allow-mic-btn'),
        
        // Profile
        ageRange: document.getElementById('age-range'),
        parish: document.getElementById('parish'),
        skipProfileBtn: document.getElementById('skip-profile-btn'),
        saveProfileBtn: document.getElementById('save-profile-btn'),
        
        // Tutorial
        startTutorialBtn: document.getElementById('start-tutorial-btn'),
        
        // Calibration
        calibrationPhrase: document.getElementById('calibration-phrase'),
        calibrationStatus: document.getElementById('calibration-status'),
        calibrationDots: document.querySelectorAll('.cal-dot'),
        volumeBars: document.querySelectorAll('.vol-bar'),
        
        // Game HUD
        score: document.getElementById('score'),
        lives: document.getElementById('lives'),
        level: document.getElementById('level'),
        combo: document.getElementById('combo'),
        currentPhrase: document.getElementById('current-phrase'),
        listeningProgress: document.querySelector('.listening-progress'),
        feedbackOverlay: document.getElementById('feedback-overlay'),
        
        // Game Over
        finalScore: document.getElementById('final-score'),
        phrasesSpoken: document.getElementById('phrases-spoken'),
        maxLevel: document.getElementById('max-level'),
        accuracy: document.getElementById('accuracy'),
        bestCombo: document.getElementById('best-combo'),
        phrasesContributed: document.getElementById('phrases-contributed'),
        playAgainBtn: document.getElementById('play-again-btn'),
        shareBtn: document.getElementById('share-btn'),
        uploadStatus: document.getElementById('upload-status'),
        
        // Global
        offlineBanner: document.getElementById('offline-banner')
    };
    
    // State
    let currentSession = null;
    let calibrationPhrases = [];
    let calibrationIndex = 0;
    let isCalibrating = false;
    
    /**
     * Initialize the application
     */
    async function init() {
        console.log('Initializing Voice Runner...');
        
        // Initialize storage
        await Storage.init();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup offline detection
        setupOfflineDetection();
        
        // Check if returning user
        const isFirstTime = await Storage.isFirstTime();
        
        // Simulate loading
        setTimeout(() => {
            showScreen('landing');
        }, 2000);
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Landing screen
        ui.startBtn.addEventListener('click', handleStart);
        
        // Permissions screen
        ui.allowMicBtn.addEventListener('click', handleAllowMic);
        
        // Profile screen
        ui.skipProfileBtn.addEventListener('click', () => handleProfile(true));
        ui.saveProfileBtn.addEventListener('click', () => handleProfile(false));
        
        // Tutorial screen
        ui.startTutorialBtn.addEventListener('click', startCalibration);
        
        // Game over screen
        ui.playAgainBtn.addEventListener('click', handlePlayAgain);
        ui.shareBtn.addEventListener('click', handleShare);
        
        // Audio callbacks
        Audio.setCallbacks({
            speechStart: handleSpeechStart,
            speechEnd: handleSpeechEnd,
            volumeChange: handleVolumeChange,
            error: handleAudioError
        });
        
        // Game callbacks
        Game.setCallbacks({
            scoreChange: handleScoreChange,
            livesChange: handleLivesChange,
            levelChange: handleLevelChange,
            comboChange: handleComboChange,
            phraseChange: handlePhraseChange,
            gameOver: handleGameOver,
            obstacleApproaching: handleObstacleApproaching,
            obstacleDestroyed: handleObstacleDestroyed,
            obstacleCollision: handleObstacleCollision
        });
    }
    
    /**
     * Setup offline detection
     */
    function setupOfflineDetection() {
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                ui.offlineBanner.classList.add('hidden');
                // Try to sync when back online
                Storage.syncWithServer();
            } else {
                ui.offlineBanner.classList.remove('hidden');
            }
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        updateOnlineStatus();
    }
    
    /**
     * Show a specific screen
     */
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }
    }
    
    /**
     * Handle start button click
     */
    async function handleStart() {
        // Check microphone permission
        const permission = await Audio.checkPermission();
        
        if (permission === 'granted') {
            // Already have permission, initialize audio
            const success = await Audio.init();
            if (success) {
                // Check if we have profile
                const profile = await Storage.getProfile();
                if (profile) {
                    showScreen('tutorial');
                } else {
                    showScreen('profile');
                }
            } else {
                showScreen('permissions');
            }
        } else {
            showScreen('permissions');
        }
    }
    
    /**
     * Handle microphone permission request
     */
    async function handleAllowMic() {
        ui.allowMicBtn.textContent = 'Requesting...';
        ui.allowMicBtn.disabled = true;
        
        const success = await Audio.init();
        
        if (success) {
            Storage.setConsent(true);
            
            // Check for existing profile
            const profile = await Storage.getProfile();
            if (profile) {
                showScreen('tutorial');
            } else {
                showScreen('profile');
            }
        } else {
            ui.allowMicBtn.textContent = 'ALLOW MICROPHONE';
            ui.allowMicBtn.disabled = false;
            alert('Microphone access is required to play. Please allow microphone access and try again.');
        }
    }
    
    /**
     * Handle profile submission
     */
    async function handleProfile(skip) {
        if (!skip) {
            const patoisRadio = document.querySelector('input[name="patois"]:checked');
            
            const profile = {
                ageRange: ui.ageRange.value || null,
                parish: ui.parish.value || null,
                patoisFirst: patoisRadio ? patoisRadio.value : null
            };
            
            await Storage.saveProfile(profile);
        }
        
        showScreen('tutorial');
    }
    
    /**
     * Start calibration round
     */
    async function startCalibration() {
        showScreen('calibration');
        
        // Get calibration phrases
        calibrationPhrases = Phrases.getCalibrationPhrases(3);
        calibrationIndex = 0;
        isCalibrating = true;
        
        // Create session
        currentSession = await Storage.createSession();
        
        // Initialize game canvas
        Game.init(document.getElementById('game-canvas'));
        
        // Show first phrase
        showCalibrationPhrase();
        
        // Start recording
        await Audio.resume();
        Audio.startRecording();
    }
    
    /**
     * Show current calibration phrase
     */
    function showCalibrationPhrase() {
        if (calibrationIndex >= calibrationPhrases.length) {
            finishCalibration();
            return;
        }
        
        const phrase = calibrationPhrases[calibrationIndex];
        ui.calibrationPhrase.textContent = `"${phrase.text}"`;
        ui.calibrationStatus.textContent = 'Speak now...';
        
        // Update progress dots
        ui.calibrationDots.forEach((dot, i) => {
            dot.classList.remove('active', 'done');
            if (i < calibrationIndex) {
                dot.classList.add('done');
            } else if (i === calibrationIndex) {
                dot.classList.add('active');
            }
        });
    }
    
    /**
     * Finish calibration and start game
     */
    async function finishCalibration() {
        isCalibrating = false;
        
        // Stop recording
        const result = await Audio.stopRecording();
        
        // Update session with calibration phrases
        await Storage.updateSession(currentSession.id, {
            calibrationPhrases: calibrationPhrases.map(p => p.id)
        });
        
        // Mark as played
        Storage.markPlayed();
        
        // Start the game
        startGame();
    }
    
    /**
     * Start the main game
     */
    async function startGame() {
        showScreen('game');
        
        // Resume audio context (required after user interaction)
        await Audio.resume();
        
        // Start game
        Game.start();
        
        // Start recording for gameplay
        Audio.startRecording();
    }
    
    /**
     * Handle speech start detection
     */
    function handleSpeechStart() {
        ui.listeningProgress.style.width = '50%';
        ui.listeningProgress.style.background = 'linear-gradient(90deg, #22c55e, #ffc857)';
    }
    
    /**
     * Handle speech end detection
     */
    async function handleSpeechEnd(speechData) {
        if (isCalibrating) {
            // Save calibration recording
            const phrase = calibrationPhrases[calibrationIndex];
            
            // Stop and get recording
            const result = await Audio.stopRecording();
            
            if (result.hadSpeech) {
                await Storage.saveRecording(currentSession.id, {
                    ...phrase,
                    gameLevel: 0,
                    gameSpeed: 0,
                    obstacleDistance: 0,
                    speechOnsetMs: 0,
                    speechDurationMs: result.duration,
                    outcome: 'calibration',
                    score: 0,
                    combo: 0,
                    peakAmplitude: result.peakAmplitude,
                    clipping: result.clipping
                }, result.blob);
                
                ui.calibrationStatus.textContent = 'Great! ✓';
                
                // Move to next phrase
                calibrationIndex++;
                
                setTimeout(() => {
                    // Start recording again for next phrase
                    Audio.startRecording();
                    showCalibrationPhrase();
                }, 800);
            } else {
                ui.calibrationStatus.textContent = 'Try again - speak louder!';
                Audio.startRecording();
            }
        } else if (Game.isPlaying()) {
            // Game speech evaluation
            const phrase = Game.getCurrentPhrase();
            if (!phrase) return;
            
            // Stop recording to get the audio
            const result = await Audio.stopRecording();
            
            // Evaluate speech
            const evaluation = Audio.evaluateSpeech(phrase, result);
            
            if (evaluation.accepted) {
                // Save recording
                await Storage.saveRecording(currentSession.id, {
                    ...phrase,
                    gameLevel: Game.getStats().level,
                    gameSpeed: Game.getSpeed(),
                    obstacleDistance: 0,
                    speechOnsetMs: speechData.duration,
                    speechDurationMs: result.duration,
                    outcome: 'success',
                    score: 0, // Will be updated
                    combo: Game.getStats().combo,
                    peakAmplitude: result.peakAmplitude,
                    clipping: result.clipping
                }, result.blob);
                
                // Tell game about success
                Game.phraseSuccess(evaluation);
            } else {
                Game.phraseFailure(evaluation.reason);
            }
            
            // Continue recording
            Audio.startRecording();
        }
        
        ui.listeningProgress.style.width = '0%';
    }
    
    /**
     * Handle volume changes (for visualizer)
     */
    function handleVolumeChange(volume) {
        // Update calibration visualizer
        if (isCalibrating) {
            ui.volumeBars.forEach((bar, i) => {
                const height = Math.min(35, 10 + volume * 200 * (1 + Math.random() * 0.3));
                bar.style.height = height + 'px';
                bar.style.background = volume > 0.05 ? '#ffc857' : '#4fb89a';
            });
        }
        
        // Update game listening bar
        if (Game.isPlaying()) {
            const progress = Math.min(100, volume * 400);
            ui.listeningProgress.style.width = progress + '%';
        }
    }
    
    /**
     * Handle audio errors
     */
    function handleAudioError(error) {
        console.error('Audio error:', error);
    }
    
    /**
     * Handle score changes
     */
    function handleScoreChange(newScore, points) {
        ui.score.textContent = newScore;
        
        if (points) {
            // Could add floating score animation here
        }
    }
    
    /**
     * Handle lives changes
     */
    function handleLivesChange(newLives) {
        const hearts = ui.lives.querySelectorAll('.heart');
        hearts.forEach((heart, i) => {
            if (i >= newLives) {
                heart.classList.add('lost');
            } else {
                heart.classList.remove('lost');
            }
        });
    }
    
    /**
     * Handle level changes
     */
    function handleLevelChange(newLevel) {
        ui.level.textContent = newLevel;
    }
    
    /**
     * Handle combo changes
     */
    function handleComboChange(newCombo) {
        if (newCombo > 1) {
            ui.combo.classList.remove('hidden');
            ui.combo.querySelector('.combo-value').textContent = newCombo + 'x';
        } else {
            ui.combo.classList.add('hidden');
        }
    }
    
    /**
     * Handle phrase changes
     */
    function handlePhraseChange(phrase) {
        if (phrase) {
            ui.currentPhrase.textContent = `"${phrase.text}"`;
        } else {
            ui.currentPhrase.textContent = 'Get ready...';
        }
    }
    
    /**
     * Handle obstacle approaching
     */
    function handleObstacleApproaching(obstacle, phrase) {
        // Phrase is now displayed, player needs to speak
    }
    
    /**
     * Handle obstacle destroyed
     */
    function handleObstacleDestroyed(obstacle, points, rating) {
        showFeedback(rating, '+' + points);
    }
    
    /**
     * Handle obstacle collision
     */
    function handleObstacleCollision(obstacle) {
        showFeedback('miss', 'MISS!');
        
        // Vibrate on mobile if supported
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
    
    /**
     * Show feedback overlay
     */
    function showFeedback(type, text) {
        ui.feedbackOverlay.className = 'feedback-overlay ' + type;
        ui.feedbackOverlay.querySelector('.feedback-text')?.remove();
        
        const span = document.createElement('span');
        span.className = 'feedback-text';
        span.textContent = text;
        ui.feedbackOverlay.appendChild(span);
        
        ui.feedbackOverlay.classList.remove('hidden');
        
        setTimeout(() => {
            ui.feedbackOverlay.classList.add('hidden');
        }, 600);
    }
    
    /**
     * Handle game over
     */
    async function handleGameOver(stats) {
        // Stop recording
        await Audio.stopRecording();
        
        // Update session
        await Storage.updateSession(currentSession.id, {
            totalPhrasesAttempted: stats.phrasesAttempted,
            totalPhrasesSucceeded: stats.phrasesSucceeded,
            finalScore: stats.score,
            maxLevelReached: stats.level,
            bestCombo: stats.maxCombo,
            timestampEnd: new Date().toISOString()
        });
        
        // Update UI
        ui.finalScore.textContent = stats.score;
        ui.phrasesSpoken.textContent = stats.phrasesSucceeded;
        ui.maxLevel.textContent = stats.level;
        ui.accuracy.textContent = stats.accuracy + '%';
        ui.bestCombo.textContent = stats.maxCombo + 'x';
        ui.phrasesContributed.textContent = stats.phrasesSucceeded;
        
        // Show game over screen
        showScreen('gameover');
        
        // Attempt to sync data
        syncData();
    }
    
    /**
     * Sync data with server
     */
    async function syncData() {
        ui.uploadStatus.innerHTML = '<span class="upload-icon">☁️</span><span class="upload-text">Uploading your contributions...</span>';
        
        try {
            const result = await Storage.syncWithServer();
            
            if (result.success) {
                ui.uploadStatus.classList.add('done');
                ui.uploadStatus.innerHTML = '<span class="upload-icon">✓</span><span class="upload-text">Data saved successfully!</span>';
            } else if (result.reason === 'offline') {
                ui.uploadStatus.classList.add('error');
                ui.uploadStatus.innerHTML = '<span class="upload-icon">📴</span><span class="upload-text">Offline - data saved locally</span>';
            }
        } catch (error) {
            console.error('Sync error:', error);
            ui.uploadStatus.classList.add('error');
            ui.uploadStatus.innerHTML = '<span class="upload-icon">⚠️</span><span class="upload-text">Upload failed - data saved locally</span>';
        }
    }
    
    /**
     * Handle play again
     */
    async function handlePlayAgain() {
        // Create new session
        currentSession = await Storage.createSession();
        
        // Start game
        startGame();
    }
    
    /**
     * Handle share button
     */
    function handleShare() {
        const stats = Game.getStats();
        const text = `🐦 Voice Runner\n\nScore: ${stats.score}\nLevel: ${stats.level}\nAccuracy: ${stats.accuracy}%\n\nHelp improve emergency services for Caribbean communities!\n\n🎮 Play now:`;
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'Voice Runner',
                text: text,
                url: url
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            const fullText = text + ' ' + url;
            navigator.clipboard.writeText(fullText).then(() => {
                alert('Score copied to clipboard!');
            }).catch(() => {
                alert('Share this link: ' + url);
            });
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
