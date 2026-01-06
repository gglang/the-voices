import Phaser from 'phaser';
import { POLICE, DEPTH, RACES, HUMAN_GENDERS } from '../config/constants.js';
import { LineOfSight } from '../utils/LineOfSight.js';
import { Pathfinding } from '../utils/Pathfinding.js';

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
  constructor(scene, x, y, race = null, gender = null) {
    this.scene = scene;
    this.isAlive = true;

    // Assign random race/gender if not provided
    this.race = race || RACES[Phaser.Math.Between(0, RACES.length - 1)];
    this.gender = gender || HUMAN_GENDERS[Phaser.Math.Between(0, HUMAN_GENDERS.length - 1)];

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

    // Pathfinding
    this.currentPath = [];
    this.pathIndex = 0;
    this.pathRecalcTimer = 0;

    this.createSprite(x, y);

    // Start with a brief wait to let physics settle, then start wandering
    this.isWaiting = true;
    this.waitTimer = Phaser.Math.Between(100, 500);
  }

  createSprite(x, y) {
    const textureKey = `police_${this.race.name}_${this.gender}`;
    this.sprite = this.scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(12, 12);
    this.sprite.body.setOffset(2, 4);
    this.sprite.parentEntity = this;
    this.sprite.setDepth(DEPTH.NPC);
    this.healthBar = null;

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

    return [
      {
        name: 'Attack',
        key: 'SPACE',
        keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
        callback: () => this.scene.player?.tryKill()
      },
      {
        name: 'Talk',
        key: 'T',
        keyCode: Phaser.Input.Keyboard.KeyCodes.T,
        callback: () => this.talk()
      }
    ];
  }

  talk() {
    // Simple talk feedback - flash the cop briefly
    this.sprite.setTint(0x88ff88);
    this.scene.time.delayedCall(200, () => {
      if (this.sprite?.active && this.isAlive) {
        this.sprite.clearTint();
      }
    });
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
      this.checkForBrokenDoors();
    }

    this.handleStuckDetection(delta);
    this.handleMovement(delta);
  }

  // ==================== Wandering ====================

  pickNewWanderTarget() {
    const townData = this.scene.townData;
    if (!townData?.grid) {
      // Fallback if no town data
      this.targetX = this.sprite.x;
      this.targetY = this.sprite.y;
      return;
    }

    const tileSize = townData.tileSize;
    const maxAttempts = 30;

    // Prefer road tiles for wandering - cops should patrol roads
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const tileX = Phaser.Math.Between(3, townData.mapWidth - 4);
      const tileY = Phaser.Math.Between(3, townData.mapHeight - 4);

      const cell = townData.grid[tileX]?.[tileY];
      if (!cell) continue;

      // Prefer roads and plazas, but allow other walkable areas
      const isPreferred = cell.type === 'road' || cell.type === 'plaza';
      const isWalkable = cell.type !== 'wall' && cell.type !== 'tree' && cell.type !== 'fountain';

      // 80% chance to require road/plaza, 20% chance to accept any walkable
      if (isWalkable && (isPreferred || attempts > maxAttempts * 0.8)) {
        this.targetX = tileX * tileSize + tileSize / 2;
        this.targetY = tileY * tileSize + tileSize / 2;
        this.isWaiting = false;
        this.recalculatePath();
        return;
      }
    }

    // Ultimate fallback - stay in place briefly
    this.isWaiting = true;
    this.waitTimer = 1000;
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

  // ==================== Body/Door Detection ====================

  checkForBrokenDoors() {
    if (!this.scene.doors) return;

    for (const door of this.scene.doors) {
      if (door.state !== 'broken' || door.hasBeenReported) continue;

      const distance = LineOfSight.distance(
        this.sprite.x, this.sprite.y,
        door.x, door.y
      );

      if (distance < POLICE.BODY_SIGHT_RANGE) {
        if (LineOfSight.hasLineOfSight(
          this.sprite.x, this.sprite.y,
          door.x, door.y,
          this.scene.walls
        )) {
          door.markAsReported();
          // Investigate the broken door
          this.assignInvestigation(door.x, door.y);
          break;
        }
      }
    }
  }

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
      // Calculate path to investigation target
      this.recalculatePath();
    }
  }

  assignChase(playerX, playerY) {
    // Force cop to chase player at given location
    // This is called when civilians report player location
    this.state = CopState.CHASING;
    this.lastSeenPlayerX = playerX;
    this.lastSeenPlayerY = playerY;
    this.targetX = playerX;
    this.targetY = playerY;
    this.isWaiting = false;
    this.investigationTarget = null;
    this.recalculatePath();
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

      // Award notoriety XP for body discovery (once per body)
      if (this.scene.notorietySystem) {
        this.scene.notorietySystem.awardBodyDiscoveryXP(bodyPresent);
        this.scene.hud?.updateNotorietyDisplay();
      }
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
        this.stuckCount = (this.stuckCount || 0) + 1;

        if (this.stuckCount >= 3) {
          // Been stuck too many times - find nearest road and go there
          this.findNearestRoadTarget();
          this.stuckCount = 0;
        } else {
          // Try recalculating path
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

  findNearestRoadTarget() {
    const townData = this.scene.townData;
    if (!townData?.grid) return;

    const tileSize = townData.tileSize;
    const currentTileX = Math.floor(this.sprite.x / tileSize);
    const currentTileY = Math.floor(this.sprite.y / tileSize);

    // Search in expanding circles for a road tile
    for (let radius = 1; radius < 15; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

          const tileX = currentTileX + dx;
          const tileY = currentTileY + dy;

          if (tileX < 0 || tileY < 0 || tileX >= townData.mapWidth || tileY >= townData.mapHeight) continue;

          const cell = townData.grid[tileX]?.[tileY];
          if (cell && (cell.type === 'road' || cell.type === 'plaza')) {
            this.targetX = tileX * tileSize + tileSize / 2;
            this.targetY = tileY * tileSize + tileSize / 2;
            this.currentPath = [];
            this.pathIndex = 0;
            this.recalculatePath();
            return;
          }
        }
      }
    }
  }

  /**
   * Calculate a path to the current target using A*
   */
  recalculatePath() {
    const townData = this.scene.townData;
    if (!townData) return;

    const path = Pathfinding.findPath(
      this.sprite.x, this.sprite.y,
      this.targetX, this.targetY,
      townData
    );

    if (path.length > 1) {
      // Simplify path to reduce waypoints
      this.currentPath = Pathfinding.simplifyPath(path, this.scene.walls);
      this.pathIndex = 1; // Skip the first point (current position)
    } else {
      this.currentPath = [];
      this.pathIndex = 0;
    }
  }

  /**
   * Get the next waypoint to move toward
   */
  getNextWaypoint() {
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      return this.currentPath[this.pathIndex];
    }
    return null;
  }

  /**
   * Advance to the next waypoint in the path
   */
  advanceWaypoint() {
    this.pathIndex++;
    if (this.pathIndex >= this.currentPath.length) {
      this.currentPath = [];
      this.pathIndex = 0;
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

    // Continuously update target when chasing
    if (this.state === CopState.CHASING) {
      const player = this.scene.player;
      if (player?.sprite) {
        this.targetX = player.sprite.x;
        this.targetY = player.sprite.y;
        this.lastSeenPlayerX = player.sprite.x;
        this.lastSeenPlayerY = player.sprite.y;

        // Recalculate path periodically while chasing
        this.pathRecalcTimer += delta;
        if (this.pathRecalcTimer > 500) {
          this.pathRecalcTimer = 0;
          // Only recalc if no direct line of sight
          if (!LineOfSight.hasLineOfSight(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y,
            this.scene.walls
          )) {
            this.recalculatePath();
          } else {
            // Clear path, move directly
            this.currentPath = [];
            this.pathIndex = 0;
          }
        }
      }
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

    const speed = this.state === CopState.CHASING ? this.chaseSpeed : this.baseSpeed;

    // Check if reached final target
    if (!waypoint && distance < 8) {
      this.isWaiting = true;
      this.waitTimer = this.getWaitTime();
      this.sprite.setVelocity(0, 0);
      this.currentPath = [];
      this.pathIndex = 0;
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

    // Unregister from action system
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(this.sprite);
    }

    const deathX = this.sprite.x;
    const deathY = this.sprite.y;

    this.scene.spawnBloodSplatter(deathX, deathY);
    const corpseTextureKey = `corpse_police_${this.race.name}_${this.gender}`;
    this.corpseData = this.scene.spawnCorpse(deathX, deathY, corpseTextureKey, true);

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
