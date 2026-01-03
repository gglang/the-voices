import { DEPTH } from '../config/constants.js';

/**
 * UI popup showing available actions for nearby objects
 */
export class ActionPopup {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.background = null;
    this.actionTexts = [];
    this.isVisible = false;
    this.currentTarget = null;

    this.create();
  }

  create() {
    // Create container for popup elements
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(DEPTH.EFFECTS + 10);
    this.container.setVisible(false);

    // Background will be created dynamically based on content
    this.background = this.scene.add.graphics();
    this.container.add(this.background);

    // Ignore in HUD camera
    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.container);
    }
  }

  update(actionSystem) {
    const target = actionSystem?.getCurrentTarget();

    if (!target) {
      this.hide();
      return;
    }

    // Check if target or actions changed
    const actionsChanged = this.hasActionsChanged(target.actions);
    if (this.currentTarget !== target.sprite || actionsChanged) {
      this.currentTarget = target.sprite;
      this.currentActionCount = target.actions.length;
      this.currentActionNames = target.actions.map(a => a.name).join(',');
      this.rebuildPopup(target);
    }

    // Update position to follow target
    this.updatePosition(target.sprite);
    this.show();
  }

  hasActionsChanged(actions) {
    if (this.currentActionCount !== actions.length) return true;
    const newNames = actions.map(a => a.name).join(',');
    return this.currentActionNames !== newNames;
  }

  rebuildPopup(target) {
    // Clear existing action texts
    this.actionTexts.forEach(text => text.destroy());
    this.actionTexts = [];

    const { actions } = target;
    const padding = 4;
    const lineHeight = 10;
    let maxWidth = 0;

    // Create text for each action
    actions.forEach((action, index) => {
      const displayText = `${action.name} (${action.key})`;
      const text = this.scene.add.text(padding, padding + index * lineHeight, displayText, {
        fontSize: '8px',
        fontFamily: 'monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      });
      text.setOrigin(0, 0);
      this.container.add(text);
      this.actionTexts.push(text);

      maxWidth = Math.max(maxWidth, text.width);
    });

    // Draw background
    const width = maxWidth + padding * 2;
    const height = actions.length * lineHeight + padding * 2;

    this.background.clear();
    this.background.fillStyle(0x000000, 0.7);
    this.background.fillRoundedRect(0, 0, width, height, 2);
    this.background.lineStyle(1, 0x444444, 1);
    this.background.strokeRoundedRect(0, 0, width, height, 2);
  }

  updatePosition(sprite) {
    // Position popup above and to the right of the target
    const offsetX = 10;
    const offsetY = -20;
    this.container.setPosition(sprite.x + offsetX, sprite.y + offsetY);
  }

  show() {
    if (!this.isVisible) {
      this.container.setVisible(true);
      this.isVisible = true;
    }
  }

  hide() {
    if (this.isVisible) {
      this.container.setVisible(false);
      this.isVisible = false;
      this.currentTarget = null;
    }
  }

  destroy() {
    this.actionTexts.forEach(text => text.destroy());
    this.background.destroy();
    this.container.destroy();
  }
}
