import Phaser from 'phaser';
import { DEPTH, EFFECTS } from '../config/constants.js';

/**
 * Manages all corpse-related functionality
 */
export class CorpseManager {
  constructor(scene) {
    this.scene = scene;
    this.corpses = [];
  }

  /**
   * Spawn a corpse at a location
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} textureKey - Texture key for the corpse
   * @param {boolean} isPolice - Whether this is a police corpse
   * @param {number} hairColor - Hair color of the victim (for humans)
   * @param {number} skinColor - Skin color of the victim (for humans)
   * @returns {object} Corpse data object
   */
  spawn(x, y, textureKey, isPolice = false, hairColor = null, skinColor = null) {
    const sprite = this.scene.add.image(x, y, textureKey);
    sprite.setDepth(DEPTH.CORPSE);

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(sprite);
    }

    const corpseData = {
      sprite,
      x,
      y,
      isPolice,
      hairColor,
      skinColor,
      discovered: false,
      isPickedUp: false
    };

    // Register corpse with action system
    this.registerCorpseActions(corpseData);

    this.corpses.push(corpseData);
    return corpseData;
  }

  /**
   * Register corpse with action system for pickup action
   */
  registerCorpseActions(corpseData) {
    if (!this.scene.actionSystem) return;

    this.scene.actionSystem.registerObject(corpseData.sprite, {
      owner: corpseData,
      getActions: () => {
        if (corpseData.isPickedUp) return [];
        // Only show pickup if player isn't carrying a corpse
        if (this.scene.player?.carriedCorpse) return [];
        return [
          {
            name: 'Pickup',
            key: 'SPACE',
            keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
            callback: () => this.scene.player?.pickupCorpse()
          }
        ];
      }
    });
  }

  /**
   * Spawn blood splatter effect
   */
  spawnBlood(x, y) {
    const blood = this.scene.add.image(x, y, 'blood');
    blood.setDepth(DEPTH.BLOOD);

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(blood);
    }

    this.scene.tweens.add({
      targets: blood,
      alpha: 0.3,
      delay: EFFECTS.BLOOD_FADE_DELAY,
      duration: EFFECTS.BLOOD_FADE_DURATION
    });
  }

  /**
   * Get all corpses within range that are not picked up
   */
  getInRange(x, y, range) {
    return this.corpses.filter(corpse => {
      if (corpse.isPickedUp) return false;
      const dx = corpse.x - x;
      const dy = corpse.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= range;
    });
  }

  /**
   * Get the nearest corpse within range
   */
  getNearest(x, y, range) {
    const inRange = this.getInRange(x, y, range);
    if (inRange.length === 0) return null;

    let nearest = null;
    let nearestDist = Infinity;

    for (const corpse of inRange) {
      const dx = corpse.x - x;
      const dy = corpse.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < nearestDist) {
        nearestDist = distance;
        nearest = corpse;
      }
    }

    return nearest;
  }

  /**
   * Remove a corpse from the manager
   */
  remove(corpse) {
    const index = this.corpses.indexOf(corpse);
    if (index > -1) {
      this.corpses.splice(index, 1);
    }
  }

  /**
   * Destroy a corpse with fade effect
   */
  destroy(corpse, duration = 500) {
    // Unregister from action system
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(corpse.sprite);
    }

    this.scene.tweens.add({
      targets: corpse.sprite,
      alpha: 0,
      scale: 0.5,
      duration,
      onComplete: () => {
        corpse.sprite.destroy();
        this.remove(corpse);
      }
    });
  }

  /**
   * Get all corpses
   */
  getAll() {
    return this.corpses;
  }
}
