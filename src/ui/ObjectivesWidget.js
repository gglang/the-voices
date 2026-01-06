/**
 * Objectives Widget - "The Will of the Voices"
 * Collapsible panel showing current objectives
 */
export class ObjectivesWidget {
  constructor(scene) {
    this.scene = scene;
    this.isExpanded = true;
    this.objectives = [];
    this.objectiveTexts = [];

    // Widget configuration (2x size)
    this.padding = 16;
    this.width = 360;
    this.headerHeight = 48;
    this.itemHeight = 40;
    this.infoButtonSize = 28;

    // Create container for all elements
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1100);

    // Background
    this.background = scene.add.graphics();
    this.container.add(this.background);

    // Header text
    this.headerText = scene.add.text(0, 0, 'The Will of the Voices', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#aa66ff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.headerText.setOrigin(0, 0);
    this.container.add(this.headerText);

    // Collapse/expand button
    this.collapseBtn = scene.add.text(0, 0, '[-]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.collapseBtn.setOrigin(1, 0);
    this.collapseBtn.setInteractive({ useHandCursor: true });
    this.collapseBtn.on('pointerdown', () => this.toggleExpand());
    this.collapseBtn.on('pointerover', () => this.collapseBtn.setColor('#ffffff'));
    this.collapseBtn.on('pointerout', () => this.collapseBtn.setColor('#888888'));
    this.container.add(this.collapseBtn);

    // Empty state text
    this.emptyText = scene.add.text(0, 0, 'The voices are at bay...', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#666666',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.emptyText.setOrigin(0, 0);
    this.container.add(this.emptyText);

    // Initial render
    this.updatePositions();
    this.render();
  }

  /**
   * Update widget position (top right corner)
   */
  updatePositions() {
    const width = this.scene.scale.width;
    const x = width - this.padding - this.width;
    const y = this.padding;

    this.container.setPosition(x, y);
    this.headerText.setPosition(16, 12);
    this.collapseBtn.setPosition(this.width - 16, 12);
    this.emptyText.setPosition(16, this.headerHeight + 8);
  }

  /**
   * Toggle expand/collapse state
   */
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.collapseBtn.setText(this.isExpanded ? '[-]' : '[+]');
    this.render();
  }

  /**
   * Set objectives list
   * @param {Array} objectives - Array of objective objects {id, title, description, rewards, isDaily, isComplete}
   */
  setObjectives(objectives) {
    this.objectives = objectives || [];
    this.render();
  }

  /**
   * Add a single objective
   */
  addObjective(objective) {
    this.objectives.push(objective);
    this.render();
  }

  /**
   * Remove an objective by ID
   */
  removeObjective(id) {
    this.objectives = this.objectives.filter(obj => obj.id !== id);
    this.render();
  }

  /**
   * Mark an objective as complete
   */
  completeObjective(id) {
    const obj = this.objectives.find(o => o.id === id);
    if (obj) {
      obj.isComplete = true;
      this.render();
    }
  }

  /**
   * Render the widget
   */
  render() {
    // Clear old objective items
    this.objectiveTexts.forEach(item => {
      if (item.hitArea) item.hitArea.destroy();
      if (item.rowBg) item.rowBg.destroy();
      if (item.checkbox) item.checkbox.destroy();
      if (item.text) item.text.destroy();
      if (item.infoIcon) item.infoIcon.destroy();
    });
    this.objectiveTexts = [];

    // Calculate height
    let contentHeight = 0;
    if (this.isExpanded) {
      if (this.objectives.length === 0) {
        contentHeight = 40;
      } else {
        contentHeight = this.objectives.length * this.itemHeight + 8;
      }
    }
    const totalHeight = this.headerHeight + contentHeight;

    // Draw background
    this.background.clear();
    this.background.fillStyle(0x000000, 0.75);
    this.background.fillRoundedRect(0, 0, this.width, totalHeight, 12);
    this.background.lineStyle(2, 0x6633aa, 0.6);
    this.background.strokeRoundedRect(0, 0, this.width, totalHeight, 12);

    // Show/hide empty text
    this.emptyText.setVisible(this.isExpanded && this.objectives.length === 0);

    // Create objective items
    if (this.isExpanded && this.objectives.length > 0) {
      this.objectives.forEach((obj, index) => {
        const y = this.headerHeight + 4 + index * this.itemHeight;
        const rowHeight = this.itemHeight - 4;

        // Row background (hover highlight)
        const rowBg = this.scene.add.graphics();
        rowBg.fillStyle(0x6633aa, 0);
        rowBg.fillRoundedRect(8, y, this.width - 16, rowHeight, 4);
        this.container.add(rowBg);

        // Clickable hit area for the entire row
        const hitArea = this.scene.add.rectangle(
          this.width / 2,
          y + rowHeight / 2,
          this.width - 16,
          rowHeight,
          0x000000, 0
        );
        hitArea.setInteractive({ useHandCursor: true });
        this.container.add(hitArea);

        // Checkbox for completion status
        const checkbox = this.scene.add.graphics();
        this.drawCheckbox(checkbox, 20, y + rowHeight / 2, obj.isComplete, obj.isFailed);
        this.container.add(checkbox);

        // Prefix with (daily) if applicable
        const prefix = obj.isDaily ? '(daily) ' : '';
        const displayText = prefix + this.truncateText(obj.title, 24);

        // Objective text (shifted right for checkbox)
        const text = this.scene.add.text(40, y + 6, displayText, {
          fontSize: '18px',
          fontFamily: 'monospace',
          color: obj.isComplete ? '#44aa44' : (obj.isFailed ? '#aa4444' : '#cccccc'),
          stroke: '#000000',
          strokeThickness: 2
        });
        text.setOrigin(0, 0);
        this.container.add(text);

        // Info icon [i] on the right
        const infoIcon = this.scene.add.text(this.width - 40, y + 6, '[i]', {
          fontSize: '18px',
          fontFamily: 'monospace',
          color: '#888888',
          stroke: '#000000',
          strokeThickness: 2
        });
        infoIcon.setOrigin(0, 0);
        this.container.add(infoIcon);

        // Row interactions
        hitArea.on('pointerdown', () => this.showObjectivePopup(obj));
        hitArea.on('pointerover', () => {
          rowBg.clear();
          rowBg.fillStyle(0x6633aa, 0.3);
          rowBg.fillRoundedRect(8, y, this.width - 16, rowHeight, 4);
          text.setColor(obj.isComplete ? '#66ff66' : (obj.isFailed ? '#ff6666' : '#ffffff'));
          infoIcon.setColor('#ffff00');
        });
        hitArea.on('pointerout', () => {
          rowBg.clear();
          text.setColor(obj.isComplete ? '#44aa44' : (obj.isFailed ? '#aa4444' : '#cccccc'));
          infoIcon.setColor('#888888');
        });

        this.objectiveTexts.push({ hitArea, rowBg, checkbox, text, infoIcon });
      });
    }
  }

  /**
   * Draw a checkbox
   * @param {Phaser.GameObjects.Graphics} graphics
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {boolean} isComplete
   * @param {boolean} isFailed
   */
  drawCheckbox(graphics, x, y, isComplete, isFailed = false) {
    const size = 12;
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
      graphics.moveTo(x - 4, y);
      graphics.lineTo(x - 1, y + 3);
      graphics.lineTo(x + 4, y - 3);
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
   * Truncate text to fit
   */
  truncateText(text, maxLen) {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 2) + '..';
  }

  /**
   * Show objective details popup
   */
  showObjectivePopup(objective) {
    if (this.scene.objectivePopup) {
      this.scene.objectivePopup.show(objective);
    }
  }

  /**
   * Register with HUD camera system
   */
  registerWithHUD(hud) {
    if (hud) {
      this.scene.cameras.main.ignore(this.container);
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.objectiveTexts.forEach(item => {
      if (item.hitArea) item.hitArea.destroy();
      if (item.rowBg) item.rowBg.destroy();
      if (item.checkbox) item.checkbox.destroy();
      if (item.text) item.text.destroy();
      if (item.infoIcon) item.infoIcon.destroy();
    });
    this.container.destroy();
  }
}
