import Phaser from 'phaser';
import { POLICE, DEPTH } from '../config/constants.js';
import { LineOfSight } from '../utils/LineOfSight.js';

/**
 * Cop behavior states
 */
const CopState = {
  WANDERING: 'wandering',
  INVESTIGATING: 'investigating',
  CHASING: 'chasing',
  GOING_TO_LAST_SEEN: 'going_to_last_seen'
};

/**
 * Police entity with patrol, investigation, and arrest behaviors
 */
export class Police {
  constructor(scene, x, y) {
    this.scene = scene;
    this.isAlive = true;

    // Movement
    this.baseSpeed = POLICE.BASE_SPEED;
    this.chaseSpeed = POLICE.CHASE_SPEED;

    // Health
    this.maxHealth = POLICE.MAX_HEALTH;
    this.health = this.maxHealth;
    this.lastDamageTime = 0;
    this.healDelay = POLICE.HEAL_DELAY;

    // Detection/arrest
    this.isDetecting = false;
    this.detectionTimer = 0;
    this.detectionDuration = POLICE.DETECTION_DURATION;
    this.flashTimer = 0;

    // Behavior state
    this.state = CopState.WANDERING;
    this.targetX = x;
    this.targetY = y;
    this.lastSeenPlayerX = null;
    this.lastSeenPlayerY = null;
    this.investigationTarget = null;
    this.waitTimer = 0;
    this.isWaiting = false;
    this.stuckTimer = 0;
    this.lastPosition = { x, y };

    this.createSprite(x, y);
    this.pickNewWanderTarget();
  }

  createSprite(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, 'police');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(12, 12);
    this.sprite.body.setOffset(2, 4);
    this.sprite.parentEntity = this;
    this.healthBar = null;
  }

  // ==================== Update Loop ====================

  update(delta) {
    if (!this.isAlive || !this.sprite.active) return;

    this.updateHealing(delta);
    this.updateHealthBar();
    this.checkPlayerChase();
    this.checkPlayerDetection(delta);

    if (this.state === CopState.WANDERING) {
      this.checkForBodies();
    }

    this.handleStuckDetection(delta);
    this.handleMovement(delta);
  }

  // ==================== Wandering ====================

  pickNewWanderTarget() {
    const bounds = this.scene.physics.world.bounds;
    const maxAttempts = 20;

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const x = Phaser.Math.Between(bounds.x + 48, bounds.right - 48);
      const y = Phaser.Math.Between(bounds.y + 48, bounds.bottom - 48);

      if (!LineOfSight.isPointInWall(x, y, this.scene.walls)) {
        this.targetX = x;
        this.targetY = y;
        this.isWaiting = false;
        return;
      }
    }

    // Fallback
    this.targetX = Phaser.Math.Between(bounds.x + 48, bounds.right - 48);
    this.targetY = Phaser.Math.Between(bounds.y + 48, bounds.bottom - 48);
    this.isWaiting = false;
  }

  // ==================== Player Detection ====================

  checkPlayerChase() {
    if (this.scene.isGameOver || this.isDetecting) return;

    const player = this.scene.player;
    if (!player?.sprite) return;

    const distance = LineOfSight.distance(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );

    if (distance < POLICE.CHASE_RANGE) {
      if (LineOfSight.hasLineOfSight(
        this.sprite.x, this.sprite.y,
        player.sprite.x, player.sprite.y,
        this.scene.walls
      )) {
        // Cop can identify player if witnessing illegal activity
        if (!this.scene.playerIdentified && this.scene.isPlayerDoingIllegalActivity()) {
          this.scene.identifyPlayer(this.sprite);
        }

        // Only chase if player has been identified
        if (this.scene.playerIdentified) {
          this.state = CopState.CHASING;
          this.lastSeenPlayerX = player.sprite.x;
          this.lastSeenPlayerY = player.sprite.y;
          this.targetX = player.sprite.x;
          this.targetY = player.sprite.y;
          this.isWaiting = false;
        }
      }
    } else if (this.state === CopState.CHASING) {
      // Lost sight of player
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

  checkPlayerDetection(delta) {
    if (this.scene.isGameOver) return;

    const player = this.scene.player;
    if (!player?.sprite) return;

    const distance = LineOfSight.distance(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );

    if (distance < POLICE.DETECTION_RANGE) {
      if (!this.isDetecting) {
        this.isDetecting = true;
        this.detectionTimer = 0;
      }

      this.detectionTimer += delta;
      this.flashTimer += delta;

      // Flash red with increasing frequency
      const progress = this.detectionTimer / this.detectionDuration;
      const flashRate = 500 - (progress * 400);

      if (this.flashTimer >= flashRate) {
        this.flashTimer = 0;
        if (this.sprite.tintTopLeft === 0xff0000) {
          this.sprite.clearTint();
        } else {
          this.sprite.setTint(0xff0000);
        }
      }

      if (this.detectionTimer >= this.detectionDuration) {
        this.scene.triggerGameOver();
      }
    } else if (this.isDetecting) {
      this.isDetecting = false;
      this.detectionTimer = 0;
      this.flashTimer = 0;
      this.sprite.clearTint();
    }
  }

  // ==================== Body Detection ====================

  checkForBodies() {
    for (const corpse of this.scene.corpses) {
      // Skip picked up bodies or ones already investigated
      if (corpse.isPickedUp || corpse.investigated) continue;

      const distance = LineOfSight.distance(
        this.sprite.x, this.sprite.y,
        corpse.x, corpse.y
      );

      // Cops can see bodies within 5 tiles
      if (distance < POLICE.BODY_SIGHT_RANGE) {
        if (LineOfSight.hasLineOfSight(
          this.sprite.x, this.sprite.y,
          corpse.x, corpse.y,
          this.scene.walls
        )) {
          // Mark body as being investigated so no other cop goes to it
          corpse.investigated = true;
          // Go investigate this body directly
          this.assignInvestigation(corpse.x, corpse.y);
          break;
        }
      }
    }
  }

  assignInvestigation(x, y) {
    if (this.state === CopState.WANDERING) {
      this.state = CopState.INVESTIGATING;
      this.investigationTarget = { x, y };
      this.targetX = x;
      this.targetY = y;
      this.isWaiting = false;
    }
  }

  /**
   * Called when cop arrives at investigation site
   */
  completeInvestigation() {
    if (!this.investigationTarget) {
      this.state = CopState.WANDERING;
      this.pickNewWanderTarget();
      return;
    }

    const { x, y } = this.investigationTarget;

    // Check if there's still a body at this location
    const bodyPresent = this.findBodyAtLocation(x, y);

    if (bodyPresent && !bodyPresent.backupCalled) {
      // Body found and backup not yet called - call for backup
      const message = bodyPresent.isPolice
        ? 'Dead officer found!\nBackup called!'
        : 'Dead body found!\nBackup called!';
      this.scene.hud?.showNotification(message, 3000);

      // Queue backup to arrive
      this.scene.policeDispatcher.queueBackup(x, y, bodyPresent.isPolice);

      // Mark body so backup isn't called again
      bodyPresent.backupCalled = true;
    }

    // Done investigating - resume patrol
    this.state = CopState.WANDERING;
    this.investigationTarget = null;
    this.pickNewWanderTarget();
  }

  /**
   * Find if there's a body at/near a location
   */
  findBodyAtLocation(x, y) {
    for (const corpse of this.scene.corpses) {
      if (corpse.isPickedUp) continue;

      const distance = LineOfSight.distance(x, y, corpse.x, corpse.y);
      if (distance < 24) { // Within 1.5 tiles
        return corpse;
      }
    }
    return null;
  }

  // ==================== Movement ====================

  handleStuckDetection(delta) {
    const dx = this.sprite.x - this.lastPosition.x;
    const dy = this.sprite.y - this.lastPosition.y;
    const moved = Math.sqrt(dx * dx + dy * dy);

    if (moved < 1 && !this.isWaiting) {
      this.stuckTimer += delta;
      if (this.stuckTimer > POLICE.STUCK_THRESHOLD) {
        this.findAlternativePath();
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }

    this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
  }

  findAlternativePath() {
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;

    // Try perpendicular directions
    const perpendiculars = [
      { x: this.sprite.x + dy * 0.5, y: this.sprite.y - dx * 0.5 },
      { x: this.sprite.x - dy * 0.5, y: this.sprite.y + dx * 0.5 }
    ];

    for (const point of perpendiculars) {
      if (!LineOfSight.isPointInWall(point.x, point.y, this.scene.walls)) {
        this.intermediateTargetX = point.x;
        this.intermediateTargetY = point.y;
        return;
      }
    }

    // Try radial directions
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const checkX = this.sprite.x + Math.cos(angle) * 48;
      const checkY = this.sprite.y + Math.sin(angle) * 48;

      if (!LineOfSight.isPointInWall(checkX, checkY, this.scene.walls)) {
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
        this.handleWaitComplete();
      }
      this.sprite.setVelocity(0, 0);
      return;
    }

    let currentTargetX = this.intermediateTargetX ?? this.targetX;
    let currentTargetY = this.intermediateTargetY ?? this.targetY;

    // Continuously update target when chasing
    if (this.state === CopState.CHASING) {
      const player = this.scene.player;
      if (player?.sprite) {
        currentTargetX = player.sprite.x;
        currentTargetY = player.sprite.y;
        this.lastSeenPlayerX = player.sprite.x;
        this.lastSeenPlayerY = player.sprite.y;
      }
    }

    const dx = currentTargetX - this.sprite.x;
    const dy = currentTargetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if reached intermediate target
    if (this.intermediateTargetX !== undefined && distance < 16) {
      this.intermediateTargetX = undefined;
      this.intermediateTargetY = undefined;
      return;
    }

    const speed = this.state === CopState.CHASING ? this.chaseSpeed : this.baseSpeed;

    if (distance < 8) {
      this.isWaiting = true;
      this.waitTimer = this.getWaitTime();
      this.sprite.setVelocity(0, 0);
    } else {
      const vx = (dx / distance) * speed;
      const vy = (dy / distance) * speed;
      this.sprite.setVelocity(vx, vy);
    }
  }

  handleWaitComplete() {
    switch (this.state) {
      case CopState.WANDERING:
        this.pickNewWanderTarget();
        break;
      case CopState.GOING_TO_LAST_SEEN:
        this.state = CopState.WANDERING;
        this.lastSeenPlayerX = null;
        this.lastSeenPlayerY = null;
        this.pickNewWanderTarget();
        break;
      case CopState.INVESTIGATING:
        this.completeInvestigation();
        break;
    }
  }

  getWaitTime() {
    switch (this.state) {
      case CopState.WANDERING:
        return Phaser.Math.Between(POLICE.WAIT_TIME_MIN, POLICE.WAIT_TIME_MAX);
      case CopState.INVESTIGATING:
        return POLICE.INVESTIGATION_WAIT;
      default:
        return 500;
    }
  }

  // ==================== Health System ====================

  updateHealing(delta) {
    if (this.health < this.maxHealth && this.health > 0) {
      const timeSinceDamage = this.scene.time.now - this.lastDamageTime;
      if (timeSinceDamage >= this.healDelay) {
        this.health = Math.min(this.health + 1, this.maxHealth);
        this.lastDamageTime = this.scene.time.now;

        if (this.health >= this.maxHealth && this.healthBar) {
          this.healthBar.destroy();
          this.healthBar = null;
        } else {
          this.updateHealthBarGraphics();
        }
      }
    }
  }

  takeDamage() {
    if (!this.isAlive) return false;

    this.health--;
    this.lastDamageTime = this.scene.time.now;

    this.sprite.setTint(0xffff00);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite?.active && this.isAlive) {
        this.sprite.clearTint();
      }
    });

    if (!this.healthBar) {
      this.createHealthBar();
    }
    this.updateHealthBarGraphics();

    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  createHealthBar() {
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(DEPTH.HEALTH_BAR);

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

    this.healthBar.fillStyle(0x444444);
    this.healthBar.fillRect(-barWidth / 2, -12, barWidth, barHeight);

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

  // ==================== Death ====================

  die() {
    this.isAlive = false;
    this.isDetecting = false;
    this.sprite.clearTint();

    const deathX = this.sprite.x;
    const deathY = this.sprite.y;

    this.scene.spawnBloodSplatter(deathX, deathY);
    this.corpseData = this.scene.spawnCorpse(deathX, deathY, 'corpse_police', true);

    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }

    this.sprite.destroy();
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
