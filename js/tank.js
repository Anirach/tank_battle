/**
 * Tank Class - Advanced tank physics and rendering
 */

class Tank {
    constructor(x, y, angle, type = 'player') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.type = type;
        this.radius = 25;
        
        // Tank properties
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.speed = 150;
        this.rotationSpeed = 3;
        this.turretAngle = angle;
        this.turretRotationSpeed = 4;
        
        // Movement physics
        this.velocity = { x: 0, y: 0 };
        this.acceleration = 600;
        this.friction = 0.85;
        
        // Shooting system
        this.fireRate = 0.3; // seconds between shots
        this.lastShotTime = 0;
        this.projectileSpeed = 400;
        this.damage = 25;
        
        // Special abilities
        this.specialCooldown = 5; // seconds
        this.lastSpecialTime = 0;
        this.hasRapidFire = false;
        this.rapidFireDuration = 0;
        
        // Visual effects
        this.muzzleFlash = 0;
        this.damageTaken = false;
        this.damageFlashTime = 0;
        
        // Track marks
        this.trackMarks = [];
        this.lastTrackTime = 0;
        
        // Tank dimensions
        this.width = 40;
        this.height = 30;
        this.turretWidth = 8;
        this.turretLength = 35;
    }
    
    update(deltaTime, keys, mouse, camera) {
        if (this.type !== 'player') return;
        
        this.updateMovement(deltaTime, keys);
        this.updateTurret(mouse, camera);
        this.updateEffects(deltaTime);
        this.createTrackMarks(deltaTime);
        
        // Handle rapid fire power-up
        if (this.rapidFireDuration > 0) {
            this.rapidFireDuration -= deltaTime;
            if (this.rapidFireDuration <= 0) {
                this.hasRapidFire = false;
            }
        }
    }
    
    updateMovement(deltaTime, keys) {
        let accelerating = false;
        
        // Forward/backward movement
        if (keys['w'] || keys['arrowup']) {
            this.velocity.x += Math.cos(this.angle) * this.acceleration * deltaTime;
            this.velocity.y += Math.sin(this.angle) * this.acceleration * deltaTime;
            accelerating = true;
        }
        if (keys['s'] || keys['arrowdown']) {
            this.velocity.x -= Math.cos(this.angle) * this.acceleration * deltaTime * 0.6;
            this.velocity.y -= Math.sin(this.angle) * this.acceleration * deltaTime * 0.6;
            accelerating = true;
        }
        
        // Rotation
        if (keys['a'] || keys['arrowleft']) {
            this.angle -= this.rotationSpeed * deltaTime;
        }
        if (keys['d'] || keys['arrowright']) {
            this.angle += this.rotationSpeed * deltaTime;
        }
        
        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        // Limit speed
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (currentSpeed > this.speed) {
            this.velocity.x = (this.velocity.x / currentSpeed) * this.speed;
            this.velocity.y = (this.velocity.y / currentSpeed) * this.speed;
        }
        
        // Update position
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
    }
    
    updateTurret(mouse, camera) {
        // Calculate angle from tank to mouse
        const worldMouseX = mouse.x + camera.x;
        const worldMouseY = mouse.y + camera.y;
        const targetAngle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);
        
        // Smooth turret rotation
        let angleDiff = targetAngle - this.turretAngle;
        
        // Normalize angle difference
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Apply rotation with speed limit
        const maxRotation = this.turretRotationSpeed * 0.016; // Assume 60fps
        if (Math.abs(angleDiff) < maxRotation) {
            this.turretAngle = targetAngle;
        } else {
            this.turretAngle += Math.sign(angleDiff) * maxRotation;
        }
    }
    
    updateEffects(deltaTime) {
        // Muzzle flash decay
        if (this.muzzleFlash > 0) {
            this.muzzleFlash -= deltaTime * 3;
        }
        
        // Damage flash
        if (this.damageFlashTime > 0) {
            this.damageFlashTime -= deltaTime;
        }
    }
    
    createTrackMarks(deltaTime) {
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        
        if (speed > 50 && Date.now() - this.lastTrackTime > 100) {
            this.trackMarks.push({
                x: this.x - Math.cos(this.angle) * 15,
                y: this.y - Math.sin(this.angle) * 15,
                angle: this.angle,
                life: 1.0,
                maxLife: 5.0
            });
            
            this.lastTrackTime = Date.now();
            
            // Limit track marks
            if (this.trackMarks.length > 50) {
                this.trackMarks.shift();
            }
        }
        
        // Update track marks
        this.trackMarks.forEach(track => {
            track.life -= deltaTime / track.maxLife;
        });
        
        this.trackMarks = this.trackMarks.filter(track => track.life > 0);
    }
    
    shoot() {
        const currentTime = Date.now() / 1000;
        const actualFireRate = this.hasRapidFire ? this.fireRate * 0.3 : this.fireRate;
        
        if (currentTime - this.lastShotTime < actualFireRate) return;
        
        // Create projectile
        const projectile = new Projectile(
            this.x + Math.cos(this.turretAngle) * this.turretLength,
            this.y + Math.sin(this.turretAngle) * this.turretLength,
            this.turretAngle,
            this.projectileSpeed,
            this.damage,
            this.type
        );
        
        game.projectiles.push(projectile);
        
        // Visual effects
        this.muzzleFlash = 1.0;
        
        // Add recoil
        this.velocity.x -= Math.cos(this.turretAngle) * 30;
        this.velocity.y -= Math.sin(this.turretAngle) * 30;
        
        this.lastShotTime = currentTime;
    }
    
    useSpecialAttack() {
        const currentTime = Date.now() / 1000;
        
        if (currentTime - this.lastSpecialTime < this.specialCooldown) return;
        
        // Triple shot special attack
        for (let i = -1; i <= 1; i++) {
            const angle = this.turretAngle + (i * Math.PI / 6); // 30 degree spread
            const projectile = new Projectile(
                this.x + Math.cos(angle) * this.turretLength,
                this.y + Math.sin(angle) * this.turretLength,
                angle,
                this.projectileSpeed * 1.2,
                this.damage * 1.5,
                this.type
            );
            game.projectiles.push(projectile);
        }
        
        // Visual effects
        this.muzzleFlash = 1.5;
        
        // Stronger recoil
        this.velocity.x -= Math.cos(this.turretAngle) * 60;
        this.velocity.y -= Math.sin(this.turretAngle) * 60;
        
        this.lastSpecialTime = currentTime;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.damageFlashTime = 0.2;
        
        if (this.health < 0) this.health = 0;
        
        // Create damage particles
        for (let i = 0; i < 5; i++) {
            const particle = {
                x: this.x + (Math.random() - 0.5) * this.width,
                y: this.y + (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                size: Math.random() * 8 + 2,
                life: 1.0,
                decay: 0.02,
                color: '#ff4444',
                isActive: true,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.life -= this.decay;
                    this.isActive = this.life > 0;
                }
            };
            game.particles.push(particle);
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    activateRapidFire(duration = 8) {
        this.hasRapidFire = true;
        this.rapidFireDuration = duration;
    }
    
    render(ctx) {
        ctx.save();
        
        // Render track marks first
        this.renderTrackMarks(ctx);
        
        // Damage flash effect
        if (this.damageFlashTime > 0) {
            ctx.filter = 'brightness(200%) hue-rotate(180deg)';
        }
        
        // Translate to tank position
        ctx.translate(this.x, this.y);
        
        // Render tank body
        this.renderTankBody(ctx);
        
        // Render turret
        this.renderTurret(ctx);
        
        // Render muzzle flash
        if (this.muzzleFlash > 0) {
            this.renderMuzzleFlash(ctx);
        }
        
        // Render health bar
        this.renderHealthBar(ctx);
        
        // Render power-up effects
        if (this.hasRapidFire) {
            this.renderRapidFireEffect(ctx);
        }
        
        ctx.restore();
    }
    
    renderTrackMarks(ctx) {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 3;
        
        this.trackMarks.forEach(track => {
            ctx.save();
            ctx.globalAlpha = track.life * 0.5;
            ctx.translate(track.x, track.y);
            ctx.rotate(track.angle);
            
            // Left track
            ctx.beginPath();
            ctx.moveTo(-8, -3);
            ctx.lineTo(-8, 3);
            ctx.stroke();
            
            // Right track
            ctx.beginPath();
            ctx.moveTo(8, -3);
            ctx.lineTo(8, 3);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    renderTankBody(ctx) {
        ctx.save();
        ctx.rotate(this.angle);
        
        // Tank body shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-this.width/2 + 2, -this.height/2 + 2, this.width, this.height);
        
        // Tank body
        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, this.height/2);
        if (this.type === 'player') {
            gradient.addColorStop(0, '#4a9a4a');
            gradient.addColorStop(0.5, '#2d6b2d');
            gradient.addColorStop(1, '#1a4a1a');
        } else {
            gradient.addColorStop(0, '#9a4a4a');
            gradient.addColorStop(0.5, '#6b2d2d');
            gradient.addColorStop(1, '#4a1a1a');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Tank outline
        ctx.strokeStyle = this.type === 'player' ? '#00ff41' : '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Tank details
        ctx.fillStyle = this.type === 'player' ? '#66bb66' : '#bb6666';
        ctx.fillRect(-this.width/2 + 5, -this.height/2 + 5, this.width - 10, 4);
        ctx.fillRect(-this.width/2 + 5, this.height/2 - 9, this.width - 10, 4);
        
        // Tank treads
        ctx.fillStyle = '#333333';
        ctx.fillRect(-this.width/2, -this.height/2 - 5, this.width, 5);
        ctx.fillRect(-this.width/2, this.height/2, this.width, 5);
        
        ctx.restore();
    }
    
    renderTurret(ctx) {
        ctx.save();
        ctx.rotate(this.turretAngle);
        
        // Turret shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-2, -this.turretWidth/2 + 2, this.turretLength + 2, this.turretWidth);
        
        // Turret barrel
        const turretGradient = ctx.createLinearGradient(0, -this.turretWidth/2, 0, this.turretWidth/2);
        if (this.type === 'player') {
            turretGradient.addColorStop(0, '#5555aa');
            turretGradient.addColorStop(0.5, '#3333aa');
            turretGradient.addColorStop(1, '#2222aa');
        } else {
            turretGradient.addColorStop(0, '#aa5555');
            turretGradient.addColorStop(0.5, '#aa3333');
            turretGradient.addColorStop(1, '#aa2222');
        }
        
        ctx.fillStyle = turretGradient;
        ctx.fillRect(0, -this.turretWidth/2, this.turretLength, this.turretWidth);
        
        // Turret outline
        ctx.strokeStyle = this.type === 'player' ? '#00ff41' : '#ff4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, -this.turretWidth/2, this.turretLength, this.turretWidth);
        
        // Turret base
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderMuzzleFlash(ctx) {
        ctx.save();
        ctx.rotate(this.turretAngle);
        ctx.translate(this.turretLength, 0);
        
        ctx.globalAlpha = this.muzzleFlash;
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;
        
        // Flash shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(15, -8);
        ctx.lineTo(25, -4);
        ctx.lineTo(30, 0);
        ctx.lineTo(25, 4);
        ctx.lineTo(15, 8);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    renderHealthBar(ctx) {
        const barWidth = 40;
        const barHeight = 6;
        const y = -25;
        
        // Health bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barWidth/2, y, barWidth, barHeight);
        
        // Health bar fill
        const healthPercent = this.health / this.maxHealth;
        let healthColor;
        
        if (healthPercent > 0.6) {
            healthColor = '#00ff41';
        } else if (healthPercent > 0.3) {
            healthColor = '#ffd700';
        } else {
            healthColor = '#ff073a';
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(-barWidth/2 + 1, y + 1, (barWidth - 2) * healthPercent, barHeight - 2);
        
        // Health bar border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth/2, y, barWidth, barHeight);
    }
    
    renderRapidFireEffect(ctx) {
        ctx.save();
        
        // Pulsing glow effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10 + pulse * 10;
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = Date.now() * 0.01;
        
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}