import Phaser from 'phaser';
import { PET, DEPTH, TRUST, PRISONER } from '../config/constants.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import { Pathfinding } from '../utils/Pathfinding.js';

/**
 * Pet behavior states
 */
const PetState = {
  WANDERING: 'wandering',
  FLEEING: 'fleeing',
  FOLLOWING: 'following',
  CONFUSED: 'confused',  // After stopping follow
  IMPRISONED: 'imprisoned'
};

/**
 * Pet entity (dogs and cats) with wandering, following, and fleeing behaviors
 * Similar to humans but:
 * - Cannot open doors
 * - Does not flee when player is identified (only from illegal activity/corpses)
 * - Can be talked to and follow player like humans
 */
export class Pet {
  constructor(scene, x, y, petType, colorVariant, homeBuilding = null) {
    this.scene = scene;
    this.speed = PET.SPEED;
    this.fleeSpeed = PET.FLEE_SPEED;
    this.petType = petType;           // 'dog' or 'cat'
    this.colorVariant = colorVariant; // { name, body, spot }
    this.isAlive = true;
    this.isPet = true;  // Flag to identify as pet (for door logic)

    // Behavior state
    this.state = PetState.WANDERING;

    // Home building for wandering
    this.homeBuilding = homeBuilding;
    if (homeBuilding) {
      this.spawnX = homeBuilding.centerPixelX;
      this.spawnY = homeBuilding.centerPixelY;
      this.wanderRadius = PET.WANDER_RADIUS;
    } else {
      this.spawnX = x;
      this.spawnY = y;
      this.wanderRadius = PET.WANDER_RADIUS;
    }

    // Pathfinding
    this.currentPath = [];
    this.pathIndex = 0;
    this.stuckTimer = 0;
    this.stuckCount = 0;
    this.lastPosition = { x, y };

    // Trust system (same as humans)
    this.trust = 0;
    this.trustMeter = null;
    this.followStartX = 0;
    this.followStartY = 0;
    this.tilesFollowed = 0;
    this.followIcon = null;

    // Waiting behavior
    this.isWaiting = false;
    this.waitTimer = 0;
    this.targetX = x;
    this.targetY = y;

    // Imprisonment state
    this.cage = null;
    this.misery = 0;
    this.miseryMeter = null;
    this.isBeingCarried = false;
    this.fleeingToReportPlayer = false;

    this.createSprite(x, y);
    this.initializeWandering();
  }

  createSprite(x, y) {
    const textureKey = `${this.petType}_${this.colorVariant.name}`;
    this.sprite = this.scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setCollideWorldBounds(true);

    // Dogs are 14x14, cats are 12x12
    if (this.petType === 'dog') {
      this.sprite.body.setSize(10, 10);
      this.sprite.body.setOffset(2, 4);
    } else {
      this.sprite.body.setSize(8, 8);
      this.sprite.body.setOffset(2, 4);
    }

    this.sprite.parentEntity = this;
    this.sprite.setDepth(DEPTH.NPC);

    this.registerActions();
  }

  registerActions() {
    if (!this.scene.actionSystem) return;

    this.scene.actionSystem.registerObject(this.sprite, {
      owner: this,
      getActions: () => this.getAvailableActions()
    });
  }

  getAvailableActions() {
    if (!this.isAlive) return [];

    const actions = [
      {
        name: 'Attack',
        key: 'SPACE',
        keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
        callback: () => this.scene.player?.tryKill()
      }
    ];

    // Add Talk action if not already following (pet the animal)
    if (this.state !== PetState.FOLLOWING) {
      actions.push({
        name: this.petType === 'dog' ? 'Pet' : 'Pet',
        key: 'T',
        keyCode: Phaser.Input.Keyboard.KeyCodes.T,
        callback: () => this.talk()
      });
    }

    // Add Follow Me action if trust is maxed and not already following
    if (this.trust >= TRUST.MAX_TRUST && this.state !== PetState.FOLLOWING) {
      actions.push({
        name: 'Follow Me',
        key: 'F',
        keyCode: Phaser.Input.Keyboard.KeyCodes.F,
        callback: () => this.startFollowing()
      });
    }

    // Add Imprison action if following and near an empty cage
    if (this.state === PetState.FOLLOWING) {
      const nearestEmptyCage = this.scene.getNearestEmptyCage?.(this.sprite.x, this.sprite.y, 30);
      if (nearestEmptyCage) {
        actions.push({
          name: 'Imprison',
          key: 'F',
          keyCode: Phaser.Input.Keyboard.KeyCodes.F,
          callback: () => nearestEmptyCage.imprison(this)
        });
      }
    }

    return actions;
  }

  talk() {
    // Check talk cooldown
    if (!this.scene.canTalk || !this.scene.canTalk()) return;

    // Trigger talk cooldown
    this.scene.triggerTalkCooldown?.();

    // Check if this is the player's own pet
    const playerHome = this.scene.townGenerator?.getPlayerHome();
    const isPlayersPet = playerHome && this.homeBuilding?.id === playerHome.id;

    if (isPlayersPet) {
      // Player's own pet - just emit red hearts, no trust change
      this.emitHearts();
    } else {
      // Other pets - gain trust (max 3)
      if (this.trust < TRUST.MAX_TRUST) {
        this.trust++;
        this.updateTrustMeter();
      }
    }

    // Visual feedback - flash the pet briefly
    this.sprite.setTint(0x88ff88);
    this.scene.time.delayedCall(200, () => {
      if (this.sprite?.active && this.isAlive) {
        this.sprite.clearTint();
      }
    });
  }

  /**
   * Emit floating red hearts above the pet
   */
  emitHearts() {
    const heartCount = 3;

    for (let i = 0; i < heartCount; i++) {
      const offsetX = Phaser.Math.Between(-8, 8);
      const delay = i * 100;

      this.scene.time.delayedCall(delay, () => {
        if (!this.sprite?.active || !this.isAlive) return;

        const heart = this.scene.add.text(
          this.sprite.x + offsetX,
          this.sprite.y - 10,
          '♥',
          {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#ff3333',
            stroke: '#000000',
            strokeThickness: 1
          }
        );
        heart.setOrigin(0.5, 0.5);
        heart.setDepth(DEPTH.EXCLAMATION);

        if (this.scene.hud) {
          this.scene.hud.ignoreGameObject(heart);
        }

        // Float up and fade out
        this.scene.tweens.add({
          targets: heart,
          y: heart.y - 16,
          alpha: 0,
          scale: 1.3,
          duration: 600,
          ease: 'Sine.easeOut',
          onComplete: () => heart.destroy()
        });
      });
    }
  }

  updateTrustMeter() {
    // Hide meter when trust is 0
    if (this.trust <= 0) {
      if (this.trustMeter) {
        this.trustMeter.destroy();
        this.trustMeter = null;
      }
      return;
    }

    // Create trust meter if it doesn't exist
    if (!this.trustMeter) {
      this.trustMeter = this.scene.add.graphics();
      this.trustMeter.setDepth(DEPTH.HEALTH_BAR);
      if (this.scene.hud) {
        this.scene.hud.ignoreGameObject(this.trustMeter);
      }
    }

    this.drawTrustMeter();
  }

  drawTrustMeter() {
    if (!this.trustMeter) return;

    this.trustMeter.clear();

    const x = this.sprite.x - 10;
    const y = this.sprite.y - 14;

    const width = 20;
    const height = 3;
    const fillWidth = (this.trust / TRUST.MAX_TRUST) * width;

    // Background
    this.trustMeter.fillStyle(0x333333, 0.8);
    this.trustMeter.fillRect(x, y, width, height);

    // Fill - blue normally, purple when full
    const fillColor = this.trust >= TRUST.MAX_TRUST ? 0x9932cc : 0x3498db;
    this.trustMeter.fillStyle(fillColor, 1);
    this.trustMeter.fillRect(x, y, fillWidth, height);

    // Border
    this.trustMeter.lineStyle(1, 0x000000, 0.8);
    this.trustMeter.strokeRect(x, y, width, height);
  }

  updateTrustMeterPosition() {
    if (this.trustMeter && this.trust > 0) {
      this.drawTrustMeter();
    }
  }

  startFollowing() {
    if (this.state === PetState.FOLLOWING) return;

    this.state = PetState.FOLLOWING;
    this.followStartX = this.sprite.x;
    this.followStartY = this.sprite.y;
    this.tilesFollowed = 0;
    this.isWaiting = false;
    this.currentPath = [];
    this.pathIndex = 0;

    // Show follow icon
    this.showFollowIcon();
  }

  showFollowIcon() {
    if (this.followIcon) return;

    this.followIcon = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 18,
      '♥',
      {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ff69b4',  // Hot pink
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.followIcon.setOrigin(0.5, 0.5);
    this.followIcon.setDepth(DEPTH.EXCLAMATION);

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.followIcon);
    }

    // Gentle pulse animation
    this.scene.tweens.add({
      targets: this.followIcon,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  hideFollowIcon() {
    if (this.followIcon) {
      this.followIcon.destroy();
      this.followIcon = null;
    }
  }

  updateFollowIconPosition() {
    if (this.followIcon && this.sprite?.active) {
      this.followIcon.setPosition(this.sprite.x, this.sprite.y - 18);
    }
  }

  stopFollowing() {
    if (this.state !== PetState.FOLLOWING) return;

    this.state = PetState.CONFUSED;
    this.sprite.setVelocity(0, 0);

    // Hide follow icon
    this.hideFollowIcon();

    // Lose 1 trust (not reset to 0)
    this.trust = Math.max(0, this.trust - 1);
    this.updateTrustMeter();

    // Show question mark
    this.showQuestionMark();

    // Shiver effect
    this.doShiverEffect();

    // After pause, return home
    this.scene.time.delayedCall(TRUST.STOP_PAUSE_DURATION, () => {
      if (this.isAlive && this.state === PetState.CONFUSED) {
        this.state = PetState.WANDERING;
        this.returnHome();
      }
    });
  }

  showQuestionMark() {
    const questionMark = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 20,
      '?',
      {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    questionMark.setOrigin(0.5, 0.5);
    questionMark.setDepth(DEPTH.EXCLAMATION);

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(questionMark);
    }

    // Bob animation
    this.scene.tweens.add({
      targets: questionMark,
      y: questionMark.y - 8,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => questionMark.destroy()
    });
  }

  doShiverEffect() {
    // Quick left-right shake
    const originalX = this.sprite.x;
    this.scene.tweens.add({
      targets: this.sprite,
      x: originalX + 2,
      duration: 50,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.sprite?.active) {
          this.sprite.x = originalX;
        }
      }
    });
  }

  returnHome() {
    // Set target back to home
    this.targetX = this.spawnX;
    this.targetY = this.spawnY;
    this.isWaiting = false;
    this.recalculatePath();
  }

  initializeWandering() {
    this.targetX = this.spawnX;
    this.targetY = this.spawnY;
    this.waitTimer = Phaser.Math.Between(100, 500);
    this.isWaiting = true;
  }

  pickNewTarget() {
    const townData = this.scene.townData;
    if (!townData?.grid) {
      // Fallback - simple random walk inside home area
      this.targetX = this.spawnX + Phaser.Math.Between(-16, 16);
      this.targetY = this.spawnY + Phaser.Math.Between(-16, 16);
      this.isWaiting = false;
      return;
    }

    // Pets split time 50/50 inside/outside
    const roll = Math.random();

    if (roll < 0.5 && this.homeBuilding) {
      // Stay inside home
      const offset = 2 * 16;
      this.targetX = this.spawnX + Phaser.Math.Between(-offset, offset);
      this.targetY = this.spawnY + Phaser.Math.Between(-offset, offset);
    } else {
      // Go to yard/outside
      const yardOffset = 3 * 16;
      this.targetX = this.spawnX + Phaser.Math.Between(-yardOffset, yardOffset);
      this.targetY = this.spawnY + Phaser.Math.Between(-yardOffset, yardOffset);
    }

    this.isWaiting = false;
    this.recalculatePath();
  }

  recalculatePath() {
    const townData = this.scene.townData;
    if (!townData) return;

    const path = Pathfinding.findPath(
      this.sprite.x, this.sprite.y,
      this.targetX, this.targetY,
      townData
    );

    if (path && path.length > 0) {
      this.currentPath = path;
      this.pathIndex = 0;
    } else {
      this.currentPath = [];
      this.isWaiting = true;
      this.waitTimer = Phaser.Math.Between(PET.WAIT_TIME_MIN, PET.WAIT_TIME_MAX);
    }
  }

  update(delta) {
    if (!this.isAlive || !this.sprite?.active) return;

    // Update trust meter position
    this.updateTrustMeterPosition();

    // Update follow icon position
    this.updateFollowIconPosition();

    // Handle imprisoned state - no AI updates
    if (this.state === PetState.IMPRISONED) {
      this.sprite.setVelocity(0, 0);
      this.updateMiseryMeterPosition();
      return;
    }

    // Handle being carried
    if (this.isBeingCarried) {
      this.sprite.setVelocity(0, 0);
      this.updateMiseryMeterPosition();
      return;
    }

    // Check for illegal activity (but NOT player identification)
    this.checkForIllegalActivity();

    // Don't do normal AI when confused (paused)
    if (this.state === PetState.CONFUSED) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    // Check if fleeing to report player and reached home
    if (this.fleeingToReportPlayer) {
      const distToHome = LineOfSight.distance(this.sprite.x, this.sprite.y, this.spawnX, this.spawnY);
      if (distToHome < 32) {
        this.scene.triggerPrisonerEscapeGameOver?.();
        return;
      }
    }

    // State-based updates
    switch (this.state) {
      case PetState.WANDERING:
        this.updateWandering(delta);
        break;
      case PetState.FLEEING:
        this.updateFleeing(delta);
        break;
      case PetState.FOLLOWING:
        this.updateFollowing(delta);
        break;
    }
  }

  checkForIllegalActivity() {
    // Pets only flee from:
    // 1. Seeing illegal activity directly (witnessing a kill, break-in)
    // 2. Player carrying a corpse
    // They do NOT flee from player being identified

    const player = this.scene.player;
    if (!player?.sprite) return;

    const distance = LineOfSight.distance(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );

    const sightRange = 4 * 16; // 4 tiles

    if (distance < sightRange) {
      // Check if player is carrying a corpse or doing illegal activity
      const isCarryingCorpse = player.carriedCorpse !== null;
      const isDoingIllegal = this.scene.illegalActivityTime &&
        (Date.now() - this.scene.illegalActivityTime < 500);

      if (isCarryingCorpse || isDoingIllegal) {
        // Check line of sight
        if (LineOfSight.hasLineOfSight(
          this.sprite.x, this.sprite.y,
          player.sprite.x, player.sprite.y,
          this.scene.walls
        )) {
          this.startFleeing(player.sprite.x, player.sprite.y);
        }
      }
    }

    // If fleeing and player is far away, stop fleeing
    if (this.state === PetState.FLEEING && distance > 6 * 16) {
      this.state = PetState.WANDERING;
      this.pickNewTarget();
    }
  }

  startFleeing(playerX, playerY) {
    if (this.state === PetState.FOLLOWING) {
      this.stopFollowing();
    }

    this.state = PetState.FLEEING;

    // Calculate flee direction (away from player)
    const dx = this.sprite.x - playerX;
    const dy = this.sprite.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const fleeDistance = 6 * 16; // Flee 6 tiles away
      const normalizedDx = dx / dist;
      const normalizedDy = dy / dist;

      this.targetX = this.sprite.x + normalizedDx * fleeDistance;
      this.targetY = this.sprite.y + normalizedDy * fleeDistance;

      // Clamp to world bounds
      const bounds = this.scene.physics.world.bounds;
      this.targetX = Phaser.Math.Clamp(this.targetX, bounds.x + 32, bounds.right - 32);
      this.targetY = Phaser.Math.Clamp(this.targetY, bounds.y + 32, bounds.bottom - 32);

      this.isWaiting = false;
      this.recalculatePath();
    }
  }

  updateWandering(delta) {
    if (this.isWaiting) {
      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        this.pickNewTarget();
      }
      this.sprite.setVelocity(0, 0);
      return;
    }

    this.moveAlongPath(this.speed);
  }

  updateFleeing(delta) {
    this.moveAlongPath(this.fleeSpeed);
  }

  updateFollowing(delta) {
    const player = this.scene.player;
    if (!player?.sprite) {
      this.stopFollowing();
      return;
    }

    // Calculate distance from follow start
    const distFromStart = LineOfSight.distance(
      this.followStartX, this.followStartY,
      this.sprite.x, this.sprite.y
    );
    this.tilesFollowed = Math.floor(distFromStart / 16);

    // Check for random stop based on distance (same as humans)
    if (this.tilesFollowed >= 5) {
      let stopChance = 0;
      if (this.tilesFollowed >= 15) {
        stopChance = TRUST.STOP_CHANCE_15_TILES;
      } else if (this.tilesFollowed >= 10) {
        stopChance = TRUST.STOP_CHANCE_10_TILES;
      } else {
        stopChance = TRUST.STOP_CHANCE_5_TILES;
      }

      if (Math.random() < stopChance * (delta / 1000)) {
        this.stopFollowing();
        return;
      }
    }

    // Max follow distance
    if (this.tilesFollowed >= TRUST.FOLLOW_MAX_TILES) {
      this.stopFollowing();
      return;
    }

    // Follow player using direct movement (not pathfinding to avoid oscillation)
    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > TRUST.FOLLOW_DISTANCE) {
      // Move directly towards player
      const vx = (dx / distance) * this.speed;
      const vy = (dy / distance) * this.speed;
      this.sprite.setVelocity(vx, vy);
    } else {
      // Close enough, stop moving
      this.sprite.setVelocity(0, 0);
    }
  }

  moveAlongPath(speed) {
    if (this.currentPath.length === 0) {
      this.sprite.setVelocity(0, 0);
      this.isWaiting = true;
      this.waitTimer = Phaser.Math.Between(PET.WAIT_TIME_MIN, PET.WAIT_TIME_MAX);
      return;
    }

    const target = this.currentPath[this.pathIndex];
    if (!target) {
      this.currentPath = [];
      return;
    }

    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 4) {
      this.pathIndex++;
      if (this.pathIndex >= this.currentPath.length) {
        this.sprite.setVelocity(0, 0);
        this.currentPath = [];
        this.isWaiting = true;
        this.waitTimer = Phaser.Math.Between(PET.WAIT_TIME_MIN, PET.WAIT_TIME_MAX);
      }
      return;
    }

    // Move toward target
    const angle = Math.atan2(dy, dx);
    this.sprite.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Store position for stuck detection
    this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
  }

  // ==================== Imprisonment ====================

  beImprisoned(cage) {
    this.state = PetState.IMPRISONED;
    this.cage = cage;
    this.sprite.setVelocity(0, 0);

    // Hide follow icon and trust meter
    this.hideFollowIcon();
    if (this.trustMeter) {
      this.trustMeter.setVisible(false);
    }

    // Unregister from ActionSystem (cage handles actions now)
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(this.sprite);
    }

    // Create misery meter
    this.createMiseryMeter();
  }

  beReleased() {
    this.state = PetState.FLEEING;
    this.cage = null;
    this.misery = 0;
    this.isBeingCarried = false;
    this.hideMiseryMeter();

    // Re-register with ActionSystem
    this.registerActions();

    // Set target to home and flee
    this.targetX = this.spawnX;
    this.targetY = this.spawnY;
    this.recalculatePath();

    // Flag that we're fleeing to report player
    this.fleeingToReportPlayer = true;
  }

  increaseMisery() {
    if (this.misery >= PRISONER.MAX_MISERY) return;

    this.misery++;
    this.updateMiseryMeter();

    // Visual feedback - quick shiver
    this.doShiverEffect();

    // At max misery, start death sequence
    if (this.misery >= PRISONER.MAX_MISERY) {
      this.startMiseryDeath();
    }
  }

  startMiseryDeath() {
    // Intense shivering for 5 seconds, then die
    const shiverCount = Math.floor(PRISONER.SHIVER_DURATION / 200);
    let shiversDone = 0;

    const shiverInterval = this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        if (!this.isAlive) {
          shiverInterval.destroy();
          return;
        }
        this.doShiverEffect();
        shiversDone++;
        if (shiversDone >= shiverCount) {
          shiverInterval.destroy();
          // Notify cage and die
          if (this.cage) {
            this.cage.onPrisonerDeath();
          }
          this.kill();
        }
      },
      loop: true
    });
  }

  // ==================== Misery Meter UI ====================

  createMiseryMeter() {
    if (this.miseryMeter) return;

    this.miseryMeter = this.scene.add.graphics();
    this.miseryMeter.setDepth(DEPTH.HEALTH_BAR);
    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.miseryMeter);
    }
    this.drawMiseryMeter();
  }

  drawMiseryMeter() {
    if (!this.miseryMeter) return;
    this.miseryMeter.clear();

    const x = this.sprite.x - 10;
    const y = this.sprite.y - 18;
    const width = 20;
    const height = 3;
    const fillWidth = (this.misery / PRISONER.MAX_MISERY) * width;

    // Background
    this.miseryMeter.fillStyle(0x333333, 0.8);
    this.miseryMeter.fillRect(x, y, width, height);

    // Fill - dark purple
    const fillColor = 0x880088;
    this.miseryMeter.fillStyle(fillColor, 1);
    this.miseryMeter.fillRect(x, y, fillWidth, height);

    // Border
    this.miseryMeter.lineStyle(1, 0x000000, 0.8);
    this.miseryMeter.strokeRect(x, y, width, height);
  }

  updateMiseryMeter() {
    if (this.miseryMeter) {
      this.drawMiseryMeter();
    }
  }

  updateMiseryMeterPosition() {
    if (this.miseryMeter && this.misery > 0) {
      this.drawMiseryMeter();
    }
  }

  hideMiseryMeter() {
    if (this.miseryMeter) {
      this.miseryMeter.destroy();
      this.miseryMeter = null;
    }
  }

  // ==================== Death ====================

  kill() {
    if (!this.isAlive) return;
    this.isAlive = false;

    // Unregister from action system
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(this.sprite);
    }

    // Clean up trust meter
    if (this.trustMeter) {
      this.trustMeter.destroy();
      this.trustMeter = null;
    }

    // Clean up follow icon
    this.hideFollowIcon();
    if (this.followIcon) {
      this.followIcon.destroy();
      this.followIcon = null;
    }

    // Clean up misery meter
    this.hideMiseryMeter();

    this.sprite.setTint(0xffff00);

    const deathX = this.sprite.x;
    const deathY = this.sprite.y;

    this.scene.spawnBloodSplatter(deathX, deathY);

    const corpseTextureKey = `corpse_${this.petType}_${this.colorVariant.name}`;
    this.corpseData = this.scene.spawnCorpse(deathX, deathY, corpseTextureKey, false, null, null, null);

    this.scene.time.delayedCall(100, () => {
      if (this.sprite?.active) {
        this.sprite.destroy();
      }
    });
  }

  destroy() {
    if (this.trustMeter) {
      this.trustMeter.destroy();
      this.trustMeter = null;
    }
    if (this.followIcon) {
      this.followIcon.destroy();
      this.followIcon = null;
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
