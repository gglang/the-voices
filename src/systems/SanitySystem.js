import { DEPTH, MAP } from '../config/constants.js';
import { Pathfinding } from '../utils/Pathfinding.js';
import { DoorState } from '../entities/Door.js';

/**
 * Sanity system - tracks player's mental state
 * 3 points: Sane
 * 2 points: Jittery
 * 1 point: On the Brink
 * 0 points: Losing It
 */
export class SanitySystem {
  constructor(scene) {
    this.scene = scene;
    this.sanity = 3; // Start sane
    this.maxSanity = 3;

    // Losing it state
    this.isLosingIt = false;
    this.losingItTarget = null;
    this.lastLoseItCheck = 0;
    this.lastRecoverCheck = 0;

    // Pathfinding for losing it
    this.currentPath = [];
    this.pathIndex = 0;
    this.lastPathRecalc = 0;
    this.pathRecalcInterval = 500; // Recalculate path every 500ms

    // Timers
    this.loseItCheckInterval = 15000; // 15 seconds
    this.recoverCheckInterval = 5000; // 5 seconds
    this.loseItChance = 0.5; // 50%
    this.recoverChance = 0.25; // 25%

    // Visual effects - edge pulse rectangles
    this.edgePulses = [];
    this.pulseAlpha = 0;
    this.pulseDirection = 1;

    this.createScreenEdgePulseEffect();
  }

  /**
   * Get sanity label based on current points
   */
  getSanityLabel() {
    switch (this.sanity) {
      case 3: return 'SANE';
      case 2: return 'JITTERY';
      case 1: return 'ON THE BRINK';
      case 0: return 'LOSING IT';
      default: return 'SANE';
    }
  }

  /**
   * Get color for sanity state
   */
  getSanityColor() {
    switch (this.sanity) {
      case 3: return 0x44ff44; // Green
      case 2: return 0xffff44; // Yellow
      case 1: return 0xff8844; // Orange
      case 0: return 0xff4444; // Red
      default: return 0x44ff44;
    }
  }

  /**
   * Get hex color string for text
   */
  getSanityColorHex() {
    switch (this.sanity) {
      case 3: return '#44ff44';
      case 2: return '#ffff44';
      case 1: return '#ff8844';
      case 0: return '#ff4444';
      default: return '#44ff44';
    }
  }

  /**
   * Increase sanity (e.g., completing objectives)
   */
  increaseSanity(amount = 1) {
    const oldSanity = this.sanity;
    this.sanity = Math.min(this.maxSanity, this.sanity + amount);

    if (this.sanity > 0 && this.isLosingIt) {
      this.stopLosingIt();
    }

    if (oldSanity !== this.sanity) {
      this.scene.hud?.updateSanityDisplay?.();
    }
  }

  /**
   * Decrease sanity (e.g., failing objectives)
   */
  decreaseSanity(amount = 1) {
    const oldSanity = this.sanity;
    this.sanity = Math.max(0, this.sanity - amount);

    if (oldSanity !== this.sanity) {
      this.scene.hud?.updateSanityDisplay?.();
    }
  }

  /**
   * Create the red screen edge pulse effect (4 rectangles for edges)
   */
  createScreenEdgePulseEffect() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const edgeThickness = 40; // How thick the edge glow is

    // Top edge
    const topEdge = this.scene.add.rectangle(
      width / 2, edgeThickness / 2,
      width, edgeThickness,
      0xff0000, 0
    );
    topEdge.setScrollFactor(0);
    topEdge.setDepth(999);

    // Bottom edge
    const bottomEdge = this.scene.add.rectangle(
      width / 2, height - edgeThickness / 2,
      width, edgeThickness,
      0xff0000, 0
    );
    bottomEdge.setScrollFactor(0);
    bottomEdge.setDepth(999);

    // Left edge
    const leftEdge = this.scene.add.rectangle(
      edgeThickness / 2, height / 2,
      edgeThickness, height,
      0xff0000, 0
    );
    leftEdge.setScrollFactor(0);
    leftEdge.setDepth(999);

    // Right edge
    const rightEdge = this.scene.add.rectangle(
      width - edgeThickness / 2, height / 2,
      edgeThickness, height,
      0xff0000, 0
    );
    rightEdge.setScrollFactor(0);
    rightEdge.setDepth(999);

    this.edgePulses = [topEdge, bottomEdge, leftEdge, rightEdge];

    // Ignore from HUD
    if (this.scene.hud) {
      for (const edge of this.edgePulses) {
        this.scene.hud.ignoreGameObject(edge);
      }
    }
  }

  /**
   * Start losing it - player loses control
   */
  startLosingIt() {
    if (this.isLosingIt) return;

    this.isLosingIt = true;
    this.lastRecoverCheck = this.scene.time.now;

    // Make player's eyes red
    this.scene.player?.sprite?.setTint(0xff8888);

    // Show notification
    this.scene.showNotification('THE VOICES ARE TOO LOUD!!!');

    // Find first target
    this.findNextTarget();
  }

  /**
   * Stop losing it - player regains control
   */
  stopLosingIt() {
    if (!this.isLosingIt) return;

    this.isLosingIt = false;
    this.losingItTarget = null;
    this.currentPath = [];
    this.pathIndex = 0;

    // Restore player appearance
    this.scene.player?.sprite?.clearTint();

    // Restore player control
    if (this.scene.player) {
      this.scene.player.canControl = true;
    }

    // Hide screen edge pulses
    for (const edge of this.edgePulses) {
      edge.setAlpha(0);
    }

    this.scene.showNotification('*heavy breathing* ...the voices stopped...');
  }

  /**
   * Find the nearest living entity to attack
   */
  findNextTarget() {
    if (!this.isLosingIt) return;

    const player = this.scene.player;
    if (!player?.sprite) return;

    let nearestTarget = null;
    let nearestDistance = Infinity;

    // Check humans
    for (const human of this.scene.humans || []) {
      if (!human.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        human.sprite.x, human.sprite.y
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestTarget = { entity: human, type: 'human' };
      }
    }

    // Check cops
    for (const cop of this.scene.police || []) {
      if (!cop.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        cop.sprite.x, cop.sprite.y
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestTarget = { entity: cop, type: 'cop' };
      }
    }

    // Check pets
    for (const pet of this.scene.pets || []) {
      if (!pet.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        pet.sprite.x, pet.sprite.y
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestTarget = { entity: pet, type: 'pet' };
      }
    }

    // Check rats
    for (const rat of this.scene.rats || []) {
      if (!rat.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        rat.sprite.x, rat.sprite.y
      );
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestTarget = { entity: rat, type: 'rat' };
      }
    }

    this.losingItTarget = nearestTarget;

    // Calculate path to new target
    if (this.losingItTarget) {
      this.recalculatePath();
    }
  }

  /**
   * Recalculate path to current target using A* pathfinding
   */
  recalculatePath() {
    const player = this.scene.player;
    const target = this.losingItTarget?.entity;

    if (!player?.sprite || !target?.sprite) {
      this.currentPath = [];
      return;
    }

    const townData = this.scene.townGenerator?.getTownData();
    if (!townData) {
      this.currentPath = [];
      return;
    }

    const path = Pathfinding.findPath(
      player.sprite.x, player.sprite.y,
      target.sprite.x, target.sprite.y,
      townData,
      false // Don't prefer roads - go straight for the target
    );

    if (path.length > 1) {
      this.currentPath = Pathfinding.simplifyPath(path, this.scene.walls);
      this.pathIndex = 1; // Skip first point (current position)
    } else if (path.length === 1) {
      this.currentPath = path;
      this.pathIndex = 0;
    } else {
      this.currentPath = [];
    }

    this.lastPathRecalc = this.scene.time.now;
  }

  /**
   * Check if there's a closed door blocking the path and break it
   */
  checkAndBreakDoorsInPath() {
    const player = this.scene.player;
    if (!player?.sprite) return;

    const checkDistance = 24; // Check slightly ahead

    for (const door of this.scene.doors || []) {
      if (door.state !== DoorState.CLOSED) continue;

      const dist = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        door.x, door.y
      );

      if (dist < checkDistance) {
        // Break the door!
        door.breakDown();
        // Recalculate path after breaking door
        this.recalculatePath();
        return;
      }
    }
  }

  /**
   * Update the losing it behavior - move towards and attack target using pathfinding
   */
  updateLosingItBehavior(delta) {
    if (!this.isLosingIt) return;

    const player = this.scene.player;
    if (!player?.sprite) return;

    // Disable normal player control
    player.canControl = false;

    // Check if target is still valid
    if (!this.losingItTarget || !this.losingItTarget.entity.isAlive) {
      this.findNextTarget();
      if (!this.losingItTarget) {
        // No targets left, stop losing it
        this.stopLosingIt();
        return;
      }
    }

    const target = this.losingItTarget.entity;
    const targetX = target.sprite.x;
    const targetY = target.sprite.y;

    // Calculate distance to target
    const distToTarget = Phaser.Math.Distance.Between(
      player.sprite.x, player.sprite.y,
      targetX, targetY
    );

    // Check for doors to break
    this.checkAndBreakDoorsInPath();

    // Periodically recalculate path (target may have moved)
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastPathRecalc >= this.pathRecalcInterval) {
      this.recalculatePath();
    }

    const speed = player.speed * 1.2; // Slightly faster when losing it

    // If close enough to target, attack
    if (distToTarget <= 20) {
      player.sprite.setVelocity(0, 0);

      // Use the player's attack cooldown system
      if (currentTime - player.lastAttackTime >= player.attackCooldown) {
        player.lastAttackTime = currentTime;

        if (this.losingItTarget.type === 'cop') {
          target.takeDamage();
        } else {
          target.kill();
        }

        // Check if target died
        if (!target.isAlive) {
          this.findNextTarget();
        }
      }
      return;
    }

    // Follow the path
    if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
      const waypoint = this.currentPath[this.pathIndex];
      const distToWaypoint = Phaser.Math.Distance.Between(
        player.sprite.x, player.sprite.y,
        waypoint.x, waypoint.y
      );

      if (distToWaypoint < 8) {
        // Reached waypoint, move to next
        this.pathIndex++;
        if (this.pathIndex >= this.currentPath.length) {
          // Path complete, recalculate
          this.recalculatePath();
        }
      } else {
        // Move towards current waypoint
        const angle = Phaser.Math.Angle.Between(
          player.sprite.x, player.sprite.y,
          waypoint.x, waypoint.y
        );
        player.sprite.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
      }
    } else {
      // No path, move directly towards target (fallback)
      const angle = Phaser.Math.Angle.Between(
        player.sprite.x, player.sprite.y,
        targetX, targetY
      );
      player.sprite.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }
  }

  /**
   * Update screen edge pulse effect
   */
  updateScreenPulse(delta) {
    if (this.edgePulses.length === 0) return;

    // Pulse at sanity 1 (slow) or when losing it (fast)
    const shouldPulse = this.sanity === 1 || this.isLosingIt;

    if (shouldPulse) {
      const pulseSpeed = this.isLosingIt ? 0.004 : 0.001;
      const maxAlpha = this.isLosingIt ? 0.6 : 0.25;

      this.pulseAlpha += this.pulseDirection * pulseSpeed * delta;

      if (this.pulseAlpha >= maxAlpha) {
        this.pulseAlpha = maxAlpha;
        this.pulseDirection = -1;
      } else if (this.pulseAlpha <= 0) {
        this.pulseAlpha = 0;
        this.pulseDirection = 1;
      }

      // Apply alpha to all edge rectangles
      for (const edge of this.edgePulses) {
        edge.setAlpha(this.pulseAlpha);
      }
    } else {
      // Hide all edges
      for (const edge of this.edgePulses) {
        edge.setAlpha(0);
      }
      this.pulseAlpha = 0;
      this.pulseDirection = 1;
    }
  }

  /**
   * Main update loop
   */
  update(delta) {
    const currentTime = this.scene.time.now;

    // Check for losing it trigger at sanity 0
    if (this.sanity === 0 && !this.isLosingIt) {
      if (currentTime - this.lastLoseItCheck >= this.loseItCheckInterval) {
        this.lastLoseItCheck = currentTime;
        if (Math.random() < this.loseItChance) {
          this.startLosingIt();
        }
      }
    }

    // Check for recovery when losing it
    if (this.isLosingIt) {
      if (currentTime - this.lastRecoverCheck >= this.recoverCheckInterval) {
        this.lastRecoverCheck = currentTime;
        if (Math.random() < this.recoverChance) {
          this.stopLosingIt();
        }
      }

      // Update losing it behavior
      this.updateLosingItBehavior(delta);
    }

    // Update screen pulse effect
    this.updateScreenPulse(delta);

    // Update player tint when losing it
    if (this.isLosingIt && this.scene.player?.sprite) {
      // Pulsing red tint
      const tintIntensity = 0.5 + 0.5 * Math.sin(currentTime * 0.01);
      const red = Math.floor(255);
      const green = Math.floor(100 * (1 - tintIntensity));
      const blue = Math.floor(100 * (1 - tintIntensity));
      const tint = (red << 16) | (green << 8) | blue;
      this.scene.player.sprite.setTint(tint);
    }
  }

  /**
   * Check if player is currently losing it
   */
  isPlayerLosingIt() {
    return this.isLosingIt;
  }

  /**
   * Reset sanity system
   */
  reset() {
    this.sanity = 3;
    this.isLosingIt = false;
    this.losingItTarget = null;
    this.lastLoseItCheck = 0;
    this.lastRecoverCheck = 0;
    this.currentPath = [];
    this.pathIndex = 0;
    this.lastPathRecalc = 0;

    // Hide edge pulses
    for (const edge of this.edgePulses) {
      edge.setAlpha(0);
    }

    if (this.scene.player?.sprite) {
      this.scene.player.sprite.clearTint();
    }
  }
}
