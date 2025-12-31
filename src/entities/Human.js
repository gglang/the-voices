import Phaser from 'phaser';

export class Human {
  constructor(scene, x, y, hairColor, skinColor) {
    this.scene = scene;
    this.speed = 80;
    this.spawnX = x;
    this.spawnY = y;
    this.wanderRadius = 5 * 16; // 5 tiles in pixels
    this.hairColor = hairColor;
    this.skinColor = skinColor;
    this.isAlive = true;
    this.bodyDiscovered = false;

    // Create texture key based on colors
    const textureKey = `human_${hairColor}_${skinColor}`;

    // Create the sprite with physics
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(12, 12);
    this.sprite.body.setOffset(2, 4);

    // Store reference to this Human on the sprite for easy access
    this.sprite.parentEntity = this;

    // Wandering state
    this.targetX = x;
    this.targetY = y;
    this.waitTimer = 0;
    this.isWaiting = true;

    // Pick first wander target
    this.pickNewTarget();
  }

  pickNewTarget() {
    // Pick random point within wander radius of spawn
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.wanderRadius;

    this.targetX = this.spawnX + Math.cos(angle) * distance;
    this.targetY = this.spawnY + Math.sin(angle) * distance;

    // Clamp to world bounds
    const bounds = this.scene.physics.world.bounds;
    this.targetX = Phaser.Math.Clamp(this.targetX, bounds.x + 32, bounds.right - 32);
    this.targetY = Phaser.Math.Clamp(this.targetY, bounds.y + 32, bounds.bottom - 32);

    this.isWaiting = false;
  }

  update(delta) {
    if (!this.isAlive || !this.sprite.active) return;

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
      // Reached target, wait for 1-3 seconds
      this.isWaiting = true;
      this.waitTimer = Phaser.Math.Between(1000, 3000);
      this.sprite.setVelocity(0, 0);
    } else {
      // Move towards target
      const vx = (dx / distance) * this.speed;
      const vy = (dy / distance) * this.speed;
      this.sprite.setVelocity(vx, vy);
    }
  }

  kill() {
    if (!this.isAlive) return;
    this.isAlive = false;

    // Flash yellow to indicate damage
    this.sprite.setTint(0xffff00);

    // Alert nearby cops to investigate the disturbance
    this.scene.alertCopsToDisturbance(this.sprite.x, this.sprite.y);

    // Blood splatter effect
    this.scene.spawnBloodSplatter(this.sprite.x, this.sprite.y);

    // Fade out and destroy after brief flash
    this.scene.time.delayedCall(100, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            this.sprite.destroy();
          }
        });
      }
    });
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
