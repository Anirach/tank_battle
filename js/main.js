/**
 * Tank Battle 2D - Main initialization and coordination
 */

// Sound effects system using Web Audio API
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.masterVolume = 0.3;
        this.enabled = true;
        
        this.initAudioContext();
        this.createSounds();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    createSounds() {
        if (!this.enabled) return;
        
        // Create procedural sound effects
        this.sounds = {
            shoot: this.createShootSound(),
            explosion: this.createExplosionSound(),
            powerup: this.createPowerUpSound(),
            hit: this.createHitSound(),
            engine: this.createEngineSound()
        };
    }
    
    createShootSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
            
            filter.type = 'lowpass';
            filter.frequency.value = 1000;
            
            gainNode.gain.setValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }
    
    createExplosionSound() {
        return () => {
            if (!this.audioContext) return;
            
            // Create noise buffer
            const bufferSize = this.audioContext.sampleRate * 0.5;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            }
            
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            source.buffer = buffer;
            source.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            filter.type = 'lowpass';
            filter.frequency.value = 1000;
            filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(this.masterVolume * 0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            source.start();
        };
    }
    
    createPowerUpSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.4);
        };
    }
    
    createHitSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.15);
        };
    }
    
    createEngineSound() {
        return () => {
            // Engine sound would be more complex, skipping for now
        };
    }
    
    play(soundName) {
        if (this.enabled && this.sounds[soundName]) {
            try {
                this.sounds[soundName]();
            } catch (e) {
                console.warn('Error playing sound:', e);
            }
        }
    }
    
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    toggle() {
        this.enabled = !this.enabled;
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = 0;
        this.fpsUpdateInterval = 1000; // Update every second
        this.showDebug = false;
    }
    
    update(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastTime >= this.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    render(ctx) {
        if (!this.showDebug) return;
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 100);
        
        ctx.fillStyle = '#00ff41';
        ctx.font = '14px monospace';
        ctx.fillText(`FPS: ${this.fps}`, 20, 30);
        ctx.fillText(`Enemies: ${game.enemies.length}`, 20, 50);
        ctx.fillText(`Projectiles: ${game.projectiles.length}`, 20, 70);
        ctx.fillText(`Particles: ${game.particles.length}`, 20, 90);
        ctx.restore();
    }
    
    toggle() {
        this.showDebug = !this.showDebug;
    }
}

// Game settings and preferences
class GameSettings {
    constructor() {
        this.settings = {
            soundEnabled: true,
            soundVolume: 0.3,
            showFPS: false,
            difficulty: 'normal', // easy, normal, hard
            fullscreen: false
        };
        
        this.loadSettings();
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('tankBattle2DSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Could not load settings');
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('tankBattle2DSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Could not save settings');
        }
    }
    
    get(key) {
        return this.settings[key];
    }
    
    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }
}

// Enhanced Tank class extensions
Tank.prototype.createShieldHitEffect = function() {
    if (!game) return;
    
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const particle = {
            x: this.x + Math.cos(angle) * 35,
            y: this.y + Math.sin(angle) * 35,
            vx: Math.cos(angle) * 60,
            vy: Math.sin(angle) * 60,
            size: Math.random() * 4 + 2,
            life: 1.0,
            decay: 0.04,
            color: '#8844ff',
            isActive: true,
            update(dt) {
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.vx *= 0.95;
                this.vy *= 0.95;
                this.life -= this.decay;
                this.isActive = this.life > 0;
            }
        };
        game.particles.push(particle);
    }
};

// Enhanced Tank rendering for shield effect
const originalTankRender = Tank.prototype.render;
Tank.prototype.render = function(ctx) {
    originalTankRender.call(this, ctx);
    
    // Render shield if active
    if (this.hasShield && this.shieldHealth > 0) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const shieldAlpha = (this.shieldHealth / 100) * 0.6;
        const pulse = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;
        
        ctx.globalAlpha = shieldAlpha * pulse;
        ctx.strokeStyle = '#8844ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#8844ff';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Shield sparkles
        for (let i = 0; i < 8; i++) {
            const angle = (Date.now() * 0.002 + i * Math.PI / 4) % (Math.PI * 2);
            const x = Math.cos(angle) * 38;
            const y = Math.sin(angle) * 38;
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
};

// Global instances
let soundSystem;
let performanceMonitor;
let gameSettings;

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize systems
    soundSystem = new SoundSystem();
    performanceMonitor = new PerformanceMonitor();
    gameSettings = new GameSettings();
    
    // Initialize game
    game = new Game();
    
    // Apply settings
    soundSystem.setVolume(gameSettings.get('soundVolume'));
    soundSystem.enabled = gameSettings.get('soundEnabled');
    performanceMonitor.showDebug = gameSettings.get('showFPS');
    
    // Add keyboard shortcuts for debug features
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F1') {
            e.preventDefault();
            performanceMonitor.toggle();
        }
        if (e.key === 'F2') {
            e.preventDefault();
            soundSystem.toggle();
        }
        if (e.key === 'F3') {
            e.preventDefault();
            // Toggle enemy AI debug mode
            game.enemies.forEach(enemy => {
                enemy.aiDebugMode = !enemy.aiDebugMode;
            });
        }
    });
    
    // Enhanced game loop with performance monitoring
    const originalGameLoop = game.gameLoop.bind(game);
    game.gameLoop = function(currentTime = 0) {
        performanceMonitor.update(currentTime);
        originalGameLoop(currentTime);
        
        // Render performance info after everything else
        if (this.isRunning) {
            performanceMonitor.render(this.ctx);
        }
    };
    
    // Override sound-related functions to integrate with sound system
    const originalShoot = Tank.prototype.shoot;
    Tank.prototype.shoot = function() {
        const shot = originalShoot.call(this);
        if (shot !== false) {
            soundSystem.play('shoot');
        }
        return shot;
    };
    
    const originalTakeDamage = Tank.prototype.takeDamage;
    Tank.prototype.takeDamage = function(damage) {
        originalTakeDamage.call(this, damage);
        soundSystem.play('hit');
    };
    
    const originalExplode = Projectile.prototype.explode;
    Projectile.prototype.explode = function() {
        originalExplode.call(this);
        soundSystem.play('explosion');
    };
    
    const originalApply = PowerUp.prototype.apply;
    PowerUp.prototype.apply = function(tank) {
        originalApply.call(this, tank);
        soundSystem.play('powerup');
    };
    
    // Auto-resize canvas on window resize
    window.addEventListener('resize', function() {
        // This would be more complex in a real implementation
        // For now, we'll just ensure the game remains playable
    });
    
    // Prevent context menu on the entire game area
    document.getElementById('gameContainer').addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Add visibility change handler to pause game when tab is not active
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && game && game.isRunning && !game.isPaused) {
            game.togglePause();
        }
    });
    
    console.log('🎮 Tank Battle 2D initialized successfully!');
    console.log('🎯 Controls: WASD to move, Mouse to aim and shoot, Spacebar for special attack');
    console.log('🔧 Debug: F1 for performance info, F2 to toggle sound, F3 for AI debug');
});

// Prevent scrolling and zooming on mobile
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Handle mobile orientation changes
window.addEventListener('orientationchange', function() {
    setTimeout(function() {
        if (game && game.canvas) {
            // Recalculate canvas size if needed
            game.canvas.style.maxWidth = '100vw';
            game.canvas.style.maxHeight = '100vh';
        }
    }, 100);
});

// Export for potential external use
window.TankBattle2D = {
    game: () => game,
    soundSystem: () => soundSystem,
    performanceMonitor: () => performanceMonitor,
    gameSettings: () => gameSettings
};