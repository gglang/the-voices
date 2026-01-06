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
    this.uiElements.push(this.playAgainText);

    // Store scene reference for later use
    this.sceneRef = scene;

    // Sanity status widget (above identification widget)
    this.sanityBg = scene.add.graphics();
    this.sanityBg.setScrollFactor(0);
    this.sanityBg.setDepth(1000);
    this.uiElements.push(this.sanityBg);

    this.sanityText = scene.add.text(0, 0, 'SANE', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.sanityText.setOrigin(0.5, 0.5);
    this.sanityText.setScrollFactor(0);
    this.sanityText.setDepth(1001);
    this.uiElements.push(this.sanityText);

    // Brain icon for sanity status
    this.sanityIcon = scene.add.graphics();
    this.sanityIcon.setScrollFactor(0);
    this.sanityIcon.setDepth(1001);
    this.uiElements.push(this.sanityIcon);

    // Sanity pulse state
    this.sanityPulseAlpha = 0;
    this.sanityPulseDirection = 1;

    // Notoriety widget (above sanity status)
    this.notorietyBg = scene.add.graphics();
    this.notorietyBg.setScrollFactor(0);
    this.notorietyBg.setDepth(1000);
    this.uiElements.push(this.notorietyBg);

    this.notorietyText = scene.add.text(0, 0, 'LVL 1', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.notorietyText.setOrigin(0.5, 0.5);
    this.notorietyText.setScrollFactor(0);
    this.notorietyText.setDepth(1001);
    this.uiElements.push(this.notorietyText);

    this.notorietyProgressText = scene.add.text(0, 0, '0/10', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#ffcc44',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.notorietyProgressText.setOrigin(0.5, 0.5);
    this.notorietyProgressText.setScrollFactor(0);
    this.notorietyProgressText.setDepth(1001);
    this.uiElements.push(this.notorietyProgressText);

    // Notoriety bar graphics
    this.notorietyBar = scene.add.graphics();
    this.notorietyBar.setScrollFactor(0);
    this.notorietyBar.setDepth(1001);
    this.uiElements.push(this.notorietyBar);

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
    this.drawSanityStatus();

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

    // Clean up when scene shuts down (e.g., on restart)
    scene.events.on('shutdown', this.destroy, this);

    // Debug menu setup
    this.setupDebugMenu();
  }

  setupDebugMenu() {
    this.debugMenuVisible = false;

    // Debug menu background
    this.debugBg = this.scene.add.rectangle(200, 150, 250, 200, 0x000000, 0.9);
    this.debugBg.setScrollFactor(0);
    this.debugBg.setDepth(2000);
    this.debugBg.setVisible(false);
    this.debugBg.setOrigin(0, 0);
    this.uiElements.push(this.debugBg);

    // Debug title
    this.debugTitle = this.scene.add.text(210, 160, 'DEBUG MENU', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ff00ff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.debugTitle.setScrollFactor(0);
    this.debugTitle.setDepth(2001);
    this.debugTitle.setVisible(false);
    this.uiElements.push(this.debugTitle);

    // Sanity controls
    this.debugSanityLabel = this.scene.add.text(210, 190, 'Sanity:', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff'
    });
    this.debugSanityLabel.setScrollFactor(0);
    this.debugSanityLabel.setDepth(2001);
    this.debugSanityLabel.setVisible(false);
    this.uiElements.push(this.debugSanityLabel);

    // Sanity value display
    this.debugSanityValue = this.scene.add.text(270, 190, '3', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#44ff44'
    });
    this.debugSanityValue.setScrollFactor(0);
    this.debugSanityValue.setDepth(2001);
    this.debugSanityValue.setVisible(false);
    this.uiElements.push(this.debugSanityValue);

    // Decrease sanity button
    this.debugSanityDown = this.scene.add.text(210, 215, '[ - ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ff4444'
    });
    this.debugSanityDown.setScrollFactor(0);
    this.debugSanityDown.setDepth(2001);
    this.debugSanityDown.setVisible(false);
    this.debugSanityDown.setInteractive({ useHandCursor: true });
    this.debugSanityDown.on('pointerdown', () => {
      if (this.scene.sanitySystem) {
        this.scene.sanitySystem.decreaseSanity(1);
        this.updateDebugMenu();
      }
    });
    this.debugSanityDown.on('pointerover', () => this.debugSanityDown.setColor('#ff8888'));
    this.debugSanityDown.on('pointerout', () => this.debugSanityDown.setColor('#ff4444'));
    this.uiElements.push(this.debugSanityDown);

    // Increase sanity button
    this.debugSanityUp = this.scene.add.text(260, 215, '[ + ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#44ff44'
    });
    this.debugSanityUp.setScrollFactor(0);
    this.debugSanityUp.setDepth(2001);
    this.debugSanityUp.setVisible(false);
    this.debugSanityUp.setInteractive({ useHandCursor: true });
    this.debugSanityUp.on('pointerdown', () => {
      if (this.scene.sanitySystem) {
        this.scene.sanitySystem.increaseSanity(1);
        this.updateDebugMenu();
      }
    });
    this.debugSanityUp.on('pointerover', () => this.debugSanityUp.setColor('#88ff88'));
    this.debugSanityUp.on('pointerout', () => this.debugSanityUp.setColor('#44ff44'));
    this.uiElements.push(this.debugSanityUp);

    // Trigger "Lose It" button
    this.debugLoseIt = this.scene.add.text(210, 250, '[ Trigger Lose It ]', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ff8800'
    });
    this.debugLoseIt.setScrollFactor(0);
    this.debugLoseIt.setDepth(2001);
    this.debugLoseIt.setVisible(false);
    this.debugLoseIt.setInteractive({ useHandCursor: true });
    this.debugLoseIt.on('pointerdown', () => {
      if (this.scene.sanitySystem) {
        if (this.scene.sanitySystem.isLosingIt) {
          this.scene.sanitySystem.stopLosingIt();
        } else {
          this.scene.sanitySystem.startLosingIt();
        }
        this.updateDebugMenu();
      }
    });
    this.debugLoseIt.on('pointerover', () => this.debugLoseIt.setColor('#ffaa44'));
    this.debugLoseIt.on('pointerout', () => this.debugLoseIt.setColor('#ff8800'));
    this.uiElements.push(this.debugLoseIt);

    // Close hint
    this.debugCloseHint = this.scene.add.text(210, 320, 'Press Shift+D to close', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#888888'
    });
    this.debugCloseHint.setScrollFactor(0);
    this.debugCloseHint.setDepth(2001);
    this.debugCloseHint.setVisible(false);
    this.uiElements.push(this.debugCloseHint);

    // Make main camera ignore these new elements
    this.scene.cameras.main.ignore([
      this.debugBg, this.debugTitle, this.debugSanityLabel,
      this.debugSanityValue, this.debugSanityDown, this.debugSanityUp,
      this.debugLoseIt, this.debugCloseHint
    ]);

    // Setup Shift+D keyboard shortcut
    this.shiftKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.dKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.dKey.on('down', () => {
      if (this.shiftKey.isDown) {
        this.toggleDebugMenu();
      }
    });
  }

  toggleDebugMenu() {
    this.debugMenuVisible = !this.debugMenuVisible;

    const visible = this.debugMenuVisible;
    this.debugBg.setVisible(visible);
    this.debugTitle.setVisible(visible);
    this.debugSanityLabel.setVisible(visible);
    this.debugSanityValue.setVisible(visible);
    this.debugSanityDown.setVisible(visible);
    this.debugSanityUp.setVisible(visible);
    this.debugLoseIt.setVisible(visible);
    this.debugCloseHint.setVisible(visible);

    if (visible) {
      this.updateDebugMenu();
    }
  }

  updateDebugMenu() {
    if (!this.debugMenuVisible) return;

    const sanity = this.scene.sanitySystem?.sanity ?? 3;
    const colorHex = this.scene.sanitySystem?.getSanityColorHex() || '#44ff44';
    this.debugSanityValue.setText(sanity.toString());
    this.debugSanityValue.setColor(colorHex);

    const isLosingIt = this.scene.sanitySystem?.isLosingIt || false;
    this.debugLoseIt.setText(isLosingIt ? '[ Stop Losing It ]' : '[ Trigger Lose It ]');
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

    // Notification (center top)
    this.notificationText.setPosition(width / 2, padding);

    // Game over elements (center)
    this.gameOverBg.setPosition(width / 2, height / 2);
    this.gameOverText.setPosition(width / 2, height / 2 - 20);
    this.playAgainText.setPosition(width / 2, height / 2 + 30);

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

    // Sanity status (above identification status)
    this.sanityX = this.knifeX;
    this.sanityY = this.idStatusY - 32; // Above the identification
    this.drawSanityStatus();

    // Notoriety status (above sanity status)
    this.notorietyX = this.knifeX;
    this.notorietyY = this.sanityY - 36; // Above the sanity
    this.drawNotorietyStatus();
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
    this.updateSanityDisplay();
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

  drawSanityStatus() {
    if (!this.sanityBg || !this.sanityIcon) return;

    const x = this.sanityX || 0;
    const y = this.sanityY || 0;

    // Get sanity info from system
    const sanitySystem = this.scene.sanitySystem;
    const sanity = sanitySystem?.sanity ?? 3;
    const label = sanitySystem?.getSanityLabel() || 'SANE';
    const color = sanitySystem?.getSanityColor() || 0x44ff44;
    const colorHex = sanitySystem?.getSanityColorHex() || '#44ff44';

    // Calculate pulse alpha for sanity 1 or 0
    let bgAlpha = 0.85;
    let borderAlpha = 0.8;
    if (sanity <= 1) {
      this.sanityPulseAlpha += this.sanityPulseDirection * 0.02;
      if (this.sanityPulseAlpha >= 1) {
        this.sanityPulseAlpha = 1;
        this.sanityPulseDirection = -1;
      } else if (this.sanityPulseAlpha <= 0.3) {
        this.sanityPulseAlpha = 0.3;
        this.sanityPulseDirection = 1;
      }
      bgAlpha = 0.5 + 0.35 * this.sanityPulseAlpha;
      borderAlpha = 0.5 + 0.5 * this.sanityPulseAlpha;
    }

    // Widget dimensions - wider to fit "ON THE BRINK"
    const widgetWidth = 130;
    const widgetHeight = 24;
    const rightEdge = x + 50; // Same right edge as identification widget
    const leftEdge = rightEdge - widgetWidth;

    // Draw background pill
    this.sanityBg.clear();
    const bgColor = sanity <= 1 ? 0x660000 : (sanity === 2 ? 0x333300 : 0x003300);
    this.sanityBg.fillStyle(bgColor, bgAlpha);
    this.sanityBg.fillRoundedRect(leftEdge, y - widgetHeight / 2, widgetWidth, widgetHeight, 8);
    this.sanityBg.lineStyle(2, color, borderAlpha);
    this.sanityBg.strokeRoundedRect(leftEdge, y - widgetHeight / 2, widgetWidth, widgetHeight, 8);

    // Draw sanity pips (3 circles) on the right side
    this.sanityIcon.clear();
    for (let i = 0; i < 3; i++) {
      const pipX = rightEdge - 10 - (2 - i) * 10;
      const pipY = y;
      const filled = i < sanity;

      if (filled) {
        this.sanityIcon.fillStyle(color);
        this.sanityIcon.fillCircle(pipX, pipY, 4);
      } else {
        this.sanityIcon.lineStyle(1, color, 0.5);
        this.sanityIcon.strokeCircle(pipX, pipY, 4);
      }
    }

    // Draw brain icon on the left
    const brainX = leftEdge + 14;
    const brainY = y;

    this.sanityIcon.lineStyle(2, color);

    // Simple brain shape
    // Left hemisphere
    this.sanityIcon.beginPath();
    this.sanityIcon.arc(brainX - 3, brainY, 5, Math.PI * 0.5, Math.PI * 1.5);
    this.sanityIcon.strokePath();

    // Right hemisphere
    this.sanityIcon.beginPath();
    this.sanityIcon.arc(brainX + 3, brainY, 5, -Math.PI * 0.5, Math.PI * 0.5);
    this.sanityIcon.strokePath();

    // Middle line
    this.sanityIcon.beginPath();
    this.sanityIcon.moveTo(brainX, brainY - 5);
    this.sanityIcon.lineTo(brainX, brainY + 5);
    this.sanityIcon.strokePath();

    // Update text - positioned between brain and pips
    if (this.sanityText) {
      this.sanityText.setPosition(leftEdge + 60, y);
      this.sanityText.setText(label);
      this.sanityText.setColor(colorHex);
      this.sanityText.setFontSize('10px');
    }
  }

  updateSanityDisplay() {
    this.drawSanityStatus();
  }

  drawNotorietyStatus() {
    if (!this.notorietyBg || !this.notorietyBar) return;

    const x = this.notorietyX || 0;
    const y = this.notorietyY || 0;

    // Get notoriety info from system
    const notorietySystem = this.scene.notorietySystem;
    const level = notorietySystem?.getLevel() || 1;
    const progressPercent = notorietySystem?.getProgressPercent() || 0;
    const progressString = notorietySystem?.getProgressString() || '0/10';
    const isMaxLevel = notorietySystem?.isMaxLevel() || false;

    // Widget dimensions
    const widgetWidth = 120;
    const widgetHeight = 32;
    const leftEdge = x - widgetWidth / 2;
    const barWidth = 60;
    const barHeight = 8;
    const barX = leftEdge + 50;
    const barY = y + 5;

    // Colors based on level
    const baseColor = 0xffaa00;  // Orange/gold
    const barBgColor = 0x442200;
    const barFillColor = isMaxLevel ? 0xff4400 : 0xffaa00;

    // Draw background
    this.notorietyBg.clear();
    this.notorietyBg.fillStyle(0x332200, 0.85);
    this.notorietyBg.fillRoundedRect(leftEdge, y - widgetHeight / 2, widgetWidth, widgetHeight, 8);
    this.notorietyBg.lineStyle(2, baseColor, 0.8);
    this.notorietyBg.strokeRoundedRect(leftEdge, y - widgetHeight / 2, widgetWidth, widgetHeight, 8);

    // Draw skull icon
    this.notorietyBg.fillStyle(baseColor);
    const skullX = leftEdge + 18;
    const skullY = y - 2;

    // Skull head (circle)
    this.notorietyBg.fillCircle(skullX, skullY, 7);

    // Skull jaw
    this.notorietyBg.fillRoundedRect(skullX - 5, skullY + 3, 10, 5, 2);

    // Eye sockets (dark)
    this.notorietyBg.fillStyle(0x332200);
    this.notorietyBg.fillCircle(skullX - 3, skullY - 1, 2);
    this.notorietyBg.fillCircle(skullX + 3, skullY - 1, 2);

    // Nose (triangle/dark)
    this.notorietyBg.beginPath();
    this.notorietyBg.moveTo(skullX, skullY + 1);
    this.notorietyBg.lineTo(skullX - 1.5, skullY + 4);
    this.notorietyBg.lineTo(skullX + 1.5, skullY + 4);
    this.notorietyBg.closePath();
    this.notorietyBg.fillPath();

    // Draw XP progress bar
    this.notorietyBar.clear();

    // Bar background
    this.notorietyBar.fillStyle(barBgColor, 1);
    this.notorietyBar.fillRoundedRect(barX, barY, barWidth, barHeight, 3);

    // Bar fill
    if (progressPercent > 0) {
      const fillWidth = Math.max(2, barWidth * progressPercent);
      this.notorietyBar.fillStyle(barFillColor, 1);
      this.notorietyBar.fillRoundedRect(barX, barY, fillWidth, barHeight, 3);
    }

    // Bar border
    this.notorietyBar.lineStyle(1, baseColor, 0.6);
    this.notorietyBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 3);

    // Update level text
    if (this.notorietyText) {
      const levelText = isMaxLevel ? 'MAX' : `LVL ${level}`;
      this.notorietyText.setPosition(leftEdge + 55, y - 6);
      this.notorietyText.setText(levelText);
      this.notorietyText.setColor(isMaxLevel ? '#ff4400' : '#ffaa00');
    }

    // Update progress text
    if (this.notorietyProgressText) {
      this.notorietyProgressText.setPosition(barX + barWidth / 2, barY + barHeight / 2);
      this.notorietyProgressText.setText(progressString);
      this.notorietyProgressText.setColor('#ffcc44');
    }
  }

  updateNotorietyDisplay() {
    this.drawNotorietyStatus();
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

  showGameOver(customMessage = null) {
    if (customMessage) {
      this.gameOverText.setText(customMessage);
      this.gameOverText.setFontSize('18px');
      // Resize background for longer message
      this.gameOverBg.setSize(350, 180);
    } else {
      this.gameOverText.setText('GAME OVER');
      this.gameOverText.setFontSize('36px');
      this.gameOverBg.setSize(300, 140);
    }
    this.gameOverBg.setVisible(true);
    this.gameOverText.setVisible(true);
    this.playAgainText.setVisible(true);

    // Remove existing listeners if any
    this.playAgainText.removeAllListeners();
    this.playAgainText.removeInteractive();

    // Make the play again button interactive
    // Use a larger hit area to compensate for camera zoom issues
    const bounds = this.playAgainText.getBounds();
    this.playAgainText.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -bounds.width / 2 - 10,
        -bounds.height / 2 - 5,
        bounds.width + 20,
        bounds.height + 10
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true
    });

    // Add event listeners
    this.playAgainText.on('pointerover', () => {
      this.playAgainText.setColor('#ffffff');
    });
    this.playAgainText.on('pointerout', () => {
      this.playAgainText.setColor('#00ff00');
    });
    this.playAgainText.on('pointerdown', () => {
      this.sceneRef.scene.restart();
    });

    this.updatePositions();
  }

  destroy() {
    this.scene.scale.off('resize', this.updatePositions, this);
    this.scene.events.off('update', this.updateFrame, this);
    this.scene.events.off('shutdown', this.destroy, this);
    if (this.uiCamera) {
      this.scene.cameras.remove(this.uiCamera);
    }
  }
}
