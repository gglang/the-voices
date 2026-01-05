/**
 * Objective Popup - Shows detailed objective info
 *
 * Layout:
 * 'title'
 * body text
 * rewards
 * (close button)
 */
export class ObjectivePopup {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.currentObjective = null;

    // Popup configuration
    this.width = 280;
    this.padding = 16;

    // Create container (centered on screen)
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(2500);
    this.container.setVisible(false);

    // Background
    this.background = scene.add.graphics();
    this.container.add(this.background);

    // Title text
    this.titleText = scene.add.text(0, 0, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aa66ff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5, 0);
    this.container.add(this.titleText);

    // Body text
    this.bodyText = scene.add.text(0, 0, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: this.width - 32 },
      lineSpacing: 4
    });
    this.bodyText.setOrigin(0.5, 0);
    this.container.add(this.bodyText);

    // Rewards label
    this.rewardsLabel = scene.add.text(0, 0, 'Rewards:', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.rewardsLabel.setOrigin(0.5, 0);
    this.container.add(this.rewardsLabel);

    // Rewards text
    this.rewardsText = scene.add.text(0, 0, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ffcc44',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: this.width - 32 }
    });
    this.rewardsText.setOrigin(0.5, 0);
    this.container.add(this.rewardsText);

    // Close button
    this.closeBtn = scene.add.text(0, 0, '[ Close ]', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.closeBtn.setOrigin(0.5, 0);
    this.closeBtn.setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', () => this.hide());
    this.closeBtn.on('pointerover', () => this.closeBtn.setColor('#ffffff'));
    this.closeBtn.on('pointerout', () => this.closeBtn.setColor('#888888'));
    this.container.add(this.closeBtn);

    // Make main camera ignore popup
    scene.cameras.main.ignore(this.container);
  }

  /**
   * Show popup with objective details
   * @param {Object} objective - {id, title, description, rewards, isDaily, isComplete}
   */
  show(objective) {
    if (!objective) return;

    this.currentObjective = objective;
    this.isVisible = true;

    // Set content
    const titlePrefix = objective.isDaily ? '(Daily) ' : '';
    this.titleText.setText(titlePrefix + objective.title);
    this.bodyText.setText(objective.description || 'No description available.');
    this.rewardsText.setText(objective.rewards || 'None');

    // Calculate layout
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    // Measure content height
    const titleHeight = this.titleText.height;
    const bodyHeight = this.bodyText.height;
    const rewardsLabelHeight = this.rewardsLabel.height;
    const rewardsHeight = this.rewardsText.height;
    const closeHeight = this.closeBtn.height;

    const contentHeight = titleHeight + 12 + bodyHeight + 16 + rewardsLabelHeight + 4 + rewardsHeight + 20 + closeHeight;
    const totalHeight = contentHeight + this.padding * 2;

    // Position container
    this.container.setPosition(centerX, centerY);

    // Draw background
    this.background.clear();
    this.background.fillStyle(0x1a1a2e, 0.95);
    this.background.fillRoundedRect(-this.width / 2, -totalHeight / 2, this.width, totalHeight, 8);
    this.background.lineStyle(2, 0x6633aa, 0.8);
    this.background.strokeRoundedRect(-this.width / 2, -totalHeight / 2, this.width, totalHeight, 8);

    // Position elements
    let yOffset = -totalHeight / 2 + this.padding;

    this.titleText.setPosition(0, yOffset);
    yOffset += titleHeight + 12;

    this.bodyText.setPosition(0, yOffset);
    yOffset += bodyHeight + 16;

    this.rewardsLabel.setPosition(0, yOffset);
    yOffset += rewardsLabelHeight + 4;

    this.rewardsText.setPosition(0, yOffset);
    yOffset += rewardsHeight + 20;

    this.closeBtn.setPosition(0, yOffset);

    this.container.setVisible(true);

    // Notify scene that popup is open
    this.scene.activePopup = this;
  }

  /**
   * Hide the popup
   */
  hide() {
    this.isVisible = false;
    this.container.setVisible(false);
    this.currentObjective = null;

    // Clear active popup reference
    if (this.scene.activePopup === this) {
      this.scene.activePopup = null;
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.container.destroy();
  }
}
