/**
 * Objective Popup - Shows detailed objective info
 *
 * Layout:
 * [checkbox] 'title'
 * body text
 * steps (with checkboxes if multi-step)
 * rewards
 * penalty
 * (close button)
 */
export class ObjectivePopup {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.currentObjective = null;

    // Popup configuration
    this.width = 320;
    this.padding = 16;

    // Dynamic step elements (cleared on each show)
    this.stepElements = [];

    // Create container (centered on screen)
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(2500);
    this.container.setVisible(false);

    // Background
    this.background = scene.add.graphics();
    this.container.add(this.background);

    // Overall completion checkbox
    this.overallCheckbox = scene.add.graphics();
    this.container.add(this.overallCheckbox);

    // Title text
    this.titleText = scene.add.text(0, 0, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aa66ff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
      wordWrap: { width: this.width - 60 }
    });
    this.titleText.setOrigin(0, 0);
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
    this.bodyText.setOrigin(0, 0);
    this.container.add(this.bodyText);

    // Steps label
    this.stepsLabel = scene.add.text(0, 0, 'Steps:', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.stepsLabel.setOrigin(0, 0);
    this.container.add(this.stepsLabel);

    // Rewards label
    this.rewardsLabel = scene.add.text(0, 0, 'Rewards:', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.rewardsLabel.setOrigin(0, 0);
    this.container.add(this.rewardsLabel);

    // Rewards text
    this.rewardsText = scene.add.text(0, 0, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: this.width - 32 }
    });
    this.rewardsText.setOrigin(0, 0);
    this.container.add(this.rewardsText);

    // Penalty label
    this.penaltyLabel = scene.add.text(0, 0, 'Penalty:', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.penaltyLabel.setOrigin(0, 0);
    this.container.add(this.penaltyLabel);

    // Penalty text
    this.penaltyText = scene.add.text(0, 0, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: this.width - 32 }
    });
    this.penaltyText.setOrigin(0, 0);
    this.container.add(this.penaltyText);

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
   * Clear step elements from previous popup
   */
  clearStepElements() {
    this.stepElements.forEach(el => {
      if (el.checkbox) el.checkbox.destroy();
      if (el.text) el.text.destroy();
    });
    this.stepElements = [];
  }

  /**
   * Draw a checkbox
   */
  drawCheckbox(graphics, x, y, isComplete, isFailed = false, size = 10) {
    const half = size / 2;

    graphics.clear();

    if (isComplete) {
      // Filled green checkbox with checkmark
      graphics.fillStyle(0x44aa44, 1);
      graphics.fillRect(x - half, y - half, size, size);
      graphics.lineStyle(2, 0x44aa44, 1);
      graphics.strokeRect(x - half, y - half, size, size);

      // Draw checkmark
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.beginPath();
      graphics.moveTo(x - 3, y);
      graphics.lineTo(x - 1, y + 2);
      graphics.lineTo(x + 3, y - 2);
      graphics.strokePath();
    } else if (isFailed) {
      // Red X for failed
      graphics.fillStyle(0x442222, 1);
      graphics.fillRect(x - half, y - half, size, size);
      graphics.lineStyle(2, 0xaa4444, 1);
      graphics.strokeRect(x - half, y - half, size, size);

      // Draw X
      graphics.lineStyle(2, 0xff4444, 1);
      graphics.beginPath();
      graphics.moveTo(x - 3, y - 3);
      graphics.lineTo(x + 3, y + 3);
      graphics.strokePath();
      graphics.beginPath();
      graphics.moveTo(x + 3, y - 3);
      graphics.lineTo(x - 3, y + 3);
      graphics.strokePath();
    } else {
      // Empty checkbox
      graphics.fillStyle(0x222222, 1);
      graphics.fillRect(x - half, y - half, size, size);
      graphics.lineStyle(2, 0x666666, 1);
      graphics.strokeRect(x - half, y - half, size, size);
    }
  }

  /**
   * Show popup with objective details
   * @param {Object} objective - {id, title, description, rewards, penalty, isDaily, isComplete, steps}
   */
  show(objective) {
    if (!objective) return;

    this.clearStepElements();
    this.currentObjective = objective;
    this.isVisible = true;

    // Set content
    const titlePrefix = objective.isDaily ? '(Daily) ' : '';
    this.titleText.setText(titlePrefix + objective.title);
    this.bodyText.setText(objective.description || 'No description available.');
    this.rewardsText.setText(objective.rewards || 'None');
    this.penaltyText.setText(objective.penalty || 'None');

    // Check if objective has steps
    const hasSteps = objective.steps && objective.steps.length > 0;
    this.stepsLabel.setVisible(hasSteps);

    // Show/hide penalty section based on whether it exists
    const hasPenalty = objective.penalty && objective.isDaily;
    this.penaltyLabel.setVisible(hasPenalty);
    this.penaltyText.setVisible(hasPenalty);

    // Calculate layout
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    // Measure content height
    const titleHeight = this.titleText.height;
    const bodyHeight = this.bodyText.height;
    const stepsLabelHeight = hasSteps ? this.stepsLabel.height : 0;
    const stepItemHeight = 18;
    const stepsHeight = hasSteps ? (objective.steps.length * stepItemHeight) : 0;
    const rewardsLabelHeight = this.rewardsLabel.height;
    const rewardsHeight = this.rewardsText.height;
    const penaltyLabelHeight = hasPenalty ? this.penaltyLabel.height : 0;
    const penaltyHeight = hasPenalty ? this.penaltyText.height : 0;
    const closeHeight = this.closeBtn.height;

    let contentHeight = titleHeight + 12 + bodyHeight;
    if (hasSteps) {
      contentHeight += 12 + stepsLabelHeight + 4 + stepsHeight;
    }
    contentHeight += 16 + rewardsLabelHeight + 4 + rewardsHeight;
    if (hasPenalty) {
      contentHeight += 12 + penaltyLabelHeight + 4 + penaltyHeight;
    }
    contentHeight += 20 + closeHeight;
    const totalHeight = contentHeight + this.padding * 2;

    // Position container
    this.container.setPosition(centerX, centerY);

    // Draw background
    this.background.clear();
    this.background.fillStyle(0x1a1a2e, 0.95);
    this.background.fillRoundedRect(-this.width / 2, -totalHeight / 2, this.width, totalHeight, 8);
    this.background.lineStyle(2, 0x6633aa, 0.8);
    this.background.strokeRoundedRect(-this.width / 2, -totalHeight / 2, this.width, totalHeight, 8);

    // Calculate left edge for left-aligned elements
    const leftEdge = -this.width / 2 + this.padding;

    // Position elements
    let yOffset = -totalHeight / 2 + this.padding;

    // Draw overall checkbox next to title
    this.drawCheckbox(this.overallCheckbox, leftEdge + 6, yOffset + titleHeight / 2, objective.isComplete, objective.isFailed, 12);
    this.titleText.setPosition(leftEdge + 20, yOffset);
    yOffset += titleHeight + 12;

    this.bodyText.setPosition(leftEdge, yOffset);
    yOffset += bodyHeight;

    // Steps section
    if (hasSteps) {
      yOffset += 12;
      this.stepsLabel.setPosition(leftEdge, yOffset);
      yOffset += stepsLabelHeight + 4;

      // Create step items
      objective.steps.forEach((step, index) => {
        const stepY = yOffset + index * stepItemHeight;

        // Step checkbox
        const checkbox = this.scene.add.graphics();
        this.drawCheckbox(checkbox, leftEdge + 14, stepY + 7, step.complete, false, 10);
        this.container.add(checkbox);

        // Step text
        const text = this.scene.add.text(leftEdge + 28, stepY, step.text, {
          fontSize: '10px',
          fontFamily: 'monospace',
          color: step.complete ? '#44aa44' : '#aaaaaa',
          stroke: '#000000',
          strokeThickness: 2,
          wordWrap: { width: this.width - 60 }
        });
        text.setOrigin(0, 0);
        this.container.add(text);

        this.stepElements.push({ checkbox, text });
      });

      yOffset += stepsHeight;
    }

    yOffset += 16;
    this.rewardsLabel.setPosition(leftEdge, yOffset);
    yOffset += rewardsLabelHeight + 4;

    this.rewardsText.setPosition(leftEdge, yOffset);
    yOffset += rewardsHeight;

    if (hasPenalty) {
      yOffset += 12;
      this.penaltyLabel.setPosition(leftEdge, yOffset);
      yOffset += penaltyLabelHeight + 4;

      this.penaltyText.setPosition(leftEdge, yOffset);
      yOffset += penaltyHeight;
    }

    yOffset += 20;
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
    this.clearStepElements();

    // Clear active popup reference
    if (this.scene.activePopup === this) {
      this.scene.activePopup = null;
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.clearStepElements();
    this.container.destroy();
  }
}
