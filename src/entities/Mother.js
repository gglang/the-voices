import Phaser from 'phaser';
import { DEPTH } from '../config/constants.js';

/**
 * Mother - Dead old woman sitting in a chair in the player's home
 * She doesn't move but the player can interact with her
 */
export class Mother {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    this.createSprite();
    this.registerActions();
  }

  createSprite() {
    this.sprite = this.scene.add.image(this.x, this.y, 'mother_in_chair');
    this.sprite.setDepth(DEPTH.HUMANS);
    this.sprite.parentEntity = this;

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.sprite);
    }
  }

  registerActions() {
    if (!this.scene.actionSystem) return;

    this.scene.actionSystem.registerObject(this.sprite, {
      owner: this,
      getActions: () => this.getAvailableActions()
    });
  }

  getAvailableActions() {
    return [
      {
        name: 'Kiss Mother',
        key: 'K',
        keyCode: Phaser.Input.Keyboard.KeyCodes.K,
        callback: () => this.kissMotherAction()
      }
    ];
  }

  kissMotherAction() {
    // Show a creepy notification
    const messages = [
      '*kisses mother on the forehead*',
      '"goodnight, mother..."',
      '"i love you, mother..."',
      '*gently strokes mother\'s hair*',
      '"the voices say hello, mother..."',
      '"soon we\'ll be together again..."'
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.scene.showNotification(message);

    // Emit event for potential objective tracking
    this.scene.events.emit('motherKissed', { mother: this });
  }

  destroy() {
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(this.sprite);
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
