/**
 * storage.js - Offline-first storage and sync for Voice Runner
 * Uses IndexedDB for local persistence, syncs when online
 */

const Storage = (function() {
    const DB_NAME = 'VoiceRunnerDB';
    const DB_VERSION = 1;
    const STORES = {
        RECORDINGS: 'recordings',
        SESSIONS: 'sessions',
        PROFILE: 'profile',
        PENDING: 'pendingUploads'
    };
    
    // API endpoint - uses localhost for dev, change for production
    const API_BASE = window.location.hostname === 'localhost'
        ? 'http://localhost:8000/api'
        : 'https://voice-runner-production.up.railway.app/api';
    
    let db = null;
    
    /**
     * Initialize the database
     */
    async function init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                
                // Recordings store - audio blobs with metadata
                if (!database.objectStoreNames.contains(STORES.RECORDINGS)) {
                    const recordingsStore = database.createObjectStore(STORES.RECORDINGS, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    recordingsStore.createIndex('sessionId', 'sessionId', { unique: false });
                    recordingsStore.createIndex('uploaded', 'uploaded', { unique: false });
                }
                
                // Sessions store - game session metadata
                if (!database.objectStoreNames.contains(STORES.SESSIONS)) {
                    const sessionsStore = database.createObjectStore(STORES.SESSIONS, { 
                        keyPath: 'id' 
                    });
                    sessionsStore.createIndex('uploaded', 'uploaded', { unique: false });
                }
                
                // Profile store - user demographics (single record)
                if (!database.objectStoreNames.contains(STORES.PROFILE)) {
                    database.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
                }
                
                // Pending uploads queue
                if (!database.objectStoreNames.contains(STORES.PENDING)) {
                    const pendingStore = database.createObjectStore(STORES.PENDING, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    pendingStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }
    
    /**
     * Generate a UUID
     */
    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Get or create player ID (persistent across sessions)
     */
    async function getPlayerId() {
        let playerId = localStorage.getItem('voicerunner_player_id');
        if (!playerId) {
            playerId = generateId();
            localStorage.setItem('voicerunner_player_id', playerId
            );
        }
        return playerId;
    }
    
    /**
     * Save player profile
     */
    async function saveProfile(profile) {
        const tx = db.transaction(STORES.PROFILE, 'readwrite');
        const store = tx.objectStore(STORES.PROFILE);
        
        const record = {
            id: 'player_profile',
            ...profile,
            updatedAt: new Date().toISOString()
        };
        
        store.put(record);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(record);
            tx.onerror = () => reject(tx.error);
        });
    }
    
    /**
     * Get player profile
     */
    async function getProfile() {
        const tx = db.transaction(STORES.PROFILE, 'readonly');
        const store = tx.objectStore(STORES.PROFILE);
        const request = store.get('player_profile');
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Start a new game session
     */
    async function createSession() {
        const playerId = await getPlayerId();
        const profile = await getProfile();
        
        const session = {
            id: generateId(),
            playerId: playerId,
            deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            browser: navigator.userAgent.substring(0, 100),
            demographicAgeRange: profile?.ageRange || null,
            demographicParish: profile?.parish || null,
            demographicPatoisFirst: profile?.patoisFirst || null,
            calibrationPhrases: [],
            totalPhrasesAttempted: 0,
            totalPhrasesSucceeded: 0,
            finalScore: 0,
            maxLevelReached: 1,
            bestCombo: 1,
            sessionDurationSeconds: 0,
            timestampStart: new Date().toISOString(),
            timestampEnd: null,
            uploaded: false
        };
        
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const store = tx.objectStore(STORES.SESSIONS);
        store.add(session);
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(session);
            tx.onerror = () => reject(tx.error);
        });
    }
    
    /**
     * Update session data
     */
    async function updateSession(sessionId, updates) {
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const store = tx.objectStore(STORES.SESSIONS);
        const request = store.get(sessionId);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const session = request.result;
                if (!session) {
                    reject(new Error('Session not found'));
                    return;
                }
                
                const updated = { ...session, ...updates };
                store.put(updated);
                
                tx.oncomplete = () => resolve(updated);
                tx.onerror = () => reject(tx.error);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Save a recording
     */
    async function saveRecording(sessionId, phraseData, audioBlob) {
        const recording = {
            sessionId: sessionId,
            phraseId: phraseData.id,
            phraseText: phraseData.text,
            phraseTier: phraseData.tier,
            phraseCategory: phraseData.category,
            phraseRegister: phraseData.register,
            gameLevel: phraseData.gameLevel,
            gameSpeed: phraseData.gameSpeed,
            obstacleDistanceAtSpeechStart: phraseData.obstacleDistance,
            timeToSpeechOnsetMs: phraseData.speechOnsetMs,
            speechDurationMs: phraseData.speechDurationMs,
            outcome: phraseData.outcome,
            scoreAwarded: phraseData.score,
            comboMultiplier: phraseData.combo,
            audioBlob: audioBlob,
            audioPeakAmplitude: phraseData.peakAmplitude || null,
            audioClippingDetected: phraseData.clipping || false,
            timestampUtc: new Date().toISOString(),
            uploaded: false
        };
        
        const tx = db.transaction(STORES.RECORDINGS, 'readwrite');
        const store = tx.objectStore(STORES.RECORDINGS);
        store.add(recording);
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(recording);
            tx.onerror = () => reject(tx.error);
        });
    }
    
    /**
     * Get all unuploaded recordings for a session
     */
    async function getSessionRecordings(sessionId) {
        const tx = db.transaction(STORES.RECORDINGS, 'readonly');
        const store = tx.objectStore(STORES.RECORDINGS);
        const index = store.index('sessionId');
        const request = index.getAll(sessionId);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Get all unuploaded data
     */
    async function getPendingUploads() {
        try {
            const sessionsTx = db.transaction(STORES.SESSIONS, 'readonly');
            const sessionsStore = sessionsTx.objectStore(STORES.SESSIONS);

            // Get all sessions and filter by uploaded field
            const allSessions = await new Promise((resolve, reject) => {
                const request = sessionsStore.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });

            const sessions = allSessions.filter(s => s.uploaded === false);

            const recordingsTx = db.transaction(STORES.RECORDINGS, 'readonly');
            const recordingsStore = recordingsTx.objectStore(STORES.RECORDINGS);

            // Get all recordings and filter by uploaded field
            const allRecordings = await new Promise((resolve, reject) => {
                const request = recordingsStore.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });

            const recordings = allRecordings.filter(r => r.uploaded === false);

            return { sessions, recordings };
        } catch (error) {
            console.error('Error getting pending uploads:', error);
            return { sessions: [], recordings: [] };
        }
    }
    
    /**
     * Mark items as uploaded
     */
    async function markUploaded(type, ids) {
        const storeName = type === 'session' ? STORES.SESSIONS : STORES.RECORDINGS;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        for (const id of ids) {
            const request = store.get(id);
            request.onsuccess = () => {
                const record = request.result;
                if (record) {
                    record.uploaded = true;
                    store.put(record);
                }
            };
        }
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    
    /**
     * Attempt to sync data with server
     */
    async function syncWithServer() {
        if (!navigator.onLine) {
            console.log('Offline - skipping sync');
            return { success: false, reason: 'offline' };
        }
        
        const pending = await getPendingUploads();
        
        if (pending.sessions.length === 0 && pending.recordings.length === 0) {
            console.log('Nothing to sync');
            return { success: true, uploaded: 0 };
        }
        
        console.log(`Syncing ${pending.sessions.length} sessions, ${pending.recordings.length} recordings`);
        
        let uploadedCount = 0;
        
        // Upload sessions first
        for (const session of pending.sessions) {
            if (!session.timestampEnd) continue; // Skip incomplete sessions
            
            try {
                // Get recordings for this session
                const recordings = pending.recordings.filter(r => r.sessionId === session.id);
                
                // Prepare form data with audio files
                const formData = new FormData();
                formData.append('session', JSON.stringify({
                    ...session,
                    audioBlob: undefined // Don't include blob in JSON
                }));
                
                // Attach audio files
                recordings.forEach((rec, idx) => {
                    if (rec.audioBlob) {
                        formData.append(`audio_${idx}`, rec.audioBlob, `${session.id}_${rec.phraseId}.webm`);
                        formData.append(`audio_${idx}_meta`, JSON.stringify({
                            ...rec,
                            audioBlob: undefined
                        }));
                    }
                });
                
                const response = await fetch(`${API_BASE}/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    await markUploaded('session', [session.id]);
                    await markUploaded('recording', recordings.map(r => r.id));
                    uploadedCount += 1 + recordings.length;
                } else {
                    console.error('Upload failed:', response.status);
                }
            } catch (error) {
                console.error('Sync error for session:', session.id, error);
            }
        }
        
        return { success: true, uploaded: uploadedCount };
    }
    
    /**
     * Get storage stats
     */
    async function getStats() {
        const pending = await getPendingUploads();
        
        // Estimate storage size
        let totalSize = 0;
        for (const rec of pending.recordings) {
            if (rec.audioBlob) {
                totalSize += rec.audioBlob.size;
            }
        }
        
        return {
            pendingSessions: pending.sessions.length,
            pendingRecordings: pending.recordings.length,
            estimatedSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    }
    
    /**
     * Clear all uploaded data (free up space)
     */
    async function clearUploaded() {
        // Clear uploaded recordings
        const recTx = db.transaction(STORES.RECORDINGS, 'readwrite');
        const recStore = recTx.objectStore(STORES.RECORDINGS);
        const recIndex = recStore.index('uploaded');
        const recRequest = recIndex.openCursor(IDBKeyRange.only(true));
        
        recRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }
        };
        
        await new Promise(resolve => recTx.oncomplete = resolve);
        
        // Clear uploaded sessions (keep last 5 for reference)
        const sessTx = db.transaction(STORES.SESSIONS, 'readwrite');
        const sessStore = sessTx.objectStore(STORES.SESSIONS);
        const sessIndex = sessStore.index('uploaded');
        const sessRequest = sessIndex.getAll(true);
        
        await new Promise((resolve) => {
            sessRequest.onsuccess = () => {
                const sessions = sessRequest.result;
                // Keep most recent 5
                const toDelete = sessions.slice(0, -5);
                toDelete.forEach(s => sessStore.delete(s.id));
                resolve();
            };
        });
    }
    
    /**
     * Check if first time user
     */
    async function isFirstTime() {
        return !localStorage.getItem('voicerunner_played');
    }
    
    /**
     * Mark user as having played
     */
    function markPlayed() {
        localStorage.setItem('voicerunner_played', 'true');
    }
    
    /**
     * Check consent status
     */
    function hasConsent() {
        return localStorage.getItem('voicerunner_consent') === 'true';
    }
    
    /**
     * Set consent status
     */
    function setConsent(value) {
        localStorage.setItem('voicerunner_consent', value ? 'true' : 'false');
    }
    
    // Public API
    return {
        init,
        generateId,
        getPlayerId,
        saveProfile,
        getProfile,
        createSession,
        updateSession,
        saveRecording,
        getSessionRecordings,
        getPendingUploads,
        syncWithServer,
        getStats,
        clearUploaded,
        isFirstTime,
        markPlayed,
        hasConsent,
        setConsent
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
