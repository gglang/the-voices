import Phaser from 'phaser';
import { HUMAN, IDENTIFICATION, DEPTH, TRUST, MAP, RACES, HUMAN_GENDERS, HUMAN_AGES, PRISONER, BODY_PARTS } from '../config/constants.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import { Pathfinding } from '../utils/Pathfinding.js';

/**
 * Human behavior states
 */
const HumanState = {
  WANDERING: 'wandering',
  FLEEING: 'fleeing',
  FOLLOWING: 'following',
  CONFUSED: 'confused',  // After stopping follow
  IMPRISONED: 'imprisoned'
};

/**
 * Human NPC entity with wandering behavior and corpse/crime detection
 */
export class Human {
  constructor(scene, x, y, race, gender, age, homeBuilding = null) {
    this.scene = scene;
    this.speed = HUMAN.SPEED;
    this.fleeSpeed = HUMAN.SPEED * 1.5; // Run faster when fleeing
    this.race = race;       // { name, skin, hair }
    this.gender = gender;   // 'male' or 'female'
    this.age = age;         // 'adult' or 'child'
    this.isAlive = true;
    this.hasSeenCorpse = false;
    this.hasAlertedPolice = false;

    // Behavior state
    this.state = HumanState.WANDERING;

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

    // Pathfinding
    this.currentPath = [];
    this.pathIndex = 0;
    this.stuckTimer = 0;
    this.stuckCount = 0;
    this.lastPosition = { x, y };

    // Trust system
    this.trust = 0;
    this.trustMeter = null;
    this.followStartX = 0;
    this.followStartY = 0;
    this.tilesFollowed = 0;
    this.followIcon = null;

    // Imprisonment state
    this.cage = null;
    this.misery = 0;
    this.miseryMeter = null;
    this.isBeingCarried = false;
    this.fleeingToReportPlayer = false;

    // Body parts tracking (how many removed)
    this.removedParts = {
      head: 0,
      heart: 0,
      arm: 0,
      leg: 0,
      funnies: 0,
      skin: 0
    };
    this.missingPartsOverlay = null;

    this.createSprite(x, y);
    this.initializeWandering();
  }

  createSprite(x, y) {
    const textureKey = `human_${this.race.name}_${this.gender}_${this.age}`;
    this.sprite = this.scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setCollideWorldBounds(true);

    // Children are smaller
    if (this.age === 'child') {
      this.sprite.body.setSize(9, 9);
      this.sprite.body.setOffset(1, 3);
    } else {
      this.sprite.body.setSize(12, 12);
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

    // Add Talk action if not already following
    if (this.state !== HumanState.FOLLOWING) {
      actions.push({
        name: 'Talk',
        key: 'T',
        keyCode: Phaser.Input.Keyboard.KeyCodes.T,
        callback: () => this.talk()
      });
    }

    // Add Follow Me action if trust is maxed and not already following
    if (this.trust >= TRUST.MAX_TRUST && this.state !== HumanState.FOLLOWING) {
      actions.push({
        name: 'Follow Me',
        key: 'F',
        keyCode: Phaser.Input.Keyboard.KeyCodes.F,
        callback: () => this.startFollowing()
      });
    }

    // Add Imprison action if following and near an empty cage
    if (this.state === HumanState.FOLLOWING) {
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

    // Gain trust (max 3)
    if (this.trust < TRUST.MAX_TRUST) {
      this.trust++;
      this.updateTrustMeter();
    }

    // Visual feedback - flash the human briefly
    this.sprite.setTint(0x88ff88);
    this.scene.time.delayedCall(200, () => {
      if (this.sprite?.active && this.isAlive) {
        this.sprite.clearTint();
      }
    });
  }

  // ==================== Trust Meter UI ====================

  updateTrustMeter() {
    if (this.trust <= 0) {
      // Hide trust meter if trust is 0
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
    const y = this.sprite.y - 14; // Below where health bar would be

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

  // ==================== Following Behavior ====================

  startFollowing() {
    if (this.state === HumanState.FOLLOWING) return;

    this.state = HumanState.FOLLOWING;
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

  updateFollowing() {
    const player = this.scene.player;
    if (!player?.sprite) {
      this.stopFollowing();
      return;
    }

    // Update follow icon position
    this.updateFollowIconPosition();

    // Calculate distance followed in tiles
    const dx = this.sprite.x - this.followStartX;
    const dy = this.sprite.y - this.followStartY;
    const distanceFollowed = Math.sqrt(dx * dx + dy * dy);
    this.tilesFollowed = distanceFollowed / MAP.TILE_SIZE;

    // Check if should stop following based on distance
    if (this.shouldStopFollowing()) {
      this.stopFollowing();
      return;
    }

    // Move towards player
    const playerDx = player.sprite.x - this.sprite.x;
    const playerDy = player.sprite.y - this.sprite.y;
    const distToPlayer = Math.sqrt(playerDx * playerDx + playerDy * playerDy);

    if (distToPlayer > TRUST.FOLLOW_DISTANCE) {
      // Move towards player
      const vx = (playerDx / distToPlayer) * this.speed;
      const vy = (playerDy / distToPlayer) * this.speed;
      this.sprite.setVelocity(vx, vy);
    } else {
      // Close enough, stop moving
      this.sprite.setVelocity(0, 0);
    }
  }

  shouldStopFollowing() {
    // 100% stop at 20 tiles
    if (this.tilesFollowed >= TRUST.FOLLOW_MAX_TILES) return true;

    // Check random stop chances at thresholds
    if (this.tilesFollowed >= 15 && !this.checked15) {
      this.checked15 = true;
      if (Math.random() < TRUST.STOP_CHANCE_15_TILES) return true;
    }
    if (this.tilesFollowed >= 10 && !this.checked10) {
      this.checked10 = true;
      if (Math.random() < TRUST.STOP_CHANCE_10_TILES) return true;
    }
    if (this.tilesFollowed >= 5 && !this.checked5) {
      this.checked5 = true;
      if (Math.random() < TRUST.STOP_CHANCE_5_TILES) return true;
    }

    return false;
  }

  stopFollowing() {
    this.state = HumanState.CONFUSED;
    this.sprite.setVelocity(0, 0);

    // Hide follow icon
    this.hideFollowIcon();

    // Lose 1 trust
    this.trust = Math.max(0, this.trust - 1);
    this.updateTrustMeter();

    // Reset follow tracking
    this.checked5 = false;
    this.checked10 = false;
    this.checked15 = false;

    // Show question mark
    this.showQuestionMark();

    // Shiver effect
    this.doShiverEffect();

    // After pause, return home
    this.scene.time.delayedCall(TRUST.STOP_PAUSE_DURATION, () => {
      if (this.isAlive && this.state === HumanState.CONFUSED) {
        this.state = HumanState.WANDERING;
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
      duration: 200,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut'
    });

    // Fade out after pause duration
    this.scene.time.delayedCall(TRUST.STOP_PAUSE_DURATION - 300, () => {
      this.scene.tweens.add({
        targets: questionMark,
        alpha: 0,
        duration: 300,
        onComplete: () => questionMark.destroy()
      });
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
    this.recalculatePath();
  }

  /**
   * Respond to a door knock - walk to door and open it
   */
  respondToKnock(door) {
    if (!this.isAlive || this.state === HumanState.FLEEING) return;

    // Save the door reference
    this.targetDoor = door;

    // Set target to door position
    this.targetX = door.x;
    this.targetY = door.y;
    this.isWaiting = false;
    this.recalculatePath();

    // Set a callback to open door when we get there
    this.respondingToKnock = true;
  }

  initializeWandering() {
    this.targetX = this.spawnX;
    this.targetY = this.spawnY;
    this.waitTimer = Phaser.Math.Between(100, 500); // Stagger initial movement
    this.isWaiting = true;
  }

  // ==================== Wandering Behavior ====================

  pickNewTarget() {
    const townData = this.scene.townData;
    if (!townData?.grid) {
      // Fallback - simple random walk inside home area
      this.targetX = this.spawnX + Phaser.Math.Between(-16, 16);
      this.targetY = this.spawnY + Phaser.Math.Between(-16, 16);
      this.isWaiting = false;
      return;
    }

    const tileSize = townData.tileSize;

    // Decide where to go based on probability:
    // 85% stay inside home
    // 10% go outside near home (yard/street)
    // 5% go to store
    const roll = Math.random();

    if (roll < 0.85) {
      // Stay inside home - find floor tiles in home building
      this.pickTargetInsideHome(townData, tileSize);
    } else if (roll < 0.95) {
      // Go outside near home
      this.pickTargetNearHome(townData, tileSize);
    } else {
      // Go to store
      this.pickTargetAtStore(townData, tileSize);
    }
  }

  pickTargetInsideHome(townData, tileSize) {
    if (!this.homeBuilding) {
      this.pickTargetNearHome(townData, tileSize);
      return;
    }

    const { x, y, width, height } = this.homeBuilding;

    // Try to find a floor tile inside the home
    for (let attempts = 0; attempts < 15; attempts++) {
      // Pick random tile inside building (not on walls)
      const tileX = x + 1 + Phaser.Math.Between(0, width - 3);
      const tileY = y + 1 + Phaser.Math.Between(0, height - 3);

      const cell = townData.grid[tileX]?.[tileY];
      if (cell && (cell.type === 'floor' || cell.type === 'door')) {
        this.targetX = tileX * tileSize + tileSize / 2;
        this.targetY = tileY * tileSize + tileSize / 2;
        this.isWaiting = false;
        this.recalculatePath();
        return;
      }
    }

    // Fallback - stay at spawn
    this.targetX = this.spawnX;
    this.targetY = this.spawnY;
    this.isWaiting = false;
  }

  pickTargetNearHome(townData, tileSize) {
    const centerTileX = Math.floor(this.spawnX / tileSize);
    const centerTileY = Math.floor(this.spawnY / tileSize);

    // Look for road/plaza tiles near home (within 3-6 tiles)
    for (let attempts = 0; attempts < 20; attempts++) {
      const offsetX = Phaser.Math.Between(-6, 6);
      const offsetY = Phaser.Math.Between(-6, 6);
      const tileX = centerTileX + offsetX;
      const tileY = centerTileY + offsetY;

      if (tileX < 2 || tileY < 2 || tileX >= townData.mapWidth - 2 || tileY >= townData.mapHeight - 2) {
        continue;
      }

      const cell = townData.grid[tileX]?.[tileY];
      if (cell && (cell.type === 'road' || cell.type === 'plaza')) {
        this.targetX = tileX * tileSize + tileSize / 2;
        this.targetY = tileY * tileSize + tileSize / 2;
        this.isWaiting = false;
        this.recalculatePath();
        return;
      }
    }

    // Fallback - stay inside
    this.pickTargetInsideHome(townData, tileSize);
  }

  pickTargetAtStore(townData, tileSize) {
    const store = townData.store || this.scene.townData?.store;
    if (!store) {
      this.pickTargetNearHome(townData, tileSize);
      return;
    }

    // Go to store entrance area
    const storeDoorX = store.doorPixelX || (store.doorX * tileSize + tileSize / 2);
    const storeDoorY = store.doorPixelY || ((store.doorY + 1) * tileSize + tileSize / 2);

    // Pick a spot near the store door
    this.targetX = storeDoorX + Phaser.Math.Between(-16, 16);
    this.targetY = storeDoorY + Phaser.Math.Between(0, 32);
    this.isWaiting = false;
    this.recalculatePath();
  }

  // ==================== Update Loop ====================

  update(delta) {
    if (!this.isAlive || !this.sprite.active) return;

    // Update trust meter position
    this.updateTrustMeterPosition();

    // Update missing parts overlay position
    this.updateMissingPartsPosition();

    // Handle imprisoned state - no AI updates
    if (this.state === HumanState.IMPRISONED) {
      this.sprite.setVelocity(0, 0);
      this.updateMiseryMeterPosition();
      return;
    }

    // Handle being carried - just update position relative to player
    if (this.isBeingCarried) {
      this.sprite.setVelocity(0, 0);
      this.updateMiseryMeterPosition();
      return;
    }

    // Handle following state separately
    if (this.state === HumanState.FOLLOWING) {
      this.updateFollowing();
      return;
    }

    // Don't do normal AI when confused (paused)
    if (this.state === HumanState.CONFUSED) {
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

    this.checkForCorpses();
    this.checkForIllegalActivity();
    this.checkForIdentifiedPlayer();
    this.checkForBrokenDoors();
    this.handleStuckDetection(delta);
    this.updateMovement(delta);
  }

  checkForBrokenDoors() {
    if (!this.scene.doors) return;

    for (const door of this.scene.doors) {
      if (door.state !== 'broken' || door.hasBeenReported) continue;

      const distance = LineOfSight.distance(
        this.sprite.x, this.sprite.y,
        door.x, door.y
      );

      if (distance < HUMAN.CORPSE_DETECT_RANGE) {
        if (LineOfSight.hasLineOfSight(
          this.sprite.x, this.sprite.y,
          door.x, door.y,
          this.scene.walls
        )) {
          door.markAsReported();
          this.scene.alertCopsToDisturbance(door.x, door.y);
          break;
        }
      }
    }
  }

  // ==================== Fleeing Behavior ====================

  checkForIdentifiedPlayer() {
    // Only flee if player has been identified as a threat
    if (!this.scene.playerIdentified) {
      // If we were fleeing but player is no longer identified, go back to wandering
      if (this.state === HumanState.FLEEING) {
        this.state = HumanState.WANDERING;
        this.pickNewTarget();
      }
      return;
    }

    const player = this.scene.player;
    if (!player?.sprite) return;

    const distance = LineOfSight.distance(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );

    const fleeRange = 5 * 16; // 5 tiles

    if (distance < fleeRange) {
      // Check line of sight
      if (LineOfSight.hasLineOfSight(
        this.sprite.x, this.sprite.y,
        player.sprite.x, player.sprite.y,
        this.scene.walls
      )) {
        this.startFleeing(player.sprite.x, player.sprite.y);
      }
    } else if (this.state === HumanState.FLEEING) {
      // Far enough away - stop fleeing, go back to wandering
      this.state = HumanState.WANDERING;
      this.hasAlertedPolice = false; // Reset so they can alert again if they see player again
      this.pickNewTarget();
    }
  }

  startFleeing(playerX, playerY) {
    if (this.state !== HumanState.FLEEING) {
      this.state = HumanState.FLEEING;

      // Alert police to player's location if we haven't already
      if (!this.hasAlertedPolice) {
        this.hasAlertedPolice = true;
        this.scene.alertCopsToPlayerLocation(playerX, playerY);
      }
    }

    // Calculate flee direction (away from player)
    const dx = this.sprite.x - playerX;
    const dy = this.sprite.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      // Find a point far away from player
      const fleeDistance = 8 * 16; // Flee 8 tiles away
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

  // ==================== Pathfinding ====================

  recalculatePath() {
    const townData = this.scene.townData;
    if (!townData) return;

    const path = Pathfinding.findPath(
      this.sprite.x, this.sprite.y,
      this.targetX, this.targetY,
      townData,
      true // preferRoads
    );

    if (path.length > 1) {
      this.currentPath = Pathfinding.simplifyPath(path, this.scene.walls);
      this.pathIndex = 1; // Skip starting position
    } else {
      this.currentPath = [];
      this.pathIndex = 0;
    }
  }

  getNextWaypoint() {
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      return this.currentPath[this.pathIndex];
    }
    return null;
  }

  advanceWaypoint() {
    this.pathIndex++;
    if (this.pathIndex >= this.currentPath.length) {
      this.currentPath = [];
      this.pathIndex = 0;
    }
  }

  handleStuckDetection(delta) {
    const dx = this.sprite.x - this.lastPosition.x;
    const dy = this.sprite.y - this.lastPosition.y;
    const moved = Math.sqrt(dx * dx + dy * dy);

    if (moved < 1 && !this.isWaiting) {
      this.stuckTimer += delta;
      if (this.stuckTimer > 1000) { // Stuck for 1 second
        this.stuckCount++;

        if (this.stuckCount >= 3) {
          // Give up on current path, pick new target
          this.stuckCount = 0;
          if (this.state === HumanState.WANDERING) {
            this.pickNewTarget();
          } else {
            // If fleeing and stuck, just wait briefly
            this.isWaiting = true;
            this.waitTimer = 500;
          }
        } else {
          this.recalculatePath();
        }
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
      this.stuckCount = 0;
    }

    this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
  }

  // ==================== Movement ====================

  updateMovement(delta) {
    if (this.isWaiting) {
      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        this.isWaiting = false;
        if (this.state === HumanState.WANDERING) {
          this.pickNewTarget();
        }
      }
      this.sprite.setVelocity(0, 0);
      return;
    }

    // Determine current movement target
    let currentTargetX, currentTargetY;
    const waypoint = this.getNextWaypoint();

    if (waypoint) {
      currentTargetX = waypoint.x;
      currentTargetY = waypoint.y;
    } else {
      currentTargetX = this.targetX;
      currentTargetY = this.targetY;
    }

    const dx = currentTargetX - this.sprite.x;
    const dy = currentTargetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if reached current waypoint
    if (waypoint && distance < 12) {
      this.advanceWaypoint();
      return;
    }

    // Use flee speed when fleeing, normal speed otherwise
    const currentSpeed = this.state === HumanState.FLEEING ? this.fleeSpeed : this.speed;

    // Check if reached final target
    if (!waypoint && distance < 8) {
      // Check if responding to knock - open the door
      if (this.respondingToKnock && this.targetDoor) {
        this.targetDoor.open();
        this.targetDoor = null;
        this.respondingToKnock = false;
      }

      if (this.state === HumanState.WANDERING) {
        this.isWaiting = true;
        this.waitTimer = Phaser.Math.Between(HUMAN.WAIT_TIME_MIN, HUMAN.WAIT_TIME_MAX);
      }
      this.sprite.setVelocity(0, 0);
      this.currentPath = [];
      this.pathIndex = 0;
    } else {
      const vx = (dx / distance) * currentSpeed;
      const vy = (dy / distance) * currentSpeed;
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

          // Award notoriety XP for body discovery (once per body)
          if (this.scene.notorietySystem) {
            this.scene.notorietySystem.awardBodyDiscoveryXP(corpse);
            this.scene.hud?.updateNotorietyDisplay();
          }
          break;
        }
      }
    }

    // Also check if player is carrying suspicious items
    this.checkForPlayerCarryingEvidence();
  }

  /**
   * Check if player is carrying body parts (uncooked), corpse, or prisoner
   */
  checkForPlayerCarryingEvidence() {
    if (this.hasSeenCorpse) return;

    const player = this.scene.player;
    if (!player?.sprite) return;

    const distance = LineOfSight.distance(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );

    if (distance < HUMAN.CORPSE_DETECT_RANGE) {
      if (LineOfSight.hasLineOfSight(
        this.sprite.x, this.sprite.y,
        player.sprite.x, player.sprite.y,
        this.scene.walls
      )) {
        // Check if carrying corpse
        if (player.carriedCorpse) {
          this.reactToEvidence();
          return;
        }

        // Check if carrying prisoner
        if (player.carriedPrisoner) {
          this.reactToEvidence();
          return;
        }

        // Check if carrying uncooked body part
        if (player.carriedBodyPart && !player.carriedBodyPart.isCooked) {
          this.reactToEvidence();
          return;
        }
      }
    }
  }

  /**
   * React to seeing player carrying evidence (corpse, prisoner, or uncooked body part)
   */
  reactToEvidence() {
    this.hasSeenCorpse = true;
    this.scene.alertCopsToDisturbance(this.sprite.x, this.sprite.y);
    this.scene.identifyPlayer(this.sprite);
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

  // ==================== Imprisonment ====================

  beImprisoned(cage) {
    this.state = HumanState.IMPRISONED;
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
    this.state = HumanState.FLEEING;
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

    // Only draw if misery > 0
    if (this.misery <= 0) return;

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

  // ==================== Body Parts ====================

  /**
   * Get list of available body parts that can still be removed
   */
  getAvailableBodyParts() {
    const available = [];
    for (const [key, config] of Object.entries(BODY_PARTS)) {
      if (this.removedParts[config.id] < config.max) {
        available.push({
          ...config,
          remaining: config.max - this.removedParts[config.id]
        });
      }
    }
    return available;
  }

  /**
   * Remove a body part
   * @returns {object|null} The removed body part info, or null if not available
   */
  removeBodyPart(partId) {
    const partConfig = Object.values(BODY_PARTS).find(p => p.id === partId);
    if (!partConfig) return null;

    if (this.removedParts[partId] >= partConfig.max) {
      return null; // Already removed max
    }

    this.removedParts[partId]++;

    // Check for fatal parts on living entities
    if (this.isAlive && partConfig.fatal) {
      this.kill();
    }

    // Apply speed reduction for legs
    if (partId === 'leg' && this.isAlive) {
      this.speed = HUMAN.SPEED * (1 - BODY_PARTS.LEG.speedReduction);
      this.fleeSpeed = this.speed * 1.5;
    }

    // Update visual overlay
    this.updateMissingPartsOverlay();

    const bodyPartInfo = {
      partId: partId,
      textureKey: `body_part_${partId}`,
      name: partConfig.name
    };

    // For skin, store victim appearance info for wearing
    if (partId === 'skin') {
      bodyPartInfo.victimRace = this.race;
      bodyPartInfo.victimGender = this.gender;
      bodyPartInfo.isPet = false;
      bodyPartInfo.petType = null;
    }

    return bodyPartInfo;
  }

  /**
   * Update the overlay showing missing body parts
   */
  updateMissingPartsOverlay() {
    if (!this.missingPartsOverlay) {
      this.missingPartsOverlay = this.scene.add.graphics();
      this.missingPartsOverlay.setDepth(DEPTH.NPC + 1);
      if (this.scene.hud) {
        this.scene.hud.ignoreGameObject(this.missingPartsOverlay);
      }
    }

    this.drawMissingPartsOverlay();
  }

  /**
   * Draw X marks on missing parts
   */
  drawMissingPartsOverlay() {
    if (!this.missingPartsOverlay || !this.sprite?.active) return;

    this.missingPartsOverlay.clear();
    const x = this.sprite.x;
    const y = this.sprite.y;

    this.missingPartsOverlay.lineStyle(1, 0xcc0000, 1);

    // Head - draw X where head would be (top)
    if (this.removedParts.head > 0) {
      this.missingPartsOverlay.lineBetween(x - 3, y - 8, x + 3, y - 4);
      this.missingPartsOverlay.lineBetween(x - 3, y - 4, x + 3, y - 8);
    }

    // Heart - draw X on chest
    if (this.removedParts.heart > 0) {
      this.missingPartsOverlay.lineBetween(x - 2, y - 2, x + 2, y + 2);
      this.missingPartsOverlay.lineBetween(x - 2, y + 2, x + 2, y - 2);
    }

    // Arms - draw X on sides
    if (this.removedParts.arm >= 1) {
      this.missingPartsOverlay.lineBetween(x - 6, y - 2, x - 4, y + 2);
      this.missingPartsOverlay.lineBetween(x - 6, y + 2, x - 4, y - 2);
    }
    if (this.removedParts.arm >= 2) {
      this.missingPartsOverlay.lineBetween(x + 4, y - 2, x + 6, y + 2);
      this.missingPartsOverlay.lineBetween(x + 4, y + 2, x + 6, y - 2);
    }

    // Legs - draw X on bottom
    if (this.removedParts.leg >= 1) {
      this.missingPartsOverlay.lineBetween(x - 4, y + 4, x - 2, y + 8);
      this.missingPartsOverlay.lineBetween(x - 4, y + 8, x - 2, y + 4);
    }
    if (this.removedParts.leg >= 2) {
      this.missingPartsOverlay.lineBetween(x + 2, y + 4, x + 4, y + 8);
      this.missingPartsOverlay.lineBetween(x + 2, y + 8, x + 4, y + 4);
    }

    // Funnies - draw X on crotch area
    if (this.removedParts.funnies > 0) {
      this.missingPartsOverlay.lineBetween(x - 2, y + 2, x + 2, y + 6);
      this.missingPartsOverlay.lineBetween(x - 2, y + 6, x + 2, y + 2);
    }
  }

  /**
   * Update overlay position (call in update loop)
   */
  updateMissingPartsPosition() {
    if (this.missingPartsOverlay && this.hasAnyMissingParts()) {
      this.drawMissingPartsOverlay();
    }
  }

  /**
   * Check if entity has any missing parts
   */
  hasAnyMissingParts() {
    return Object.values(this.removedParts).some(count => count > 0);
  }

  /**
   * Clean up missing parts overlay
   */
  hideMissingPartsOverlay() {
    if (this.missingPartsOverlay) {
      this.missingPartsOverlay.destroy();
      this.missingPartsOverlay = null;
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

    // Clean up misery meter
    this.hideMiseryMeter();

    this.sprite.setTint(0xffff00);

    const deathX = this.sprite.x;
    const deathY = this.sprite.y;

    this.scene.spawnBloodSplatter(deathX, deathY);

    const corpseTextureKey = `corpse_${this.race.name}_${this.gender}_${this.age}`;
    this.corpseData = this.scene.spawnCorpse(deathX, deathY, corpseTextureKey, false, this.race, this.gender, this.age);

    // Transfer removed parts to corpse
    if (this.corpseData) {
      this.corpseData.removedParts = { ...this.removedParts };
    }

    // Clean up overlay
    this.hideMissingPartsOverlay();

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
    this.hideFollowIcon();
    this.hideMissingPartsOverlay();
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
