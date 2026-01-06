import { BODY_PARTS } from '../config/constants.js';
import { LocationType } from './PlayerLocationSystem.js';

/**
 * Action types for objectives
 */
export const ActionType = {
  FRIPPLE: 'fripple',
  PIZZLE: 'pizzle',
  JALLY: 'jally'
};

export const ActionNames = {
  [ActionType.FRIPPLE]: 'Fripple',
  [ActionType.PIZZLE]: 'Pizzle',
  [ActionType.JALLY]: 'Jally'
};

export const ActionVerbs = {
  [ActionType.FRIPPLE]: 'fripple',
  [ActionType.PIZZLE]: 'pizzle',
  [ActionType.JALLY]: 'jally'
};

/**
 * Someone types for objectives
 */
export const SomeoneType = {
  COP: 'cop',
  DOG: 'dog',
  CAT: 'cat',
  KID: 'kid',
  ADULT: 'adult',
  AZURE_PERSON: 'azure_person',
  CRIMSON_PERSON: 'crimson_person',
  GOLDEN_PERSON: 'golden_person',
  PRISONER: 'prisoner',
  ANYONE: 'anyone'
};

export const SomeoneNames = {
  [SomeoneType.COP]: 'a cop',
  [SomeoneType.DOG]: 'a dog',
  [SomeoneType.CAT]: 'a cat',
  [SomeoneType.KID]: 'a small humanoid',
  [SomeoneType.ADULT]: 'a big humanoid',
  [SomeoneType.AZURE_PERSON]: 'a big azure humanoid',
  [SomeoneType.CRIMSON_PERSON]: 'a big crimson humanoid',
  [SomeoneType.GOLDEN_PERSON]: 'a big golden humanoid',
  [SomeoneType.PRISONER]: 'a prisoner',
  [SomeoneType.ANYONE]: 'someone'
};

/**
 * Object types for Mootiti action
 */
export const ObjectType = {
  RAT: 'rat',
  KNIFE: 'knife',
  HANDS: 'hands',
  LAMP: 'lamp',
  FUNNY: 'funny',
  BODY_PART: 'bodyPart'
};

export const ObjectNames = {
  [ObjectType.RAT]: 'a rat',
  [ObjectType.KNIFE]: 'a knife',
  [ObjectType.HANDS]: 'your hands',
  [ObjectType.LAMP]: 'a lamp',
  [ObjectType.FUNNY]: 'their funnies',
  [ObjectType.BODY_PART]: 'a body part'
};

/**
 * Location types for objectives (maps to PlayerLocationSystem)
 */
export const ObjectiveLocationType = {
  WOODS: LocationType.WOODS,
  DOWNTOWN: LocationType.DOWNTOWN,
  SOMEONE_HOME: 'someoneHome',
  YOUR_HOME: LocationType.YOUR_HOME,
  NEAR_POLICE: LocationType.NEAR_POLICE_STATION
};

export const ObjectiveLocationNames = {
  [ObjectiveLocationType.WOODS]: 'the woods',
  [ObjectiveLocationType.DOWNTOWN]: 'a downtown alley',
  [ObjectiveLocationType.SOMEONE_HOME]: "someone else's home",
  [ObjectiveLocationType.YOUR_HOME]: 'your home',
  [ObjectiveLocationType.NEAR_POLICE]: 'near the police station'
};

/**
 * Body part types for objectives
 */
export const BodyPartType = {
  HEAD: BODY_PARTS.HEAD.id,
  HEART: BODY_PARTS.HEART.id,
  ARM: BODY_PARTS.ARM.id,
  LEG: BODY_PARTS.LEG.id,
  FUNNIES: BODY_PARTS.FUNNIES.id,
  SKIN: BODY_PARTS.SKIN.id
};

export const BodyPartNames = {
  [BodyPartType.HEAD]: 'head',
  [BodyPartType.HEART]: 'heart',
  [BodyPartType.ARM]: 'arm',
  [BodyPartType.LEG]: 'leg',
  [BodyPartType.FUNNIES]: 'funnies',
  [BodyPartType.SKIN]: 'skin'
};

/**
 * Random element pools for selection
 */
const RandomPools = {
  actions: Object.values(ActionType),
  someoneAll: Object.values(SomeoneType),
  someoneNotCop: Object.values(SomeoneType).filter(s => s !== SomeoneType.COP && s !== SomeoneType.PRISONER),
  someoneNotCopOrPrisoner: Object.values(SomeoneType).filter(s => s !== SomeoneType.COP && s !== SomeoneType.PRISONER),
  objects: Object.values(ObjectType),
  locations: Object.values(ObjectiveLocationType),
  locationsPublic: [ObjectiveLocationType.WOODS, ObjectiveLocationType.DOWNTOWN, ObjectiveLocationType.NEAR_POLICE],
  bodyParts: Object.values(BodyPartType),
  races: [SomeoneType.AZURE_PERSON, SomeoneType.CRIMSON_PERSON, SomeoneType.GOLDEN_PERSON]
};

/**
 * Helper to pick random element from array
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Helper to get display name for someone type
 */
function getSomeoneName(type) {
  return SomeoneNames[type] || 'someone';
}

/**
 * Helper to get display name for action type
 */
function getActionName(type) {
  return ActionNames[type] || 'act on';
}

/**
 * Helper to get display name for location type
 */
function getLocationName(type) {
  return ObjectiveLocationNames[type] || 'somewhere';
}

/**
 * Helper to get display name for body part type
 */
function getBodyPartName(type) {
  return BodyPartNames[type] || 'body part';
}

/**
 * Helper to get display name for object type
 */
function getObjectName(type) {
  return ObjectNames[type] || 'an object';
}

/**
 * Daily Objective Templates
 * Each template has:
 * - id: unique identifier
 * - titleTemplate: function that generates title from random elements
 * - descriptionTemplate: function that generates description
 * - xp: notoriety XP reward
 * - requiresPrisoner: whether this objective requires having a prisoner
 * - generateRandomElements: function that picks random elements for this objective
 * - highlightLocation: optional location to highlight on minimap
 */
export const DailyObjectiveTemplates = [
  // 1. Kill _someone_ and _action_ their corpse in their home
  {
    id: 'kill_action_corpse_their_home',
    generate: () => {
      const action = pickRandom(RandomPools.actions);
      const someone = pickRandom(RandomPools.someoneAll);
      return {
        title: `Kill & ${getActionName(action)} in Their Home`,
        description: `Kill ${getSomeoneName(someone)} and ${ActionVerbs[action]} their corpse within their own home. Leave your mark.`,
        xp: 8,
        action,
        targetType: someone,
        steps: [
          { id: 'kill', text: `Kill ${getSomeoneName(someone)} in their home`, complete: false },
          { id: 'action', text: `${getActionName(action)} the corpse`, complete: false }
        ]
      };
    }
  },

  // 2. Lure _someone(notcop)_ into your home, _action_ them, then kill them
  {
    id: 'lure_action_kill',
    generate: () => {
      const someone = pickRandom(RandomPools.someoneNotCopOrPrisoner);
      const action = pickRandom(RandomPools.actions);
      return {
        title: `Lure, ${getActionName(action)}, Kill`,
        description: `Convince ${getSomeoneName(someone)} to follow you home. ${getActionName(action)} them, then end their life.`,
        xp: 10,
        action,
        targetType: someone,
        highlightLocation: LocationType.YOUR_HOME,
        steps: [
          { id: 'lure', text: `Lure ${getSomeoneName(someone)} to your home`, complete: false },
          { id: 'action', text: `${getActionName(action)} them`, complete: false },
          { id: 'kill', text: 'Kill them', complete: false }
        ]
      };
    }
  },

  // 3. Lure _someone(notcop)_ into your home and imprison them
  {
    id: 'lure_imprison',
    generate: () => {
      const someone = pickRandom(RandomPools.someoneNotCopOrPrisoner);
      return {
        title: `New Guest: ${getSomeoneName(someone)}`,
        description: `Lure ${getSomeoneName(someone)} into your home and place them in a cage. They'll be staying a while.`,
        xp: 8,
        targetType: someone,
        highlightLocation: LocationType.YOUR_HOME,
        steps: [
          { id: 'lure', text: `Lure ${getSomeoneName(someone)} to your home`, complete: false },
          { id: 'imprison', text: 'Place them in a cage', complete: false }
        ]
      };
    }
  },

  // 4. Cook a dish from a _bodypart_ and gift it to _someone_
  {
    id: 'cook_gift_bodypart',
    generate: () => {
      const bodyPart = pickRandom(RandomPools.bodyParts);
      const someone = pickRandom(RandomPools.someoneNotCop);
      return {
        title: `Chef's Special: ${getBodyPartName(bodyPart)}`,
        description: `Prepare a cooked ${getBodyPartName(bodyPart)} and gift this "delicacy" to ${getSomeoneName(someone)}. Share your passion.`,
        xp: 10,
        bodyPart,
        targetType: someone,
        steps: [
          { id: 'cook', text: `Cook a ${getBodyPartName(bodyPart)}`, complete: false },
          { id: 'gift', text: `Gift it to ${getSomeoneName(someone)}`, complete: false }
        ]
      };
    }
  },

  // 5. Cook a dish from a _bodypart_ and eat it
  {
    id: 'cook_eat_bodypart',
    generate: () => {
      const bodyPart = pickRandom(RandomPools.bodyParts);
      return {
        title: `Taste of ${getBodyPartName(bodyPart)}`,
        description: `Cook a ${getBodyPartName(bodyPart)} and consume it yourself. Become one with your work.`,
        xp: 6,
        bodyPart,
        steps: [
          { id: 'cook', text: `Cook a ${getBodyPartName(bodyPart)}`, complete: false },
          { id: 'eat', text: 'Eat it', complete: false }
        ]
      };
    }
  },

  // 6. Kiss mother
  {
    id: 'kiss_mother',
    generate: () => {
      return {
        title: 'Kiss Mother Goodnight',
        description: `Return home and kiss mother. She's always there for you.`,
        xp: 2,
        highlightLocation: LocationType.YOUR_HOME
      };
    }
  },

  // 7. Mootiti a corpse with an _OBJECT_
  {
    id: 'mootiti_corpse_object',
    generate: () => {
      const object = pickRandom(RandomPools.objects);
      return {
        title: `Mootiti with ${getObjectName(object)}`,
        description: `Use ${getObjectName(object)} to mootiti a corpse.`,
        xp: 5,
        objectType: object
      };
    }
  },

  // 8. Leave a corpse in _location_
  {
    id: 'leave_corpse_location',
    generate: () => {
      const location = pickRandom(RandomPools.locationsPublic);
      return {
        title: `Display in ${getLocationName(location)}`,
        description: `Leave a corpse in ${getLocationName(location)} for discovery. Let them know you exist.`,
        xp: 6,
        location,
        highlightLocation: location !== ObjectiveLocationType.SOMEONE_HOME ? location : null
      };
    }
  },

  // 9. Perform a ritual at the site marked on the map
  {
    id: 'perform_ritual',
    generate: () => {
      return {
        title: 'The Ritual Calls',
        description: `Perform a sacrifice at the ritual site marked on your map. The voices demand tribute.`,
        xp: 5,
        highlightRitualSite: true
      };
    }
  },

  // 10. (prisoner required) Feed a prisoner a body part
  {
    id: 'feed_prisoner_bodypart',
    requiresPrisoner: true,
    generate: () => {
      const bodyPart = pickRandom(RandomPools.bodyParts);
      return {
        title: `Feed Them ${getBodyPartName(bodyPart)}`,
        description: `Force-feed a prisoner a ${getBodyPartName(bodyPart)}. Watch their despair grow.`,
        xp: 7,
        bodyPart
      };
    }
  },

  // 11. (prisoner required) kill a prisoner
  {
    id: 'kill_prisoner',
    requiresPrisoner: true,
    generate: () => {
      return {
        title: 'End Their Misery',
        description: `Kill one of your prisoners. Their time has come.`,
        xp: 4
      };
    }
  }
];

/**
 * DailyObjectiveBank - Generates and manages daily objectives
 */
export class DailyObjectiveBank {
  constructor(scene) {
    this.scene = scene;
    this.templates = DailyObjectiveTemplates;
  }

  /**
   * Check if player has any prisoners
   */
  hasPrisoner() {
    const cages = this.scene.cages || [];
    return cages.some(cage => cage.prisoner !== null);
  }

  /**
   * Get available templates based on game state
   */
  getAvailableTemplates() {
    const hasPrisoner = this.hasPrisoner();

    return this.templates.filter(template => {
      // Filter out prisoner-required objectives if no prisoner
      if (template.requiresPrisoner && !hasPrisoner) {
        return false;
      }
      return true;
    });
  }

  /**
   * Generate a random daily objective
   * @returns {Object} Generated objective with all properties
   */
  generateObjective() {
    const availableTemplates = this.getAvailableTemplates();

    if (availableTemplates.length === 0) {
      // Fallback objective if nothing available
      return {
        id: 'fallback',
        title: 'Survive the Day',
        description: 'Make it through another day. The voices will guide you.',
        xp: 2,
        rewardText: '+2 XP, +1 Sanity',
        penaltyText: '-1 Sanity'
      };
    }

    const template = pickRandom(availableTemplates);
    const generated = template.generate();

    // Build reward and penalty text
    const rewardText = `+${generated.xp} XP, +1 Sanity`;
    const penaltyText = '-1 Sanity';

    return {
      templateId: template.id,
      ...generated,
      rewardText,
      penaltyText,
      requiresPrisoner: template.requiresPrisoner || false
    };
  }

  /**
   * Get a specific template by ID (for testing)
   */
  getTemplateById(id) {
    return this.templates.find(t => t.id === id);
  }
}
