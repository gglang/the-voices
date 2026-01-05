import Phaser from 'phaser';
import { DEPTH, PRISONER } from '../config/constants.js';

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
      actions.push({
        name: 'Pick Up',
        key: 'SPACE',
        keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
        callback: () => this.pickupPrisoner()
      });
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
        key: 'R',
        keyCode: Phaser.Input.Keyboard.KeyCodes.R,
        callback: () => this.whisperToPrisoner()
      });
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
   * Start periodic shiver animation for prisoner
   */
  startPrisonerShiver() {
    this.shiverTimer = this.scene.time.addEvent({
      delay: PRISONER.SHIVER_INTERVAL,
      callback: () => {
        if (this.prisoner?.sprite?.active) {
          this.prisoner.doShiverEffect();
        }
      },
      loop: true
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
