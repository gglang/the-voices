import Phaser from 'phaser';

/**
 * Sleep transition overlay
 * Shows a black screen with text during sleep
 */
export class SleepTransition {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;

    // Create overlay elements (initially hidden)
    this.createOverlay();
  }

  createOverlay() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // Black overlay
    this.overlay = this.scene.add.graphics();
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(2000);
    this.overlay.setAlpha(0);

    // Main text (sleeping message)
    this.mainText = this.scene.add.text(width / 2, height / 2 - 20, '', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.mainText.setOrigin(0.5);
    this.mainText.setScrollFactor(0);
    this.mainText.setDepth(2001);
    this.mainText.setAlpha(0);

    // Sub text (date/time info)
    this.subText = this.scene.add.text(width / 2, height / 2 + 20, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.subText.setOrigin(0.5);
    this.subText.setScrollFactor(0);
    this.subText.setDepth(2001);
    this.subText.setAlpha(0);

    // ZZZ animation text
    this.zzzText = this.scene.add.text(width / 2, height / 2 - 60, '', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#6666ff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.zzzText.setOrigin(0.5);
    this.zzzText.setScrollFactor(0);
    this.zzzText.setDepth(2001);
    this.zzzText.setAlpha(0);

    // Register with HUD camera
    if (this.scene.hud) {
      this.scene.cameras.main.ignore([
        this.overlay,
        this.mainText,
        this.subText,
        this.zzzText
      ]);
    }
  }

  /**
   * Show restful sleep transition (from going to bed)
   */
  showRestfulSleep(callback) {
    this.show('Sleeping peacefully...', 'zzZ', callback);
  }

  /**
   * Show fitful sleep transition (from passing out at home)
   */
  showFitfulSleep(callback) {
    this.show('You passed out...', 'z..Z..z', callback, true);
  }

  /**
   * Show the sleep transition
   */
  show(message, zzzPattern, callback, isFitful = false) {
    if (this.isActive) return;
    this.isActive = true;

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // Draw black overlay
    this.overlay.clear();
    this.overlay.fillStyle(0x000000, 1);
    this.overlay.fillRect(0, 0, width, height);

    // Set text
    this.mainText.setText(message);
    this.zzzText.setText(zzzPattern);

    // Get next day info
    const nextDay = this.scene.dayNightSystem.currentDay + 1;
    const nextSeason = this.scene.dayNightSystem.currentSeason;
    const seasonName = this.scene.dayNightSystem.SEASONS[nextSeason];
    const adjustedDay = nextDay > 28 ? 1 : nextDay;
    const adjustedSeason = nextDay > 28
      ? this.scene.dayNightSystem.SEASONS[(nextSeason + 1) % 4]
      : seasonName;

    this.subText.setText(`${adjustedSeason} ${adjustedDay}`);

    // Fade in
    this.scene.tweens.add({
      targets: [this.overlay, this.mainText, this.subText, this.zzzText],
      alpha: 1,
      duration: 500,
      onComplete: () => {
        // Animate ZZZ
        this.animateZzz(zzzPattern, isFitful);

        // Wait then fade out
        this.scene.time.delayedCall(isFitful ? 2000 : 1500, () => {
          this.hide(callback);
        });
      }
    });
  }

  /**
   * Animate the ZZZ text
   */
  animateZzz(pattern, isFitful) {
    const colors = isFitful ? [0x666666, 0x888888, 0x666666] : [0x4444ff, 0x6666ff, 0x8888ff];
    let colorIndex = 0;

    this.zzzTween = this.scene.tweens.add({
      targets: this.zzzText,
      y: this.zzzText.y - 10,
      duration: 400,
      yoyo: true,
      repeat: 3,
      onRepeat: () => {
        colorIndex = (colorIndex + 1) % colors.length;
        this.zzzText.setColor(Phaser.Display.Color.IntegerToColor(colors[colorIndex]).rgba);
      }
    });
  }

  /**
   * Hide the transition and call callback
   */
  hide(callback) {
    if (this.zzzTween) {
      this.zzzTween.stop();
    }

    this.scene.tweens.add({
      targets: [this.overlay, this.mainText, this.subText, this.zzzText],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.isActive = false;
        if (callback) callback();
      }
    });
  }

  destroy() {
    if (this.overlay) this.overlay.destroy();
    if (this.mainText) this.mainText.destroy();
    if (this.subText) this.subText.destroy();
    if (this.zzzText) this.zzzText.destroy();
  }
}
