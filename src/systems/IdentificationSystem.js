import { DEPTH, EFFECTS, IDENTIFICATION } from '../config/constants.js';

/**
 * Manages player identification by NPCs
 */
export class IdentificationSystem {
  constructor(scene) {
    this.scene = scene;
    this.playerIdentified = false;
    this.playerDoingIllegalActivity = false;
  }

  /**
   * Check if player is currently doing something illegal
   */
  isPlayerDoingIllegalActivity() {
    if (this.scene.player?.carriedCorpse) return true;
    return this.playerDoingIllegalActivity;
  }

  /**
   * Mark player as doing illegal activity temporarily
   */
  markIllegalActivity() {
    this.playerDoingIllegalActivity = true;
    this.scene.time.delayedCall(IDENTIFICATION.ILLEGAL_ACTIVITY_DURATION, () => {
      this.playerDoingIllegalActivity = false;
    });
  }

  /**
   * Identify the player (triggered when NPC witnesses illegal activity)
   * @param {Phaser.GameObjects.Sprite} witnessSprite - The sprite of the witnessing NPC
   */
  identifyPlayer(witnessSprite) {
    if (this.playerIdentified) return;

    this.playerIdentified = true;
    this.spawnExclamationMark(witnessSprite.x, witnessSprite.y - 16);
    this.scene.hud?.showNotification('You have been identified!\nThe police are on the lookout!', 3000);
  }

  /**
   * Spawn animated exclamation mark above witness
   */
  spawnExclamationMark(x, y) {
    const exclamation = this.scene.add.image(x, y, 'exclamation');
    exclamation.setDepth(DEPTH.EXCLAMATION);
    exclamation.setScale(1.5);

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(exclamation);
    }

    // Bob animation
    this.scene.tweens.add({
      targets: exclamation,
      y: y - 8,
      duration: 200,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut'
    });

    // Fade out after duration
    this.scene.time.delayedCall(EFFECTS.EXCLAMATION_DURATION, () => {
      this.scene.tweens.add({
        targets: exclamation,
        alpha: 0,
        duration: 300,
        onComplete: () => exclamation.destroy()
      });
    });
  }

  /**
   * Check if player has been identified
   */
  isIdentified() {
    return this.playerIdentified;
  }

  /**
   * Reset identification state (e.g., for new game)
   */
  reset() {
    this.playerIdentified = false;
    this.playerDoingIllegalActivity = false;
  }
}
