import { BODY_PARTS } from '../config/constants.js';

/**
 * Entity types for constraint matching
 */
export const EntityType = {
  HUMAN: 'human',
  PET: 'pet',
  RAT: 'rat',
  CORPSE: 'corpse',
  BODY_PART: 'bodyPart'
};

/**
 * Entity status for constraint matching
 */
export const EntityStatus = {
  ALIVE: 'alive',
  DEAD: 'dead',
  ANY: 'any'
};

/**
 * Pet types
 */
export const PetType = {
  CAT: 'cat',
  DOG: 'dog',
  ANY: 'any'
};

/**
 * Human age types
 */
export const HumanAge = {
  ADULT: 'adult',
  CHILD: 'child',
  ANY: 'any'
};

/**
 * Human gender types
 */
export const HumanGender = {
  MALE: 'male',
  FEMALE: 'female',
  ANY: 'any'
};

/**
 * Race types (matching constants.js RACES)
 */
export const Race = {
  AZURE: 'azure',
  CRIMSON: 'crimson',
  GOLDEN: 'golden',
  ANY: 'any'
};

/**
 * Neighborhood types
 */
export const Neighborhood = {
  POOR: 'poor',
  MEDIUM: 'medium',
  RICH: 'rich',
  ANY: 'any'
};

/**
 * "With" object types for Mootiti action
 * References BODY_PARTS from constants for body part types
 */
export const WithObject = {
  RAT: 'rat',
  KNIFE: 'knife',
  HANDS: 'hands',
  LAMP: 'lamp',
  FUNNY: 'funny',  // Funnies body part
  // Body parts - dynamically reference from BODY_PARTS
  BODY_PART_HEAD: BODY_PARTS.HEAD.id,
  BODY_PART_HEART: BODY_PARTS.HEART.id,
  BODY_PART_ARM: BODY_PARTS.ARM.id,
  BODY_PART_LEG: BODY_PARTS.LEG.id,
  BODY_PART_FUNNIES: BODY_PARTS.FUNNIES.id,
  BODY_PART_SKIN: BODY_PARTS.SKIN.id
};

/**
 * Get all body part with-object types (for easy iteration)
 */
export function getBodyPartWithObjects() {
  return Object.values(BODY_PARTS).map(part => part.id);
}

/**
 * Check if a WithObject is a body part type
 */
export function isBodyPartWithObject(withObj) {
  return getBodyPartWithObjects().includes(withObj);
}

/**
 * EntityConstraint - Flexible constraint system for matching entities
 *
 * Usage examples:
 * - Match any human: { type: EntityType.HUMAN }
 * - Match dead adult: { type: EntityType.HUMAN, status: EntityStatus.DEAD, age: HumanAge.ADULT }
 * - Match azure child from poor neighborhood:
 *   { type: EntityType.HUMAN, age: HumanAge.CHILD, race: Race.AZURE, neighborhood: Neighborhood.POOR }
 * - Match any cat: { type: EntityType.PET, petType: PetType.CAT }
 * - Match cooked body part: { type: EntityType.BODY_PART, isCooked: true }
 */
export class EntityConstraint {
  constructor(config = {}) {
    // Core type (required)
    this.type = config.type || EntityType.HUMAN;

    // Status (alive/dead/any) - applies to humans, pets, rats
    this.status = config.status || EntityStatus.ANY;

    // Human-specific constraints
    this.age = config.age || HumanAge.ANY;
    this.gender = config.gender || HumanGender.ANY;
    this.race = config.race || Race.ANY;
    this.neighborhood = config.neighborhood || Neighborhood.ANY;

    // Pet-specific constraints
    this.petType = config.petType || PetType.ANY;
    this.petColor = config.petColor || null; // e.g., 'orange', 'black'

    // Body part specific constraints
    this.bodyPartType = config.bodyPartType || null; // e.g., 'head', 'arm'
    this.isCooked = config.isCooked; // undefined = any, true/false = specific

    // Future extensibility - store any additional constraints
    this.extra = config.extra || {};
  }

  /**
   * Check if an entity matches this constraint
   * @param {Object} entity - The entity to check (Human, Pet, Rat, or body part data)
   * @param {Object} context - Additional context (scene reference for neighborhood lookup)
   * @returns {boolean}
   */
  matches(entity, context = {}) {
    if (!entity) return false;

    // Determine entity type
    const entityType = this.getEntityType(entity);

    // Type must match
    if (this.type !== entityType) return false;

    // Check type-specific constraints
    switch (entityType) {
      case EntityType.HUMAN:
        return this.matchesHuman(entity, context);
      case EntityType.PET:
        return this.matchesPet(entity, context);
      case EntityType.RAT:
        return this.matchesRat(entity, context);
      case EntityType.CORPSE:
        return this.matchesCorpse(entity, context);
      case EntityType.BODY_PART:
        return this.matchesBodyPart(entity, context);
      default:
        return false;
    }
  }

  /**
   * Determine the type of an entity
   */
  getEntityType(entity) {
    // Body part (carried or dropped)
    if (entity.partType || entity.bodyPartType) {
      return EntityType.BODY_PART;
    }

    // Corpse (dead human/pet stored in corpse manager)
    if (entity.isCorpse) {
      return EntityType.CORPSE;
    }

    // Rat
    if (entity.isRat) {
      return EntityType.RAT;
    }

    // Pet
    if (entity.isPet) {
      return EntityType.PET;
    }

    // Human (has race property)
    if (entity.race !== undefined) {
      return EntityType.HUMAN;
    }

    return null;
  }

  /**
   * Match against a human entity
   */
  matchesHuman(human, context) {
    // Status check
    if (this.status !== EntityStatus.ANY) {
      const isAlive = human.isAlive !== false;
      if (this.status === EntityStatus.ALIVE && !isAlive) return false;
      if (this.status === EntityStatus.DEAD && isAlive) return false;
    }

    // Age check
    if (this.age !== HumanAge.ANY && human.age !== this.age) {
      return false;
    }

    // Gender check
    if (this.gender !== HumanGender.ANY && human.gender !== this.gender) {
      return false;
    }

    // Race check
    if (this.race !== Race.ANY) {
      const humanRace = human.race?.name || human.race;
      if (humanRace !== this.race) return false;
    }

    // Neighborhood check
    if (this.neighborhood !== Neighborhood.ANY) {
      const humanNeighborhood = this.getEntityNeighborhood(human, context);
      if (humanNeighborhood !== this.neighborhood) return false;
    }

    // Check extra constraints (for future extensibility)
    for (const [key, value] of Object.entries(this.extra)) {
      if (human[key] !== value) return false;
    }

    return true;
  }

  /**
   * Match against a pet entity
   */
  matchesPet(pet, context) {
    // Status check
    if (this.status !== EntityStatus.ANY) {
      const isAlive = pet.isAlive !== false;
      if (this.status === EntityStatus.ALIVE && !isAlive) return false;
      if (this.status === EntityStatus.DEAD && isAlive) return false;
    }

    // Pet type check
    if (this.petType !== PetType.ANY && pet.petType !== this.petType) {
      return false;
    }

    // Pet color check
    if (this.petColor !== null) {
      const petColorName = pet.colorVariant?.name || pet.color;
      if (petColorName !== this.petColor) return false;
    }

    // Neighborhood check (pets have homeBuilding too)
    if (this.neighborhood !== Neighborhood.ANY) {
      const petNeighborhood = this.getEntityNeighborhood(pet, context);
      if (petNeighborhood !== this.neighborhood) return false;
    }

    return true;
  }

  /**
   * Match against a rat entity
   */
  matchesRat(rat, context) {
    // Status check
    if (this.status !== EntityStatus.ANY) {
      const isAlive = rat.isAlive !== false;
      if (this.status === EntityStatus.ALIVE && !isAlive) return false;
      if (this.status === EntityStatus.DEAD && isAlive) return false;
    }

    // Rats don't have many other properties to match
    return true;
  }

  /**
   * Match against a corpse
   */
  matchesCorpse(corpse, context) {
    // Corpses are always dead, so status check only makes sense for DEAD or ANY
    if (this.status === EntityStatus.ALIVE) return false;

    // If corpse has original entity data, check those constraints
    if (corpse.originalEntity) {
      // Check human-specific properties if it was a human
      if (corpse.originalEntity.race !== undefined) {
        if (this.age !== HumanAge.ANY && corpse.originalEntity.age !== this.age) {
          return false;
        }
        if (this.gender !== HumanGender.ANY && corpse.originalEntity.gender !== this.gender) {
          return false;
        }
        if (this.race !== Race.ANY) {
          const race = corpse.originalEntity.race?.name || corpse.originalEntity.race;
          if (race !== this.race) return false;
        }
      }

      // Check pet-specific properties if it was a pet
      if (corpse.originalEntity.isPet) {
        if (this.petType !== PetType.ANY && corpse.originalEntity.petType !== this.petType) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Match against a body part
   */
  matchesBodyPart(bodyPart, context) {
    // Body part type check
    if (this.bodyPartType !== null) {
      const partType = bodyPart.partType || bodyPart.bodyPartType || bodyPart.type;
      if (partType !== this.bodyPartType) return false;
    }

    // Cooked status check
    if (this.isCooked !== undefined) {
      const isCooked = bodyPart.isCooked === true;
      if (this.isCooked !== isCooked) return false;
    }

    return true;
  }

  /**
   * Get the neighborhood of an entity
   */
  getEntityNeighborhood(entity, context) {
    // Check homeBuilding first
    if (entity.homeBuilding?.neighborhood) {
      return entity.homeBuilding.neighborhood;
    }

    // Try to determine from position using townGenerator
    if (context.scene?.townGenerator && entity.sprite) {
      const tileX = Math.floor(entity.sprite.x / 16);
      const tileY = Math.floor(entity.sprite.y / 16);
      const neighborhood = context.scene.townGenerator.getNeighborhoodAt(tileX, tileY);
      return neighborhood?.name || null;
    }

    return null;
  }

  /**
   * Create a human-readable description of this constraint
   */
  describe() {
    const parts = [];

    // Status
    if (this.status !== EntityStatus.ANY) {
      parts.push(this.status);
    }

    // Type-specific descriptions
    switch (this.type) {
      case EntityType.HUMAN:
        if (this.age !== HumanAge.ANY) parts.push(this.age);
        if (this.gender !== HumanGender.ANY) parts.push(this.gender);
        if (this.race !== Race.ANY) parts.push(this.race);
        parts.push('human');
        if (this.neighborhood !== Neighborhood.ANY) {
          parts.push(`from ${this.neighborhood} neighborhood`);
        }
        break;

      case EntityType.PET:
        if (this.petColor) parts.push(this.petColor);
        if (this.petType !== PetType.ANY) {
          parts.push(this.petType);
        } else {
          parts.push('pet');
        }
        break;

      case EntityType.RAT:
        parts.push('rat');
        break;

      case EntityType.CORPSE:
        parts.push('corpse');
        break;

      case EntityType.BODY_PART:
        if (this.isCooked !== undefined) {
          parts.push(this.isCooked ? 'cooked' : 'raw');
        }
        if (this.bodyPartType) {
          parts.push(this.bodyPartType);
        } else {
          parts.push('body part');
        }
        break;
    }

    return parts.join(' ');
  }

  /**
   * Static factory methods for common constraints
   */
  static anyHuman() {
    return new EntityConstraint({ type: EntityType.HUMAN });
  }

  static anyAdult() {
    return new EntityConstraint({ type: EntityType.HUMAN, age: HumanAge.ADULT });
  }

  static anyChild() {
    return new EntityConstraint({ type: EntityType.HUMAN, age: HumanAge.CHILD });
  }

  static deadHuman() {
    return new EntityConstraint({ type: EntityType.HUMAN, status: EntityStatus.DEAD });
  }

  static anyPet() {
    return new EntityConstraint({ type: EntityType.PET });
  }

  static anyCat() {
    return new EntityConstraint({ type: EntityType.PET, petType: PetType.CAT });
  }

  static anyDog() {
    return new EntityConstraint({ type: EntityType.PET, petType: PetType.DOG });
  }

  static anyRat() {
    return new EntityConstraint({ type: EntityType.RAT });
  }

  static anyCorpse() {
    return new EntityConstraint({ type: EntityType.CORPSE });
  }

  static anyBodyPart() {
    return new EntityConstraint({ type: EntityType.BODY_PART });
  }

  static cookedBodyPart() {
    return new EntityConstraint({ type: EntityType.BODY_PART, isCooked: true });
  }

  static rawBodyPart() {
    return new EntityConstraint({ type: EntityType.BODY_PART, isCooked: false });
  }
}
