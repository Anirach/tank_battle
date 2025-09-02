/**
 * PowerUp Class - Collectible power-ups that enhance gameplay
 */

class PowerUp {
    constructor(x, y, type = null) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.isActive = true;
        
        // Power-up types
        this.types = [
            {
                name: 'health',
                color: '#ff0066',
                icon: '♥',
                description: 'Health Boost +50',
                rarity: 0.3
            },
            {
                name: 'rapidfire',
                color: '#ffaa00',
                icon: '⚡',
                description: 'Rapid Fire 8s',
                rarity: 0.25
            },
            {
                name: 'damage',
                color: '#ff4444',
                icon: '💥',
                description: 'Damage Boost +15',
                rarity: 0.2
            },
            {
                name: 'speed',
                color: '#00aaff',
                icon: '🚀',
                description: 'Speed Boost 10s',
                rarity: 0.15
            },
            {
                name: 'shield',
                color: '#8844ff',
                icon: '🛡',
                description: 'Temporary Shield 15s',
                rarity: 0.1
            }
        ];
        
        // Select power-up type
        if (type) {
            this.type = this.types.find(t => t.name === type) || this.types[0];
        } else {
            this.type = this.selectRandomType();
        }
        
        // Visual properties
        this.rotation = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.pulseSpeed = 2 + Math.random() * 2;
        
        // Collection effect
        this.collected = false;
        this.collectionTime = 0;
        
        // Lifetime
        this.maxLifetime = 30; // 30 seconds
        this.lifetime = this.maxLifetime;
        
        // Spawn animation
        this.spawnTime = 0;
        this.spawnDuration = 0.5;
        this.scale = 0;
    }
    
    selectRandomType() {
        const random = Math.random();
        let cumulativeRarity = 0;
        
        for (let type of this.types) {
            cumulativeRarity += type.rarity;
            if (random <= cumulativeRarity) {
                return type;
            }
        }
        
        // Fallback to first type
        return this.types[0];
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update spawn animation
        if (this.spawnTime < this.spawnDuration) {
            this.spawnTime += deltaTime;
            this.scale = Math.min(1, this.spawnTime / this.spawnDuration);
            this.scale = this.easeOutBack(this.scale);
        } else {
            this.scale = 1;
        }
        
        // Update visual effects
        this.rotation += deltaTime * 1.5;
        this.glowIntensity += this.glowDirection * deltaTime * this.pulseSpeed;
        
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
        
        // Update lifetime
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.isActive = false;
        }
        
        // Collection animation
        if (this.collected) {
            this.collectionTime += deltaTime;
            if (this.collectionTime > 0.5) {
                this.isActive = false;
            }
        }
    }
    
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    
    apply(tank) {
        if (this.collected) return;
        
        this.collected = true;
        
        // Apply power-up effect based on type
        switch (this.type.name) {
            case 'health':
                tank.heal(50);
                this.createHealEffect(tank);
                break;
                
            case 'rapidfire':
                tank.activateRapidFire(8);
                this.createRapidFireEffect(tank);
                break;
                
            case 'damage':
                tank.damage += 15;
                this.createDamageBoostEffect(tank);
                // Temporary boost - will reset on respawn/restart
                setTimeout(() => {
                    if (tank.health > 0) {
                        tank.damage = Math.max(25, tank.damage - 15);
                    }
                }, 15000);
                break;
                
            case 'speed':
                const originalSpeed = tank.speed;
                tank.speed += 50;
                this.createSpeedBoostEffect(tank);
                // Temporary boost
                setTimeout(() => {
                    if (tank.health > 0) {
                        tank.speed = originalSpeed;
                    }
                }, 10000);
                break;
                
            case 'shield':
                this.activateShield(tank);
                break;
        }
        
        // Create collection particles
        this.createCollectionEffect();
        
        // Update score
        if (game) {
            game.score += 50;
        }
    }
    
    activateShield(tank) {
        tank.hasShield = true;
        tank.shieldHealth = 100;
        tank.shieldDuration = 15;
        
        // Override tank's takeDamage method temporarily
        const originalTakeDamage = tank.takeDamage.bind(tank);
        
        tank.takeDamage = function(damage) {
            if (this.hasShield && this.shieldHealth > 0) {
                this.shieldHealth -= damage;
                if (this.shieldHealth <= 0) {
                    this.hasShield = false;
                    this.shieldHealth = 0;
                    // Restore original takeDamage method
                    this.takeDamage = originalTakeDamage;
                }
                // Create shield hit effect
                this.createShieldHitEffect();
                return;
            }
            // Call original method if shield is down
            originalTakeDamage(damage);
        };
        
        // Auto-remove shield after duration
        setTimeout(() => {
            if (tank.health > 0) {
                tank.hasShield = false;
                tank.shieldHealth = 0;
                tank.takeDamage = originalTakeDamage;
            }
        }, 15000);
        
        this.createShieldActivationEffect(tank);
    }
    
    createHealEffect(tank) {
        if (!game) return;
        
        for (let i = 0; i < 8; i++) {
            const particle = {
                x: tank.x + (Math.random() - 0.5) * 60,
                y: tank.y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 50,
                vy: -Math.random() * 100 - 50,
                size: Math.random() * 6 + 3,
                life: 1.0,
                decay: 0.02,
                color: '#ff0066',
                symbol: '♥',
                isActive: true,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vy += 50 * dt; // Gravity
                    this.life -= this.decay;
                    this.isActive = this.life > 0;
                },
                render(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.life;
                    ctx.fillStyle = this.color;
                    ctx.font = `${this.size}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(this.symbol, this.x, this.y);
                    ctx.restore();
                }
            };
            game.particles.push(particle);
        }
    }
    
    createRapidFireEffect(tank) {
        // Add glowing effect to tank during rapid fire
        tank.rapidFireGlow = true;
    }
    
    createDamageBoostEffect(tank) {
        if (!game) return;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const particle = {
                x: tank.x + Math.cos(angle) * 30,
                y: tank.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * 80,
                vy: Math.sin(angle) * 80,
                size: 8,
                life: 1.0,
                decay: 0.03,
                color: '#ff4444',
                symbol: '💥',
                isActive: true,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                    this.life -= this.decay;
                    this.isActive = this.life > 0;
                },
                render(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.life;
                    ctx.fillStyle = this.color;
                    ctx.font = `${this.size}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(this.symbol, this.x, this.y);
                    ctx.restore();
                }
            };
            game.particles.push(particle);
        }
    }
    
    createSpeedBoostEffect(tank) {
        if (!game) return;
        
        // Create speed lines behind tank
        for (let i = 0; i < 10; i++) {
            const particle = {
                x: tank.x - Math.cos(tank.angle) * (20 + i * 5),
                y: tank.y - Math.sin(tank.angle) * (20 + i * 5),
                vx: -Math.cos(tank.angle) * 100,
                vy: -Math.sin(tank.angle) * 100,
                width: 3,
                height: 20,
                life: 1.0,
                decay: 0.05,
                color: '#00aaff',
                isActive: true,
                update(dt) {
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.life -= this.decay;
                    this.isActive = this.life > 0;
                },
                render(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.life;
                    ctx.fillStyle = this.color;
                    ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
                    ctx.restore();
                }
            };
            game.particles.push(particle);
        }
    }
    
    createShieldActivationEffect(tank) {
        if (!game) return;
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const particle = {
                x: tank.x,
                y: tank.y,
                targetX: tank.x + Math.cos(angle) * 50,
                targetY: tank.y + Math.sin(angle) * 50,
                progress: 0,
                size: 4,
                life: 1.0,
                decay: 0.02,
                color: '#8844ff',
                isActive: true,
                update(dt) {
                    this.progress += dt * 2;
                    if (this.progress >= 1) {
                        this.progress = 1;
                        this.life -= this.decay;
                        this.isActive = this.life > 0;
                    }
                    
                    // Interpolate position
                    this.x = tank.x + (this.targetX - tank.x) * this.progress;
                    this.y = tank.y + (this.targetY - tank.y) * this.progress;
                },
                render(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.life;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            };
            game.particles.push(particle);
        }
    }
    
    createCollectionEffect() {
        if (!game) return;
        
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: 0.03,
                color: this.type.color,
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
    }
    
    render(ctx) {
        if (!this.isActive || this.collected) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Floating animation
        const bobAmount = Math.sin(Date.now() * 0.003 + this.bobOffset) * 5;
        ctx.translate(0, bobAmount);
        
        // Outer glow
        ctx.save();
        ctx.globalAlpha = this.glowIntensity * 0.4;
        ctx.shadowColor = this.type.color;
        ctx.shadowBlur = 25;
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Main power-up body
        ctx.rotate(this.rotation);
        
        // Background circle
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, this.type.color);
        gradient.addColorStop(0.7, this.type.color + '88');
        gradient.addColorStop(1, this.type.color + '22');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = `${this.radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, 0, 0);
        
        // Lifetime indicator
        if (this.lifetime < 5) {
            ctx.save();
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            
            const angle = (this.lifetime / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, -Math.PI/2, -Math.PI/2 + angle, false);
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.restore();
        
        // Description text (when close to player)
        if (game && game.playerTank) {
            const distance = Math.sqrt(
                Math.pow(this.x - game.playerTank.x, 2) + 
                Math.pow(this.y - game.playerTank.y, 2)
            );
            
            if (distance < 80) {
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.strokeText(this.type.description, this.x, this.y - 40);
                ctx.fillText(this.type.description, this.x, this.y - 40);
                ctx.restore();
            }
        }
    }
}