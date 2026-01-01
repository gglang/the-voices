import Phaser from 'phaser';
import { HUMAN, IDENTIFICATION } from '../config/constants.js';
import { LineOfSight } from '../utils/LineOfSight.js';

/**
 * Human NPC entity with wandering behavior and corpse/crime detection
 */
export class Human {
  constructor(scene, x, y, hairColor, skinColor, homeBuilding = null) {
    this.scene = scene;
    this.speed = HUMAN.SPEED;
    this.hairColor = hairColor;
    this.skinColor = skinColor;
    this.isAlive = true;
    this.hasSeenCorpse = false;

    // Home building for wandering
    this.homeBuilding = homeBuilding;
    if (homeBuilding) {
      // Wander around home (5 tiles radius)
      this.spawnX = homeBuilding.centerPixelX;
      this.spawnY = homeBuilding.centerPixelY;
      this.wanderRadius = 5 * 16; // 5 tiles
    } else {
      this.spawnX = x;
      this.spawnY = y;
      this.wanderRadius = HUMAN.WANDER_RADIUS;
    }

    this.createSprite(x, y);
    this.initializeWandering();
  }

  createSprite(x, y) {
    const textureKey = `human_${this.hairColor}_${this.skinColor}`;
    this.sprite = this.scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(12, 12);
    this.sprite.body.setOffset(2, 4);
    this.sprite.parentEntity = this;
  }

  initializeWandering() {
    this.targetX = this.spawnX;
    this.targetY = this.spawnY;
    this.waitTimer = 0;
    this.isWaiting = true;
    this.pickNewTarget();
  }

  // ==================== Wandering Behavior ====================

  pickNewTarget() {
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

  // ==================== Update Loop ====================

  update(delta) {
    if (!this.isAlive || !this.sprite.active) return;

    this.checkForCorpses();
    this.checkForIllegalActivity();
    this.updateMovement(delta);
  }

  updateMovement(delta) {
    if (this.isWaiting) {
      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        this.pickNewTarget();
      }
      this.sprite.setVelocity(0, 0);
      return;
    }

    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 8) {
      this.isWaiting = true;
      this.waitTimer = Phaser.Math.Between(
        HUMAN.WAIT_TIME_MIN,
        HUMAN.WAIT_TIME_MAX
      );
      this.sprite.setVelocity(0, 0);
    } else {
      const vx = (dx / distance) * this.speed;
      const vy = (dy / distance) * this.speed;
      this.sprite.setVelocity(vx, vy);
    }
  }

  // ==================== Detection Systems ====================

  checkForCorpses() {
    if (this.hasSeenCorpse) return;

    for (const corpse of this.scene.corpses) {
      // Skip picked up or already investigated corpses
      if (corpse.isPickedUp || corpse.investigated) continue;

      const distance = LineOfSight.distance(
        this.sprite.x, this.sprite.y,
        corpse.x, corpse.y
      );

      if (distance < HUMAN.CORPSE_DETECT_RANGE) {
        if (LineOfSight.hasLineOfSight(
          this.sprite.x, this.sprite.y,
          corpse.x, corpse.y,
          this.scene.walls
        )) {
          this.hasSeenCorpse = true;
          // Mark corpse as being investigated so only one cop responds
          corpse.investigated = true;
          this.scene.alertCopsToDisturbance(corpse.x, corpse.y);
          break;
        }
      }
    }
  }

  checkForIllegalActivity() {
    if (this.scene.playerIdentified) return;

    const player = this.scene.player;
    if (!player?.sprite) return;

    const distance = LineOfSight.distance(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );

    if (distance < IDENTIFICATION.IDENTIFY_RANGE) {
      if (LineOfSight.hasLineOfSight(
        this.sprite.x, this.sprite.y,
        player.sprite.x, player.sprite.y,
        this.scene.walls
      )) {
        if (this.scene.isPlayerDoingIllegalActivity()) {
          this.scene.identifyPlayer(this.sprite);
        }
      }
    }
  }

  // ==================== Death ====================

  kill() {
    if (!this.isAlive) return;
    this.isAlive = false;

    this.sprite.setTint(0xffff00);

    const deathX = this.sprite.x;
    const deathY = this.sprite.y;

    this.scene.spawnBloodSplatter(deathX, deathY);

    const corpseTextureKey = `corpse_${this.hairColor}_${this.skinColor}`;
    this.corpseData = this.scene.spawnCorpse(deathX, deathY, corpseTextureKey, false, this.hairColor, this.skinColor);

    this.scene.time.delayedCall(100, () => {
      if (this.sprite?.active) {
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
