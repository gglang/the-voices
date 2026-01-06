import { DailyObjectiveBank } from './DailyObjectiveBank.js';
import { ObjectiveCompletionTracker } from './ObjectiveCompletionTracker.js';
import { EntityConstraint, EntityType, EntityStatus } from './EntityConstraint.js';

/**
 * ObjectiveSystem - Manages game objectives
 *
 * Provides daily objectives and tracks completion
 * Rewards: XP + 1 sanity on completion
 * Penalty: -1 sanity on failure (end of day without completing)
 */
export class ObjectiveSystem {
  constructor(scene) {
    this.scene = scene;
    this.objectives = [];
    this.nextId = 1;

    // Daily objective bank for generating randomized objectives
    this.dailyObjectiveBank = new DailyObjectiveBank(scene);

    // Track current daily objective for location highlighting
    this.currentDailyObjective = null;

    // Completion tracker for real-time objective progress
    this.completionTracker = new ObjectiveCompletionTracker(scene);
  }

  /**
   * Generate a random daily objective using DailyObjectiveBank
   */
  generateDailyObjective() {
    const generated = this.dailyObjectiveBank.generateObjective();

    const objective = {
      id: this.nextId++,
      templateId: generated.templateId,
      title: generated.title,
      description: generated.description,
      rewards: generated.rewardText,
      penalty: generated.penaltyText,
      xp: generated.xp || 0,
      isDaily: true,
      isComplete: false,
      isFailed: false,
      // Store objective-specific data for completion checking
      action: generated.action || null,
      targetType: generated.targetType || null,
      bodyPart: generated.bodyPart || null,
      objectType: generated.objectType || null,
      location: generated.location || null,
      highlightLocation: generated.highlightLocation || null,
      highlightRitualSite: generated.highlightRitualSite || false,
      killCount: generated.killCount || null,
      requiresPrisoner: generated.requiresPrisoner || false,
      // Steps for multi-step objectives (deep copy to avoid reference issues)
      steps: generated.steps ? generated.steps.map(s => ({ ...s })) : null
    };

    return objective;
  }

  /**
   * Add the daily objective (called at start of each day)
   */
  addDailyObjective() {
    // Check if previous daily objective failed (not completed by end of day)
    const oldDaily = this.objectives.find(obj => obj.isDaily && !obj.isComplete);
    if (oldDaily) {
      this.failObjective(oldDaily.id);
    }

    // Remove old daily objectives
    this.objectives = this.objectives.filter(obj => !obj.isDaily);

    // Clear old location highlights
    this.clearLocationHighlights();

    // Add new daily objective
    const daily = this.generateDailyObjective();
    this.objectives.push(daily);
    this.currentDailyObjective = daily;

    // Set up location highlighting on minimap
    this.updateLocationHighlights();

    // Set up objective-specific actions
    this.setupObjectiveActions();

    // Update widget
    this.updateWidget();

    return daily;
  }

  /**
   * Update minimap location highlights based on current daily objective
   */
  updateLocationHighlights() {
    const locationSystem = this.scene.playerLocationSystem;
    if (!this.currentDailyObjective) return;

    // Highlight specific location if objective has one
    if (this.currentDailyObjective.highlightLocation && locationSystem) {
      locationSystem.highlightLocation(this.currentDailyObjective.highlightLocation);
    }

    // Highlight a ritual site if required
    if (this.currentDailyObjective.highlightRitualSite && this.scene.ritualSystem) {
      // Pick a random ritual site to highlight
      const sites = this.scene.ritualSystem.getAll();
      if (sites.length > 0) {
        const randomSite = sites[Math.floor(Math.random() * sites.length)];
        this.highlightedRitualSite = randomSite;
      }
    } else {
      this.highlightedRitualSite = null;
    }
  }

  /**
   * Get the currently highlighted ritual site (for minimap rendering)
   */
  getHighlightedRitualSite() {
    return this.highlightedRitualSite || null;
  }

  /**
   * Clear all location highlights
   */
  clearLocationHighlights() {
    const locationSystem = this.scene.playerLocationSystem;
    if (locationSystem) {
      locationSystem.clearHighlights();
    }
    this.highlightedRitualSite = null;
  }

  /**
   * Set up objective-specific actions based on the current daily objective
   * This registers actions like Fripple, Pizzle, Jally, Mootiti, Leave Letter
   */
  setupObjectiveActions() {
    const actionSystem = this.scene.objectiveActionSystem;
    if (!actionSystem) return;

    // Clear any previous objective actions
    if (this.currentDailyObjective) {
      actionSystem.unregisterObjectiveActions(this.currentDailyObjective.id.toString());
    }

    const objective = this.currentDailyObjective;
    if (!objective) return;

    const objectiveId = objective.id.toString();

    // Determine the entity constraint based on objective template and target type
    // Fripple/Pizzle/Jally actions are typically used on living entities or corpses
    // depending on the objective
    let entityConstraint = null;

    // For kill_action_corpse objectives, actions target corpses
    if (objective.templateId === 'kill_action_corpse_their_home') {
      entityConstraint = new EntityConstraint({ type: EntityType.CORPSE });
    } else if (objective.templateId === 'lure_action_kill') {
      // For lure_action_kill, action targets living entities (before the kill step)
      // Check if target is a pet (cat/dog) or human
      const targetType = objective.targetType;
      if (targetType === 'cat' || targetType === 'dog') {
        entityConstraint = new EntityConstraint({
          type: EntityType.PET,
          status: EntityStatus.ALIVE
        });
      } else {
        entityConstraint = new EntityConstraint({
          type: EntityType.HUMAN,
          status: EntityStatus.ALIVE
        });
      }
    }

    // Register actions based on objective's action type
    if (objective.action) {
      switch (objective.action) {
        case 'fripple':
          actionSystem.registerFripple({
            objectiveId,
            id: `${objectiveId}_fripple`,
            entityConstraint
          });
          break;
        case 'pizzle':
          actionSystem.registerPizzle({
            objectiveId,
            id: `${objectiveId}_pizzle`,
            entityConstraint
          });
          break;
        case 'jally':
          actionSystem.registerJally({
            objectiveId,
            id: `${objectiveId}_jally`,
            entityConstraint
          });
          break;
      }
    }

    // Register Mootiti if objective has objectType (always targets corpses)
    if (objective.objectType) {
      actionSystem.registerMootiti({
        objectiveId,
        id: `${objectiveId}_mootiti`,
        withObject: objective.objectType,
        entityConstraint: new EntityConstraint({ type: EntityType.CORPSE })
      });
    }

    // Register Leave Letter for letter objectives
    if (objective.templateId === 'leave_letter_corpse') {
      actionSystem.registerLeaveLetter({
        objectiveId,
        id: `${objectiveId}_leave_letter`
      });
    }
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
    if (obj && !obj.isComplete && !obj.isFailed) {
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

      // Award sanity (+1 for daily objectives)
      if (obj.isDaily && this.scene.sanitySystem) {
        this.scene.sanitySystem.increaseSanity(1);
        this.scene.hud?.drawSanityStatus();
      }

      // Clear location highlights for daily objectives
      if (obj.isDaily) {
        this.clearLocationHighlights();
        this.currentDailyObjective = null;
      }
    }
  }

  /**
   * Fail an objective by ID (e.g., day ended without completion)
   */
  failObjective(id) {
    const obj = this.objectives.find(o => o.id === id);
    if (obj && !obj.isComplete && !obj.isFailed) {
      obj.isFailed = true;
      this.updateWidget();

      // Show notification
      if (this.scene.hud) {
        this.scene.hud.showNotification(`Objective failed: ${obj.title}`, 3000);
      }

      // Apply sanity penalty (-1 for daily objectives)
      if (obj.isDaily && this.scene.sanitySystem) {
        this.scene.sanitySystem.decreaseSanity(1);
        this.scene.hud?.drawSanityStatus();
      }

      // Clear location highlights
      if (obj.isDaily) {
        this.clearLocationHighlights();
        this.currentDailyObjective = null;
      }
    }
  }

  /**
   * Get current daily objective
   */
  getCurrentDailyObjective() {
    return this.currentDailyObjective;
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
