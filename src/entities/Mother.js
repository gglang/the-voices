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

    // Spawn slobber drops effect
    this.spawnSlobberEffect();

    // Emit event for potential objective tracking
    this.scene.events.emit('motherKissed', { mother: this });
  }

  /**
   * Spawn slobber drops falling from kiss
   */
  spawnSlobberEffect() {
    const kissPosX = this.x;
    const kissPosY = this.y - 12; // Near forehead

    // Create several slobber droplets
    const numDroplets = Phaser.Math.Between(3, 6);
    for (let i = 0; i < numDroplets; i++) {
      const droplet = this.scene.add.ellipse(
        kissPosX + Phaser.Math.Between(-6, 6),
        kissPosY + Phaser.Math.Between(-2, 2),
        Phaser.Math.Between(2, 4),
        Phaser.Math.Between(3, 5),
        0xaaddff,  // Light blue slobber color
        0.8
      );
      droplet.setDepth(DEPTH.EFFECTS);

      // Make sure main camera can see the droplet
      if (this.scene.hud) {
        this.scene.hud.ignoreGameObject(droplet);
      }

      // Animate droplet falling and fading
      this.scene.tweens.add({
        targets: droplet,
        y: droplet.y + Phaser.Math.Between(15, 30),
        x: droplet.x + Phaser.Math.Between(-4, 4),
        scaleY: 1.5,  // Stretch as it falls
        alpha: 0,
        duration: Phaser.Math.Between(400, 800),
        delay: i * 50,
        ease: 'Quad.easeIn',
        onComplete: () => droplet.destroy()
      });
    }
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
