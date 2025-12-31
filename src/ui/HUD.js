export class HUD {
  constructor(scene) {
    this.scene = scene;

    // Store all UI elements for camera management
    this.uiElements = [];

    // Score display (top right)
    this.scoreText = scene.add.text(0, 0, 'Score: 0', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.scoreText.setOrigin(1, 0);
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(1000);
    this.uiElements.push(this.scoreText);

    // Target preference label
    this.targetLabel = scene.add.text(0, 0, 'Target:', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.targetLabel.setOrigin(1, 0);
    this.targetLabel.setScrollFactor(0);
    this.targetLabel.setDepth(1000);
    this.uiElements.push(this.targetLabel);

    // Hair color block
    this.hairBlock = scene.add.rectangle(0, 0, 24, 24, 0xffffff);
    this.hairBlock.setOrigin(0, 0);
    this.hairBlock.setStrokeStyle(2, 0x000000);
    this.hairBlock.setScrollFactor(0);
    this.hairBlock.setDepth(1000);
    this.uiElements.push(this.hairBlock);

    // Hair label
    this.hairLabel = scene.add.text(0, 0, 'hair', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.hairLabel.setOrigin(0.5, 0);
    this.hairLabel.setScrollFactor(0);
    this.hairLabel.setDepth(1000);
    this.uiElements.push(this.hairLabel);

    // Skin color block
    this.skinBlock = scene.add.rectangle(0, 0, 24, 24, 0xffffff);
    this.skinBlock.setOrigin(0, 0);
    this.skinBlock.setStrokeStyle(2, 0x000000);
    this.skinBlock.setScrollFactor(0);
    this.skinBlock.setDepth(1000);
    this.uiElements.push(this.skinBlock);

    // Skin label
    this.skinLabel = scene.add.text(0, 0, 'skin', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.skinLabel.setOrigin(0.5, 0);
    this.skinLabel.setScrollFactor(0);
    this.skinLabel.setDepth(1000);
    this.uiElements.push(this.skinLabel);

    // Notification text (center top)
    this.notificationText = scene.add.text(0, 0, '', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    });
    this.notificationText.setOrigin(0.5, 0);
    this.notificationText.setScrollFactor(0);
    this.notificationText.setDepth(1000);
    this.notificationText.setAlpha(0);
    this.uiElements.push(this.notificationText);

    // Game over background
    this.gameOverBg = scene.add.rectangle(0, 0, 300, 180, 0x000000, 0.85);
    this.gameOverBg.setScrollFactor(0);
    this.gameOverBg.setDepth(1001);
    this.gameOverBg.setVisible(false);
    this.uiElements.push(this.gameOverBg);

    // Game over text
    this.gameOverText = scene.add.text(0, 0, 'GAME OVER', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.gameOverText.setOrigin(0.5, 0.5);
    this.gameOverText.setScrollFactor(0);
    this.gameOverText.setDepth(1002);
    this.gameOverText.setVisible(false);
    this.uiElements.push(this.gameOverText);

    // Final score text
    this.finalScoreText = scene.add.text(0, 0, 'Final Score: 0', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.finalScoreText.setOrigin(0.5, 0.5);
    this.finalScoreText.setScrollFactor(0);
    this.finalScoreText.setDepth(1002);
    this.finalScoreText.setVisible(false);
    this.uiElements.push(this.finalScoreText);

    // Play again button
    this.playAgainText = scene.add.text(0, 0, '[ Play Again ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.playAgainText.setOrigin(0.5, 0.5);
    this.playAgainText.setScrollFactor(0);
    this.playAgainText.setDepth(1002);
    this.playAgainText.setVisible(false);
    this.playAgainText.setInteractive({ useHandCursor: true });
    this.playAgainText.on('pointerover', () => {
      this.playAgainText.setColor('#ffffff');
    });
    this.playAgainText.on('pointerout', () => {
      this.playAgainText.setColor('#00ff00');
    });
    this.playAgainText.on('pointerdown', () => {
      scene.scene.restart();
    });
    this.uiElements.push(this.playAgainText);

    // Create a dedicated UI camera that only renders UI elements
    this.uiCamera = scene.cameras.add(0, 0, scene.scale.width, scene.scale.height);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setName('uiCamera');

    // Make main camera ignore UI elements
    scene.cameras.main.ignore(this.uiElements);

    // Make UI camera ignore all existing non-UI objects
    const nonUiObjects = scene.children.list.filter(
      child => !this.uiElements.includes(child)
    );
    this.uiCamera.ignore(nonUiObjects);

    // Initial position update
    this.updatePositions();

    // Listen for resize
    scene.scale.on('resize', this.updatePositions, this);
  }

  // Call this method when adding new game objects to make UI camera ignore them
  ignoreGameObject(gameObject) {
    if (this.uiCamera && gameObject) {
      this.uiCamera.ignore(gameObject);
    }
  }

  updatePositions() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const padding = 16;

    // Update UI camera size on resize
    if (this.uiCamera) {
      this.uiCamera.setSize(width, height);
    }

    // Score (top right)
    this.scoreText.setPosition(width - padding, padding);

    // Target info below score
    this.targetLabel.setPosition(width - padding, padding + 32);

    // Hair block and label
    this.hairBlock.setPosition(width - padding - 60, padding + 55);
    this.hairLabel.setPosition(width - padding - 48, padding + 80);

    // Skin block and label
    this.skinBlock.setPosition(width - padding - 28, padding + 55);
    this.skinLabel.setPosition(width - padding - 16, padding + 80);

    // Notification (center top)
    this.notificationText.setPosition(width / 2, padding);

    // Game over elements (center)
    this.gameOverBg.setPosition(width / 2, height / 2);
    this.gameOverText.setPosition(width / 2, height / 2 - 50);
    this.finalScoreText.setPosition(width / 2, height / 2);
    this.playAgainText.setPosition(width / 2, height / 2 + 50);
  }

  setScore(score) {
    this.scoreText.setText(`Score: ${score}`);
  }

  setTargetPreference(hairColor, skinColor) {
    this.hairBlock.setFillStyle(hairColor);
    this.skinBlock.setFillStyle(skinColor);
  }

  showNotification(message, duration = 3000) {
    this.notificationText.setText(message);
    this.notificationText.setAlpha(1);

    // Clear existing tween
    if (this.notificationTween) {
      this.notificationTween.stop();
    }

    this.notificationTween = this.scene.tweens.add({
      targets: this.notificationText,
      alpha: 0,
      delay: duration,
      duration: 500
    });
  }

  showGameOver(finalScore) {
    this.finalScoreText.setText(`Final Score: ${finalScore}`);
    this.gameOverBg.setVisible(true);
    this.gameOverText.setVisible(true);
    this.finalScoreText.setVisible(true);
    this.playAgainText.setVisible(true);
    this.updatePositions();
  }

  destroy() {
    this.scene.scale.off('resize', this.updatePositions, this);
    if (this.uiCamera) {
      this.scene.cameras.remove(this.uiCamera);
    }
  }
}
