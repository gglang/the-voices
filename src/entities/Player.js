import Phaser from 'phaser';
import { PLAYER, DEPTH, PRISONER, CARRIED_TYPE, BODY_PARTS } from '../config/constants.js';
import { LineOfSight } from '../utils/LineOfSight.js';

/**
 * Player entity with movement, attack, and corpse carrying abilities
 */
export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = PLAYER.SPEED;
    this.canControl = true;

    // Attack state
    this.attackCooldown = PLAYER.ATTACK_COOLDOWN;
    this.lastAttackTime = -this.attackCooldown;

    // Corpse carrying
    this.carriedCorpse = null;

    // Prisoner carrying
    this.carriedPrisoner = null;

    // Body part carrying
    this.carriedBodyPart = null;
    this.carriedBodyPartSprite = null;

    // Rat carrying (living or dead, cooked or uncooked)
    this.carriedRat = null;
    this.carriedRatSprite = null;

    // Lamp carrying
    this.carriedLamp = null;
    this.carriedLampSprite = null;

    // Sleepy effect
    this.isSleepy = false;
    this.zzzSprite = null;
    this.zzzWiggleTime = 0;

    this.createSprite(x, y);
    this.setupInput();
    this.setupCollision();
  }

  createSprite(x, y) {
    this.sprite = this.scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(false);
    this.sprite.body.setSize(12, 12);
    this.sprite.body.setOffset(2, 4);
    this.sprite.setDepth(DEPTH.PLAYER);
  }

  setupInput() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasd = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.setupActionSystem();
  }

  setupCollision() {
    this.scene.events.once('update', () => {
      if (this.scene.walls) {
        this.scene.physics.add.collider(this.sprite, this.scene.walls);
      }
    });
  }

  // ==================== Action System ====================

  /**
   * Priority-based action system for spacebar
   * Higher priority actions are checked first
   */
  setupActionSystem() {
    this.spaceActions = [
      {
        name: 'attack',
        priority: 100,
        condition: () => this.canAttackTarget(),
        action: () => this.tryKill()
      },
      {
        name: 'dropCorpse',
        priority: 50,
        condition: () => this.carriedCorpse !== null,
        action: () => this.dropCorpse()
      },
      {
        name: 'dropPrisoner',
        priority: 45,
        condition: () => this.carriedPrisoner !== null,
        action: () => this.dropPrisoner()
      },
      {
        name: 'dropBodyPart',
        priority: 40,
        condition: () => this.carriedBodyPart !== null,
        action: () => this.dropBodyPart()
      },
      {
        name: 'dropRat',
        priority: 35,
        condition: () => this.carriedRat !== null,
        action: () => this.dropRat()
      },
      {
        name: 'dropLamp',
        priority: 30,
        condition: () => this.carriedLamp !== null,
        action: () => this.dropLamp()
      },
      {
        name: 'pickupCorpse',
        priority: 25,
        condition: () => this.canPickupCorpse(),
        action: () => this.pickupCorpse()
      }
    ];

    this.spaceActions.sort((a, b) => b.priority - a.priority);

    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', () => this.handleSpaceAction());

    // T key for secondary actions (knock, talk, close door)
    this.tKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.tKey.on('down', () => this.handleTAction());

    // F key for Follow Me action
    this.fKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.fKey.on('down', () => this.handleFAction());

    // R key for Whisper action (on prisoners)
    this.rKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.rKey.on('down', () => this.handleRAction());

    // E key for Eat action (body parts)
    this.eKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.eKey.on('down', () => this.handleEAction());

    // G key for Gift action (body parts to NPCs)
    this.gKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    this.gKey.on('down', () => this.handleGAction());

    // C key for Cook action (near stove)
    this.cKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.cKey.on('down', () => this.handleCAction());

    // Q key for Wear action (skin body part)
    this.qKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.qKey.on('down', () => this.handleQAction());

    // Register player context actions with ActionSystem (for popup display)
    this.scene.events.once('update', () => {
      if (this.scene.actionSystem) {
        this.scene.actionSystem.setPlayerContextActions(() => this.getPlayerContextActions());
      }
    });
  }

  /**
   * Get actions based on what player is currently holding/doing
   * These show in the action popup regardless of nearby objects
   */
  getPlayerContextActions() {
    const actions = [];

    // Rat context actions
    if (this.carriedRat) {
      // Eat is always available when holding a rat
      actions.push({
        name: 'Eat',
        key: 'E',
        keyCode: Phaser.Input.Keyboard.KeyCodes.E,
        callback: () => this.eatRat()
      });

      // Gift to pets/rats always available
      const nearbyPet = this.findNearbyPet();
      const nearbyRat = this.findNearbyRat();
      // Gift to humans/cops only if cooked
      const nearbyHuman = this.carriedRat.isCooked ? this.findNearbyHuman() : null;
      const nearbyCop = this.carriedRat.isCooked ? this.findNearbyCop() : null;

      if (nearbyRat) {
        actions.push({
          name: 'Gift',
          key: 'G',
          keyCode: Phaser.Input.Keyboard.KeyCodes.G,
          callback: () => this.giftRatToRat(nearbyRat)
        });
      } else if (nearbyPet) {
        actions.push({
          name: 'Gift',
          key: 'G',
          keyCode: Phaser.Input.Keyboard.KeyCodes.G,
          callback: () => this.giftRatToPet(nearbyPet)
        });
      } else if (nearbyHuman) {
        actions.push({
          name: 'Gift',
          key: 'G',
          keyCode: Phaser.Input.Keyboard.KeyCodes.G,
          callback: () => this.giftRatToHuman(nearbyHuman)
        });
      } else if (nearbyCop) {
        actions.push({
          name: 'Gift',
          key: 'G',
          keyCode: Phaser.Input.Keyboard.KeyCodes.G,
          callback: () => this.giftRatToHuman(nearbyCop)
        });
      }
    }

    // Lamp context actions
    if (this.carriedLamp) {
      actions.push({
        name: this.carriedLamp.isOn ? 'Turn Off' : 'Turn On',
        key: 'T',
        keyCode: Phaser.Input.Keyboard.KeyCodes.T,
        callback: () => this.toggleCarriedLamp()
      });
    }

    if (this.carriedBodyPart) {
      // Eat is always available when holding a body part
      actions.push({
        name: 'Eat',
        key: 'E',
        keyCode: Phaser.Input.Keyboard.KeyCodes.E,
        callback: () => this.eatBodyPart()
      });

      // Wear is available for skin (uncooked only)
      if (this.carriedBodyPart.partId === 'skin' && !this.carriedBodyPart.isCooked) {
        actions.push({
          name: 'Wear',
          key: 'Q',
          keyCode: Phaser.Input.Keyboard.KeyCodes.Q,
          callback: () => this.wearSkin()
        });
      }

      // Gift is available when near a valid target
      // Rats and pets can receive cooked or uncooked body parts
      // Humans and cops can only receive cooked body parts
      const nearbyRat = this.findNearbyRat();
      const nearbyPet = this.findNearbyPet();
      const nearbyHuman = this.carriedBodyPart.isCooked ? this.findNearbyHuman() : null;
      const nearbyCop = this.carriedBodyPart.isCooked ? this.findNearbyCop() : null;

      if (nearbyRat) {
        actions.push({
          name: 'Gift',
          key: 'G',
          keyCode: Phaser.Input.Keyboard.KeyCodes.G,
          callback: () => this.giftBodyPartToRat(nearbyRat)
        });
      } else if (nearbyPet) {
        actions.push({
          name: 'Gift',
          key: 'G',
          keyCode: Phaser.Input.Keyboard.KeyCodes.G,
          callback: () => this.giftToPet(nearbyPet)
        });
      } else if (nearbyHuman) {
        actions.push({
          name: 'Gift',
          key: 'G',
          keyCode: Phaser.Input.Keyboard.KeyCodes.G,
          callback: () => this.giftToHuman(nearbyHuman)
        });
      } else if (nearbyCop) {
        actions.push({
          name: 'Gift',
          key: 'G',
          keyCode: Phaser.Input.Keyboard.KeyCodes.G,
          callback: () => this.giftToHuman(nearbyCop)
        });
      }
    }

    return actions;
  }

  handleSpaceAction() {
    if (!this.canControl || this.scene.isGameOver) return;

    // Check if ActionSystem has a SPACE action to execute
    if (this.scene.actionSystem?.executeAction(Phaser.Input.Keyboard.KeyCodes.SPACE)) {
      return;
    }

    for (const actionDef of this.spaceActions) {
      if (actionDef.condition()) {
        actionDef.action();
        return;
      }
    }
  }

  handleTAction() {
    if (!this.canControl || this.scene.isGameOver) return;

    // Check if ActionSystem has a T action to execute
    this.scene.actionSystem?.executeAction(Phaser.Input.Keyboard.KeyCodes.T);
  }

  handleFAction() {
    if (!this.canControl || this.scene.isGameOver) return;

    // Check if ActionSystem has an F action to execute (Follow Me, Imprison, Release)
    this.scene.actionSystem?.executeAction(Phaser.Input.Keyboard.KeyCodes.F);
  }

  handleRAction() {
    if (!this.canControl || this.scene.isGameOver) return;

    // Check if ActionSystem has an R action to execute (Whisper)
    this.scene.actionSystem?.executeAction(Phaser.Input.Keyboard.KeyCodes.R);
  }

  handleEAction() {
    if (!this.canControl || this.scene.isGameOver) return;

    // Check if ActionSystem has an E action to execute first
    if (this.scene.actionSystem?.executeAction(Phaser.Input.Keyboard.KeyCodes.E)) {
      return;
    }

    // If carrying a body part, eat it
    if (this.carriedBodyPart) {
      this.eatBodyPart();
    }
  }

  handleGAction() {
    if (!this.canControl || this.scene.isGameOver) return;

    // Check if ActionSystem has a G action to execute first
    if (this.scene.actionSystem?.executeAction(Phaser.Input.Keyboard.KeyCodes.G)) {
      return;
    }

    // If carrying a body part, check for nearby targets to gift
    if (this.carriedBodyPart) {
      // Check for nearby rat (cooked or uncooked)
      const nearbyRat = this.findNearbyRat();
      if (nearbyRat) {
        this.giftBodyPartToRat(nearbyRat);
        return;
      }

      // Check for nearby pet (cooked or uncooked)
      const nearbyPet = this.findNearbyPet();
      if (nearbyPet) {
        this.giftToPet(nearbyPet);
        return;
      }

      // Check for nearby human/cop (cooked only)
      if (this.carriedBodyPart.isCooked) {
        const nearbyHuman = this.findNearbyHuman();
        if (nearbyHuman) {
          this.giftToHuman(nearbyHuman);
          return;
        }

        const nearbyCop = this.findNearbyCop();
        if (nearbyCop) {
          this.giftToHuman(nearbyCop);
          return;
        }
      }
    }
  }

  handleCAction() {
    if (!this.canControl || this.scene.isGameOver) return;

    // Check if ActionSystem has a C action to execute (Cook near stove)
    this.scene.actionSystem?.executeAction(Phaser.Input.Keyboard.KeyCodes.C);
  }

  handleQAction() {
    if (!this.canControl || this.scene.isGameOver) return;

    // Check if ActionSystem has a Q action to execute first
    if (this.scene.actionSystem?.executeAction(Phaser.Input.Keyboard.KeyCodes.Q)) {
      return;
    }

    // If carrying skin, wear it
    if (this.carriedBodyPart?.partId === 'skin' && !this.carriedBodyPart.isCooked) {
      this.wearSkin();
    }
  }

  /**
   * Find a pet within gift range
   */
  findNearbyPet() {
    const giftRange = 24;
    if (!this.scene.pets) return null;

    for (const pet of this.scene.pets) {
      if (!pet.isAlive) continue;
      const distance = this.distanceTo(pet.sprite);
      if (distance < giftRange) {
        return pet;
      }
    }
    return null;
  }

  /**
   * Find a human within gift range
   */
  findNearbyHuman() {
    const giftRange = 24;
    for (const human of this.scene.humans) {
      if (!human.isAlive) continue;
      const distance = this.distanceTo(human.sprite);
      if (distance < giftRange) {
        return human;
      }
    }
    return null;
  }

  /**
   * Find a cop within gift range
   */
  findNearbyCop() {
    const giftRange = 24;
    for (const cop of this.scene.police) {
      if (!cop.isAlive) continue;
      const distance = this.distanceTo(cop.sprite);
      if (distance < giftRange) {
        return cop;
      }
    }
    return null;
  }

  /**
   * Find a rat within gift range
   */
  findNearbyRat() {
    const giftRange = 24;
    if (!this.scene.rats) return null;

    for (const rat of this.scene.rats) {
      if (!rat.isAlive) continue;
      const distance = this.distanceTo(rat.sprite);
      if (distance < giftRange) {
        return rat;
      }
    }
    return null;
  }

  // ==================== Attack System ====================

  canAttackTarget() {
    return this.findNearestTarget() !== null;
  }

  findNearestTarget() {
    let nearestTarget = null;
    let nearestDistance = PLAYER.ATTACK_RANGE;
    let isTargetCop = false;
    let isTargetPet = false;
    let isTargetRat = false;

    // Check humans
    for (const human of this.scene.humans) {
      if (!human.isAlive) continue;
      const distance = this.distanceTo(human.sprite);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = human;
        isTargetCop = false;
        isTargetPet = false;
        isTargetRat = false;
      }
    }

    // Check police
    for (const cop of this.scene.police) {
      if (!cop.isAlive) continue;
      const distance = this.distanceTo(cop.sprite);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = cop;
        isTargetCop = true;
        isTargetPet = false;
        isTargetRat = false;
      }
    }

    // Check pets
    if (this.scene.pets) {
      for (const pet of this.scene.pets) {
        if (!pet.isAlive) continue;
        const distance = this.distanceTo(pet.sprite);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestTarget = pet;
          isTargetCop = false;
          isTargetPet = true;
          isTargetRat = false;
        }
      }
    }

    // Check rats
    if (this.scene.rats) {
      for (const rat of this.scene.rats) {
        if (!rat.isAlive) continue;
        const distance = this.distanceTo(rat.sprite);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestTarget = rat;
          isTargetCop = false;
          isTargetPet = false;
          isTargetRat = true;
        }
      }
    }

    return nearestTarget ? { target: nearestTarget, isCop: isTargetCop, isPet: isTargetPet, isRat: isTargetRat } : null;
  }

  tryKill() {
    if (!this.canControl || this.scene.isGameOver) return;

    const currentTime = this.scene.time.now;
    if (currentTime - this.lastAttackTime < this.attackCooldown) return;

    const result = this.findNearestTarget();
    if (!result) return;

    this.lastAttackTime = currentTime;

    const { target, isCop, isPet, isRat } = result;

    // Killing rats is NOT illegal - no witnesses, no cooldown display
    if (isRat) {
      target.kill();
      return;
    }

    // Mark as illegal activity (rats don't count)
    this.scene.markIllegalActivity();

    // Update HUD cooldown
    this.scene.hud?.triggerCooldown();

    // Get kill location for witness check
    const killX = target.sprite.x;
    const killY = target.sprite.y;

    if (isCop) {
      target.takeDamage();
    } else {
      target.kill();
    }

    // Check for witnesses (humans who saw the kill)
    // This applies to killing pets, kids, or any human
    this.checkForKillWitnesses(killX, killY);
  }

  /**
   * Check if any human witnessed a kill and identify player if so
   */
  checkForKillWitnesses(killX, killY) {
    const witnessRange = 5 * 16; // 5 tiles

    for (const human of this.scene.humans) {
      if (!human.isAlive) continue;

      const distance = Math.sqrt(
        Math.pow(human.sprite.x - killX, 2) +
        Math.pow(human.sprite.y - killY, 2)
      );

      if (distance < witnessRange) {
        // Check line of sight from human to kill location
        if (LineOfSight.hasLineOfSight(
          human.sprite.x, human.sprite.y,
          killX, killY,
          this.scene.walls
        )) {
          // Human witnessed the kill - identify player and alert cops
          this.scene.identifyPlayer(human.sprite);
          this.scene.alertCopsToDisturbance(killX, killY);
          return; // Only need one witness
        }
      }
    }

    // Also check if any cops witnessed
    for (const cop of this.scene.police) {
      if (!cop.isAlive) continue;

      const distance = Math.sqrt(
        Math.pow(cop.sprite.x - killX, 2) +
        Math.pow(cop.sprite.y - killY, 2)
      );

      if (distance < witnessRange) {
        if (LineOfSight.hasLineOfSight(
          cop.sprite.x, cop.sprite.y,
          killX, killY,
          this.scene.walls
        )) {
          // Cop witnessed the kill
          this.scene.identifyPlayer(cop.sprite);
          return;
        }
      }
    }
  }

  getCooldownProgress() {
    const elapsed = this.scene.time.now - this.lastAttackTime;
    if (elapsed >= this.attackCooldown) return 0;
    return 1 - (elapsed / this.attackCooldown);
  }

  // ==================== Carrying System ====================

  /**
   * Check if player is carrying anything
   */
  isCarryingAnything() {
    return this.carriedCorpse !== null ||
           this.carriedPrisoner !== null ||
           this.carriedBodyPart !== null ||
           this.carriedRat !== null ||
           this.carriedLamp !== null;
  }

  /**
   * Get what the player is currently carrying
   */
  getCarriedType() {
    if (this.carriedCorpse) return CARRIED_TYPE.CORPSE;
    if (this.carriedPrisoner) return CARRIED_TYPE.PRISONER;
    if (this.carriedBodyPart) return CARRIED_TYPE.BODY_PART;
    return CARRIED_TYPE.NONE;
  }

  // ==================== Corpse System ====================

  canPickupCorpse() {
    if (this.isCarryingAnything()) return false;
    return this.scene.getNearestCorpse(
      this.sprite.x,
      this.sprite.y,
      PLAYER.CORPSE_PICKUP_RANGE
    ) !== null;
  }

  pickupCorpse() {
    const corpse = this.scene.getNearestCorpse(
      this.sprite.x,
      this.sprite.y,
      PLAYER.CORPSE_PICKUP_RANGE
    );
    if (!corpse) return;

    this.carriedCorpse = corpse;
    corpse.isPickedUp = true;
    corpse.sprite.setDepth(DEPTH.CARRIED_CORPSE);
  }

  dropCorpse() {
    if (!this.carriedCorpse) return;

    const dropX = this.sprite.x;
    const dropY = this.sprite.y;

    // Check for ritual sacrifice
    const ritualSite = this.scene.getRitualSiteAt(dropX, dropY);
    if (ritualSite) {
      const corpseToSacrifice = this.carriedCorpse;
      this.carriedCorpse = null;
      this.scene.performSacrifice(corpseToSacrifice, ritualSite);
      return;
    }

    // Normal drop
    this.carriedCorpse.x = dropX;
    this.carriedCorpse.y = dropY;
    this.carriedCorpse.sprite.setPosition(dropX, dropY);
    this.carriedCorpse.sprite.setDepth(DEPTH.CORPSE);
    this.carriedCorpse.isPickedUp = false;
    this.carriedCorpse = null;
  }

  updateCarriedCorpse() {
    if (!this.carriedCorpse) return;

    const aboveHeadY = this.sprite.y - 12;
    this.carriedCorpse.sprite.setPosition(this.sprite.x, aboveHeadY);
    this.carriedCorpse.x = this.sprite.x;
    this.carriedCorpse.y = aboveHeadY;
  }

  // ==================== Prisoner System ====================

  pickupPrisoner(prisoner) {
    if (this.isCarryingAnything()) return;

    this.carriedPrisoner = prisoner;
    prisoner.isBeingCarried = true;
    prisoner.sprite.setDepth(DEPTH.CARRIED_PRISONER);
  }

  dropPrisoner() {
    if (!this.carriedPrisoner) return null;

    const prisoner = this.carriedPrisoner;
    this.carriedPrisoner = null;
    prisoner.isBeingCarried = false;

    // Check if near a cage - if so, don't release (cage will handle imprison)
    const nearestCage = this.scene.getNearestEmptyCage?.(this.sprite.x, this.sprite.y, 30);
    if (nearestCage) {
      // Return prisoner so cage can imprison them
      return prisoner;
    }

    // Not near cage - prisoner flees
    prisoner.beReleased();
    return null;
  }

  updateCarriedPrisoner() {
    if (!this.carriedPrisoner) return;

    const aboveHeadY = this.sprite.y - 12;
    this.carriedPrisoner.sprite.setPosition(this.sprite.x, aboveHeadY);

    // Start periodic shiver if not already running
    if (!this.prisonerShiverTimer) {
      this.scheduleCarriedPrisonerShiver();
    }
  }

  scheduleCarriedPrisonerShiver() {
    const delay = Phaser.Math.Between(PRISONER.SHIVER_INTERVAL_MIN, PRISONER.SHIVER_INTERVAL_MAX);
    this.prisonerShiverTimer = this.scene.time.addEvent({
      delay: delay,
      callback: () => {
        if (this.carriedPrisoner?.sprite?.active) {
          this.carriedPrisoner.doShiverEffect();
          // Schedule next shiver with new random delay
          this.scheduleCarriedPrisonerShiver();
        }
      },
      loop: false
    });
  }

  stopPrisonerShiverTimer() {
    if (this.prisonerShiverTimer) {
      this.prisonerShiverTimer.destroy();
      this.prisonerShiverTimer = null;
    }
  }

  // ==================== Body Part System ====================

  /**
   * Pick up a body part after removal
   */
  pickupBodyPart(bodyPartInfo) {
    if (this.isCarryingAnything()) return false;

    this.carriedBodyPart = bodyPartInfo;

    // Create sprite for the body part
    this.carriedBodyPartSprite = this.scene.add.image(
      this.sprite.x,
      this.sprite.y - 12,
      bodyPartInfo.textureKey
    );
    this.carriedBodyPartSprite.setDepth(DEPTH.CARRIED_CORPSE);
    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.carriedBodyPartSprite);
    }

    return true;
  }

  /**
   * Drop the carried body part
   */
  dropBodyPart() {
    if (!this.carriedBodyPart) return;

    // Place the body part on the ground
    const dropX = this.sprite.x;
    const dropY = this.sprite.y;

    // Create a ground sprite for the body part
    const groundSprite = this.scene.add.image(dropX, dropY, this.carriedBodyPart.textureKey);
    groundSprite.setDepth(DEPTH.CORPSE);
    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(groundSprite);
    }

    // Register with corpse manager for pickup
    if (this.scene.corpseManager) {
      this.scene.corpseManager.registerDroppedBodyPart(groundSprite, this.carriedBodyPart);
    }

    // Clean up carried sprite
    if (this.carriedBodyPartSprite) {
      this.carriedBodyPartSprite.destroy();
      this.carriedBodyPartSprite = null;
    }

    this.carriedBodyPart = null;
  }

  /**
   * Update carried body part position
   */
  updateCarriedBodyPart() {
    if (!this.carriedBodyPartSprite) return;

    this.carriedBodyPartSprite.setPosition(this.sprite.x, this.sprite.y - 12);
  }

  /**
   * Cook the carried body part (called when near stove)
   */
  cookBodyPart() {
    if (!this.carriedBodyPart || this.carriedBodyPart.isCooked) return;

    // Mark as cooked
    this.carriedBodyPart.isCooked = true;

    // Update texture to cooked version
    const cookedTextureKey = this.carriedBodyPart.textureKey + '_cooked';
    this.carriedBodyPart.textureKey = cookedTextureKey;

    // Update the sprite
    if (this.carriedBodyPartSprite) {
      this.carriedBodyPartSprite.setTexture(cookedTextureKey);
    }

    // Sizzle effect notification
    this.scene.showNotification('*sizzle* *sizzle*');

    // Spawn some smoke/steam particles
    this.spawnCookingEffect();
  }

  /**
   * Spawn cooking steam/smoke effect
   */
  spawnCookingEffect() {
    // Create a few rising smoke particles
    for (let i = 0; i < 5; i++) {
      const smoke = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-8, 8),
        this.sprite.y - 10,
        Phaser.Math.Between(2, 4),
        0x888888,
        0.7
      );
      smoke.setDepth(DEPTH.EFFECTS);

      this.scene.tweens.add({
        targets: smoke,
        y: smoke.y - 20,
        alpha: 0,
        scale: 2,
        duration: 800,
        delay: i * 100,
        onComplete: () => smoke.destroy()
      });
    }
  }

  /**
   * Eat the carried body part
   */
  eatBodyPart() {
    if (!this.carriedBodyPart) return;

    // Emit hearts and slobber
    this.spawnEatingEffect();

    // Show notification
    this.scene.showNotification('the voices feast');

    // Destroy the body part
    if (this.carriedBodyPartSprite) {
      this.carriedBodyPartSprite.destroy();
      this.carriedBodyPartSprite = null;
    }
    this.carriedBodyPart = null;
  }

  /**
   * Spawn hearts and slobber driblets for eating effect
   */
  spawnEatingEffect() {
    // Hearts
    for (let i = 0; i < 4; i++) {
      const heart = this.scene.add.text(
        this.sprite.x + Phaser.Math.Between(-12, 12),
        this.sprite.y - 8,
        '♥',
        { fontSize: '12px', color: '#ff6666' }
      );
      heart.setDepth(DEPTH.EFFECTS);
      heart.setOrigin(0.5);

      this.scene.tweens.add({
        targets: heart,
        y: heart.y - 25,
        alpha: 0,
        duration: 1000,
        delay: i * 150,
        onComplete: () => heart.destroy()
      });
    }

    // Slobber driblets (falling down)
    for (let i = 0; i < 3; i++) {
      const slobber = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-6, 6),
        this.sprite.y,
        Phaser.Math.Between(1, 3),
        0x88ccff,
        0.8
      );
      slobber.setDepth(DEPTH.EFFECTS);

      this.scene.tweens.add({
        targets: slobber,
        y: slobber.y + 15,
        alpha: 0,
        duration: 600,
        delay: i * 200,
        onComplete: () => slobber.destroy()
      });
    }
  }

  /**
   * Gift body part to a pet
   */
  giftToPet(pet) {
    if (!this.carriedBodyPart || !pet) return;

    // Pet eats the body part
    this.spawnMunchingEffect(pet.sprite.x, pet.sprite.y);

    // Show notification
    this.scene.showNotification('yes, my sweet dear, munch! munch! munch!!');

    // Destroy the body part
    if (this.carriedBodyPartSprite) {
      this.carriedBodyPartSprite.destroy();
      this.carriedBodyPartSprite = null;
    }
    this.carriedBodyPart = null;
  }

  /**
   * Gift body part to a rat (cooked or uncooked)
   */
  giftBodyPartToRat(rat) {
    if (!this.carriedBodyPart || !rat) return;

    // Rat eats the body part
    this.spawnMunchingEffect(rat.sprite.x, rat.sprite.y);

    // Show notification
    this.scene.showNotification('the little one feasts!');

    // Destroy the body part
    if (this.carriedBodyPartSprite) {
      this.carriedBodyPartSprite.destroy();
      this.carriedBodyPartSprite = null;
    }
    this.carriedBodyPart = null;
  }

  /**
   * Gift cooked body part to a human or cop
   */
  giftToHuman(human) {
    if (!this.carriedBodyPart || !human) return;
    if (!this.carriedBodyPart.isCooked) return;  // Only cooked for humans/cops

    // Human eats the body part
    this.spawnMunchingEffect(human.sprite.x, human.sprite.y);

    // Show notification
    this.scene.showNotification('teehee');

    // Destroy the body part
    if (this.carriedBodyPartSprite) {
      this.carriedBodyPartSprite.destroy();
      this.carriedBodyPartSprite = null;
    }
    this.carriedBodyPart = null;
  }

  /**
   * Wear a skin to change appearance and remove identification
   */
  wearSkin() {
    if (!this.carriedBodyPart || this.carriedBodyPart.partId !== 'skin') return;
    if (this.carriedBodyPart.isCooked) return;  // Can't wear cooked skin

    const skinInfo = this.carriedBodyPart;

    // Transform player appearance based on victim info
    this.scene.transformPlayerToSkin(skinInfo);

    // Reset identification - player is no longer identified
    if (this.scene.identificationSystem) {
      this.scene.identificationSystem.reset();
    }

    // Show notification
    if (skinInfo.isPet) {
      this.scene.showNotification(`*slips into ${skinInfo.petType} costume*`);
    } else {
      this.scene.showNotification('*puts on a new face*');
    }

    // Spawn creepy effect
    this.spawnWearSkinEffect();

    // Destroy the body part
    if (this.carriedBodyPartSprite) {
      this.carriedBodyPartSprite.destroy();
      this.carriedBodyPartSprite = null;
    }
    this.carriedBodyPart = null;
  }

  /**
   * Visual effect when wearing skin
   */
  spawnWearSkinEffect() {
    // Swirling dark particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.circle(
        this.sprite.x + Math.cos(angle) * 20,
        this.sprite.y + Math.sin(angle) * 20,
        Phaser.Math.Between(2, 4),
        0x660066,
        0.8
      );
      particle.setDepth(DEPTH.EFFECTS);

      this.scene.tweens.add({
        targets: particle,
        x: this.sprite.x,
        y: this.sprite.y,
        alpha: 0,
        scale: 0.5,
        duration: 500,
        delay: i * 50,
        onComplete: () => particle.destroy()
      });
    }

    // Flash effect on player
    this.sprite.setTint(0x660066);
    this.scene.time.delayedCall(300, () => {
      if (this.sprite?.active) {
        this.sprite.clearTint();
      }
    });
  }

  /**
   * Spawn munching effect (hearts and slobber) at a position
   */
  spawnMunchingEffect(x, y) {
    // Hearts
    for (let i = 0; i < 5; i++) {
      const heart = this.scene.add.text(
        x + Phaser.Math.Between(-12, 12),
        y - 8,
        '♥',
        { fontSize: '14px', color: '#ff4444' }
      );
      heart.setDepth(DEPTH.EFFECTS);
      heart.setOrigin(0.5);

      this.scene.tweens.add({
        targets: heart,
        y: heart.y - 30,
        alpha: 0,
        duration: 1200,
        delay: i * 100,
        onComplete: () => heart.destroy()
      });
    }

    // Slobber
    for (let i = 0; i < 4; i++) {
      const slobber = this.scene.add.circle(
        x + Phaser.Math.Between(-8, 8),
        y + 4,
        Phaser.Math.Between(2, 4),
        0x88ccff,
        0.8
      );
      slobber.setDepth(DEPTH.EFFECTS);

      this.scene.tweens.add({
        targets: slobber,
        y: slobber.y + 20,
        alpha: 0,
        duration: 800,
        delay: i * 150,
        onComplete: () => slobber.destroy()
      });
    }
  }

  // ==================== Rat System ====================

  /**
   * Attack a rat directly (used by rat's action system)
   */
  attackRat(rat) {
    if (!rat || !rat.isAlive) return;

    this.lastAttackTime = this.scene.time.now;

    // If player is carrying the rat, handle it specially
    if (this.carriedRat && this.carriedRat.entity === rat) {
      // Rat dies while carried
      rat.isAlive = false;
      this.carriedRat.isAlive = false;
      // Update texture to dead
      if (this.carriedRatSprite) {
        this.carriedRatSprite.setTexture('rat_dead');
      }
      this.scene.spawnBloodSplatter(this.sprite.x, this.sprite.y - 12, 0.5);
    } else {
      // Kill the rat normally
      rat.kill();
    }
  }

  /**
   * Pick up a living rat
   */
  pickupRat(rat) {
    if (this.isCarryingAnything()) return;
    if (!rat || !rat.isAlive) return;

    rat.bePickedUp();

    this.carriedRat = {
      entity: rat,
      isAlive: true,
      isCooked: false,
      textureKey: 'rat'
    };

    // Create sprite for the carried rat
    this.carriedRatSprite = this.scene.add.image(
      this.sprite.x,
      this.sprite.y - 12,
      'rat'
    );
    this.carriedRatSprite.setDepth(DEPTH.CARRIED_CORPSE);
    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.carriedRatSprite);
    }
  }

  /**
   * Pick up a dead rat (from ground sprite)
   */
  pickupDeadRat(deadRatSprite) {
    if (this.isCarryingAnything()) return;
    if (!deadRatSprite) return;

    const isCooked = deadRatSprite.isCooked || false;

    // Unregister from action system
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(deadRatSprite);
    }

    // Destroy ground sprite
    deadRatSprite.destroy();

    this.carriedRat = {
      entity: null,  // No living entity
      isAlive: false,
      isCooked: isCooked,
      textureKey: isCooked ? 'rat_cooked' : 'rat_dead'
    };

    // Create sprite for the carried rat
    this.carriedRatSprite = this.scene.add.image(
      this.sprite.x,
      this.sprite.y - 12,
      this.carriedRat.textureKey
    );
    this.carriedRatSprite.setDepth(DEPTH.CARRIED_CORPSE);
    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.carriedRatSprite);
    }
  }

  /**
   * Drop the carried rat
   */
  dropRat() {
    if (!this.carriedRat) return;

    const dropX = this.sprite.x;
    const dropY = this.sprite.y;

    // If alive, release it to flee
    if (this.carriedRat.isAlive && this.carriedRat.entity) {
      this.carriedRat.entity.beDropped(dropX, dropY);
    } else {
      // Dead rat - create ground sprite
      const groundSprite = this.scene.add.sprite(dropX, dropY, this.carriedRat.textureKey);
      groundSprite.setDepth(DEPTH.CORPSE);
      groundSprite.isDeadRat = true;
      groundSprite.isCooked = this.carriedRat.isCooked;

      if (this.scene.hud) {
        this.scene.hud.ignoreGameObject(groundSprite);
      }

      // Register for pickup
      if (this.scene.actionSystem) {
        this.scene.actionSystem.registerObject(groundSprite, {
          owner: { type: 'dead_rat', sprite: groundSprite },
          getActions: () => {
            if (this.scene.player?.isCarryingAnything()) return [];
            return [{
              name: 'Pick Up',
              key: 'SPACE',
              keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
              callback: () => this.scene.player?.pickupDeadRat(groundSprite)
            }];
          }
        });
      }
    }

    // Clean up carried sprite
    if (this.carriedRatSprite) {
      this.carriedRatSprite.destroy();
      this.carriedRatSprite = null;
    }

    this.carriedRat = null;
  }

  /**
   * Update carried rat position
   */
  updateCarriedRat() {
    if (!this.carriedRatSprite) return;

    this.carriedRatSprite.setPosition(this.sprite.x, this.sprite.y - 12);
  }

  /**
   * Cook the carried rat (living or dead)
   */
  cookRat() {
    if (!this.carriedRat || this.carriedRat.isCooked) return;

    // If alive, kill it first
    if (this.carriedRat.isAlive && this.carriedRat.entity) {
      this.carriedRat.entity.isAlive = false;
      this.carriedRat.isAlive = false;
    }

    // Mark as cooked
    this.carriedRat.isCooked = true;
    this.carriedRat.textureKey = 'rat_cooked';

    // Update the sprite
    if (this.carriedRatSprite) {
      this.carriedRatSprite.setTexture('rat_cooked');
    }

    // Sizzle effect notification
    this.scene.showNotification('*sizzle* *sizzle*');

    // Spawn some smoke/steam particles
    this.spawnCookingEffect();
  }

  /**
   * Eat the carried rat
   */
  eatRat() {
    if (!this.carriedRat) return;

    // Emit hearts and slobber
    this.spawnEatingEffect();

    // Show notification
    this.scene.showNotification('tasty critter!');

    // Destroy the rat entity if alive
    if (this.carriedRat.isAlive && this.carriedRat.entity) {
      this.carriedRat.entity.destroy();
    }

    // Clean up sprite
    if (this.carriedRatSprite) {
      this.carriedRatSprite.destroy();
      this.carriedRatSprite = null;
    }
    this.carriedRat = null;
  }

  /**
   * Gift rat to another rat
   */
  giftRatToRat(targetRat) {
    if (!this.carriedRat || !targetRat) return;

    // Rat eats the carried rat
    this.spawnMunchingEffect(targetRat.sprite.x, targetRat.sprite.y);

    // Show notification
    this.scene.showNotification('rats together, strong!');

    // Clean up carried rat
    if (this.carriedRat.isAlive && this.carriedRat.entity) {
      this.carriedRat.entity.destroy();
    }
    if (this.carriedRatSprite) {
      this.carriedRatSprite.destroy();
      this.carriedRatSprite = null;
    }
    this.carriedRat = null;
  }

  /**
   * Gift rat to a pet
   */
  giftRatToPet(pet) {
    if (!this.carriedRat || !pet) return;

    // Pet eats the rat
    this.spawnMunchingEffect(pet.sprite.x, pet.sprite.y);

    // Show notification
    this.scene.showNotification('munch! munch! good pet!');

    // Clean up carried rat
    if (this.carriedRat.isAlive && this.carriedRat.entity) {
      this.carriedRat.entity.destroy();
    }
    if (this.carriedRatSprite) {
      this.carriedRatSprite.destroy();
      this.carriedRatSprite = null;
    }
    this.carriedRat = null;
  }

  /**
   * Gift cooked rat to a human or cop
   */
  giftRatToHuman(human) {
    if (!this.carriedRat || !human) return;
    if (!this.carriedRat.isCooked) return;  // Only cooked rats for humans/cops

    // Human eats the rat
    this.spawnMunchingEffect(human.sprite.x, human.sprite.y);

    // Show notification
    this.scene.showNotification('teehee');

    // Clean up carried rat
    if (this.carriedRatSprite) {
      this.carriedRatSprite.destroy();
      this.carriedRatSprite = null;
    }
    this.carriedRat = null;
  }

  // ==================== Lamp System ====================

  /**
   * Pick up a lamp
   */
  pickupLamp(lampData) {
    if (this.isCarryingAnything()) return;

    this.carriedLamp = {
      isOn: lampData.isOn,
      building: lampData.building
    };

    // Create sprite for the carried lamp
    this.carriedLampSprite = this.scene.add.image(
      this.sprite.x,
      this.sprite.y - 12,
      'furniture_lamp'
    );
    this.carriedLampSprite.setDepth(DEPTH.CARRIED_CORPSE);
    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.carriedLampSprite);
    }

    // Create light graphics for carried lamp
    this.carriedLampLight = this.scene.add.graphics();
    this.carriedLampLight.setDepth(DEPTH.CARRIED_CORPSE - 1);
    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.carriedLampLight);
    }

    this.scene.showNotification('*grabs lamp*');
  }

  /**
   * Drop the carried lamp
   */
  dropLamp() {
    if (!this.carriedLamp) return;

    const dropX = this.sprite.x;
    const dropY = this.sprite.y;

    // Create a new lamp sprite on the ground
    const lamp = this.scene.add.image(dropX, dropY, 'furniture_lamp');
    lamp.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(lamp);

    // Create lamp data object
    const lampData = {
      sprite: lamp,
      x: dropX,
      y: dropY,
      isOn: this.carriedLamp.isOn,
      lightGraphics: null,
      building: null  // No longer tied to a building
    };

    // Add to lamps array
    this.scene.lamps.push(lampData);

    // Register for actions via TownGenerator
    if (this.scene.townGenerator) {
      this.scene.townGenerator.registerLampAction(lampData);
      this.scene.townGenerator.createLampLight(lampData);
    }

    // Clean up carried lamp
    if (this.carriedLampSprite) {
      this.carriedLampSprite.destroy();
      this.carriedLampSprite = null;
    }
    if (this.carriedLampLight) {
      this.carriedLampLight.destroy();
      this.carriedLampLight = null;
    }

    this.carriedLamp = null;
  }

  /**
   * Toggle carried lamp on/off
   */
  toggleCarriedLamp() {
    if (!this.carriedLamp) return;

    this.carriedLamp.isOn = !this.carriedLamp.isOn;
    this.updateCarriedLampLight();

    const message = this.carriedLamp.isOn ? '*click* light on' : '*click* light off';
    this.scene.showNotification(message);
  }

  /**
   * Update carried lamp position
   */
  updateCarriedLamp() {
    if (!this.carriedLampSprite) return;

    this.carriedLampSprite.setPosition(this.sprite.x, this.sprite.y - 12);
    this.updateCarriedLampLight();
  }

  /**
   * Update carried lamp light effect
   */
  updateCarriedLampLight() {
    if (!this.carriedLampLight || !this.carriedLamp) return;

    this.carriedLampLight.clear();

    const isNight = this.scene.dayNightSystem?.isNight() || false;
    if (this.carriedLamp.isOn && isNight) {
      const x = this.sprite.x;
      const y = this.sprite.y - 12;

      // Draw warm light glow
      this.carriedLampLight.fillStyle(0xffeeaa, 0.15);
      this.carriedLampLight.fillCircle(x, y, 48);
      this.carriedLampLight.fillStyle(0xffdd88, 0.2);
      this.carriedLampLight.fillCircle(x, y, 32);
      this.carriedLampLight.fillStyle(0xffcc66, 0.3);
      this.carriedLampLight.fillCircle(x, y, 16);
    }
  }

  // ==================== Movement ====================

  update(time, delta) {
    if (!this.canControl) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    const velocity = this.getInputVelocity();
    this.sprite.setVelocity(velocity.x, velocity.y);
    this.updateCarriedCorpse();
    this.updateCarriedPrisoner();
    this.updateCarriedBodyPart();
    this.updateCarriedRat();
    this.updateCarriedLamp();
    this.updateSleepyEffect(delta);
  }

  getInputVelocity() {
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -this.speed;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = this.speed;

    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -this.speed;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = this.speed;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    return { x: vx, y: vy };
  }

  // ==================== Utilities ====================

  distanceTo(sprite) {
    const dx = sprite.x - this.sprite.x;
    const dy = sprite.y - this.sprite.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  disableControl() {
    this.canControl = false;
    this.sprite.setVelocity(0, 0);

    if (this.carriedCorpse) {
      this.dropCorpse();
    }

    if (this.carriedPrisoner) {
      this.carriedPrisoner.beReleased();
      this.carriedPrisoner = null;
      this.stopPrisonerShiverTimer();
    }
  }

  // ==================== Sleepy Effect ====================

  /**
   * Start the sleepy effect (zzz icon above head)
   */
  startSleepyEffect() {
    if (this.isSleepy) return;

    this.isSleepy = true;

    // Create zzz sprite
    this.zzzSprite = this.scene.add.image(
      this.sprite.x,
      this.sprite.y - 20,
      'zzz_icon'
    );
    this.zzzSprite.setDepth(DEPTH.EXCLAMATION);

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.zzzSprite);
    }
  }

  /**
   * Stop the sleepy effect
   */
  stopSleepyEffect() {
    this.isSleepy = false;

    if (this.zzzSprite) {
      this.zzzSprite.destroy();
      this.zzzSprite = null;
    }
  }

  /**
   * Update the zzz sprite position and wiggle animation
   */
  updateSleepyEffect(delta) {
    if (!this.isSleepy || !this.zzzSprite) return;

    this.zzzWiggleTime += delta / 1000;

    // Wiggle side to side
    const wiggleX = Math.sin(this.zzzWiggleTime * 4) * 2;
    // Bob up and down slightly
    const wiggleY = Math.sin(this.zzzWiggleTime * 2) * 1;

    this.zzzSprite.setPosition(
      this.sprite.x + wiggleX,
      this.sprite.y - 20 + wiggleY
    );

    // Slight rotation
    this.zzzSprite.setRotation(Math.sin(this.zzzWiggleTime * 3) * 0.1);
  }
}
