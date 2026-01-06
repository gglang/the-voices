import Phaser from 'phaser';
import { DEPTH, EFFECTS, BODY_PARTS } from '../config/constants.js';

/**
 * Manages all corpse-related functionality
 */
export class CorpseManager {
  constructor(scene) {
    this.scene = scene;
    this.corpses = [];
    this.droppedBodyParts = [];
    this.bodyPartMenu = null;
    this.bodyPartKeyListeners = null;
    this.escKey = null;
  }

  /**
   * Spawn a corpse at a location
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} textureKey - Texture key for the corpse
   * @param {boolean} isPolice - Whether this is a police corpse
   * @param {object} race - Race of the victim (for humans) { name, skin, hair }
   * @param {string} gender - Gender of the victim (for humans)
   * @param {string} age - Age of the victim (for humans)
   * @param {boolean} isPet - Whether this is a pet corpse
   * @param {string} petType - Pet type ('dog' or 'cat') for pets
   * @returns {object} Corpse data object
   */
  spawn(x, y, textureKey, isPolice = false, race = null, gender = null, age = null, isPet = false, petType = null) {
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
      race,
      gender,
      age,
      isPet,
      petType,
      discovered: false,
      isPickedUp: false,
      removedParts: {
        head: 0,
        heart: 0,
        arm: 0,
        leg: 0,
        funnies: 0,
        skin: 0
      },
      missingPartsOverlay: null
    };

    // Register corpse with action system
    this.registerCorpseActions(corpseData);

    this.corpses.push(corpseData);
    return corpseData;
  }

  /**
   * Register corpse with action system for pickup and body part removal actions
   */
  registerCorpseActions(corpseData) {
    if (!this.scene.actionSystem) return;

    this.scene.actionSystem.registerObject(corpseData.sprite, {
      owner: corpseData,
      getActions: () => {
        if (corpseData.isPickedUp) return [];

        const actions = [];
        const isCarrying = this.scene.player?.isCarryingAnything();

        // Only show pickup if player isn't carrying anything
        if (!isCarrying) {
          actions.push({
            name: 'Pickup',
            key: 'SPACE',
            keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
            callback: () => this.scene.player?.pickupCorpse()
          });

          // Show remove body part option if parts are available
          const availableParts = this.getAvailableBodyParts(corpseData);
          if (availableParts.length > 0) {
            actions.push({
              name: 'Remove Part',
              key: 'R',
              keyCode: Phaser.Input.Keyboard.KeyCodes.R,
              callback: () => this.showBodyPartMenu(corpseData)
            });
          }
        }

        return actions;
      }
    });
  }

  /**
   * Check if body part menu is currently open
   */
  isBodyPartMenuOpen() {
    return this.bodyPartMenu !== null;
  }

  /**
   * Show the body part removal menu for a corpse
   */
  showBodyPartMenu(corpseData) {
    const availableParts = this.getAvailableBodyParts(corpseData);
    if (availableParts.length === 0) return;

    // Create body part selection menu
    this.bodyPartMenu = this.createBodyPartMenu(corpseData, availableParts);
  }

  /**
   * Map key string ('1', '2', etc.) to Phaser key code
   */
  getKeyCodeForPart(keyString) {
    const keyMap = {
      '1': Phaser.Input.Keyboard.KeyCodes.ONE,
      '2': Phaser.Input.Keyboard.KeyCodes.TWO,
      '3': Phaser.Input.Keyboard.KeyCodes.THREE,
      '4': Phaser.Input.Keyboard.KeyCodes.FOUR,
      '5': Phaser.Input.Keyboard.KeyCodes.FIVE,
      '6': Phaser.Input.Keyboard.KeyCodes.SIX
    };
    return keyMap[keyString] || null;
  }

  /**
   * Create the body part selection UI for a corpse (matches ActionPopup style)
   */
  createBodyPartMenu(corpseData, availableParts) {
    const padding = 4;
    const lineHeight = 10;

    // Calculate menu size based on content
    const texts = availableParts.map(part => `${part.name} (${part.key})`);
    let maxWidth = 0;

    // Create temporary text to measure widths
    texts.forEach(t => {
      const tempText = this.scene.add.text(0, 0, t, {
        fontSize: '8px',
        fontFamily: 'monospace'
      });
      maxWidth = Math.max(maxWidth, tempText.width);
      tempText.destroy();
    });

    const menuWidth = maxWidth + padding * 2;
    const menuHeight = availableParts.length * lineHeight + padding * 2;

    // Position like ActionPopup (above and to the right of target)
    const offsetX = 10;
    const offsetY = -20;
    const container = this.scene.add.container(
      corpseData.sprite.x + offsetX,
      corpseData.sprite.y + offsetY
    );
    container.setDepth(DEPTH.EFFECTS + 10);

    // Background (matches ActionPopup style)
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(0, 0, menuWidth, menuHeight, 2);
    bg.lineStyle(1, 0x444444, 1);
    bg.strokeRoundedRect(0, 0, menuWidth, menuHeight, 2);
    container.add(bg);

    // Options (matches ActionPopup style)
    availableParts.forEach((part, index) => {
      const y = padding + index * lineHeight;
      const text = this.scene.add.text(padding, y, `${part.name} (${part.key})`, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      });
      text.setOrigin(0, 0);
      container.add(text);
    });

    // Setup key listeners for number keys (using proper Phaser key codes)
    this.bodyPartKeyListeners = {};
    availableParts.forEach(part => {
      const keyCode = this.getKeyCodeForPart(part.key);
      if (keyCode) {
        const key = this.scene.input.keyboard.addKey(keyCode);
        this.bodyPartKeyListeners[part.id] = key;
        key.once('down', () => {
          this.removeBodyPartFromCorpse(corpseData, part.id);
          this.closeBodyPartMenu();
        });
      }
    });

    // Close on ESC
    this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.once('down', () => this.closeBodyPartMenu());

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(container);
    }

    return container;
  }

  /**
   * Close the body part menu
   */
  closeBodyPartMenu() {
    if (this.bodyPartMenu) {
      this.bodyPartMenu.destroy();
      this.bodyPartMenu = null;
    }

    // Clean up key listeners
    if (this.bodyPartKeyListeners) {
      Object.values(this.bodyPartKeyListeners).forEach(key => {
        key.removeAllListeners();
      });
      this.bodyPartKeyListeners = null;
    }

    if (this.escKey) {
      this.escKey.removeAllListeners();
      this.escKey = null;
    }
  }

  /**
   * Remove a body part from a corpse and give to player
   */
  removeBodyPartFromCorpse(corpseData, partId) {
    const bodyPartInfo = this.removeBodyPart(corpseData, partId);
    if (bodyPartInfo) {
      // Player picks up the body part
      this.scene.player.pickupBodyPart(bodyPartInfo);

      // Blood splatter effect
      this.scene.spawnBloodSplatter(corpseData.sprite.x, corpseData.sprite.y);
    }
  }

  /**
   * Register a dropped body part for pickup
   */
  registerDroppedBodyPart(sprite, bodyPartInfo) {
    const droppedPart = {
      sprite,
      bodyPartInfo: { ...bodyPartInfo },
      x: sprite.x,
      y: sprite.y
    };

    this.droppedBodyParts.push(droppedPart);

    // Register with action system for pickup
    if (this.scene.actionSystem) {
      this.scene.actionSystem.registerObject(sprite, {
        owner: droppedPart,
        getActions: () => {
          if (this.scene.player?.isCarryingAnything()) return [];

          return [{
            name: 'Pickup',
            key: 'SPACE',
            keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
            callback: () => this.pickupDroppedBodyPart(droppedPart)
          }];
        }
      });
    }
  }

  /**
   * Pick up a dropped body part
   */
  pickupDroppedBodyPart(droppedPart) {
    // Give to player
    this.scene.player.pickupBodyPart(droppedPart.bodyPartInfo);

    // Remove from tracking
    const index = this.droppedBodyParts.indexOf(droppedPart);
    if (index > -1) {
      this.droppedBodyParts.splice(index, 1);
    }

    // Unregister from action system and destroy sprite
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(droppedPart.sprite);
    }
    droppedPart.sprite.destroy();
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

  // ==================== Body Parts ====================

  /**
   * Get list of available body parts that can still be removed from a corpse
   */
  getAvailableBodyParts(corpseData) {
    const available = [];
    for (const [key, config] of Object.entries(BODY_PARTS)) {
      if (corpseData.removedParts[config.id] < config.max) {
        available.push({
          ...config,
          remaining: config.max - corpseData.removedParts[config.id]
        });
      }
    }
    return available;
  }

  /**
   * Remove a body part from a corpse
   * @returns {object|null} The removed body part info, or null if not available
   */
  removeBodyPart(corpseData, partId) {
    const partConfig = Object.values(BODY_PARTS).find(p => p.id === partId);
    if (!partConfig) return null;

    if (corpseData.removedParts[partId] >= partConfig.max) {
      return null; // Already removed max
    }

    corpseData.removedParts[partId]++;

    // Update visual overlay
    this.updateMissingPartsOverlay(corpseData);

    const bodyPartInfo = {
      partId: partId,
      textureKey: `body_part_${partId}`,
      name: partConfig.name
    };

    // For skin, store victim appearance info for wearing
    if (partId === 'skin') {
      bodyPartInfo.victimRace = corpseData.race;
      bodyPartInfo.victimGender = corpseData.gender;
      bodyPartInfo.isPet = corpseData.isPet || false;
      bodyPartInfo.petType = corpseData.petType || null;
    }

    return bodyPartInfo;
  }

  /**
   * Update the overlay showing missing body parts on a corpse
   */
  updateMissingPartsOverlay(corpseData) {
    if (!corpseData.missingPartsOverlay) {
      corpseData.missingPartsOverlay = this.scene.add.graphics();
      corpseData.missingPartsOverlay.setDepth(DEPTH.CORPSE + 1);
      if (this.scene.hud) {
        this.scene.hud.ignoreGameObject(corpseData.missingPartsOverlay);
      }
    }

    this.drawMissingPartsOverlay(corpseData);
  }

  /**
   * Draw X marks on missing parts of a corpse
   */
  drawMissingPartsOverlay(corpseData) {
    if (!corpseData.missingPartsOverlay || !corpseData.sprite?.active) return;

    corpseData.missingPartsOverlay.clear();
    const x = corpseData.sprite.x;
    const y = corpseData.sprite.y;

    corpseData.missingPartsOverlay.lineStyle(1, 0xcc0000, 1);

    // Head
    if (corpseData.removedParts.head > 0) {
      corpseData.missingPartsOverlay.lineBetween(x + 3, y - 4, x + 7, y);
      corpseData.missingPartsOverlay.lineBetween(x + 3, y, x + 7, y - 4);
    }

    // Heart
    if (corpseData.removedParts.heart > 0) {
      corpseData.missingPartsOverlay.lineBetween(x - 2, y - 2, x + 2, y + 2);
      corpseData.missingPartsOverlay.lineBetween(x - 2, y + 2, x + 2, y - 2);
    }

    // Arms
    if (corpseData.removedParts.arm >= 1) {
      corpseData.missingPartsOverlay.lineBetween(x - 6, y - 2, x - 4, y + 2);
      corpseData.missingPartsOverlay.lineBetween(x - 6, y + 2, x - 4, y - 2);
    }
    if (corpseData.removedParts.arm >= 2) {
      corpseData.missingPartsOverlay.lineBetween(x + 4, y - 2, x + 6, y + 2);
      corpseData.missingPartsOverlay.lineBetween(x + 4, y + 2, x + 6, y - 2);
    }

    // Legs
    if (corpseData.removedParts.leg >= 1) {
      corpseData.missingPartsOverlay.lineBetween(x - 4, y + 4, x - 2, y + 8);
      corpseData.missingPartsOverlay.lineBetween(x - 4, y + 8, x - 2, y + 4);
    }
    if (corpseData.removedParts.leg >= 2) {
      corpseData.missingPartsOverlay.lineBetween(x + 2, y + 4, x + 4, y + 8);
      corpseData.missingPartsOverlay.lineBetween(x + 2, y + 8, x + 4, y + 4);
    }

    // Funnies
    if (corpseData.removedParts.funnies > 0) {
      corpseData.missingPartsOverlay.lineBetween(x - 2, y + 2, x + 2, y + 6);
      corpseData.missingPartsOverlay.lineBetween(x - 2, y + 6, x + 2, y + 2);
    }
  }

  /**
   * Check if corpse has any missing parts
   */
  hasAnyMissingParts(corpseData) {
    return Object.values(corpseData.removedParts).some(count => count > 0);
  }
}
