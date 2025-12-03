/**
 * game.js - Voice Runner Game Engine
 * Canvas-based endless runner with voice-controlled obstacle destruction
 */

const Game = (function() {
    // Canvas and context
    let canvas = null;
    let ctx = null;
    
    // Game state
    const STATE = {
        IDLE: 'idle',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAMEOVER: 'gameover'
    };
    
    let gameState = STATE.IDLE;
    let animationFrameId = null;
    let lastFrameTime = 0;
    let elapsedTime = 0;
    
    // Game metrics
    let score = 0;
    let level = 1;
    let lives = 3;
    let combo = 0;
    let maxCombo = 1;
    let phrasesAttempted = 0;
    let phrasesSucceeded = 0;
    
    // Player (bird)
    const player = {
        x: 80,
        y: 0,
        width: 50,
        height: 40,
        baseY: 0,
        bobOffset: 0,
        bobSpeed: 0.003,
        invincible: false,
        invincibleUntil: 0
    };
    
    // Obstacles
    let obstacles = [];
    let currentObstacle = null;
    let obstacleSpawnTimer = 0;
    
    // Current phrase
    let currentPhrase = null;
    let phraseStartTime = 0;
    let speechDetected = false;
    
    // Speed and difficulty
    const BASE_SPEED = 150; // pixels per second
    const SPEED_INCREMENT = 15; // per level
    const BASE_SPAWN_INTERVAL = 4000; // ms
    const SPAWN_INTERVAL_DECREASE = 200; // per level
    const MIN_SPAWN_INTERVAL = 1500;
    
    // Visual elements
    const colors = {
        sky: '#87ceeb',
        ground: '#f5ebe0',
        cloud: 'rgba(255, 255, 255, 0.8)',
        cloudDark: 'rgba(100, 100, 120, 0.7)',
        bird: '#ffc857',
        birdWing: '#ff8a7d',
        obstacle: '#6b7280'
    };
    
    // Decorative clouds (background)
    let backgroundClouds = [];
    
    // Callbacks
    let onScoreChange = null;
    let onLivesChange = null;
    let onLevelChange = null;
    let onComboChange = null;
    let onPhraseChange = null;
    let onGameOver = null;
    let onObstacleApproaching = null;
    let onObstacleDestroyed = null;
    let onObstacleCollision = null;
    
    /**
     * Initialize the game
     */
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        
        // Set canvas size
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Initialize player position
        player.baseY = canvas.height * 0.6;
        player.y = player.baseY;
        
        // Create background clouds
        createBackgroundClouds();
        
        console.log('Game engine initialized');
    }
    
    /**
     * Resize canvas to fit container
     */
    function resizeCanvas() {
        const container = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = container.clientWidth * dpr;
        canvas.height = container.clientHeight * dpr;

        canvas.style.width = container.clientWidth + 'px';
        canvas.style.height = container.clientHeight + 'px';

        // Reset transform before scaling (setting width/height resets the context)
        // So we only need to apply scale once after setting dimensions
        ctx.scale(dpr, dpr);

        // Update player position
        if (player) {
            player.baseY = container.clientHeight * 0.6;
            player.y = player.baseY;
        }
    }
    
    /**
     * Create decorative background clouds
     */
    function createBackgroundClouds() {
        backgroundClouds = [];
        const numClouds = 5;
        
        for (let i = 0; i < numClouds; i++) {
            backgroundClouds.push({
                x: Math.random() * canvas.width,
                y: 50 + Math.random() * 150,
                size: 30 + Math.random() * 50,
                speed: 10 + Math.random() * 20
            });
        }
    }
    
    /**
     * Start a new game
     */
    function start() {
        // Reset state
        score = 0;
        level = 1;
        lives = 3;
        combo = 0;
        maxCombo = 1;
        phrasesAttempted = 0;
        phrasesSucceeded = 0;
        obstacles = [];
        currentObstacle = null;
        currentPhrase = null;
        obstacleSpawnTimer = 0;
        elapsedTime = 0;
        player.invincible = false;
        
        // Reset phrase selection
        Phrases.reset();
        
        // Notify UI
        updateUI();
        
        // Start game loop
        gameState = STATE.PLAYING;
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
        
        // Spawn first obstacle
        spawnObstacle();
        
        console.log('Game started');
    }
    
    /**
     * Main game loop
     */
    function gameLoop(timestamp) {
        if (gameState !== STATE.PLAYING) return;
        
        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;
        
        update(deltaTime);
        render();
        
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    /**
     * Update game state
     */
    function update(deltaTime) {
        const speed = getSpeed();
        const dt = deltaTime / 1000; // Convert to seconds

        // Update elapsed time
        elapsedTime += deltaTime;

        // Update player bob animation
        player.bobOffset = Math.sin(elapsedTime * player.bobSpeed) * 8;
        player.y = player.baseY + player.bobOffset;
        
        // Update obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= speed * dt;
            
            // Check if obstacle is approaching (trigger phrase)
            if (!obs.triggered && obs.x < canvas.width * 0.7) {
                obs.triggered = true;
                currentObstacle = obs;
                triggerPhrase(obs);
            }
            
            // Check collision
            if (!obs.destroyed && !player.invincible && checkCollision(obs)) {
                handleCollision(obs);
            }
            
            // Remove off-screen obstacles
            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
                if (currentObstacle === obs) {
                    currentObstacle = null;
                }
            }
        }
        
        // Spawn new obstacles
        obstacleSpawnTimer += deltaTime;
        const spawnInterval = Math.max(
            MIN_SPAWN_INTERVAL,
            BASE_SPAWN_INTERVAL - (level - 1) * SPAWN_INTERVAL_DECREASE
        );
        
        if (obstacleSpawnTimer >= spawnInterval && !hasActiveObstacle()) {
            spawnObstacle();
            obstacleSpawnTimer = 0;
        }
        
        // Update background clouds
        for (const cloud of backgroundClouds) {
            cloud.x -= cloud.speed * dt;
            if (cloud.x + cloud.size < 0) {
                cloud.x = canvas.width / window.devicePixelRatio + cloud.size;
                cloud.y = 50 + Math.random() * 150;
            }
        }
        
        // Check for level up (every 500 points)
        const newLevel = Math.floor(score / 500) + 1;
        if (newLevel > level) {
            level = Math.min(newLevel, 10);
            if (onLevelChange) onLevelChange(level);
        }
    }
    
    /**
     * Get current game speed
     */
    function getSpeed() {
        return BASE_SPEED + (level - 1) * SPEED_INCREMENT;
    }
    
    /**
     * Check if there's an active (on-screen) obstacle
     */
    function hasActiveObstacle() {
        return obstacles.some(o => !o.destroyed && o.x > canvas.width * 0.3);
    }
    
    /**
     * Spawn a new obstacle
     */
    function spawnObstacle() {
        const canvasWidth = canvas.width / window.devicePixelRatio;
        const canvasHeight = canvas.height / window.devicePixelRatio;

        const obstacle = {
            x: canvasWidth + 100,
            y: canvasHeight * 0.4,
            width: 80 + level * 5,
            height: 60 + level * 3,
            tier: getTierForLevel(level),
            triggered: false,
            destroyed: false,
            phrase: null,
            destroyAnimation: 0
        };

        obstacles.push(obstacle);
        console.log('Spawned obstacle at x:', obstacle.x, 'canvasWidth:', canvasWidth, 'player at:', player.x, player.y);
    }
    
    /**
     * Get appropriate tier for current level
     */
    function getTierForLevel(level) {
        const range = Phrases.LEVEL_TIER_MAP[Math.min(level, 10)];
        return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
    }
    
    /**
     * Trigger phrase display when obstacle approaches
     */
    function triggerPhrase(obstacle) {
        currentPhrase = Phrases.selectPhrase(level);
        obstacle.phrase = currentPhrase;
        phraseStartTime = performance.now();
        speechDetected = false;
        phrasesAttempted++;
        
        if (onPhraseChange) {
            onPhraseChange(currentPhrase);
        }
        
        if (onObstacleApproaching) {
            onObstacleApproaching(obstacle, currentPhrase);
        }
    }
    
    /**
     * Check collision between player and obstacle
     */
    function checkCollision(obstacle) {
        const padding = 10; // Be a little forgiving
        
        return (
            player.x < obstacle.x + obstacle.width - padding &&
            player.x + player.width > obstacle.x + padding &&
            player.y < obstacle.y + obstacle.height - padding &&
            player.y + player.height > obstacle.y + padding
        );
    }
    
    /**
     * Handle collision with obstacle
     */
    function handleCollision(obstacle) {
        lives--;
        combo = 0;
        
        // Make player invincible briefly
        player.invincible = true;
        player.invincibleUntil = performance.now() + 1500;
        
        setTimeout(() => {
            player.invincible = false;
        }, 1500);
        
        // Mark obstacle as destroyed (passed through)
        obstacle.destroyed = true;
        
        if (onLivesChange) onLivesChange(lives);
        if (onComboChange) onComboChange(combo);
        if (onObstacleCollision) onObstacleCollision(obstacle);
        
        // Clear current phrase
        currentPhrase = null;
        if (onPhraseChange) onPhraseChange(null);
        
        // Check game over
        if (lives <= 0) {
            endGame();
        }
    }
    
    /**
     * Handle successful phrase completion
     */
    function phraseSuccess(evaluation) {
        if (!currentObstacle || currentObstacle.destroyed) return;
        
        // Destroy obstacle
        currentObstacle.destroyed = true;
        currentObstacle.destroyAnimation = 1;
        
        // Update combo
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        
        // Calculate score
        const baseScore = 100;
        const tierBonus = currentPhrase.tier * 20;
        const comboMultiplier = Math.min(3, 1 + (combo - 1) * 0.5);
        const timeBonus = evaluation.confidence > 0.8 ? 50 : 0;
        
        const points = Math.round((baseScore + tierBonus + timeBonus) * comboMultiplier);
        score += points;
        phrasesSucceeded++;
        
        // Notify UI
        if (onScoreChange) onScoreChange(score, points);
        if (onComboChange) onComboChange(combo);
        if (onObstacleDestroyed) {
            onObstacleDestroyed(currentObstacle, points, evaluation.confidence > 0.8 ? 'perfect' : 'good');
        }
        
        // Clear phrase
        currentPhrase = null;
        currentObstacle = null;
        if (onPhraseChange) onPhraseChange(null);
    }
    
    /**
     * Handle phrase failure (silence or invalid)
     */
    function phraseFailure(reason) {
        // Don't end phrase here - let collision happen naturally
        // Just reset combo
        if (reason === 'timeout') {
            combo = 0;
            if (onComboChange) onComboChange(combo);
        }
    }
    
    /**
     * End the game
     */
    function endGame() {
        gameState = STATE.GAMEOVER;
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        if (onGameOver) {
            onGameOver({
                score: score,
                level: level,
                phrasesAttempted: phrasesAttempted,
                phrasesSucceeded: phrasesSucceeded,
                maxCombo: maxCombo,
                accuracy: phrasesAttempted > 0 
                    ? Math.round((phrasesSucceeded / phrasesAttempted) * 100) 
                    : 0
            });
        }
    }
    
    /**
     * Render the game
     */
    function render() {
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(0.6, '#b5e3f5');
        gradient.addColorStop(1, '#f5ebe0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw background clouds
        for (const cloud of backgroundClouds) {
            drawCloud(cloud.x, cloud.y, cloud.size, 'rgba(255, 255, 255, 0.5)');
        }
        
        // Draw ground line
        ctx.fillStyle = '#d4c4b0';
        ctx.fillRect(0, height * 0.85, width, height * 0.15);
        
        // Draw obstacles
        for (const obs of obstacles) {
            drawObstacle(obs);
        }
        
        // Draw player
        drawPlayer();
    }
    
    /**
     * Draw a cloud shape
     */
    function drawCloud(x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw an obstacle (speech cloud)
     */
    function drawObstacle(obs) {
        if (obs.destroyed && obs.destroyAnimation > 0) {
            // Destruction animation
            ctx.globalAlpha = obs.destroyAnimation;
            obs.destroyAnimation -= 0.05;
        }
        
        // Draw cloud shape
        const gradient = ctx.createRadialGradient(
            obs.x + obs.width * 0.5, 
            obs.y + obs.height * 0.3,
            0,
            obs.x + obs.width * 0.5,
            obs.y + obs.height * 0.5,
            obs.width * 0.8
        );
        
        if (obs.destroyed) {
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.4)');
        } else {
            const darkness = 0.3 + (obs.tier || 1) * 0.15;
            gradient.addColorStop(0, `rgba(100, 100, 120, ${darkness})`);
            gradient.addColorStop(1, `rgba(70, 70, 90, ${darkness + 0.2})`);
        }
        
        ctx.fillStyle = gradient;
        
        // Cloud shape
        ctx.beginPath();
        const cx = obs.x + obs.width * 0.5;
        const cy = obs.y + obs.height * 0.5;
        const rx = obs.width * 0.5;
        const ry = obs.height * 0.4;
        
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - rx * 0.5, cy - ry * 0.3, rx * 0.6, ry * 0.7, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + rx * 0.4, cy - ry * 0.2, rx * 0.5, ry * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tier indicator
        if (!obs.destroyed) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'bold 14px Fredoka';
            ctx.textAlign = 'center';
            ctx.fillText('☁️', cx, cy);
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Draw the player (doctorbird)
     */
    function drawPlayer() {
        const px = player.x;
        const py = player.y;
        
        // Blinking when invincible
        if (player.invincible && Math.floor(performance.now() / 100) % 2 === 0) {
            return;
        }
        
        ctx.save();
        
        // Body
        ctx.fillStyle = colors.bird;
        ctx.beginPath();
        ctx.ellipse(px + 25, py + 20, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing
        ctx.fillStyle = colors.birdWing;
        const wingFlap = Math.sin(performance.now() * 0.02) * 5;
        ctx.beginPath();
        ctx.ellipse(px + 20, py + 15 + wingFlap, 12, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = colors.bird;
        ctx.beginPath();
        ctx.arc(px + 40, py + 12, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#ff6b5b';
        ctx.beginPath();
        ctx.moveTo(px + 48, py + 12);
        ctx.lineTo(px + 60, py + 14);
        ctx.lineTo(px + 48, py + 16);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(px + 43, py + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail feathers
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(px + 5, py + 20);
        ctx.quadraticCurveTo(px - 15, py + 15, px - 10, py + 25);
        ctx.quadraticCurveTo(px - 5, py + 22, px + 5, py + 20);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * Update UI elements
     */
    function updateUI() {
        if (onScoreChange) onScoreChange(score);
        if (onLivesChange) onLivesChange(lives);
        if (onLevelChange) onLevelChange(level);
        if (onComboChange) onComboChange(combo);
    }
    
    /**
     * Set callbacks
     */
    function setCallbacks(callbacks) {
        onScoreChange = callbacks.scoreChange || null;
        onLivesChange = callbacks.livesChange || null;
        onLevelChange = callbacks.levelChange || null;
        onComboChange = callbacks.comboChange || null;
        onPhraseChange = callbacks.phraseChange || null;
        onGameOver = callbacks.gameOver || null;
        onObstacleApproaching = callbacks.obstacleApproaching || null;
        onObstacleDestroyed = callbacks.obstacleDestroyed || null;
        onObstacleCollision = callbacks.obstacleCollision || null;
    }
    
    /**
     * Get current game stats
     */
    function getStats() {
        return {
            score,
            level,
            lives,
            combo,
            maxCombo,
            phrasesAttempted,
            phrasesSucceeded,
            accuracy: phrasesAttempted > 0 
                ? Math.round((phrasesSucceeded / phrasesAttempted) * 100) 
                : 0
        };
    }
    
    /**
     * Get current phrase
     */
    function getCurrentPhrase() {
        return currentPhrase;
    }
    
    /**
     * Check if game is playing
     */
    function isPlaying() {
        return gameState === STATE.PLAYING;
    }
    
    /**
     * Pause the game
     */
    function pause() {
        if (gameState === STATE.PLAYING) {
            gameState = STATE.PAUSED;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        }
    }
    
    /**
     * Resume the game
     */
    function resume() {
        if (gameState === STATE.PAUSED) {
            gameState = STATE.PLAYING;
            lastFrameTime = performance.now();
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Public API
    return {
        init,
        start,
        pause,
        resume,
        phraseSuccess,
        phraseFailure,
        setCallbacks,
        getStats,
        getCurrentPhrase,
        isPlaying,
        getSpeed
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
