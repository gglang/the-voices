import { SomeoneType, BodyPartType } from './DailyObjectiveBank.js';
import { LocationType } from './PlayerLocationSystem.js';

/**
 * ObjectiveCompletionTracker - Tracks game events and updates objective completion
 *
 * Listens for:
 * - humanKilled: When a human is killed
 * - petKilled: When a pet (cat/dog) is killed
 * - motherKissed: When player kisses mother
 * - objectiveActionExecuted: When Fripple/Pizzle/Jally/Mootiti is performed
 * - bodyPartRemoved: When a body part is removed from a corpse/prisoner
 * - bodyPartCooked: When a body part is cooked
 * - bodyPartGifted: When a body part is gifted to someone
 * - bodyPartEaten: When a body part is eaten
 * - corpseDropped: When a corpse is dropped at a location
 * - humanStartedFollowing: When a human starts following the player
 * - entityImprisoned: When an entity is imprisoned
 * - ritualPerformed: When a ritual sacrifice is performed
 * - skinWorn: When skin is worn
 * - ratCooked: When a rat is cooked
 * - ratGifted: When a rat is gifted
 *
 * Updates objective steps and overall completion in real-time.
 */
export class ObjectiveCompletionTracker {
  constructor(scene) {
    this.scene = scene;

    // Bind event handlers
    this.onHumanKilled = this.onHumanKilled.bind(this);
    this.onPetKilled = this.onPetKilled.bind(this);
    this.onMotherKissed = this.onMotherKissed.bind(this);
    this.onObjectiveActionExecuted = this.onObjectiveActionExecuted.bind(this);
    this.onBodyPartRemoved = this.onBodyPartRemoved.bind(this);
    this.onBodyPartCooked = this.onBodyPartCooked.bind(this);
    this.onBodyPartGifted = this.onBodyPartGifted.bind(this);
    this.onBodyPartEaten = this.onBodyPartEaten.bind(this);
    this.onCorpseDropped = this.onCorpseDropped.bind(this);
    this.onHumanStartedFollowing = this.onHumanStartedFollowing.bind(this);
    this.onEntityImprisoned = this.onEntityImprisoned.bind(this);
    this.onRitualPerformed = this.onRitualPerformed.bind(this);
    this.onSkinWorn = this.onSkinWorn.bind(this);

    // Register event listeners
    this.registerListeners();
  }

  /**
   * Register all event listeners
   */
  registerListeners() {
    this.scene.events.on('humanKilled', this.onHumanKilled);
    this.scene.events.on('petKilled', this.onPetKilled);
    this.scene.events.on('motherKissed', this.onMotherKissed);
    this.scene.events.on('objectiveActionExecuted', this.onObjectiveActionExecuted);
    this.scene.events.on('bodyPartRemoved', this.onBodyPartRemoved);
    this.scene.events.on('bodyPartCooked', this.onBodyPartCooked);
    this.scene.events.on('bodyPartGifted', this.onBodyPartGifted);
    this.scene.events.on('bodyPartEaten', this.onBodyPartEaten);
    this.scene.events.on('corpseDropped', this.onCorpseDropped);
    this.scene.events.on('humanStartedFollowing', this.onHumanStartedFollowing);
    this.scene.events.on('entityImprisoned', this.onEntityImprisoned);
    this.scene.events.on('ritualPerformed', this.onRitualPerformed);
    this.scene.events.on('skinWorn', this.onSkinWorn);
  }

  /**
   * Unregister all event listeners
   */
  unregisterListeners() {
    this.scene.events.off('humanKilled', this.onHumanKilled);
    this.scene.events.off('petKilled', this.onPetKilled);
    this.scene.events.off('motherKissed', this.onMotherKissed);
    this.scene.events.off('objectiveActionExecuted', this.onObjectiveActionExecuted);
    this.scene.events.off('bodyPartRemoved', this.onBodyPartRemoved);
    this.scene.events.off('bodyPartCooked', this.onBodyPartCooked);
    this.scene.events.off('bodyPartGifted', this.onBodyPartGifted);
    this.scene.events.off('bodyPartEaten', this.onBodyPartEaten);
    this.scene.events.off('corpseDropped', this.onCorpseDropped);
    this.scene.events.off('humanStartedFollowing', this.onHumanStartedFollowing);
    this.scene.events.off('entityImprisoned', this.onEntityImprisoned);
    this.scene.events.off('ritualPerformed', this.onRitualPerformed);
    this.scene.events.off('skinWorn', this.onSkinWorn);
  }

  /**
   * Get current daily objective
   */
  getCurrentObjective() {
    return this.scene.objectiveSystem?.getCurrentDailyObjective();
  }

  /**
   * Check if a target type matches the killed victim
   */
  matchesTargetType(targetType, victim) {
    if (!targetType || targetType === SomeoneType.ANYONE) return true;

    switch (targetType) {
      case SomeoneType.COP:
        return victim.isCop === true;
      case SomeoneType.KID:
        return victim.age === 'child';
      case SomeoneType.ADULT:
        return victim.age === 'adult';
      case SomeoneType.AZURE_PERSON:
        return victim.race?.name === 'azure' && victim.age === 'adult';
      case SomeoneType.CRIMSON_PERSON:
        return victim.race?.name === 'crimson' && victim.age === 'adult';
      case SomeoneType.GOLDEN_PERSON:
        return victim.race?.name === 'golden' && victim.age === 'adult';
      case SomeoneType.PRISONER:
        return victim.isPrisoner === true;
      case SomeoneType.DOG:
        return victim.entityType === 'dog';
      case SomeoneType.CAT:
        return victim.entityType === 'cat';
      default:
        return false;
    }
  }

  /**
   * Check if player is in a specific location
   */
  isPlayerInLocation(location) {
    const locationSystem = this.scene.playerLocationSystem;
    if (!locationSystem) return false;
    return locationSystem.isPlayerInLocation(location);
  }

  /**
   * Check if a position is inside someone else's home (not player's)
   */
  isInSomeoneElseHome(x, y) {
    const tileSize = this.scene.townData?.tileSize || 16;
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);

    const grid = this.scene.townData?.grid;
    if (!grid || !grid[tileX] || !grid[tileX][tileY]) return false;

    const cell = grid[tileX][tileY];
    if (cell.type !== 'floor' && cell.type !== 'door') return false;

    // Check if it's inside a building
    const building = this.scene.townData?.buildings?.find(b => b.id === cell.buildingId);
    if (!building) return false;

    // Make sure it's not the player's home
    return building.type !== 'player_home';
  }

  /**
   * Mark a step as complete and update UI
   */
  completeStep(objective, stepId) {
    if (!objective.steps) return false;

    const step = objective.steps.find(s => s.id === stepId);
    if (!step || step.complete) return false;

    step.complete = true;

    // Show notification
    this.scene.hud?.showNotification(`Step complete: ${step.text}`, 2000);

    // Update objectives widget
    this.scene.objectiveSystem?.updateWidget();

    // Check if all steps are complete
    const allComplete = objective.steps.every(s => s.complete);
    if (allComplete) {
      this.scene.objectiveSystem?.completeObjective(objective.id);
    }

    return true;
  }

  /**
   * Complete a single-step objective
   */
  completeObjective(objective) {
    this.scene.objectiveSystem?.completeObjective(objective.id);
  }

  /**
   * Handle human killed event
   */
  onHumanKilled(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { victim, x, y } = data;
    const templateId = objective.templateId;

    // Check if this kill matches the objective's target type
    const targetMatches = this.matchesTargetType(objective.targetType, victim);
    if (!targetMatches && objective.targetType) return;

    // Check location-specific kill objectives
    const inTheirHome = this.isInSomeoneElseHome(x, y);
    const inYourHome = this.isPlayerInLocation(LocationType.YOUR_HOME);
    const nearPolice = this.isPlayerInLocation(LocationType.NEAR_POLICE_STATION);
    const inWoods = this.isPlayerInLocation(LocationType.WOODS);
    const inDowntown = this.isPlayerInLocation(LocationType.DOWNTOWN);

    // Handle different objective types
    switch (templateId) {
      // Objectives that require killing in their home
      case 'kill_action_corpse_their_home':
      case 'kill_in_home_action_corpse':
      case 'kill_store_in_your_home':
      case 'kill_decorate_with_bodypart':
        if (inTheirHome && targetMatches) {
          this.completeStep(objective, 'kill');
        }
        break;

      // Kill anyone at specified location
      case 'leave_corpse_location':
        if (objective.location) {
          const atLocation = this.isPlayerInLocation(objective.location);
          if (atLocation) {
            this.completeStep(objective, 'kill');
          }
        }
        break;

      // Lure and kill objectives
      case 'lure_action_kill':
        if (inYourHome && targetMatches && victim.wasFollowing) {
          this.completeStep(objective, 'kill');
        }
        break;

      case 'lure_ritual_sacrifice':
        // Check if near a ritual site
        const ritualSites = this.scene.ritualSystem?.getAll() || [];
        const nearRitualSite = ritualSites.some(site => {
          const dist = Math.sqrt(Math.pow(x - site.x, 2) + Math.pow(y - site.y, 2));
          return dist < 50; // Within 50 pixels of ritual site
        });
        if (nearRitualSite && targetMatches && victim.wasFollowing) {
          this.completeStep(objective, 'kill');
        }
        break;

      case 'lure_location_kill_action':
        if (objective.location) {
          const atLureLocation = this.isPlayerInLocation(objective.location);
          if (atLureLocation && targetMatches && victim.wasFollowing) {
            this.completeStep(objective, 'kill');
          }
        }
        break;

      // Kill prisoner objectives
      case 'kill_prisoner':
        if (victim.isPrisoner) {
          // Single-step objective
          this.completeObjective(objective);
        }
        break;

      case 'skin_and_wear':
        if (victim.isPrisoner) {
          this.completeStep(objective, 'kill');
        }
        break;

      // Kill 3 in same home
      case 'kill_three_same_home':
        if (inTheirHome) {
          // Track kills in the current home
          if (!objective._killsInHome) {
            objective._killsInHome = { buildingId: null, count: 0 };
          }
          // Get current building
          const tileSize = this.scene.townData?.tileSize || 16;
          const tileX = Math.floor(x / tileSize);
          const tileY = Math.floor(y / tileSize);
          const cell = this.scene.townData?.grid?.[tileX]?.[tileY];
          const buildingId = cell?.buildingId;

          if (objective._killsInHome.buildingId === buildingId) {
            objective._killsInHome.count++;
          } else {
            objective._killsInHome = { buildingId, count: 1 };
          }

          if (objective._killsInHome.count >= 3) {
            this.completeObjective(objective);
          } else {
            this.scene.hud?.showNotification(`Kills in home: ${objective._killsInHome.count}/3`, 2000);
          }
        }
        break;
    }
  }

  /**
   * Handle pet killed event (cats, dogs)
   */
  onPetKilled(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { victim, x, y } = data;
    const templateId = objective.templateId;

    // Check if this kill matches the objective's target type (cat/dog)
    const targetMatches = this.matchesTargetType(objective.targetType, victim);
    if (!targetMatches && objective.targetType) return;

    // Check location-specific kill objectives
    const inTheirHome = this.isInSomeoneElseHome(x, y);

    // Handle different objective types
    switch (templateId) {
      // Objectives that require killing in their home
      case 'kill_action_corpse_their_home':
        if (inTheirHome && targetMatches) {
          this.completeStep(objective, 'kill');
        }
        break;
    }
  }

  /**
   * Handle mother kissed event
   */
  onMotherKissed(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    if (objective.templateId === 'kiss_mother') {
      this.completeObjective(objective);
    }
  }

  /**
   * Handle objective action executed (Fripple, Pizzle, Jally, Mootiti)
   */
  onObjectiveActionExecuted(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { actionType, targetEntity, withObject } = data;
    const templateId = objective.templateId;

    // Handle Mootiti separately (uses objectType instead of action)
    if (templateId === 'mootiti_corpse_object') {
      if (actionType === 'mootiti' && (targetEntity?.isCorpse || !targetEntity?.isAlive)) {
        // Check if using the correct object type (or any object if not specified)
        if (!objective.objectType || withObject === objective.objectType) {
          this.completeObjective(objective);
        }
      }
      return;
    }

    // Check if the action matches what the objective requires
    const objectiveAction = objective.action;
    if (!objectiveAction) return;

    // Map action types to objective action types
    const actionMatches = actionType === objectiveAction;
    if (!actionMatches) return;

    // Handle different objective types that involve actions
    switch (templateId) {
      case 'kill_action_corpse_their_home':
        // Action on corpse after killing
        if (targetEntity?.isCorpse || !targetEntity?.isAlive) {
          this.completeStep(objective, 'action');
        }
        break;

      case 'lure_action_kill':
        // Action step comes before kill - also complete lure step if they're in your home
        if (targetEntity?.isAlive !== false) {
          const inYourHome = this.isPlayerInLocation(LocationType.YOUR_HOME);
          if (inYourHome && this.matchesTargetType(objective.targetType, targetEntity)) {
            // Complete lure step first (they made it to your home)
            this.completeStep(objective, 'lure');
            // Then complete the action step
            this.completeStep(objective, 'action');
          }
        }
        break;
    }
  }

  /**
   * Handle body part removed event
   */
  onBodyPartRemoved(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { partId, fromPrisoner } = data;
    const templateId = objective.templateId;

    // Check if the body part matches what objective requires
    const bodyPartMatches = !objective.bodyPart || objective.bodyPart === partId;
    if (!bodyPartMatches) return;

    switch (templateId) {
      case 'kill_decorate_with_bodypart':
        // Remove step after killing
        this.completeStep(objective, 'remove');
        break;

      case 'remove_feed_prisoner':
        // Remove body part from prisoner
        if (fromPrisoner) {
          this.completeStep(objective, 'remove');
        }
        break;

      case 'eat_prisoner_part':
        // Remove body part from prisoner
        if (fromPrisoner) {
          this.completeStep(objective, 'remove');
        }
        break;

      case 'skin_and_wear':
        // Remove skin from prisoner corpse
        if (partId === 'skin') {
          this.completeStep(objective, 'skin');
        }
        break;
    }
  }

  /**
   * Handle body part cooked event
   */
  onBodyPartCooked(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { partId } = data;
    const templateId = objective.templateId;

    // Check if the body part matches what objective requires
    const bodyPartMatches = !objective.bodyPart || objective.bodyPart === partId;
    if (!bodyPartMatches) return;

    switch (templateId) {
      case 'cook_gift_bodypart':
      case 'cook_eat_bodypart':
        this.completeStep(objective, 'cook');
        break;
    }
  }

  /**
   * Handle body part gifted event
   */
  onBodyPartGifted(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { partId, recipient, recipientType, isCooked } = data;
    const templateId = objective.templateId;

    // Check if the body part matches what objective requires
    const bodyPartMatches = !objective.bodyPart || objective.bodyPart === partId;
    if (!bodyPartMatches) return;

    // Check if recipient matches target type
    const targetMatches = this.matchesGiftRecipient(objective.targetType, recipient, recipientType);

    switch (templateId) {
      case 'cook_gift_bodypart':
        // Gift cooked body part to someone
        if (isCooked && targetMatches) {
          this.completeStep(objective, 'gift');
        }
        break;

      case 'feed_prisoner_bodypart':
        // Feed body part to prisoner
        if (recipient?.isPrisoner) {
          this.completeObjective(objective);
        }
        break;

      case 'remove_feed_prisoner':
        // Feed the removed part back to them
        if (recipient?.isPrisoner) {
          this.completeStep(objective, 'feed');
        }
        break;

      case 'feed_dogs_corpse':
        // Feed to dogs
        if (recipientType === 'dog') {
          this.completeObjective(objective);
        }
        break;
    }
  }

  /**
   * Check if gift recipient matches target type
   */
  matchesGiftRecipient(targetType, recipient, recipientType) {
    if (!targetType || targetType === SomeoneType.ANYONE) return true;

    switch (targetType) {
      case SomeoneType.DOG:
        return recipientType === 'dog';
      case SomeoneType.CAT:
        return recipientType === 'cat';
      case SomeoneType.COP:
        return recipientType === 'cop';
      case SomeoneType.KID:
        return recipient?.age === 'child';
      case SomeoneType.ADULT:
        return recipient?.age === 'adult';
      case SomeoneType.AZURE_PERSON:
        return recipient?.race?.name === 'azure' && recipient?.age === 'adult';
      case SomeoneType.CRIMSON_PERSON:
        return recipient?.race?.name === 'crimson' && recipient?.age === 'adult';
      case SomeoneType.GOLDEN_PERSON:
        return recipient?.race?.name === 'golden' && recipient?.age === 'adult';
      default:
        return recipientType === 'human' || recipientType === 'cop';
    }
  }

  /**
   * Handle body part eaten event
   */
  onBodyPartEaten(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { partId, isCooked } = data;
    const templateId = objective.templateId;

    // Check if the body part matches what objective requires
    const bodyPartMatches = !objective.bodyPart || objective.bodyPart === partId;
    if (!bodyPartMatches) return;

    switch (templateId) {
      case 'cook_eat_bodypart':
        // Eat cooked body part
        if (isCooked) {
          this.completeStep(objective, 'eat');
        }
        break;

      case 'eat_prisoner_part':
        // Eat body part from prisoner
        this.completeStep(objective, 'eat');
        break;
    }
  }

  /**
   * Handle corpse dropped event
   */
  onCorpseDropped(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { x, y } = data;
    const templateId = objective.templateId;

    switch (templateId) {
      case 'leave_corpse_location':
        // Check if dropped at required location
        if (objective.location) {
          const atLocation = this.isPlayerInLocation(objective.location);
          if (atLocation) {
            this.completeObjective(objective);
          }
        }
        break;

      case 'kill_store_in_your_home':
        // Check if dropped in player's home
        const inYourHome = this.isPlayerInLocation(LocationType.YOUR_HOME);
        if (inYourHome) {
          this.completeStep(objective, 'store');
        }
        break;

      case 'leave_letter_corpse':
        // Check if corpse left at location (letter step handled separately)
        if (objective.location) {
          const atLetterLocation = this.isPlayerInLocation(objective.location);
          if (atLetterLocation) {
            this.completeStep(objective, 'leave');
          }
        }
        break;
    }
  }

  /**
   * Handle human started following event
   */
  onHumanStartedFollowing(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { human } = data;
    const templateId = objective.templateId;

    // Check if the human matches target type
    const targetMatches = this.matchesTargetType(objective.targetType, human);
    if (!targetMatches && objective.targetType) return;

    switch (templateId) {
      case 'lure_action_kill':
      case 'lure_imprison':
      case 'lure_ritual_sacrifice':
      case 'lure_location_kill_action':
        // Note: lure step is completed when they arrive at destination, not when they start following
        // But we track that they started following
        objective._followingHuman = human;
        break;
    }
  }

  /**
   * Handle entity imprisoned event
   */
  onEntityImprisoned(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { entity } = data;
    const templateId = objective.templateId;

    // Check if entity matches target type
    const targetMatches = this.matchesTargetType(objective.targetType, entity);
    if (!targetMatches && objective.targetType) return;

    switch (templateId) {
      case 'lure_imprison':
        // Complete both lure and imprison steps
        this.completeStep(objective, 'lure');
        this.completeStep(objective, 'imprison');
        break;
    }
  }

  /**
   * Handle ritual performed event
   */
  onRitualPerformed(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const templateId = objective.templateId;

    switch (templateId) {
      case 'perform_ritual':
        // Single-step ritual objective
        this.completeObjective(objective);
        break;

      case 'lure_ritual_sacrifice':
        // Complete ritual step (kill step should already be complete)
        this.completeStep(objective, 'ritual');
        break;
    }
  }

  /**
   * Handle skin worn event
   */
  onSkinWorn(data) {
    const objective = this.getCurrentObjective();
    if (!objective || objective.isComplete) return;

    const { isPrisonerSkin } = data;
    const templateId = objective.templateId;

    switch (templateId) {
      case 'skin_and_wear':
        // Must be prisoner skin
        if (isPrisonerSkin) {
          this.completeStep(objective, 'wear');
        }
        break;
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.unregisterListeners();
  }
}
