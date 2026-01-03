export class HUD {
  constructor(scene) {
    this.scene = scene;

    // Store all UI elements for camera management
    this.uiElements = [];

    // Knife cooldown state
    this.cooldownActive = false;
    this.cooldownStartTime = 0;
    this.cooldownDuration = 1000;

    // Talk cooldown state
    this.talkCooldownActive = false;
    this.talkCooldownStartTime = 0;
    this.talkCooldownDuration = 1000;

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

    // Identification status widget (above knife icon)
    this.idStatusBg = scene.add.graphics();
    this.idStatusBg.setScrollFactor(0);
    this.idStatusBg.setDepth(1000);
    this.uiElements.push(this.idStatusBg);

    this.idStatusText = scene.add.text(0, 0, 'INCOGNITO', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.idStatusText.setOrigin(0.5, 0.5);
    this.idStatusText.setScrollFactor(0);
    this.idStatusText.setDepth(1001);
    this.uiElements.push(this.idStatusText);

    // Eye icon for identification status
    this.idEyeIcon = scene.add.graphics();
    this.idEyeIcon.setScrollFactor(0);
    this.idEyeIcon.setDepth(1001);
    this.uiElements.push(this.idEyeIcon);

    // Knife icon background (bottom right) - 2x size
    this.knifeBackground = scene.add.graphics();
    this.knifeBackground.setScrollFactor(0);
    this.knifeBackground.setDepth(1000);
    this.uiElements.push(this.knifeBackground);

    // Knife cooldown overlay (the "sweeping" cooldown indicator)
    this.knifeCooldown = scene.add.graphics();
    this.knifeCooldown.setScrollFactor(0);
    this.knifeCooldown.setDepth(1001);
    this.uiElements.push(this.knifeCooldown);

    // Knife icon (simple knife shape)
    this.knifeIcon = scene.add.graphics();
    this.knifeIcon.setScrollFactor(0);
    this.knifeIcon.setDepth(1002);
    this.uiElements.push(this.knifeIcon);

    // Talk icon background (left of knife icon)
    this.talkBackground = scene.add.graphics();
    this.talkBackground.setScrollFactor(0);
    this.talkBackground.setDepth(1000);
    this.uiElements.push(this.talkBackground);

    // Talk cooldown overlay
    this.talkCooldown = scene.add.graphics();
    this.talkCooldown.setScrollFactor(0);
    this.talkCooldown.setDepth(1001);
    this.uiElements.push(this.talkCooldown);

    // Talk icon (speech bubble)
    this.talkIcon = scene.add.graphics();
    this.talkIcon.setScrollFactor(0);
    this.talkIcon.setDepth(1002);
    this.uiElements.push(this.talkIcon);

    // Draw initial graphics
    this.drawKnifeIcon();
    this.drawTalkIcon();
    this.drawIdStatus();

    // Update cooldown and ID status every frame
    scene.events.on('update', this.updateFrame, this);

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

    // Knife icon (bottom right) - 2x bigger, so offset by 36 instead of 20
    this.knifeX = width - padding - 36;
    this.knifeY = height - padding - 36;
    this.drawKnifeIcon();

    // Talk icon (left of knife icon)
    this.talkX = this.knifeX - 60;
    this.talkY = this.knifeY;
    this.drawTalkIcon();

    // Identification status (above knife icon)
    this.idStatusX = this.knifeX;
    this.idStatusY = this.knifeY - 60; // Above the knife
    this.drawIdStatus();
  }

  drawKnifeIcon() {
    if (!this.knifeBackground || !this.knifeIcon) return;

    const x = this.knifeX || 0;
    const y = this.knifeY || 0;
    const radius = 36; // 2x size (was 18)

    // Draw background circle
    this.knifeBackground.clear();
    this.knifeBackground.fillStyle(0x333333, 0.8);
    this.knifeBackground.fillCircle(x, y, radius);
    this.knifeBackground.lineStyle(3, 0x666666);
    this.knifeBackground.strokeCircle(x, y, radius);

    // Draw knife icon (2x size)
    this.knifeIcon.clear();
    this.knifeIcon.fillStyle(0xcccccc);

    // Blade (triangular) - 2x size
    this.knifeIcon.beginPath();
    this.knifeIcon.moveTo(x - 4, y - 24);  // tip
    this.knifeIcon.lineTo(x + 6, y - 4);   // right edge
    this.knifeIcon.lineTo(x - 4, y - 4);   // left edge
    this.knifeIcon.closePath();
    this.knifeIcon.fillPath();

    // Handle - 2x size
    this.knifeIcon.fillStyle(0x8B4513);  // brown
    this.knifeIcon.fillRect(x - 6, y - 4, 12, 24);

    // Handle guard - 2x size
    this.knifeIcon.fillStyle(0x666666);
    this.knifeIcon.fillRect(x - 10, y - 6, 20, 6);
  }

  drawTalkIcon() {
    if (!this.talkBackground || !this.talkIcon) return;

    const x = this.talkX || 0;
    const y = this.talkY || 0;
    const radius = 20;

    // Draw background circle
    this.talkBackground.clear();
    this.talkBackground.fillStyle(0x333333, 0.8);
    this.talkBackground.fillCircle(x, y, radius);
    this.talkBackground.lineStyle(2, 0x666666);
    this.talkBackground.strokeCircle(x, y, radius);

    // Draw speech bubble icon
    this.talkIcon.clear();
    this.talkIcon.fillStyle(0x3498db); // Blue

    // Speech bubble body (rounded rectangle-ish)
    this.talkIcon.beginPath();
    this.talkIcon.moveTo(x - 8, y - 6);
    this.talkIcon.lineTo(x + 8, y - 6);
    this.talkIcon.arc(x + 8, y - 2, 4, -Math.PI / 2, Math.PI / 2);
    this.talkIcon.lineTo(x - 8, y + 2);
    this.talkIcon.arc(x - 8, y - 2, 4, Math.PI / 2, -Math.PI / 2);
    this.talkIcon.closePath();
    this.talkIcon.fillPath();

    // Speech bubble tail
    this.talkIcon.beginPath();
    this.talkIcon.moveTo(x - 4, y + 2);
    this.talkIcon.lineTo(x - 6, y + 8);
    this.talkIcon.lineTo(x + 2, y + 2);
    this.talkIcon.closePath();
    this.talkIcon.fillPath();
  }

  triggerCooldown() {
    this.cooldownActive = true;
    this.cooldownStartTime = this.scene.time.now;
  }

  triggerTalkCooldown() {
    this.talkCooldownActive = true;
    this.talkCooldownStartTime = this.scene.time.now;
  }

  canTalk() {
    return !this.talkCooldownActive;
  }

  updateFrame() {
    this.updateCooldown();
    this.updateTalkCooldown();
    this.updateIdStatus();
  }

  updateCooldown() {
    if (!this.cooldownActive || !this.knifeCooldown) return;

    const elapsed = this.scene.time.now - this.cooldownStartTime;
    const progress = Math.min(elapsed / this.cooldownDuration, 1);

    if (progress >= 1) {
      this.cooldownActive = false;
      this.knifeCooldown.clear();
      return;
    }

    const x = this.knifeX || 0;
    const y = this.knifeY || 0;
    const radius = 36; // 2x size (was 18)

    // Draw cooldown overlay as a "pie slice" that shrinks
    this.knifeCooldown.clear();
    this.knifeCooldown.fillStyle(0x000000, 0.6);

    // Calculate the arc from top (start) going clockwise
    const startAngle = -Math.PI / 2; // Start at top
    const endAngle = startAngle + (1 - progress) * Math.PI * 2;

    this.knifeCooldown.beginPath();
    this.knifeCooldown.moveTo(x, y);
    this.knifeCooldown.arc(x, y, radius, startAngle, endAngle, false);
    this.knifeCooldown.closePath();
    this.knifeCooldown.fillPath();
  }

  updateTalkCooldown() {
    if (!this.talkCooldownActive || !this.talkCooldown) return;

    const elapsed = this.scene.time.now - this.talkCooldownStartTime;
    const progress = Math.min(elapsed / this.talkCooldownDuration, 1);

    if (progress >= 1) {
      this.talkCooldownActive = false;
      this.talkCooldown.clear();
      return;
    }

    const x = this.talkX || 0;
    const y = this.talkY || 0;
    const radius = 20;

    // Draw cooldown overlay as a "pie slice" that shrinks
    this.talkCooldown.clear();
    this.talkCooldown.fillStyle(0x000000, 0.6);

    // Calculate the arc from top (start) going clockwise
    const startAngle = -Math.PI / 2; // Start at top
    const endAngle = startAngle + (1 - progress) * Math.PI * 2;

    this.talkCooldown.beginPath();
    this.talkCooldown.moveTo(x, y);
    this.talkCooldown.arc(x, y, radius, startAngle, endAngle, false);
    this.talkCooldown.closePath();
    this.talkCooldown.fillPath();
  }

  drawIdStatus() {
    if (!this.idStatusBg || !this.idEyeIcon) return;

    const x = this.idStatusX || 0;
    const y = this.idStatusY || 0;
    const isIdentified = this.scene.playerIdentified || false;

    // Draw background pill (wider to fit INCOGNITO)
    this.idStatusBg.clear();
    this.idStatusBg.fillStyle(isIdentified ? 0x660000 : 0x003300, 0.85);
    this.idStatusBg.fillRoundedRect(x - 50, y - 12, 100, 24, 8);
    this.idStatusBg.lineStyle(2, isIdentified ? 0xff0000 : 0x00ff00, 0.8);
    this.idStatusBg.strokeRoundedRect(x - 50, y - 12, 100, 24, 8);

    // Update text
    if (this.idStatusText) {
      this.idStatusText.setPosition(x + 8, y);
      this.idStatusText.setText(isIdentified ? 'WANTED' : 'INCOGNITO');
      this.idStatusText.setColor(isIdentified ? '#ff4444' : '#44ff44');
    }

    // Draw eye icon
    this.idEyeIcon.clear();
    const eyeX = x - 24;
    const eyeY = y;

    if (isIdentified) {
      // Open eye (red) - you're being watched!
      this.idEyeIcon.lineStyle(2, 0xff4444);
      // Eye outline
      this.idEyeIcon.beginPath();
      this.idEyeIcon.arc(eyeX, eyeY, 6, 0.3, Math.PI - 0.3);
      this.idEyeIcon.strokePath();
      this.idEyeIcon.beginPath();
      this.idEyeIcon.arc(eyeX, eyeY, 6, Math.PI + 0.3, -0.3);
      this.idEyeIcon.strokePath();
      // Pupil
      this.idEyeIcon.fillStyle(0xff4444);
      this.idEyeIcon.fillCircle(eyeX, eyeY, 3);
    } else {
      // Closed eye (green) - hidden
      this.idEyeIcon.lineStyle(2, 0x44ff44);
      // Closed eye line
      this.idEyeIcon.beginPath();
      this.idEyeIcon.moveTo(eyeX - 6, eyeY);
      this.idEyeIcon.lineTo(eyeX + 6, eyeY);
      this.idEyeIcon.strokePath();
      // Eyelashes
      this.idEyeIcon.beginPath();
      this.idEyeIcon.moveTo(eyeX - 4, eyeY);
      this.idEyeIcon.lineTo(eyeX - 5, eyeY + 3);
      this.idEyeIcon.strokePath();
      this.idEyeIcon.beginPath();
      this.idEyeIcon.moveTo(eyeX, eyeY);
      this.idEyeIcon.lineTo(eyeX, eyeY + 4);
      this.idEyeIcon.strokePath();
      this.idEyeIcon.beginPath();
      this.idEyeIcon.moveTo(eyeX + 4, eyeY);
      this.idEyeIcon.lineTo(eyeX + 5, eyeY + 3);
      this.idEyeIcon.strokePath();
    }
  }

  updateIdStatus() {
    this.drawIdStatus();
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
    this.scene.events.off('update', this.updateFrame, this);
    if (this.uiCamera) {
      this.scene.cameras.remove(this.uiCamera);
    }
  }
}
