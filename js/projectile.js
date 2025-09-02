/**
 * Projectile Class - Advanced projectile physics and rendering
 */

class Projectile {
    constructor(x, y, angle, speed, damage, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.owner = owner;
        this.radius = 3;
        
        // Physics
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        
        // Projectile properties
        this.isActive = true;
        this.maxDistance = 800;
        this.travelDistance = 0;
        this.life = 1.0;
        
        // Visual effects
        this.trail = [];
        this.maxTrailLength = 8;
        this.glowIntensity = 1.0;
        
        // Ballistic properties
        this.gravity = 0; // For now, no gravity effect
        this.drag = 0.998; // Air resistance
        
        // Visual properties
        this.size = 4;
        this.color = owner === 'player' ? '#00ff41' : '#ff073a';
        this.trailColor = owner === 'player' ? 'rgba(0, 255, 65, 0.6)' : 'rgba(255, 7, 58, 0.6)';
        
        // Initialize trail
        for (let i = 0; i < this.maxTrailLength; i++) {
            this.trail.push({ x: this.x, y: this.y, life: (i / this.maxTrailLength) });
        }
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update physics
        this.velocity.x *= this.drag;
        this.velocity.y *= this.drag;
        this.velocity.y += this.gravity * deltaTime;
        
        // Update position
        const moveX = this.velocity.x * deltaTime;
        const moveY = this.velocity.y * deltaTime;
        
        this.x += moveX;
        this.y += moveY;
        
        // Track distance traveled
        const distanceMoved = Math.sqrt(moveX * moveX + moveY * moveY);
        this.travelDistance += distanceMoved;
        
        // Update trail
        this.updateTrail();
        
        // Check if projectile should be destroyed
        if (this.travelDistance > this.maxDistance) {
            this.isActive = false;
        }
        
        // Check world boundaries
        if (this.x < 0 || this.x > game.worldWidth || 
            this.y < 0 || this.y > game.worldHeight) {
            this.isActive = false;
        }
        
        // Update visual effects
        this.life = Math.max(0, 1 - (this.travelDistance / this.maxDistance));
        this.glowIntensity = this.life;
    }
    
    updateTrail() {
        // Shift trail positions
        for (let i = this.trail.length - 1; i > 0; i--) {
            this.trail[i].x = this.trail[i - 1].x;
            this.trail[i].y = this.trail[i - 1].y;
            this.trail[i].life = (this.trail.length - i) / this.trail.length * this.life;
        }
        
        // Add current position to trail
        this.trail[0] = { x: this.x, y: this.y, life: this.life };
    }
    
    render(ctx) {
        if (!this.isActive) return;
        
        ctx.save();
        
        // Render trail
        this.renderTrail(ctx);
        
        // Render projectile glow
        this.renderGlow(ctx);
        
        // Render main projectile
        this.renderProjectile(ctx);
        
        ctx.restore();
    }
    
    renderTrail(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.strokeStyle = this.trailColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const current = this.trail[i];
            const next = this.trail[i + 1];
            
            if (current.life <= 0 || next.life <= 0) continue;
            
            ctx.save();
            ctx.globalAlpha = current.life * 0.8;
            ctx.lineWidth = (current.life * 3) + 1;
            
            ctx.beginPath();
            ctx.moveTo(next.x, next.y);
            ctx.lineTo(current.x, current.y);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    renderGlow(ctx) {
        // Outer glow
        ctx.save();
        ctx.globalAlpha = this.glowIntensity * 0.3;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Inner glow
        ctx.save();
        ctx.globalAlpha = this.glowIntensity * 0.6;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderProjectile(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Main projectile body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, this.owner === 'player' ? '#004422' : '#440022');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Projectile tip (more aerodynamic look)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(this.size * 0.3, 0, this.size * 0.4, this.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Projectile outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Check collision with a circular object
    checkCollision(target) {
        const distance = Math.sqrt(
            Math.pow(this.x - target.x, 2) + 
            Math.pow(this.y - target.y, 2)
        );
        return distance < (this.radius + target.radius);
    }
    
    // Create explosion effect when projectile hits
    explode() {
        if (!game) return;
        
        // Create explosion particles
        for (let i = 0; i < 6; i++) {
            const particle = {
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                size: Math.random() * 6 + 2,
                life: 1.0,
                decay: Math.random() * 0.03 + 0.02,
                color: `hsl(${Math.random() * 60 + 10}, 100%, ${Math.random() * 30 + 50}%)`,
                isActive: true,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.95; // Friction
                    this.vy *= 0.95;
                    this.life -= this.decay;
                    this.isActive = this.life > 0;
                }
            };
            game.particles.push(particle);
        }
        
        // Create shockwave effect
        const shockwave = {
            x: this.x,
            y: this.y,
            radius: 5,
            maxRadius: 40,
            life: 1.0,
            decay: 0.05,
            color: this.color,
            isActive: true,
            update(dt) {
                this.radius += (this.maxRadius - this.radius) * dt * 8;
                this.life -= this.decay;
                this.isActive = this.life > 0;
            },
            render(ctx) {
                ctx.save();
                ctx.globalAlpha = this.life * 0.4;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        game.particles.push(shockwave);
        
        this.isActive = false;
    }
}

/**
 * Special Projectile Types
 */

class RocketProjectile extends Projectile {
    constructor(x, y, angle, speed, damage, owner) {
        super(x, y, angle, speed, damage, owner);
        
        this.size = 6;
        this.maxDistance = 600;
        this.explosionRadius = 80;
        this.smokeTrail = [];
        this.maxSmokeLength = 15;
        
        // Rocket specific properties
        this.thrust = speed * 0.1;
        this.fuel = 2.0; // seconds of fuel
        this.hasThrust = true;
    }
    
    update(deltaTime) {
        // Apply thrust if fuel remains
        if (this.fuel > 0 && this.hasThrust) {
            this.velocity.x += Math.cos(this.angle) * this.thrust * deltaTime;
            this.velocity.y += Math.sin(this.angle) * this.thrust * deltaTime;
            this.fuel -= deltaTime;
            
            // Create smoke particles
            this.createSmokeParticle();
        }
        
        // Call parent update
        super.update(deltaTime);
    }
    
    createSmokeParticle() {
        const smokeX = this.x - Math.cos(this.angle) * 15;
        const smokeY = this.y - Math.sin(this.angle) * 15;
        
        const smoke = {
            x: smokeX + (Math.random() - 0.5) * 5,
            y: smokeY + (Math.random() - 0.5) * 5,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            size: Math.random() * 4 + 2,
            life: 1.0,
            decay: 0.02,
            color: `rgba(150, 150, 150, 0.6)`,
            isActive: true,
            update(dt) {
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.vx *= 0.98;
                this.vy *= 0.98;
                this.size += dt * 5;
                this.life -= this.decay;
                this.isActive = this.life > 0;
            }
        };
        
        if (game) {
            game.particles.push(smoke);
        }
    }
    
    explode() {
        // Larger explosion for rockets
        if (!game) return;
        
        for (let i = 0; i < 12; i++) {
            const particle = {
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: Math.random() * 8 + 3,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                color: `hsl(${Math.random() * 40}, 100%, ${Math.random() * 30 + 50}%)`,
                isActive: true,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.92;
                    this.vy *= 0.92;
                    this.life -= this.decay;
                    this.isActive = this.life > 0;
                }
            };
            game.particles.push(particle);
        }
        
        // Create multiple shockwaves
        for (let i = 0; i < 2; i++) {
            const shockwave = {
                x: this.x,
                y: this.y,
                radius: 10 + i * 5,
                maxRadius: 60 + i * 20,
                life: 1.0,
                decay: 0.03,
                color: this.color,
                isActive: true,
                update(dt) {
                    this.radius += (this.maxRadius - this.radius) * dt * 6;
                    this.life -= this.decay;
                    this.isActive = this.life > 0;
                },
                render(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.life * 0.3;
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            };
            game.particles.push(shockwave);
        }
        
        this.isActive = false;
    }
    
    render(ctx) {
        if (!this.isActive) return;
        
        ctx.save();
        
        // Render exhaust flame if thrusting
        if (this.fuel > 0 && this.hasThrust) {
            this.renderExhaust(ctx);
        }
        
        // Render trail
        this.renderTrail(ctx);
        
        // Render rocket body
        this.renderRocket(ctx);
        
        ctx.restore();
    }
    
    renderExhaust(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        const flameLength = 15 + Math.random() * 10;
        const flameWidth = 6;
        
        // Exhaust flame
        const gradient = ctx.createLinearGradient(-flameLength, 0, 0, 0);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-flameLength, -flameWidth/2);
        ctx.lineTo(-flameLength * 0.7, 0);
        ctx.lineTo(-flameLength, flameWidth/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    renderRocket(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Rocket body
        ctx.fillStyle = '#666666';
        ctx.fillRect(-this.size, -this.size/2, this.size * 2, this.size);
        
        // Rocket nose
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(this.size + 4, -this.size/2);
        ctx.lineTo(this.size + 4, this.size/2);
        ctx.closePath();
        ctx.fill();
        
        // Rocket fins
        ctx.fillStyle = '#888888';
        ctx.fillRect(-this.size, -this.size, 3, this.size/2);
        ctx.fillRect(-this.size, this.size/2, 3, this.size/2);
        
        ctx.restore();
    }
}