import Phaser from 'phaser';
import { DEPTH, PRISONER, BODY_PARTS } from '../config/constants.js';

/**
 * Cage entity that can hold a single living prisoner (human or pet)
 */
export class Cage {
  constructor(scene, x, y, index) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.index = index;
    this.prisoner = null;

    this.shiverTimer = null;
    this.bodyPartMenu = null;
    this.bodyPartKeyListeners = null;
    this.escKey = null;

    this.createSprite();
    this.registerActions();
  }

  createSprite() {
    this.sprite = this.scene.add.sprite(this.x, this.y, 'cage_empty');
    this.sprite.setDepth(DEPTH.FURNITURE);
    this.sprite.parentEntity = this;

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.sprite);
    }
  }

  registerActions() {
    if (!this.scene.actionSystem) {
      console.warn('Cage: No action system available');
      return;
    }

    this.scene.actionSystem.registerObject(this.sprite, {
      owner: this,
      getActions: () => this.getAvailableActions()
    });
  }

  getAvailableActions() {
    const actions = [];

    if (this.prisoner) {
      // Cage has a prisoner - show prisoner actions
      // Only show Pick Up if player is not carrying anything
      if (!this.scene.player?.isCarryingAnything()) {
        actions.push({
          name: 'Pick Up',
          key: 'SPACE',
          keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
          callback: () => this.pickupPrisoner()
        });
      }
      actions.push({
        name: 'Release',
        key: 'F',
        keyCode: Phaser.Input.Keyboard.KeyCodes.F,
        callback: () => this.releasePrisoner()
      });
      actions.push({
        name: 'Kill',
        key: 'T',
        keyCode: Phaser.Input.Keyboard.KeyCodes.T,
        callback: () => this.killPrisoner()
      });
      actions.push({
        name: 'Whisper',
        key: 'E',
        keyCode: Phaser.Input.Keyboard.KeyCodes.E,
        callback: () => this.whisperToPrisoner()
      });
      // Only show Remove Body Part if player is not carrying anything and parts are available
      if (!this.scene.player?.isCarryingAnything()) {
        const availableParts = this.prisoner.getAvailableBodyParts();
        if (availableParts.length > 0) {
          actions.push({
            name: 'Remove Part',
            key: 'R',
            keyCode: Phaser.Input.Keyboard.KeyCodes.R,
            callback: () => this.showBodyPartMenu()
          });
        }
      }
      // Feed action when player is carrying a body part
      if (this.scene.player?.carriedBodyPart) {
        actions.push({
          name: 'Feed',
          key: 'G',
          keyCode: Phaser.Input.Keyboard.KeyCodes.G,
          callback: () => this.feedPrisoner()
        });
      }
    } else {
      // Empty cage - check if player is carrying a prisoner
      if (this.scene.player?.carriedPrisoner) {
        actions.push({
          name: 'Drop Here',
          key: 'SPACE',
          keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
          callback: () => this.receivePrisoner()
        });
      }
    }

    return actions;
  }

  /**
   * Imprison an entity (called when entity is FOLLOWING and player uses F near cage)
   */
  imprison(entity) {
    if (this.prisoner) return false;

    this.prisoner = entity;
    entity.beImprisoned(this);

    // Position entity in cage
    entity.sprite.setPosition(this.x, this.y - 4);
    entity.sprite.setDepth(DEPTH.FURNITURE + 1);

    // Start periodic shiver effect
    this.startPrisonerShiver();

    // Emit event for objective tracking
    this.scene.events.emit('entityImprisoned', {
      entity: entity,
      cage: this,
      race: entity.race,
      age: entity.age,
      gender: entity.gender,
      wasFollowing: entity.isFollowing || entity.wasFollowing || true
    });

    return true;
  }

  /**
   * Pick up the prisoner (player carries them)
   */
  pickupPrisoner() {
    if (!this.prisoner) return;

    const prisoner = this.prisoner;
    this.prisoner = null;
    this.stopPrisonerShiver();

    this.scene.player.pickupPrisoner(prisoner);
  }

  /**
   * Release the prisoner - they flee home and trigger game over when they arrive
   */
  releasePrisoner() {
    if (!this.prisoner) return;

    const prisoner = this.prisoner;
    this.prisoner = null;
    this.stopPrisonerShiver();

    prisoner.beReleased();
  }

  /**
   * Kill the prisoner - spawn corpse, empty cage
   */
  killPrisoner() {
    if (!this.prisoner) return;

    const prisoner = this.prisoner;
    this.prisoner = null;
    this.stopPrisonerShiver();

    prisoner.kill();
  }

  /**
   * Whisper to prisoner - increase misery
   */
  whisperToPrisoner() {
    if (!this.prisoner) return;

    this.prisoner.increaseMisery();

    // Visual feedback
    this.showWhisperEffect();
  }

  /**
   * Check if body part menu is currently open
   */
  isBodyPartMenuOpen() {
    return this.bodyPartMenu !== null;
  }

  /**
   * Show the body part removal menu
   */
  showBodyPartMenu() {
    if (!this.prisoner) return;

    const availableParts = this.prisoner.getAvailableBodyParts();
    if (availableParts.length === 0) return;

    // Create body part selection menu
    this.bodyPartMenu = this.createBodyPartMenu(availableParts);
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
   * Create the body part selection UI (matches ActionPopup style)
   */
  createBodyPartMenu(availableParts) {
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
      this.x + offsetX,
      this.y + offsetY
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
          this.removeBodyPartFromPrisoner(part.id);
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
   * Remove a body part from the prisoner
   */
  removeBodyPartFromPrisoner(partId) {
    if (!this.prisoner) return;

    const bodyPartInfo = this.prisoner.removeBodyPart(partId);
    if (bodyPartInfo) {
      // Mark as prisoner skin if it's skin
      if (partId === 'skin') {
        bodyPartInfo.isPrisonerSkin = true;
      }

      // Player picks up the body part
      this.scene.player.pickupBodyPart(bodyPartInfo);

      // Blood splatter effect
      this.scene.spawnBloodSplatter(this.prisoner.sprite.x, this.prisoner.sprite.y);

      // Emit event for objective tracking
      this.scene.events.emit('bodyPartRemoved', {
        bodyPart: bodyPartInfo,
        partId: partId,
        fromCorpse: false,
        fromPrisoner: true,
        prisoner: this.prisoner,
        race: this.prisoner.race,
        age: this.prisoner.age
      });
    }
  }

  /**
   * Feed a body part to the prisoner
   */
  feedPrisoner() {
    if (!this.prisoner) return;

    const player = this.scene.player;
    if (!player?.carriedBodyPart) return;

    const bodyPart = player.carriedBodyPart;
    const partId = bodyPart.partId || bodyPart.bodyPartType || bodyPart.partType;
    const isCooked = bodyPart.isCooked || false;

    // Show feeding effect
    this.spawnFeedingEffect();

    // Creepy notification
    const messages = [
      '*forces meat down throat*',
      '"eat... EAT..."',
      '*muffled screaming*',
      '"good... swallow it all..."',
      '*prisoner gags*'
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.scene.showNotification(message);

    // Increase prisoner misery
    if (this.prisoner.increaseMisery) {
      this.prisoner.increaseMisery(15);
    }

    // Emit event for objective tracking
    this.scene.events.emit('bodyPartGifted', {
      bodyPart: bodyPart,
      partId: partId,
      recipient: this.prisoner,
      recipientType: 'prisoner',
      isCooked: isCooked,
      isPrisoner: true
    });

    // Destroy player's carried body part
    if (player.carriedBodyPartSprite) {
      player.carriedBodyPartSprite.destroy();
      player.carriedBodyPartSprite = null;
    }
    player.carriedBodyPart = null;
  }

  /**
   * Spawn feeding effect (drool, struggle)
   */
  spawnFeedingEffect() {
    if (!this.prisoner?.sprite) return;

    const x = this.prisoner.sprite.x;
    const y = this.prisoner.sprite.y;

    // Create drool droplets
    for (let i = 0; i < 4; i++) {
      const droplet = this.scene.add.ellipse(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-4, 4),
        Phaser.Math.Between(2, 4),
        Phaser.Math.Between(3, 5),
        0x88aacc,
        0.8
      );
      droplet.setDepth(DEPTH.EFFECTS);

      if (this.scene.hud) {
        this.scene.hud.ignoreGameObject(droplet);
      }

      this.scene.tweens.add({
        targets: droplet,
        y: droplet.y + Phaser.Math.Between(10, 20),
        alpha: 0,
        duration: Phaser.Math.Between(300, 600),
        delay: i * 80,
        ease: 'Quad.easeIn',
        onComplete: () => droplet.destroy()
      });
    }

    // Make prisoner shake violently
    if (this.prisoner.sprite) {
      const originalX = this.prisoner.sprite.x;
      this.scene.tweens.add({
        targets: this.prisoner.sprite,
        x: originalX + 2,
        duration: 50,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          if (this.prisoner?.sprite) {
            this.prisoner.sprite.x = originalX;
          }
        }
      });
    }
  }

  /**
   * Receive a dropped prisoner from player
   */
  receivePrisoner() {
    if (this.prisoner) return;

    const prisoner = this.scene.player.dropPrisoner();
    if (prisoner) {
      this.imprison(prisoner);
    }
  }

  /**
   * Start periodic shiver animation for prisoner with random interval
   */
  startPrisonerShiver() {
    this.scheduleNextShiver();
  }

  /**
   * Schedule the next shiver with a random delay
   */
  scheduleNextShiver() {
    const delay = Phaser.Math.Between(PRISONER.SHIVER_INTERVAL_MIN, PRISONER.SHIVER_INTERVAL_MAX);
    this.shiverTimer = this.scene.time.addEvent({
      delay: delay,
      callback: () => {
        if (this.prisoner?.sprite?.active) {
          this.prisoner.doShiverEffect();
          // Schedule next shiver with new random delay
          this.scheduleNextShiver();
        }
      },
      loop: false
    });
  }

  stopPrisonerShiver() {
    if (this.shiverTimer) {
      this.shiverTimer.destroy();
      this.shiverTimer = null;
    }
  }

  showWhisperEffect() {
    // Dark whisper text floats up
    const text = this.scene.add.text(
      this.x, this.y - 24,
      '...',
      { fontSize: '12px', color: '#660066', fontStyle: 'italic' }
    );
    text.setOrigin(0.5);
    text.setDepth(DEPTH.EXCLAMATION);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 15,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }

  /**
   * Called when prisoner dies from max misery
   */
  onPrisonerDeath() {
    this.prisoner = null;
    this.stopPrisonerShiver();
  }

  /**
   * Check if cage is empty
   */
  isEmpty() {
    return this.prisoner === null;
  }

  /**
   * Check if cage is occupied
   */
  isOccupied() {
    return this.prisoner !== null;
  }

  destroy() {
    this.stopPrisonerShiver();
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(this.sprite);
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
