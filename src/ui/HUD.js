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

    // Win screen background
    this.winBg = scene.add.rectangle(0, 0, 400, 380, 0x000000, 0.9);
    this.winBg.setScrollFactor(0);
    this.winBg.setDepth(1001);
    this.winBg.setVisible(false);
    this.uiElements.push(this.winBg);

    // Win title text
    this.winTitle = scene.add.text(0, 0, 'YOU WIN!', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.winTitle.setOrigin(0.5, 0.5);
    this.winTitle.setScrollFactor(0);
    this.winTitle.setDepth(1002);
    this.winTitle.setVisible(false);
    this.uiElements.push(this.winTitle);

    // Win subtitle text
    this.winSubtitle = scene.add.text(0, 0, 'Your legacy is cemented in infamy.', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.winSubtitle.setOrigin(0.5, 0.5);
    this.winSubtitle.setScrollFactor(0);
    this.winSubtitle.setDepth(1002);
    this.winSubtitle.setVisible(false);
    this.uiElements.push(this.winSubtitle);

    // Win gif will be created on demand (needs special loading)
    this.winGif = null;

    // Win play again button
    this.winPlayAgain = scene.add.text(0, 0, '[ Play Again ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.winPlayAgain.setOrigin(0.5, 0.5);
    this.winPlayAgain.setScrollFactor(0);
    this.winPlayAgain.setDepth(1002);
    this.winPlayAgain.setVisible(false);
    this.uiElements.push(this.winPlayAgain);

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

    // Listen for notoriety changes to update display
    scene.events.on('notorietyChanged', this.updateNotorietyDisplay, this);

    // Debug menu setup
    this.setupDebugMenu();
  }

  setupDebugMenu() {
    this.debugMenuVisible = false;

    // Track selected objective template for debug picker
    this.debugObjectiveIndex = 0;

    // Debug menu background
    this.debugBg = this.scene.add.rectangle(200, 150, 350, 350, 0x000000, 0.9);
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

    // Notoriety controls
    this.debugNotorietyLabel = this.scene.add.text(210, 250, 'Notoriety Lvl:', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff'
    });
    this.debugNotorietyLabel.setScrollFactor(0);
    this.debugNotorietyLabel.setDepth(2001);
    this.debugNotorietyLabel.setVisible(false);
    this.uiElements.push(this.debugNotorietyLabel);

    // Notoriety value display
    this.debugNotorietyValue = this.scene.add.text(320, 250, '1', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffcc44'
    });
    this.debugNotorietyValue.setScrollFactor(0);
    this.debugNotorietyValue.setDepth(2001);
    this.debugNotorietyValue.setVisible(false);
    this.uiElements.push(this.debugNotorietyValue);

    // Decrease notoriety button
    this.debugNotorietyDown = this.scene.add.text(210, 275, '[ - ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ff4444'
    });
    this.debugNotorietyDown.setScrollFactor(0);
    this.debugNotorietyDown.setDepth(2001);
    this.debugNotorietyDown.setVisible(false);
    this.debugNotorietyDown.setInteractive({ useHandCursor: true });
    this.debugNotorietyDown.on('pointerdown', () => {
      if (this.scene.notorietySystem) {
        const ns = this.scene.notorietySystem;
        if (ns.level > 1) {
          ns.level--;
          ns.currentXP = 0;
          this.scene.events.emit('notorietyChanged', {
            level: ns.level,
            currentXP: ns.currentXP,
            totalXP: ns.totalXP
          });
          this.updateDebugMenu();
          this.updateNotorietyDisplay();
        }
      }
    });
    this.debugNotorietyDown.on('pointerover', () => this.debugNotorietyDown.setColor('#ff8888'));
    this.debugNotorietyDown.on('pointerout', () => this.debugNotorietyDown.setColor('#ff4444'));
    this.uiElements.push(this.debugNotorietyDown);

    // Increase notoriety button
    this.debugNotorietyUp = this.scene.add.text(260, 275, '[ + ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#44ff44'
    });
    this.debugNotorietyUp.setScrollFactor(0);
    this.debugNotorietyUp.setDepth(2001);
    this.debugNotorietyUp.setVisible(false);
    this.debugNotorietyUp.setInteractive({ useHandCursor: true });
    this.debugNotorietyUp.on('pointerdown', () => {
      if (this.scene.notorietySystem) {
        const ns = this.scene.notorietySystem;
        if (ns.level < ns.maxLevel) {
          ns.level++;
          ns.currentXP = 0;
          this.scene.events.emit('notorietyChanged', {
            level: ns.level,
            currentXP: ns.currentXP,
            totalXP: ns.totalXP
          });
          // Check for level 10 to trigger the special objective
          if (ns.level === ns.maxLevel) {
            this.scene.events.emit('notorietyLevelUp', { level: ns.level });
          }
          this.updateDebugMenu();
          this.updateNotorietyDisplay();
        }
      }
    });
    this.debugNotorietyUp.on('pointerover', () => this.debugNotorietyUp.setColor('#88ff88'));
    this.debugNotorietyUp.on('pointerout', () => this.debugNotorietyUp.setColor('#44ff44'));
    this.uiElements.push(this.debugNotorietyUp);

    // Trigger "Lose It" button
    this.debugLoseIt = this.scene.add.text(210, 310, '[ Trigger Lose It ]', {
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

    // Objective picker section
    this.debugObjectiveLabel = this.scene.add.text(210, 345, 'Daily Objective:', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#ffffff'
    });
    this.debugObjectiveLabel.setScrollFactor(0);
    this.debugObjectiveLabel.setDepth(2001);
    this.debugObjectiveLabel.setVisible(false);
    this.uiElements.push(this.debugObjectiveLabel);

    // Previous objective button
    this.debugObjectivePrev = this.scene.add.text(210, 370, '[ < ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#8888ff'
    });
    this.debugObjectivePrev.setScrollFactor(0);
    this.debugObjectivePrev.setDepth(2001);
    this.debugObjectivePrev.setVisible(false);
    this.debugObjectivePrev.setInteractive({ useHandCursor: true });
    this.debugObjectivePrev.on('pointerdown', () => {
      this.cycleDebugObjective(-1);
    });
    this.debugObjectivePrev.on('pointerover', () => this.debugObjectivePrev.setColor('#aaaaff'));
    this.debugObjectivePrev.on('pointerout', () => this.debugObjectivePrev.setColor('#8888ff'));
    this.uiElements.push(this.debugObjectivePrev);

    // Objective name display
    this.debugObjectiveName = this.scene.add.text(260, 370, 'Loading...', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#aa66ff',
      wordWrap: { width: 220 }
    });
    this.debugObjectiveName.setScrollFactor(0);
    this.debugObjectiveName.setDepth(2001);
    this.debugObjectiveName.setVisible(false);
    this.uiElements.push(this.debugObjectiveName);

    // Next objective button
    this.debugObjectiveNext = this.scene.add.text(500, 370, '[ > ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#8888ff'
    });
    this.debugObjectiveNext.setScrollFactor(0);
    this.debugObjectiveNext.setDepth(2001);
    this.debugObjectiveNext.setVisible(false);
    this.debugObjectiveNext.setInteractive({ useHandCursor: true });
    this.debugObjectiveNext.on('pointerdown', () => {
      this.cycleDebugObjective(1);
    });
    this.debugObjectiveNext.on('pointerover', () => this.debugObjectiveNext.setColor('#aaaaff'));
    this.debugObjectiveNext.on('pointerout', () => this.debugObjectiveNext.setColor('#8888ff'));
    this.uiElements.push(this.debugObjectiveNext);

    // Apply objective button
    this.debugObjectiveApply = this.scene.add.text(210, 405, '[ Set This Objective ]', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#44ff88'
    });
    this.debugObjectiveApply.setScrollFactor(0);
    this.debugObjectiveApply.setDepth(2001);
    this.debugObjectiveApply.setVisible(false);
    this.debugObjectiveApply.setInteractive({ useHandCursor: true });
    this.debugObjectiveApply.on('pointerdown', () => {
      this.applyDebugObjective();
    });
    this.debugObjectiveApply.on('pointerover', () => this.debugObjectiveApply.setColor('#88ffaa'));
    this.debugObjectiveApply.on('pointerout', () => this.debugObjectiveApply.setColor('#44ff88'));
    this.uiElements.push(this.debugObjectiveApply);

    // Close hint
    this.debugCloseHint = this.scene.add.text(210, 465, 'Press Shift+D to close', {
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
      this.debugNotorietyLabel, this.debugNotorietyValue,
      this.debugNotorietyDown, this.debugNotorietyUp,
      this.debugLoseIt, this.debugCloseHint,
      this.debugObjectiveLabel, this.debugObjectivePrev, this.debugObjectiveName,
      this.debugObjectiveNext, this.debugObjectiveApply
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
    this.debugNotorietyLabel.setVisible(visible);
    this.debugNotorietyValue.setVisible(visible);
    this.debugNotorietyDown.setVisible(visible);
    this.debugNotorietyUp.setVisible(visible);
    this.debugLoseIt.setVisible(visible);
    this.debugCloseHint.setVisible(visible);
    this.debugObjectiveLabel.setVisible(visible);
    this.debugObjectivePrev.setVisible(visible);
    this.debugObjectiveName.setVisible(visible);
    this.debugObjectiveNext.setVisible(visible);
    this.debugObjectiveApply.setVisible(visible);

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

    // Update notoriety display
    const notorietyLevel = this.scene.notorietySystem?.level ?? 1;
    const maxLevel = this.scene.notorietySystem?.maxLevel ?? 10;
    this.debugNotorietyValue.setText(`${notorietyLevel}/${maxLevel}`);

    const isLosingIt = this.scene.sanitySystem?.isLosingIt || false;
    this.debugLoseIt.setText(isLosingIt ? '[ Stop Losing It ]' : '[ Trigger Lose It ]');

    // Update objective picker display
    this.updateDebugObjectiveDisplay();
  }

  /**
   * Get list of objective templates from the daily objective bank
   */
  getObjectiveTemplates() {
    const objectiveSystem = this.scene.objectiveSystem;
    if (!objectiveSystem?.dailyObjectiveBank) return [];
    return objectiveSystem.dailyObjectiveBank.templates || [];
  }

  /**
   * Cycle through available objective templates
   */
  cycleDebugObjective(direction) {
    const templates = this.getObjectiveTemplates();
    if (templates.length === 0) return;

    this.debugObjectiveIndex += direction;
    if (this.debugObjectiveIndex < 0) {
      this.debugObjectiveIndex = templates.length - 1;
    } else if (this.debugObjectiveIndex >= templates.length) {
      this.debugObjectiveIndex = 0;
    }

    this.updateDebugObjectiveDisplay();
  }

  /**
   * Update the objective name display
   */
  updateDebugObjectiveDisplay() {
    const templates = this.getObjectiveTemplates();
    if (templates.length === 0) {
      this.debugObjectiveName.setText('No templates');
      return;
    }

    const template = templates[this.debugObjectiveIndex];
    // Generate preview of the objective to show the title
    const preview = template.generate();
    const indexDisplay = `(${this.debugObjectiveIndex + 1}/${templates.length})`;
    this.debugObjectiveName.setText(`${indexDisplay} ${preview.title}`);
  }

  /**
   * Apply the selected objective template as the current daily objective
   */
  applyDebugObjective() {
    const objectiveSystem = this.scene.objectiveSystem;
    if (!objectiveSystem?.dailyObjectiveBank) {
      this.showNotification('No objective system available', 2000);
      return;
    }

    const templates = this.getObjectiveTemplates();
    if (templates.length === 0) return;

    const template = templates[this.debugObjectiveIndex];

    // Clear current objectives and location highlights
    objectiveSystem.clearLocationHighlights();
    objectiveSystem.objectives = objectiveSystem.objectives.filter(obj => !obj.isDaily);

    // Generate the objective using the template
    const generated = template.generate();
    const objective = {
      id: objectiveSystem.nextId++,
      templateId: generated.templateId || template.id,
      title: generated.title,
      description: generated.description,
      rewards: generated.rewardText,
      penalty: generated.penaltyText,
      xp: generated.xp || 0,
      isDaily: true,
      isComplete: false,
      isFailed: false,
      action: generated.action || null,
      targetType: generated.targetType || null,
      bodyPart: generated.bodyPart || null,
      objectType: generated.objectType || null,
      location: generated.location || null,
      highlightLocation: generated.highlightLocation || null,
      highlightRitualSite: generated.highlightRitualSite || false,
      killCount: generated.killCount || null,
      requiresPrisoner: generated.requiresPrisoner || false,
      steps: generated.steps ? generated.steps.map(s => ({ ...s })) : null
    };

    objectiveSystem.objectives.push(objective);
    objectiveSystem.currentDailyObjective = objective;

    // Set up location highlighting
    objectiveSystem.updateLocationHighlights();

    // Set up objective-specific actions (Fripple, Pizzle, etc.)
    objectiveSystem.setupObjectiveActions();

    // Update widget
    objectiveSystem.updateWidget();

    this.showNotification(`Debug: Set objective to "${objective.title}"`, 3000);
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

    // Win screen elements (center)
    this.winBg.setPosition(width / 2, height / 2);
    this.winTitle.setPosition(width / 2, height / 2 - 140);
    this.winSubtitle.setPosition(width / 2, height / 2 + 100);
    this.winPlayAgain.setPosition(width / 2, height / 2 + 140);

    // Update win gif position if it exists
    this.updateWinGifPosition();

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

  showWin() {
    this.winBg.setVisible(true);
    this.winTitle.setVisible(true);
    this.winSubtitle.setVisible(true);
    this.winPlayAgain.setVisible(true);

    // Load and display the win gif using a DOM element overlay
    this.createWinGif();

    // Remove existing listeners if any
    this.winPlayAgain.removeAllListeners();
    this.winPlayAgain.removeInteractive();

    // Make the play again button interactive
    const bounds = this.winPlayAgain.getBounds();
    this.winPlayAgain.setInteractive({
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
    this.winPlayAgain.on('pointerover', () => {
      this.winPlayAgain.setColor('#ffffff');
    });
    this.winPlayAgain.on('pointerout', () => {
      this.winPlayAgain.setColor('#00ff00');
    });
    this.winPlayAgain.on('pointerdown', () => {
      // Clean up gif before restart
      if (this.winGifElement) {
        this.winGifElement.remove();
        this.winGifElement = null;
      }
      this.sceneRef.scene.restart();
    });

    this.updatePositions();
  }

  createWinGif() {
    // Create a DOM element for the GIF since Phaser doesn't natively support animated GIFs
    const canvas = this.scene.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    // Create image element
    const gifElement = document.createElement('img');
    gifElement.src = 'win.gif';
    gifElement.style.position = 'absolute';
    gifElement.style.width = '200px';
    gifElement.style.height = 'auto';
    gifElement.style.maxHeight = '150px';
    gifElement.style.objectFit = 'contain';
    gifElement.style.zIndex = '1000';
    gifElement.style.pointerEvents = 'none';
    gifElement.style.borderRadius = '8px';
    gifElement.style.border = '2px solid #ffcc00';

    // Handle image load error gracefully
    gifElement.onerror = () => {
      console.log('Win gif not found - using placeholder');
      gifElement.style.display = 'none';
    };

    // Position will be updated in updatePositions
    document.body.appendChild(gifElement);
    this.winGifElement = gifElement;

    // Update position immediately
    this.updateWinGifPosition();
  }

  updateWinGifPosition() {
    if (!this.winGifElement) return;

    const canvas = this.scene.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // Calculate the position - center horizontally, positioned in upper part of popup
    const gifWidth = 200;
    const gifHeight = 150;
    const centerX = canvasRect.left + (canvasRect.width / 2) - (gifWidth / 2);
    const centerY = canvasRect.top + (canvasRect.height / 2) - 50;

    this.winGifElement.style.left = `${centerX}px`;
    this.winGifElement.style.top = `${centerY}px`;
  }

  destroy() {
    this.scene.scale.off('resize', this.updatePositions, this);
    this.scene.events.off('update', this.updateFrame, this);
    this.scene.events.off('shutdown', this.destroy, this);
    this.scene.events.off('notorietyChanged', this.updateNotorietyDisplay, this);
    if (this.uiCamera) {
      this.scene.cameras.remove(this.uiCamera);
    }
    // Clean up win gif DOM element
    if (this.winGifElement) {
      this.winGifElement.remove();
      this.winGifElement = null;
    }
  }
}
