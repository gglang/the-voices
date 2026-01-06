/**
 * ObjectiveSystem - Manages game objectives
 *
 * Provides daily objectives and tracks completion
 */
export class ObjectiveSystem {
  constructor(scene) {
    this.scene = scene;
    this.objectives = [];
    this.nextId = 1;

    // Pool of possible daily objectives
    this.dailyObjectivePool = [
      {
        title: 'Make a Sacrifice',
        description: 'The voices demand blood. Bring a body to a ritual site and perform a sacrifice.',
        rewards: 'The voices grow stronger...',
        xp: 5
      },
      {
        title: 'Remain Unseen',
        description: 'Complete the day without being identified by anyone.',
        rewards: 'Your anonymity is preserved.',
        xp: 3
      },
      {
        title: 'Visit the Basement',
        description: 'Return to your basement. The ritual site awaits.',
        rewards: 'A sense of dark comfort.',
        xp: 2
      },
      {
        title: 'Explore the Town',
        description: 'Wander through the streets. Know your hunting grounds.',
        rewards: 'Knowledge of the terrain.',
        xp: 2
      },
      {
        title: 'Avoid the Police',
        description: 'Do not let any officer get too close today.',
        rewards: 'Freedom to continue your work.',
        xp: 3
      }
    ];
  }

  /**
   * Generate a random daily objective
   */
  generateDailyObjective() {
    const pool = this.dailyObjectivePool;
    const template = pool[Math.floor(Math.random() * pool.length)];

    const objective = {
      id: this.nextId++,
      title: template.title,
      description: template.description,
      rewards: template.rewards,
      xp: template.xp || 0,
      isDaily: true,
      isComplete: false
    };

    return objective;
  }

  /**
   * Add the daily objective (called at start of each day)
   */
  addDailyObjective() {
    // Remove old daily objectives
    this.objectives = this.objectives.filter(obj => !obj.isDaily);

    // Add new daily objective
    const daily = this.generateDailyObjective();
    this.objectives.push(daily);

    // Update widget
    this.updateWidget();

    return daily;
  }

  /**
   * Add a custom objective
   * @param {string} title
   * @param {string} description
   * @param {string} rewards - Text description of rewards
   * @param {number} xp - Notoriety XP awarded on completion
   */
  addObjective(title, description, rewards = null, xp = 0) {
    const objective = {
      id: this.nextId++,
      title,
      description,
      rewards: rewards || 'None',
      xp: xp || 0,
      isDaily: false,
      isComplete: false
    };

    this.objectives.push(objective);
    this.updateWidget();

    return objective;
  }

  /**
   * Complete an objective by ID
   */
  completeObjective(id) {
    const obj = this.objectives.find(o => o.id === id);
    if (obj && !obj.isComplete) {
      obj.isComplete = true;
      this.updateWidget();

      // Show notification
      if (this.scene.hud) {
        this.scene.hud.showNotification(`Objective complete: ${obj.title}`, 3000);
      }

      // Award notoriety XP
      if (obj.xp > 0 && this.scene.notorietySystem) {
        this.scene.notorietySystem.awardObjectiveXP(obj.xp, obj.title);
        this.scene.hud?.updateNotorietyDisplay();
      }
    }
  }

  /**
   * Remove an objective by ID
   */
  removeObjective(id) {
    this.objectives = this.objectives.filter(o => o.id !== id);
    this.updateWidget();
  }

  /**
   * Get all objectives
   */
  getObjectives() {
    return this.objectives;
  }

  /**
   * Get incomplete objectives
   */
  getIncompleteObjectives() {
    return this.objectives.filter(o => !o.isComplete);
  }

  /**
   * Update the objectives widget
   */
  updateWidget() {
    if (this.scene.objectivesWidget) {
      this.scene.objectivesWidget.setObjectives(this.objectives);
    }
  }

  /**
   * Called when a new day starts
   */
  onNewDay() {
    this.addDailyObjective();
  }
}
