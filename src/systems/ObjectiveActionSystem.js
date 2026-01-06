import Phaser from 'phaser';
import {
  EntityConstraint,
  EntityType,
  EntityStatus,
  WithObject,
  isBodyPartWithObject,
  getBodyPartWithObjects
} from './EntityConstraint.js';
import { BODY_PARTS } from '../config/constants.js';

/**
 * Objective Action Types
 */
export const ObjectiveActionType = {
  LEAVE_LETTER: 'leaveLetter',    // L key - on corpses
  FRIPPLE: 'fripple',              // H key - entity constraint
  PIZZLE: 'pizzle',                // P key - entity + body part constraint
  JALLY: 'jally',                  // J key - same as Pizzle
  MOOTITI: 'mootiti'               // M key - entity + with clause
};

/**
 * Key mappings for objective actions
 */
export const ObjectiveActionKeys = {
  [ObjectiveActionType.LEAVE_LETTER]: { key: 'L', keyCode: Phaser.Input.Keyboard.KeyCodes.L },
  [ObjectiveActionType.FRIPPLE]: { key: 'H', keyCode: Phaser.Input.Keyboard.KeyCodes.H },
  [ObjectiveActionType.PIZZLE]: { key: 'P', keyCode: Phaser.Input.Keyboard.KeyCodes.P },
  [ObjectiveActionType.JALLY]: { key: 'J', keyCode: Phaser.Input.Keyboard.KeyCodes.J },
  [ObjectiveActionType.MOOTITI]: { key: 'M', keyCode: Phaser.Input.Keyboard.KeyCodes.M }
};

/**
 * ObjectiveAction - Represents a single objective-specific action
 */
export class ObjectiveAction {
  constructor(config) {
    // Action type (from ObjectiveActionType)
    this.type = config.type;

    // Unique ID for this action instance
    this.id = config.id || `${config.type}_${Date.now()}`;

    // Display name shown in action widget
    this.displayName = config.displayName || this.getDefaultDisplayName();

    // Entity constraint - what entities this action can target
    this.entityConstraint = config.entityConstraint || null;

    // Body part constraint (for Pizzle/Jally) - matches carried or nearby body parts
    this.bodyPartConstraint = config.bodyPartConstraint || null;

    // With clause (for Mootiti) - what object must be held/used
    this.withObject = config.withObject || null;

    // Callback when action is executed
    this.onExecute = config.onExecute || null;

    // Reference to the objective this action belongs to
    this.objectiveId = config.objectiveId || null;

    // Whether this action is currently active (objective is active)
    this.isActive = config.isActive !== false;
  }

  getDefaultDisplayName() {
    switch (this.type) {
      case ObjectiveActionType.LEAVE_LETTER: return 'Leave Letter';
      case ObjectiveActionType.FRIPPLE: return 'Fripple';
      case ObjectiveActionType.PIZZLE: return 'Pizzle';
      case ObjectiveActionType.JALLY: return 'Jally';
      case ObjectiveActionType.MOOTITI: return 'Mootiti';
      default: return 'Action';
    }
  }

  getKeyBinding() {
    return ObjectiveActionKeys[this.type] || { key: '?', keyCode: null };
  }
}

/**
 * ObjectiveActionSystem - Manages objective-specific actions
 *
 * This system:
 * 1. Tracks registered objective actions
 * 2. Checks if actions are available for nearby entities
 * 3. Provides actions to the ActionSystem for display
 * 4. Handles execution of objective actions
 */
export class ObjectiveActionSystem {
  constructor(scene) {
    this.scene = scene;

    // Registered objective actions
    this.actions = new Map(); // id -> ObjectiveAction

    // Action range (same as normal actions)
    this.actionRange = 20;
  }

  /**
   * Register a new objective action
   * @param {ObjectiveAction} action
   */
  registerAction(action) {
    this.actions.set(action.id, action);
  }

  /**
   * Unregister an objective action
   * @param {string} actionId
   */
  unregisterAction(actionId) {
    this.actions.delete(actionId);
  }

  /**
   * Unregister all actions for a specific objective
   * @param {string} objectiveId
   */
  unregisterObjectiveActions(objectiveId) {
    for (const [id, action] of this.actions) {
      if (action.objectiveId === objectiveId) {
        this.actions.delete(id);
      }
    }
  }

  /**
   * Set active state for actions belonging to an objective
   * @param {string} objectiveId
   * @param {boolean} isActive
   */
  setObjectiveActionsActive(objectiveId, isActive) {
    for (const action of this.actions.values()) {
      if (action.objectiveId === objectiveId) {
        action.isActive = isActive;
      }
    }
  }

  /**
   * Get available objective actions for an entity
   * @param {Object} entity - The target entity
   * @returns {Array} Array of action configs for ActionSystem
   */
  getActionsForEntity(entity) {
    if (!entity) return [];

    const availableActions = [];
    const context = { scene: this.scene };

    for (const action of this.actions.values()) {
      if (!action.isActive) continue;

      // Check if this action can target this entity
      if (this.canTargetEntity(action, entity, context)) {
        const keyBinding = action.getKeyBinding();

        availableActions.push({
          name: action.displayName,
          key: keyBinding.key,
          keyCode: keyBinding.keyCode,
          callback: () => this.executeAction(action, entity),
          isObjectiveAction: true,  // Flag for yellow coloring
          objectiveActionId: action.id
        });
      }
    }

    return availableActions;
  }

  /**
   * Get available objective actions for corpses specifically
   * @param {Object} corpse - The corpse entity
   * @returns {Array} Array of action configs
   */
  getActionsForCorpse(corpse) {
    if (!corpse) return [];

    const availableActions = [];
    const context = { scene: this.scene };

    // Create a corpse-like object for constraint matching
    const corpseEntity = {
      isCorpse: true,
      originalEntity: corpse.entity || corpse
    };

    for (const action of this.actions.values()) {
      if (!action.isActive) continue;

      let canUse = false;

      // Leave Letter only works on corpses
      if (action.type === ObjectiveActionType.LEAVE_LETTER) {
        canUse = true;
        // If there's an entity constraint, check it
        if (action.entityConstraint && !action.entityConstraint.matches(corpseEntity, context)) {
          canUse = false;
        }
      }

      // Mootiti can work on corpses (check entity constraint and with clause)
      if (action.type === ObjectiveActionType.MOOTITI) {
        // Mootiti works on corpses - check if entityConstraint is CORPSE or not set
        const targetCorpse = !action.entityConstraint || action.entityConstraint.type === EntityType.CORPSE;
        if (targetCorpse) {
          canUse = true;
          // Also check the 'with' clause
          if (action.withObject && !this.checkWithClause(action.withObject)) {
            canUse = false;
          }
        }
      }

      // Fripple, Pizzle, Jally can work on corpses if their constraint is CORPSE type
      if (action.type === ObjectiveActionType.FRIPPLE ||
          action.type === ObjectiveActionType.PIZZLE ||
          action.type === ObjectiveActionType.JALLY) {
        if (action.entityConstraint && action.entityConstraint.type === EntityType.CORPSE) {
          canUse = true;
          // For Pizzle/Jally, also check body part constraint
          if ((action.type === ObjectiveActionType.PIZZLE || action.type === ObjectiveActionType.JALLY) &&
              action.bodyPartConstraint) {
            const carriedBodyPart = this.scene.player?.carriedBodyPart;
            if (!carriedBodyPart || !action.bodyPartConstraint.matches(carriedBodyPart, context)) {
              canUse = false;
            }
          }
        }
      }

      if (canUse) {
        const keyBinding = action.getKeyBinding();
        availableActions.push({
          name: action.displayName,
          key: keyBinding.key,
          keyCode: keyBinding.keyCode,
          callback: () => this.executeAction(action, { ...corpse, isCorpse: true }),
          isObjectiveAction: true,
          objectiveActionId: action.id
        });
      }
    }

    return availableActions;
  }

  /**
   * Check if an action can target an entity
   */
  canTargetEntity(action, entity, context) {
    // For Leave Letter, use getActionsForCorpse instead
    if (action.type === ObjectiveActionType.LEAVE_LETTER) {
      return false; // Handled separately
    }

    // Mootiti always targets corpses - handled by getActionsForCorpse
    if (action.type === ObjectiveActionType.MOOTITI) {
      return false; // Handled separately
    }

    // Actions with CORPSE entity constraint are handled by getActionsForCorpse
    if (action.entityConstraint && action.entityConstraint.type === EntityType.CORPSE) {
      return false; // Handled separately
    }

    // Check entity constraint
    if (action.entityConstraint) {
      if (!action.entityConstraint.matches(entity, context)) {
        return false;
      }
    }

    // For Pizzle/Jally, also need to check body part constraint if specified
    if (action.type === ObjectiveActionType.PIZZLE || action.type === ObjectiveActionType.JALLY) {
      if (action.bodyPartConstraint) {
        // Check if player is carrying a matching body part
        const carriedBodyPart = this.scene.player?.carriedBodyPart;
        if (carriedBodyPart) {
          if (!action.bodyPartConstraint.matches(carriedBodyPart, context)) {
            return false;
          }
        } else {
          // No body part carried - action not available
          return false;
        }
      }
    }

    // For Mootiti, check the 'with' clause
    if (action.type === ObjectiveActionType.MOOTITI && action.withObject) {
      if (!this.checkWithClause(action.withObject)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if the 'with' clause is satisfied
   * @param {string} withObject - The required object from WithObject enum
   * @returns {boolean}
   */
  checkWithClause(withObject) {
    const player = this.scene.player;
    if (!player) return false;

    switch (withObject) {
      case WithObject.RAT:
        // Must be carrying a rat
        return !!player.carriedRat;

      case WithObject.LAMP:
        // Must be carrying a lamp
        return !!player.carriedLamp;

      case WithObject.KNIFE:
        // Knife is always available (player always has it)
        return true;

      case WithObject.HANDS:
        // Hands are always available
        return true;

      case WithObject.FUNNY:
        // Must be carrying funnies body part
        return player.carriedBodyPart?.partType === BODY_PARTS.FUNNIES.id ||
               player.carriedBodyPart?.bodyPartType === BODY_PARTS.FUNNIES.id;

      default:
        // Check if it's a body part type
        if (isBodyPartWithObject(withObject)) {
          const carriedPart = player.carriedBodyPart;
          if (!carriedPart) return false;
          const partType = carriedPart.partType || carriedPart.bodyPartType;
          return partType === withObject;
        }
        return false;
    }
  }

  /**
   * Execute an objective action
   * @param {ObjectiveAction} action
   * @param {Object} targetEntity
   */
  executeAction(action, targetEntity) {
    // Call the action's callback if provided
    if (action.onExecute) {
      action.onExecute(targetEntity, this.scene);
    }

    // Emit event for objective system to track
    this.scene.events.emit('objectiveActionExecuted', {
      actionType: action.type,
      actionId: action.id,
      objectiveId: action.objectiveId,
      targetEntity: targetEntity,
      withObject: action.withObject || null  // Include for Mootiti tracking
    });
  }

  /**
   * Helper to register a Leave Letter action
   */
  registerLeaveLetter(config = {}) {
    const action = new ObjectiveAction({
      type: ObjectiveActionType.LEAVE_LETTER,
      displayName: config.displayName || 'Leave Letter',
      entityConstraint: config.entityConstraint || null,
      objectiveId: config.objectiveId,
      onExecute: config.onExecute,
      id: config.id
    });
    this.registerAction(action);
    return action;
  }

  /**
   * Helper to register a Fripple action
   */
  registerFripple(config = {}) {
    const action = new ObjectiveAction({
      type: ObjectiveActionType.FRIPPLE,
      displayName: config.displayName || 'Fripple',
      entityConstraint: config.entityConstraint,
      objectiveId: config.objectiveId,
      onExecute: config.onExecute,
      id: config.id
    });
    this.registerAction(action);
    return action;
  }

  /**
   * Helper to register a Pizzle action
   */
  registerPizzle(config = {}) {
    const action = new ObjectiveAction({
      type: ObjectiveActionType.PIZZLE,
      displayName: config.displayName || 'Pizzle',
      entityConstraint: config.entityConstraint,
      bodyPartConstraint: config.bodyPartConstraint,
      objectiveId: config.objectiveId,
      onExecute: config.onExecute,
      id: config.id
    });
    this.registerAction(action);
    return action;
  }

  /**
   * Helper to register a Jally action
   */
  registerJally(config = {}) {
    const action = new ObjectiveAction({
      type: ObjectiveActionType.JALLY,
      displayName: config.displayName || 'Jally',
      entityConstraint: config.entityConstraint,
      bodyPartConstraint: config.bodyPartConstraint,
      objectiveId: config.objectiveId,
      onExecute: config.onExecute,
      id: config.id
    });
    this.registerAction(action);
    return action;
  }

  /**
   * Helper to register a Mootiti action
   */
  registerMootiti(config = {}) {
    const action = new ObjectiveAction({
      type: ObjectiveActionType.MOOTITI,
      displayName: config.displayName || 'Mootiti',
      entityConstraint: config.entityConstraint,
      withObject: config.withObject,
      objectiveId: config.objectiveId,
      onExecute: config.onExecute,
      id: config.id
    });
    this.registerAction(action);
    return action;
  }

  /**
   * Clear all registered actions
   */
  clearAllActions() {
    this.actions.clear();
  }

  /**
   * Get all registered actions (for debugging)
   */
  getAllActions() {
    return Array.from(this.actions.values());
  }
}
