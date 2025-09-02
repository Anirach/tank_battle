/**
 * Tank Battle 2D - Core Game Engine
 * Advanced 2D tank combat game with physics, AI, and dynamic gameplay
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap.getContext('2d');
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.gameStarted = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game objects
        this.playerTank = null;
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.particles = [];
        this.obstacles = [];
        
        // Game stats
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.enemiesInWave = 3;
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false };
        
        // Game settings
        this.worldWidth = 2400;  // Larger world than canvas
        this.worldHeight = 1600;
        this.camera = { x: 0, y: 0 };
        
        // Initialize game
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createObstacles();
        this.showLoadingScreen();
        
        // Simulate loading time
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showStartScreen();
        }, 3000);
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Special keys
            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
            }
            if (e.key === ' ') {
                e.preventDefault();
                if (this.playerTank) {
                    this.playerTank.useSpecialAttack();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.pressed = true;
            if (this.playerTank && this.isRunning) {
                this.playerTank.shoot();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.pressed = false;
        });
        
        // UI buttons
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    createObstacles() {
        this.obstacles = [];
        
        // Create scattered obstacles throughout the world
        for (let i = 0; i < 30; i++) {
            const obstacle = {
                x: Math.random() * (this.worldWidth - 100) + 50,
                y: Math.random() * (this.worldHeight - 100) + 50,
                width: 60 + Math.random() * 40,
                height: 60 + Math.random() * 40,
                type: Math.random() < 0.5 ? 'rock' : 'metal',
                health: Math.random() < 0.3 ? 100 : Infinity // Some can be destroyed
            };
            
            // Ensure obstacles don't spawn too close to player start position
            const playerStartX = this.worldWidth / 2;
            const playerStartY = this.worldHeight / 2;
            const distance = Math.sqrt(
                Math.pow(obstacle.x - playerStartX, 2) + 
                Math.pow(obstacle.y - playerStartY, 2)
            );
            
            if (distance > 150) {
                this.obstacles.push(obstacle);
            }
        }
    }
    
    showLoadingScreen() {
        document.getElementById('loadingScreen').classList.remove('hidden');
    }
    
    hideLoadingScreen() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }
    
    showStartScreen() {
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const startBtn = document.getElementById('startButton');
        const restartBtn = document.getElementById('restartButton');
        
        title.textContent = 'Tank Battle 2D';
        message.textContent = 'Use WASD to move, mouse to aim and shoot. Survive the waves!';
        startBtn.style.display = 'inline-block';
        restartBtn.style.display = 'none';
        overlay.style.display = 'flex';
    }
    
    showGameOverScreen(victory = false) {
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const startBtn = document.getElementById('startButton');
        const restartBtn = document.getElementById('restartButton');
        
        if (victory) {
            title.textContent = 'Victory!';
            message.textContent = `Congratulations! You survived all waves!\nFinal Score: ${this.score}`;
        } else {
            title.textContent = 'Game Over';
            message.textContent = `Tank Destroyed!\nWave Reached: ${this.wave}\nFinal Score: ${this.score}`;
        }
        
        startBtn.style.display = 'none';
        restartBtn.style.display = 'inline-block';
        overlay.style.display = 'flex';
    }
    
    startGame() {
        document.getElementById('gameOverlay').style.display = 'none';
        this.resetGame();
        this.isRunning = true;
        this.gameStarted = true;
        this.gameLoop();
    }
    
    restartGame() {
        this.startGame();
    }
    
    resetGame() {
        // Reset game state
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.enemiesInWave = 3;
        
        // Clear arrays
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.particles = [];
        
        // Create player tank
        this.playerTank = new Tank(
            this.worldWidth / 2, 
            this.worldHeight / 2, 
            0, 
            'player'
        );
        
        // Reset camera
        this.updateCamera();
        
        // Spawn first wave
        this.spawnWave();
        
        // Update UI
        this.updateUI();
    }
    
    togglePause() {
        if (this.gameStarted && this.isRunning) {
            this.isPaused = !this.isPaused;
        }
    }
    
    spawnWave() {
        this.enemies = [];
        const enemiesToSpawn = this.enemiesInWave + Math.floor(this.wave / 2);
        
        for (let i = 0; i < enemiesToSpawn; i++) {
            let x, y;
            let attempts = 0;
            
            // Find a spawn position far from player
            do {
                x = Math.random() * (this.worldWidth - 100) + 50;
                y = Math.random() * (this.worldHeight - 100) + 50;
                attempts++;
            } while (
                attempts < 50 && 
                Math.sqrt(
                    Math.pow(x - this.playerTank.x, 2) + 
                    Math.pow(y - this.playerTank.y, 2)
                ) < 300
            );
            
            const enemy = new Enemy(x, y, Math.random() * Math.PI * 2);
            this.enemies.push(enemy);
        }
        
        // Spawn power-ups occasionally
        if (this.wave % 3 === 0) {
            this.spawnPowerUp();
        }
    }
    
    spawnPowerUp() {
        const powerUp = new PowerUp(
            Math.random() * (this.worldWidth - 100) + 50,
            Math.random() * (this.worldHeight - 100) + 50
        );
        this.powerUps.push(powerUp);
    }
    
    updateCamera() {
        if (!this.playerTank) return;
        
        // Center camera on player
        this.camera.x = this.playerTank.x - this.canvas.width / 2;
        this.camera.y = this.playerTank.y - this.canvas.height / 2;
        
        // Keep camera within world bounds
        this.camera.x = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.camera.y));
    }
    
    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;
        
        // Update player tank
        if (this.playerTank) {
            this.playerTank.update(deltaTime, this.keys, this.mouse, this.camera);
            
            // Check world boundaries
            if (this.playerTank.x < 30) this.playerTank.x = 30;
            if (this.playerTank.x > this.worldWidth - 30) this.playerTank.x = this.worldWidth - 30;
            if (this.playerTank.y < 30) this.playerTank.y = 30;
            if (this.playerTank.y > this.worldHeight - 30) this.playerTank.y = this.worldHeight - 30;
            
            // Check if player is destroyed
            if (this.playerTank.health <= 0) {
                this.gameOver();
                return;
            }
        }
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (this.playerTank) {
                enemy.update(deltaTime, this.playerTank, this.obstacles);
            }
        });
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);
            return projectile.isActive;
        });
        
        // Update power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.update(deltaTime);
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.isActive;
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Update camera
        this.updateCamera();
        
        // Check wave completion
        if (this.enemies.length === 0) {
            this.nextWave();
        }
        
        // Update UI
        this.updateUI();
    }
    
    checkCollisions() {
        // Projectile vs Tank collisions
        this.projectiles.forEach(projectile => {
            if (!projectile.isActive) return;
            
            // Check player hit
            if (projectile.owner !== 'player' && this.playerTank) {
                if (this.checkCollision(projectile, this.playerTank)) {
                    this.playerTank.takeDamage(projectile.damage);
                    projectile.isActive = false;
                    this.createExplosion(projectile.x, projectile.y, 30);
                }
            }
            
            // Check enemy hits
            if (projectile.owner === 'player') {
                this.enemies.forEach((enemy, enemyIndex) => {
                    if (this.checkCollision(projectile, enemy)) {
                        enemy.takeDamage(projectile.damage);
                        projectile.isActive = false;
                        this.createExplosion(projectile.x, projectile.y, 25);
                        
                        if (enemy.health <= 0) {
                            this.enemies.splice(enemyIndex, 1);
                            this.enemiesKilled++;
                            this.score += 100;
                        }
                    }
                });
            }
            
            // Check obstacle collisions
            this.obstacles.forEach(obstacle => {
                if (this.checkCollisionWithRect(projectile, obstacle)) {
                    projectile.isActive = false;
                    this.createExplosion(projectile.x, projectile.y, 20);
                    
                    if (obstacle.health !== Infinity) {
                        obstacle.health -= projectile.damage;
                        if (obstacle.health <= 0) {
                            const index = this.obstacles.indexOf(obstacle);
                            this.obstacles.splice(index, 1);
                            this.createExplosion(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 40);
                        }
                    }
                }
            });
        });
        
        // Power-up collection
        if (this.playerTank) {
            this.powerUps = this.powerUps.filter(powerUp => {
                if (this.checkCollision(this.playerTank, powerUp)) {
                    powerUp.apply(this.playerTank);
                    return false;
                }
                return true;
            });
        }
    }
    
    checkCollision(obj1, obj2) {
        const distance = Math.sqrt(
            Math.pow(obj1.x - obj2.x, 2) + 
            Math.pow(obj1.y - obj2.y, 2)
        );
        return distance < (obj1.radius + obj2.radius);
    }
    
    checkCollisionWithRect(circle, rect) {
        const distX = Math.abs(circle.x - rect.x - rect.width/2);
        const distY = Math.abs(circle.y - rect.y - rect.height/2);
        
        if (distX > (rect.width/2 + circle.radius) || distY > (rect.height/2 + circle.radius)) {
            return false;
        }
        
        if (distX <= rect.width/2 || distY <= rect.height/2) {
            return true;
        }
        
        const dx = distX - rect.width/2;
        const dy = distY - rect.height/2;
        return (dx*dx + dy*dy <= circle.radius*circle.radius);
    }
    
    createExplosion(x, y, size) {
        for (let i = 0; i < 8; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: Math.random() * size + 5,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                color: `hsl(${Math.random() * 60 + 10}, 100%, 60%)`,
                isActive: true,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.life -= this.decay;
                    this.isActive = this.life > 0;
                }
            };
            this.particles.push(particle);
        }
    }
    
    nextWave() {
        this.wave++;
        this.spawnWave();
        
        if (this.wave > 10) {
            this.victory();
        }
    }
    
    gameOver() {
        this.isRunning = false;
        this.showGameOverScreen(false);
    }
    
    victory() {
        this.isRunning = false;
        this.showGameOverScreen(true);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('health').textContent = this.playerTank ? this.playerTank.health : 0;
    }
    
    render() {
        // Clear main canvas
        this.ctx.fillStyle = '#0f0f0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context and apply camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render world background grid
        this.renderGrid();
        
        // Render obstacles
        this.obstacles.forEach(obstacle => {
            this.renderObstacle(obstacle);
        });
        
        // Render power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.render(this.ctx);
        });
        
        // Render projectiles
        this.projectiles.forEach(projectile => {
            projectile.render(this.ctx);
        });
        
        // Render player tank
        if (this.playerTank) {
            this.playerTank.render(this.ctx);
        }
        
        // Render enemies
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx);
        });
        
        // Render particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Restore context
        this.ctx.restore();
        
        // Render minimap
        this.renderMinimap();
    }
    
    renderGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 100;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        
        for (let x = startX; x < this.camera.x + this.canvas.width + gridSize; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.camera.y);
            this.ctx.lineTo(x, this.camera.y + this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = startY; y < this.camera.y + this.canvas.height + gridSize; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.camera.x, y);
            this.ctx.lineTo(this.camera.x + this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    renderObstacle(obstacle) {
        this.ctx.fillStyle = obstacle.type === 'rock' ? '#4a4a4a' : '#666666';
        this.ctx.strokeStyle = obstacle.type === 'rock' ? '#333333' : '#888888';
        this.ctx.lineWidth = 2;
        
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add some detail
        if (obstacle.type === 'rock') {
            this.ctx.fillStyle = '#555555';
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
        } else {
            this.ctx.fillStyle = '#777777';
            this.ctx.fillRect(obstacle.x + 3, obstacle.y + 3, obstacle.width - 6, 3);
            this.ctx.fillRect(obstacle.x + 3, obstacle.y + obstacle.height - 6, obstacle.width - 6, 3);
        }
    }
    
    renderMinimap() {
        this.minimapCtx.fillStyle = '#0a0a0a';
        this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);
        
        const scaleX = this.minimap.width / this.worldWidth;
        const scaleY = this.minimap.height / this.worldHeight;
        
        // Render obstacles
        this.minimapCtx.fillStyle = '#444444';
        this.obstacles.forEach(obstacle => {
            this.minimapCtx.fillRect(
                obstacle.x * scaleX,
                obstacle.y * scaleY,
                obstacle.width * scaleX,
                obstacle.height * scaleY
            );
        });
        
        // Render enemies
        this.minimapCtx.fillStyle = '#ff0000';
        this.enemies.forEach(enemy => {
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(enemy.x * scaleX, enemy.y * scaleY, 3, 0, Math.PI * 2);
            this.minimapCtx.fill();
        });
        
        // Render player
        if (this.playerTank) {
            this.minimapCtx.fillStyle = '#00ff41';
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(this.playerTank.x * scaleX, this.playerTank.y * scaleY, 4, 0, Math.PI * 2);
            this.minimapCtx.fill();
        }
        
        // Render camera viewport
        this.minimapCtx.strokeStyle = '#00ff41';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(
            this.camera.x * scaleX,
            this.camera.y * scaleY,
            this.canvas.width * scaleX,
            this.canvas.height * scaleY
        );
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 0.033);
        
        this.update(this.deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Global game instance
let game;