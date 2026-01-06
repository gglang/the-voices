import Phaser from 'phaser';
import { DEPTH } from '../config/constants.js';
import { Pathfinding } from '../utils/Pathfinding.js';

/**
 * Rat behavior states
 */
const RatState = {
  WANDERING: 'wandering',
  FLEEING: 'fleeing'
};

/**
 * Rat settings
 */
const RAT = {
  SPEED: 50,
  FLEE_SPEED: 80,
  WANDER_RADIUS: 4 * 16,    // pixels - wander around spawn area
  WAIT_TIME_MIN: 500,
  WAIT_TIME_MAX: 3000
};

/**
 * Rat entity - small critters that wander around downtown
 * Can be picked up, killed, cooked, eaten, or gifted
 * Does NOT trigger any alarm when carried (alive or dead)
 */
export class Rat {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = RAT.SPEED;
    this.fleeSpeed = RAT.FLEE_SPEED;
    this.isAlive = true;
    this.isRat = true;  // Flag to identify as rat

    // Behavior state
    this.state = RatState.WANDERING;

    // Spawn point for wandering
    this.spawnX = x;
    this.spawnY = y;
    this.wanderRadius = RAT.WANDER_RADIUS;

    // Pathfinding
    this.currentPath = [];
    this.pathIndex = 0;

    // Waiting behavior
    this.isWaiting = false;
    this.waitTimer = 0;
    this.targetX = x;
    this.targetY = y;

    // Being carried state
    this.isBeingCarried = false;

    this.createSprite(x, y);
    this.initializeWandering();
  }

  createSprite(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, 'rat');
    this.sprite.setCollideWorldBounds(true);

    // Rats are small (8x6)
    this.sprite.body.setSize(6, 4);
    this.sprite.body.setOffset(1, 2);

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

    const actions = [];

    // Attack action (kill the rat)
    actions.push({
      name: 'Attack',
      key: 'T',
      keyCode: Phaser.Input.Keyboard.KeyCodes.T,
      callback: () => this.scene.player?.attackRat(this)
    });

    // Pickup action (only if player isn't carrying anything)
    if (!this.scene.player?.isCarryingAnything()) {
      actions.push({
        name: 'Pick Up',
        key: 'SPACE',
        keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
        callback: () => this.scene.player?.pickupRat(this)
      });
    }

    return actions;
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
      // Fallback - simple random walk
      this.targetX = this.spawnX + Phaser.Math.Between(-32, 32);
      this.targetY = this.spawnY + Phaser.Math.Between(-32, 32);
      this.isWaiting = false;
      return;
    }

    // Random position within wander radius
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.wanderRadius;

    this.targetX = this.spawnX + Math.cos(angle) * distance;
    this.targetY = this.spawnY + Math.sin(angle) * distance;

    // Clamp to world bounds
    const bounds = this.scene.physics.world.bounds;
    this.targetX = Phaser.Math.Clamp(this.targetX, bounds.x + 16, bounds.right - 16);
    this.targetY = Phaser.Math.Clamp(this.targetY, bounds.y + 16, bounds.bottom - 16);

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
      this.waitTimer = Phaser.Math.Between(RAT.WAIT_TIME_MIN, RAT.WAIT_TIME_MAX);
    }
  }

  update(delta) {
    if (!this.isAlive || !this.sprite?.active) return;

    // Handle being carried
    if (this.isBeingCarried) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    // State-based updates
    switch (this.state) {
      case RatState.WANDERING:
        this.updateWandering(delta);
        break;
      case RatState.FLEEING:
        this.updateFleeing(delta);
        break;
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

    // After fleeing far enough, go back to wandering
    const distFromTarget = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.targetX, this.targetY
    );

    if (distFromTarget < 8 || this.currentPath.length === 0) {
      this.state = RatState.WANDERING;
      this.isWaiting = true;
      this.waitTimer = Phaser.Math.Between(RAT.WAIT_TIME_MIN, RAT.WAIT_TIME_MAX);
    }
  }

  moveAlongPath(speed) {
    if (this.currentPath.length === 0) {
      this.sprite.setVelocity(0, 0);
      this.isWaiting = true;
      this.waitTimer = Phaser.Math.Between(RAT.WAIT_TIME_MIN, RAT.WAIT_TIME_MAX);
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
        this.waitTimer = Phaser.Math.Between(RAT.WAIT_TIME_MIN, RAT.WAIT_TIME_MAX);
      }
      return;
    }

    // Move toward target
    const angle = Math.atan2(dy, dx);
    this.sprite.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
  }

  /**
   * Start fleeing from a position
   */
  startFleeing(fromX, fromY) {
    this.state = RatState.FLEEING;

    // Calculate flee direction (away from threat)
    const dx = this.sprite.x - fromX;
    const dy = this.sprite.y - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const fleeDistance = 4 * 16; // Flee 4 tiles away
      const normalizedDx = dx / dist;
      const normalizedDy = dy / dist;

      this.targetX = this.sprite.x + normalizedDx * fleeDistance;
      this.targetY = this.sprite.y + normalizedDy * fleeDistance;

      // Clamp to world bounds
      const bounds = this.scene.physics.world.bounds;
      this.targetX = Phaser.Math.Clamp(this.targetX, bounds.x + 16, bounds.right - 16);
      this.targetY = Phaser.Math.Clamp(this.targetY, bounds.y + 16, bounds.bottom - 16);

      this.isWaiting = false;
      this.recalculatePath();
    }
  }

  /**
   * Called when player picks up this rat
   */
  bePickedUp() {
    this.isBeingCarried = true;
    this.sprite.setVisible(false);

    // Unregister from action system while carried
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(this.sprite);
    }
  }

  /**
   * Called when player drops this rat
   */
  beDropped(x, y) {
    this.isBeingCarried = false;
    this.sprite.setPosition(x, y);
    this.sprite.setVisible(true);
    this.spawnX = x;
    this.spawnY = y;

    // Re-register with action system
    this.registerActions();

    // Start fleeing from where it was dropped
    this.startFleeing(x, y);
  }

  /**
   * Kill this rat
   */
  kill() {
    if (!this.isAlive) return;
    this.isAlive = false;

    // Unregister from action system
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(this.sprite);
    }

    // Small blood splatter
    this.scene.spawnBloodSplatter(this.sprite.x, this.sprite.y, 0.5);

    // Spawn dead rat (if not being carried)
    if (!this.isBeingCarried) {
      this.scene.spawnDeadRat(this.sprite.x, this.sprite.y);
    }

    // Destroy sprite
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
