import { LineOfSight } from '../utils/LineOfSight.js';

/**
 * System for managing object interactions and actions
 */
export class ActionSystem {
  constructor(scene) {
    this.scene = scene;
    this.actionRange = 20; // Slightly more than 1 tile for easier interaction
    this.currentTarget = null;
    this.registeredObjects = new Map(); // Map of sprite -> action config
  }

  /**
   * Register an object with available actions
   * @param {Phaser.GameObjects.Sprite} sprite - The sprite to register
   * @param {object} config - Action configuration
   * @param {Array} config.actions - Array of action objects {name, key, keyCode, callback}
   * @param {Function} config.getActions - Optional function that returns dynamic actions
   * @param {object} config.owner - The entity that owns this sprite
   */
  registerObject(sprite, config) {
    this.registeredObjects.set(sprite, config);
  }

  /**
   * Unregister an object
   */
  unregisterObject(sprite) {
    this.registeredObjects.delete(sprite);
    if (this.currentTarget?.sprite === sprite) {
      this.currentTarget = null;
    }
  }

  /**
   * Update - find nearest actionable object and show popup
   */
  update() {
    if (this.scene.isGameOver) {
      this.currentTarget = null;
      return;
    }

    const player = this.scene.player;
    if (!player?.sprite) return;

    const playerX = player.sprite.x;
    const playerY = player.sprite.y;

    let nearestTarget = null;
    let nearestDistance = Infinity;

    // Find nearest actionable object in range
    for (const [sprite, config] of this.registeredObjects) {
      if (!sprite.active) continue;

      const distance = LineOfSight.distance(playerX, playerY, sprite.x, sprite.y);

      if (distance <= this.actionRange && distance < nearestDistance) {
        // Get available actions
        const actions = this.getActionsForObject(sprite, config);
        if (actions.length > 0) {
          nearestTarget = { sprite, config, actions, distance };
          nearestDistance = distance;
        }
      }
    }

    this.currentTarget = nearestTarget;
  }

  /**
   * Get available actions for an object
   */
  getActionsForObject(sprite, config) {
    if (config.getActions) {
      return config.getActions();
    }
    return config.actions || [];
  }

  /**
   * Execute an action by key code
   */
  executeAction(keyCode) {
    if (!this.currentTarget) return false;

    const { actions } = this.currentTarget;
    const action = actions.find(a => a.keyCode === keyCode);

    if (action && action.callback) {
      action.callback();
      return true;
    }

    return false;
  }

  /**
   * Get current target info for UI rendering
   */
  getCurrentTarget() {
    return this.currentTarget;
  }

  /**
   * Check if a specific key is an action key for current target
   */
  isActionKey(keyCode) {
    if (!this.currentTarget) return false;
    return this.currentTarget.actions.some(a => a.keyCode === keyCode);
  }
}
