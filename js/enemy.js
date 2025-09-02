/**
 * Enemy Class - Intelligent AI-driven enemy tanks
 */

class Enemy extends Tank {
    constructor(x, y, angle) {
        super(x, y, angle, 'enemy');
        
        // AI properties
        this.state = 'patrol'; // patrol, chase, attack, retreat
        this.stateTime = 0;
        this.targetPosition = { x: x, y: y };
        this.lastPlayerPosition = { x: 0, y: 0 };
        this.detectionRange = 250;
        this.attackRange = 200;
        this.fleeHealthThreshold = 20;
        
        // AI behavior timers
        this.lastShotTime = 0;
        this.lastStateChange = 0;
        this.pathUpdateTime = 0;
        this.stuckTime = 0;
        this.lastPosition = { x: x, y: y };
        
        // Pathfinding
        this.path = [];
        this.currentPathIndex = 0;
        this.pathfindingCooldown = 0;
        
        // Combat AI
        this.predictiveAiming = true;
        this.accuracy = 0.8; // 80% accuracy
        this.reactionTime = 0.3; // seconds to react
        this.lastReactionTime = 0;
        
        // Movement patterns
        this.patrolPoints = this.generatePatrolPoints();
        this.currentPatrolIndex = 0;
        
        // Enemy stats (slightly different from player)
        this.health = 75;
        this.maxHealth = 75;
        this.speed = 120;
        this.damage = 20;
        this.fireRate = 0.8;
        
        // Visual differences
        this.aiDebugMode = false; // Set to true to show AI debug info
    }
    
    generatePatrolPoints() {
        const points = [];
        const numPoints = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: this.x + (Math.random() - 0.5) * 400,
                y: this.y + (Math.random() - 0.5) * 400
            });
        }
        
        return points;
    }
    
    update(deltaTime, player, obstacles) {
        super.updateEffects(deltaTime);
        
        if (!player) return;
        
        this.stateTime += deltaTime;
        this.pathfindingCooldown -= deltaTime;
        
        // Update AI state machine
        this.updateAI(deltaTime, player, obstacles);
        
        // Execute current behavior
        this.executeBehavior(deltaTime, player, obstacles);
        
        // Update movement and physics
        this.updateMovement(deltaTime);
        
        // Keep enemy in world bounds
        this.constrainToWorld();
        
        // Check if stuck and try to unstuck
        this.checkIfStuck(deltaTime);
    }
    
    updateAI(deltaTime, player, obstacles) {
        const distanceToPlayer = this.getDistanceTo(player);
        const canSeePlayer = this.canSeeTarget(player, obstacles);
        
        // Store last known player position
        if (canSeePlayer) {
            this.lastPlayerPosition.x = player.x;
            this.lastPlayerPosition.y = player.y;
            this.lastReactionTime = 0;
        } else {
            this.lastReactionTime += deltaTime;
        }
        
        // State transition logic
        const previousState = this.state;
        
        switch (this.state) {
            case 'patrol':
                if (canSeePlayer && distanceToPlayer < this.detectionRange) {
                    this.setState('chase');
                }
                break;
                
            case 'chase':
                if (!canSeePlayer && this.lastReactionTime > 3.0) {
                    this.setState('patrol');
                } else if (canSeePlayer && distanceToPlayer < this.attackRange) {
                    this.setState('attack');
                } else if (this.health < this.fleeHealthThreshold) {
                    this.setState('retreat');
                }
                break;
                
            case 'attack':
                if (distanceToPlayer > this.attackRange * 1.5) {
                    this.setState('chase');
                } else if (this.health < this.fleeHealthThreshold) {
                    this.setState('retreat');
                } else if (!canSeePlayer && this.lastReactionTime > 2.0) {
                    this.setState('chase');
                }
                break;
                
            case 'retreat':
                if (this.health > this.fleeHealthThreshold * 1.5 && 
                    distanceToPlayer > this.detectionRange) {
                    this.setState('patrol');
                }
                break;
        }
        
        // Reset state time if state changed
        if (previousState !== this.state) {
            this.stateTime = 0;
            this.lastStateChange = Date.now();
        }
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTime = 0;
        
        // Clear current path when changing states
        this.path = [];
        this.currentPathIndex = 0;
    }
    
    executeBehavior(deltaTime, player, obstacles) {
        switch (this.state) {
            case 'patrol':
                this.executePatrol(deltaTime, obstacles);
                break;
                
            case 'chase':
                this.executeChase(deltaTime, player, obstacles);
                break;
                
            case 'attack':
                this.executeAttack(deltaTime, player, obstacles);
                break;
                
            case 'retreat':
                this.executeRetreat(deltaTime, player, obstacles);
                break;
        }
    }
    
    executePatrol(deltaTime, obstacles) {
        if (this.patrolPoints.length === 0) return;
        
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const distance = this.getDistanceTo(targetPoint);
        
        if (distance < 50) {
            // Reached patrol point, move to next
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            // Move towards patrol point
            this.moveTowards(targetPoint, obstacles);
        }
    }
    
    executeChase(deltaTime, player, obstacles) {
        // Move towards last known player position
        this.moveTowards(this.lastPlayerPosition, obstacles);
        
        // Aim at player
        if (this.canSeeTarget(player, obstacles)) {
            this.aimAt(player);
        }
    }
    
    executeAttack(deltaTime, player, obstacles) {
        // Strafe around player while maintaining distance
        const distanceToPlayer = this.getDistanceTo(player);
        
        if (distanceToPlayer < this.attackRange * 0.7) {
            // Too close, back away while shooting
            const retreatPoint = this.calculateRetreatPoint(player);
            this.moveTowards(retreatPoint, obstacles);
        } else if (distanceToPlayer > this.attackRange) {
            // Too far, move closer
            this.moveTowards(player, obstacles);
        } else {
            // Good distance, strafe
            this.executeStrafe(deltaTime, player);
        }
        
        // Aim and shoot at player
        if (this.canSeeTarget(player, obstacles)) {
            this.aimAt(player);
            this.attemptShoot(player);
        }
    }
    
    executeRetreat(deltaTime, player, obstacles) {
        const retreatPoint = this.calculateRetreatPoint(player);
        this.moveTowards(retreatPoint, obstacles);
        
        // Still try to shoot while retreating
        if (this.canSeeTarget(player, obstacles) && Math.random() < 0.3) {
            this.aimAt(player);
            this.attemptShoot(player);
        }
    }
    
    executeStrafe(deltaTime, player) {
        // Circle strafe around player
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        const strafeAngle = angleToPlayer + (Math.PI / 2) * (Math.random() < 0.5 ? 1 : -1);
        
        const strafePoint = {
            x: this.x + Math.cos(strafeAngle) * 100,
            y: this.y + Math.sin(strafeAngle) * 100
        };
        
        this.targetPosition = strafePoint;
    }
    
    moveTowards(target, obstacles) {
        const distance = this.getDistanceTo(target);
        if (distance < 10) return;
        
        // Simple pathfinding - direct movement with obstacle avoidance
        let targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
        
        // Check for obstacles in the way
        const obstacleAvoidance = this.getObstacleAvoidanceVector(obstacles);
        if (obstacleAvoidance) {
            targetAngle += obstacleAvoidance * 0.5;
        }
        
        // Smooth rotation towards target
        this.rotateTowards(targetAngle);
        
        // Move forward
        this.accelerate();
    }
    
    getObstacleAvoidanceVector(obstacles) {
        const lookAheadDistance = 80;
        const avoidanceAngle = Math.PI / 4; // 45 degrees
        
        for (let obstacle of obstacles) {
            const obstacleDistance = this.getDistanceTo(obstacle);
            
            if (obstacleDistance < lookAheadDistance) {
                // Calculate avoidance direction
                const obstacleAngle = Math.atan2(obstacle.y - this.y, obstacle.x - this.x);
                const angleDiff = this.normalizeAngle(obstacleAngle - this.angle);
                
                // If obstacle is in front, return avoidance vector
                if (Math.abs(angleDiff) < avoidanceAngle) {
                    return angleDiff > 0 ? -1 : 1; // Turn away from obstacle
                }
            }
        }
        
        return null;
    }
    
    rotateTowards(targetAngle) {
        let angleDiff = this.normalizeAngle(targetAngle - this.angle);
        const maxRotation = this.rotationSpeed * 0.016; // Assume 60fps
        
        if (Math.abs(angleDiff) < maxRotation) {
            this.angle = targetAngle;
        } else {
            this.angle += Math.sign(angleDiff) * maxRotation;
        }
    }
    
    accelerate() {
        this.velocity.x += Math.cos(this.angle) * this.acceleration * 0.016;
        this.velocity.y += Math.sin(this.angle) * this.acceleration * 0.016;
    }
    
    aimAt(target) {
        let targetAngle;
        
        if (this.predictiveAiming) {
            // Predictive aiming - aim where target will be
            const timeToTarget = this.getDistanceTo(target) / this.projectileSpeed;
            const predictedX = target.x + target.velocity.x * timeToTarget;
            const predictedY = target.y + target.velocity.y * timeToTarget;
            
            targetAngle = Math.atan2(predictedY - this.y, predictedX - this.x);
        } else {
            // Direct aiming
            targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
        }
        
        // Add some inaccuracy
        const inaccuracy = (1 - this.accuracy) * (Math.random() - 0.5) * Math.PI / 4;
        targetAngle += inaccuracy;
        
        // Smooth turret rotation
        let angleDiff = this.normalizeAngle(targetAngle - this.turretAngle);
        const maxRotation = this.turretRotationSpeed * 0.016;
        
        if (Math.abs(angleDiff) < maxRotation) {
            this.turretAngle = targetAngle;
        } else {
            this.turretAngle += Math.sign(angleDiff) * maxRotation;
        }
    }
    
    attemptShoot(target) {
        const currentTime = Date.now() / 1000;
        
        if (currentTime - this.lastShotTime < this.fireRate) return;
        
        // Check if turret is roughly aimed at target
        const targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
        const angleDiff = Math.abs(this.normalizeAngle(targetAngle - this.turretAngle));
        
        if (angleDiff < Math.PI / 8) { // Within 22.5 degrees
            this.shoot();
        }
    }
    
    calculateRetreatPoint(player) {
        // Find a point away from player
        const retreatAngle = Math.atan2(this.y - player.y, this.x - player.x);
        const retreatDistance = 200;
        
        return {
            x: this.x + Math.cos(retreatAngle) * retreatDistance,
            y: this.y + Math.sin(retreatAngle) * retreatDistance
        };
    }
    
    canSeeTarget(target, obstacles) {
        // Simple line-of-sight check
        const steps = 20;
        const dx = (target.x - this.x) / steps;
        const dy = (target.y - this.y) / steps;
        
        for (let i = 0; i < steps; i++) {
            const checkX = this.x + dx * i;
            const checkY = this.y + dy * i;
            
            // Check against obstacles
            for (let obstacle of obstacles) {
                if (checkX >= obstacle.x && checkX <= obstacle.x + obstacle.width &&
                    checkY >= obstacle.y && checkY <= obstacle.y + obstacle.height) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    getDistanceTo(target) {
        return Math.sqrt(
            Math.pow(target.x - this.x, 2) + 
            Math.pow(target.y - this.y, 2)
        );
    }
    
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }
    
    checkIfStuck(deltaTime) {
        const currentPos = { x: this.x, y: this.y };
        const distanceMoved = this.getDistanceTo(this.lastPosition);
        
        if (distanceMoved < 5) {
            this.stuckTime += deltaTime;
        } else {
            this.stuckTime = 0;
        }
        
        // If stuck for too long, try random direction
        if (this.stuckTime > 2.0) {
            this.angle += (Math.random() - 0.5) * Math.PI;
            this.stuckTime = 0;
        }
        
        this.lastPosition = currentPos;
    }
    
    constrainToWorld() {
        if (!game) return;
        
        if (this.x < 30) {
            this.x = 30;
            this.velocity.x = Math.abs(this.velocity.x);
        }
        if (this.x > game.worldWidth - 30) {
            this.x = game.worldWidth - 30;
            this.velocity.x = -Math.abs(this.velocity.x);
        }
        if (this.y < 30) {
            this.y = 30;
            this.velocity.y = Math.abs(this.velocity.y);
        }
        if (this.y > game.worldHeight - 30) {
            this.y = game.worldHeight - 30;
            this.velocity.y = -Math.abs(this.velocity.y);
        }
    }
    
    updateMovement(deltaTime) {
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
    
    render(ctx) {
        // Call parent render method
        super.render(ctx);
        
        // Render AI debug info if enabled
        if (this.aiDebugMode) {
            this.renderDebugInfo(ctx);
        }
    }
    
    renderDebugInfo(ctx) {
        ctx.save();
        
        // State text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(this.state, this.x - 20, this.y - 40);
        
        // Detection range
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.detectionRange, 0, Math.PI * 2);
        ctx.stroke();
        
        // Attack range
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
        ctx.stroke();
        
        // Target position
        if (this.targetPosition) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(this.targetPosition.x, this.targetPosition.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Line to target
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.targetPosition.x, this.targetPosition.y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}