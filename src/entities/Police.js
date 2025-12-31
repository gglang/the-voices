import Phaser from 'phaser';

export class Police {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 80;
    this.isAlive = true;

    // Detection state
    this.isDetecting = false;
    this.detectionTimer = 0;
    this.detectionDuration = 2000; // 2 seconds
    this.flashTimer = 0;

    // Create the sprite with physics
    this.sprite = scene.physics.add.sprite(x, y, 'police');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(12, 12);
    this.sprite.body.setOffset(2, 4);

    // Store reference to this Police on the sprite
    this.sprite.parentEntity = this;

    // Wandering state (map-wide)
    this.targetX = x;
    this.targetY = y;
    this.waitTimer = 0;
    this.isWaiting = true;

    // Pick first wander target
    this.pickNewTarget();
  }

  pickNewTarget() {
    // Pick random point anywhere on the map
    const bounds = this.scene.physics.world.bounds;
    this.targetX = Phaser.Math.Between(bounds.x + 32, bounds.right - 32);
    this.targetY = Phaser.Math.Between(bounds.y + 32, bounds.bottom - 32);
    this.isWaiting = false;
  }

  update(delta) {
    if (!this.isAlive || !this.sprite.active) return;

    // Check distance to player for detection
    this.checkPlayerDetection(delta);

    // Handle movement
    if (this.isWaiting) {
      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        this.pickNewTarget();
      }
      this.sprite.setVelocity(0, 0);
      return;
    }

    // Move towards target
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 8) {
      // Reached target, wait briefly
      this.isWaiting = true;
      this.waitTimer = Phaser.Math.Between(500, 1500);
      this.sprite.setVelocity(0, 0);
    } else {
      // Move towards target
      const vx = (dx / distance) * this.speed;
      const vy = (dy / distance) * this.speed;
      this.sprite.setVelocity(vx, vy);
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

  kill() {
    if (!this.isAlive) return;
    this.isAlive = false;

    // Cancel detection
    this.isDetecting = false;
    this.sprite.clearTint();

    // Queue cop respawn (3 cops in 30 seconds near this location)
    this.scene.queueCopRespawn(this.sprite.x, this.sprite.y, false);

    // Blood splatter effect
    this.scene.spawnBloodSplatter(this.sprite.x, this.sprite.y);

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
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
