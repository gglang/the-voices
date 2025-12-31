import Phaser from 'phaser';

// Cop behavior states
const CopState = {
  WANDERING: 'wandering',
  INVESTIGATING: 'investigating',
  CHASING: 'chasing',
  GOING_TO_LAST_SEEN: 'going_to_last_seen'
};

export class Police {
  constructor(scene, x, y) {
    this.scene = scene;
    this.baseSpeed = 64; // 80% of player speed (80 * 0.8)
    this.chaseSpeed = 80; // Same as player when chasing
    this.isAlive = true;

    // Health system
    this.maxHealth = 2;
    this.health = this.maxHealth;
    this.lastDamageTime = 0;
    this.healDelay = 30000; // 30 seconds to heal

    // Detection/arrest state
    this.isDetecting = false;
    this.detectionTimer = 0;
    this.detectionDuration = 2000; // 2 seconds
    this.flashTimer = 0;

    // Behavior state
    this.state = CopState.WANDERING;
    this.targetX = x;
    this.targetY = y;
    this.lastSeenPlayerX = null;
    this.lastSeenPlayerY = null;
    this.investigationTarget = null; // {x, y} of kill site
    this.waitTimer = 0;
    this.isWaiting = false;
    this.stuckTimer = 0;
    this.lastPosition = { x, y };

    // Create the sprite with physics
    this.sprite = scene.physics.add.sprite(x, y, 'police');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(12, 12);
    this.sprite.body.setOffset(2, 4);

    // Store reference to this Police on the sprite
    this.sprite.parentEntity = this;

    // Health bar graphics (created when damaged)
    this.healthBar = null;

    // Pick first wander target
    this.pickNewWanderTarget();
  }

  pickNewWanderTarget() {
    // Pick random point anywhere on the map, avoiding walls
    const bounds = this.scene.physics.world.bounds;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const x = Phaser.Math.Between(bounds.x + 48, bounds.right - 48);
      const y = Phaser.Math.Between(bounds.y + 48, bounds.bottom - 48);

      // Check if point is not inside a wall
      if (!this.isPointInWall(x, y)) {
        this.targetX = x;
        this.targetY = y;
        this.isWaiting = false;
        return;
      }
      attempts++;
    }

    // Fallback: just pick a random point
    this.targetX = Phaser.Math.Between(bounds.x + 48, bounds.right - 48);
    this.targetY = Phaser.Math.Between(bounds.y + 48, bounds.bottom - 48);
    this.isWaiting = false;
  }

  isPointInWall(x, y) {
    // Check if a point collides with any wall
    const walls = this.scene.walls;
    if (!walls) return false;

    let inWall = false;
    walls.children.iterate(wall => {
      if (!wall) return;
      const dx = Math.abs(wall.x - x);
      const dy = Math.abs(wall.y - y);
      if (dx < 16 && dy < 16) {
        inWall = true;
      }
    });
    return inWall;
  }

  hasLineOfSight(targetX, targetY) {
    // Simple raycast to check line of sight
    const startX = this.sprite.x;
    const startY = this.sprite.y;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance / 8); // Check every 8 pixels

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = startX + dx * t;
      const checkY = startY + dy * t;

      if (this.isPointInWall(checkX, checkY)) {
        return false;
      }
    }
    return true;
  }

  update(delta) {
    if (!this.isAlive || !this.sprite.active) return;

    // Handle healing
    this.updateHealing(delta);

    // Update health bar position
    this.updateHealthBar();

    // Check for player chase (highest priority except when arresting)
    this.checkPlayerChase();

    // Check arrest condition (3 tile range)
    this.checkPlayerDetection(delta);

    // Check for nearby bodies while wandering
    if (this.state === CopState.WANDERING) {
      this.checkForBodies();
    }

    // Handle stuck detection and avoidance
    this.handleStuckDetection(delta);

    // Handle movement based on state
    this.handleMovement(delta);
  }

  updateHealing(delta) {
    if (this.health < this.maxHealth && this.health > 0) {
      const timeSinceDamage = this.scene.time.now - this.lastDamageTime;
      if (timeSinceDamage >= this.healDelay) {
        this.health = Math.min(this.health + 1, this.maxHealth);
        this.lastDamageTime = this.scene.time.now;

        // Hide health bar if fully healed
        if (this.health >= this.maxHealth && this.healthBar) {
          this.healthBar.destroy();
          this.healthBar = null;
        } else {
          this.updateHealthBarGraphics();
        }
      }
    }
  }

  checkPlayerChase() {
    if (this.scene.isGameOver) return;
    if (this.isDetecting) return; // Don't change state while arresting

    const player = this.scene.player;
    if (!player || !player.sprite) return;

    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const chaseRange = 4 * 16; // 4 tiles in pixels

    if (distance < chaseRange && this.hasLineOfSight(player.sprite.x, player.sprite.y)) {
      // Can see player - chase them
      this.state = CopState.CHASING;
      this.lastSeenPlayerX = player.sprite.x;
      this.lastSeenPlayerY = player.sprite.y;
      this.targetX = player.sprite.x;
      this.targetY = player.sprite.y;
      this.isWaiting = false;
    } else if (this.state === CopState.CHASING) {
      // Lost sight of player - go to last seen position
      if (this.lastSeenPlayerX !== null) {
        this.state = CopState.GOING_TO_LAST_SEEN;
        this.targetX = this.lastSeenPlayerX;
        this.targetY = this.lastSeenPlayerY;
        this.isWaiting = false;
      } else {
        this.state = CopState.WANDERING;
        this.pickNewWanderTarget();
      }
    }
  }

  checkForBodies() {
    // Check for dead humans or cops nearby
    const checkRadius = 3 * 16; // 3 tiles

    // Check dead humans
    this.scene.humans.forEach(human => {
      if (!human.isAlive && human.bodyDiscovered === false) {
        const dx = human.sprite.x - this.sprite.x;
        const dy = human.sprite.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < checkRadius && this.hasLineOfSight(human.sprite.x, human.sprite.y)) {
          human.bodyDiscovered = true;
          this.scene.onBodyDiscovered(human.sprite.x, human.sprite.y, false);
        }
      }
    });

    // Check dead cops
    this.scene.deadCopBodies.forEach(body => {
      if (!body.discovered) {
        const dx = body.x - this.sprite.x;
        const dy = body.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < checkRadius && this.hasLineOfSight(body.x, body.y)) {
          body.discovered = true;
          this.scene.onBodyDiscovered(body.x, body.y, true);
        }
      }
    });
  }

  handleStuckDetection(delta) {
    const dx = this.sprite.x - this.lastPosition.x;
    const dy = this.sprite.y - this.lastPosition.y;
    const moved = Math.sqrt(dx * dx + dy * dy);

    if (moved < 1 && !this.isWaiting) {
      this.stuckTimer += delta;

      if (this.stuckTimer > 1000) {
        // Stuck for 1 second, try to find a new path
        this.findAlternativePath();
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }

    this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
  }

  findAlternativePath() {
    // Try to move around the obstacle by picking a perpendicular direction
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;

    // Try perpendicular directions
    const perpendiculars = [
      { x: this.sprite.x + dy * 0.5, y: this.sprite.y - dx * 0.5 },
      { x: this.sprite.x - dy * 0.5, y: this.sprite.y + dx * 0.5 }
    ];

    for (const point of perpendiculars) {
      if (!this.isPointInWall(point.x, point.y)) {
        // Temporarily set intermediate target
        this.intermediateTargetX = point.x;
        this.intermediateTargetY = point.y;
        return;
      }
    }

    // If all else fails, pick a random nearby point
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const checkX = this.sprite.x + Math.cos(angle) * 48;
      const checkY = this.sprite.y + Math.sin(angle) * 48;

      if (!this.isPointInWall(checkX, checkY)) {
        this.intermediateTargetX = checkX;
        this.intermediateTargetY = checkY;
        return;
      }
    }
  }

  handleMovement(delta) {
    if (this.isWaiting) {
      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        this.isWaiting = false;
        if (this.state === CopState.WANDERING) {
          this.pickNewWanderTarget();
        } else if (this.state === CopState.GOING_TO_LAST_SEEN) {
          // Reached last seen position, resume wandering
          this.state = CopState.WANDERING;
          this.lastSeenPlayerX = null;
          this.lastSeenPlayerY = null;
          this.pickNewWanderTarget();
        } else if (this.state === CopState.INVESTIGATING) {
          // Done investigating, resume wandering
          this.state = CopState.WANDERING;
          this.investigationTarget = null;
          this.pickNewWanderTarget();
        }
      }
      this.sprite.setVelocity(0, 0);
      return;
    }

    // Determine current target (use intermediate target if set)
    let currentTargetX = this.intermediateTargetX ?? this.targetX;
    let currentTargetY = this.intermediateTargetY ?? this.targetY;

    // If chasing, continuously update target to player position
    if (this.state === CopState.CHASING) {
      const player = this.scene.player;
      if (player && player.sprite) {
        currentTargetX = player.sprite.x;
        currentTargetY = player.sprite.y;
        this.lastSeenPlayerX = player.sprite.x;
        this.lastSeenPlayerY = player.sprite.y;
      }
    }

    // Move towards target
    const dx = currentTargetX - this.sprite.x;
    const dy = currentTargetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if reached intermediate target
    if (this.intermediateTargetX !== undefined && distance < 16) {
      this.intermediateTargetX = undefined;
      this.intermediateTargetY = undefined;
      return;
    }

    // Determine speed based on state
    const speed = this.state === CopState.CHASING ? this.chaseSpeed : this.baseSpeed;

    if (distance < 8) {
      // Reached target
      this.isWaiting = true;

      if (this.state === CopState.WANDERING) {
        this.waitTimer = Phaser.Math.Between(500, 1500);
      } else if (this.state === CopState.INVESTIGATING) {
        this.waitTimer = 2000; // Wait 2 seconds at investigation site
      } else {
        this.waitTimer = 500;
      }

      this.sprite.setVelocity(0, 0);
    } else {
      // Move towards target
      const vx = (dx / distance) * speed;
      const vy = (dy / distance) * speed;
      this.sprite.setVelocity(vx, vy);
    }
  }

  assignInvestigation(x, y) {
    // Only accept investigation if wandering (not chasing or already investigating)
    if (this.state === CopState.WANDERING) {
      this.state = CopState.INVESTIGATING;
      this.investigationTarget = { x, y };
      this.targetX = x;
      this.targetY = y;
      this.isWaiting = false;
    }
  }

  checkPlayerDetection(delta) {
    if (this.scene.isGameOver) return;

    const player = this.scene.player;
    if (!player || !player.sprite) return;

    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const detectionRange = 3 * 16; // 3 tiles in pixels

    if (distance < detectionRange) {
      // Player in range - start or continue detection
      if (!this.isDetecting) {
        this.isDetecting = true;
        this.detectionTimer = 0;
      }

      this.detectionTimer += delta;
      this.flashTimer += delta;

      // Flash red with increasing frequency
      const progress = this.detectionTimer / this.detectionDuration;
      const flashRate = 500 - (progress * 400); // 500ms -> 100ms

      if (this.flashTimer >= flashRate) {
        this.flashTimer = 0;
        // Toggle tint
        if (this.sprite.tintTopLeft === 0xff0000) {
          this.sprite.clearTint();
        } else {
          this.sprite.setTint(0xff0000);
        }
      }

      // Check if detection complete
      if (this.detectionTimer >= this.detectionDuration) {
        this.scene.triggerGameOver();
      }
    } else {
      // Player escaped
      if (this.isDetecting) {
        this.isDetecting = false;
        this.detectionTimer = 0;
        this.flashTimer = 0;
        this.sprite.clearTint();
      }
    }
  }

  takeDamage() {
    if (!this.isAlive) return false;

    this.health--;
    this.lastDamageTime = this.scene.time.now;

    // Flash yellow to indicate damage
    this.sprite.setTint(0xffff00);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite && this.sprite.active && this.isAlive) {
        this.sprite.clearTint();
      }
    });

    // Create or update health bar
    if (!this.healthBar) {
      this.createHealthBar();
    }
    this.updateHealthBarGraphics();

    if (this.health <= 0) {
      this.die();
      return true; // Cop died
    }
    return false; // Cop still alive
  }

  createHealthBar() {
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(50);

    // Make UI camera ignore health bar
    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.healthBar);
    }
  }

  updateHealthBarGraphics() {
    if (!this.healthBar) return;

    this.healthBar.clear();

    const barWidth = 16;
    const barHeight = 3;
    const blockWidth = barWidth / this.maxHealth;

    // Draw background (gray for lost health)
    this.healthBar.fillStyle(0x444444);
    this.healthBar.fillRect(-barWidth / 2, -12, barWidth, barHeight);

    // Draw health blocks (green)
    this.healthBar.fillStyle(0x00ff00);
    for (let i = 0; i < this.health; i++) {
      this.healthBar.fillRect(-barWidth / 2 + i * blockWidth, -12, blockWidth - 1, barHeight);
    }
  }

  updateHealthBar() {
    if (this.healthBar) {
      this.healthBar.setPosition(this.sprite.x, this.sprite.y);
    }
  }

  die() {
    this.isAlive = false;

    // Cancel detection
    this.isDetecting = false;
    this.sprite.clearTint();

    // Alert nearby cops to investigate the disturbance
    this.scene.alertCopsToDisturbance(this.sprite.x, this.sprite.y);

    // Add to dead cop bodies list for discovery
    this.scene.deadCopBodies.push({
      x: this.sprite.x,
      y: this.sprite.y,
      discovered: false
    });

    // Blood splatter effect
    this.scene.spawnBloodSplatter(this.sprite.x, this.sprite.y);

    // Destroy health bar
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }

    // Fade out and destroy
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.sprite.destroy();
      }
    });
  }

  destroy() {
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
