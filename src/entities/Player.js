import Phaser from 'phaser';
import { PLAYER, DEPTH } from '../config/constants.js';
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

  // ==================== Attack System ====================

  canAttackTarget() {
    return this.findNearestTarget() !== null;
  }

  findNearestTarget() {
    let nearestTarget = null;
    let nearestDistance = PLAYER.ATTACK_RANGE;
    let isTargetCop = false;
    let isTargetPet = false;

    // Check humans
    for (const human of this.scene.humans) {
      if (!human.isAlive) continue;
      const distance = this.distanceTo(human.sprite);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = human;
        isTargetCop = false;
        isTargetPet = false;
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
        }
      }
    }

    return nearestTarget ? { target: nearestTarget, isCop: isTargetCop, isPet: isTargetPet } : null;
  }

  tryKill() {
    if (!this.canControl || this.scene.isGameOver) return;

    const currentTime = this.scene.time.now;
    if (currentTime - this.lastAttackTime < this.attackCooldown) return;

    const result = this.findNearestTarget();
    if (!result) return;

    this.lastAttackTime = currentTime;

    // Mark as illegal activity
    this.scene.markIllegalActivity();

    // Update HUD cooldown
    this.scene.hud?.triggerCooldown();

    const { target, isCop, isPet } = result;

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

  // ==================== Corpse System ====================

  canPickupCorpse() {
    if (this.carriedCorpse) return false;
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
    if (this.carriedPrisoner || this.carriedCorpse) return;

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

    // Periodic shiver while being carried
    if (!this.prisonerShiverTimer) {
      this.prisonerShiverTimer = this.scene.time.addEvent({
        delay: 800,
        callback: () => {
          if (this.carriedPrisoner?.sprite?.active) {
            this.carriedPrisoner.doShiverEffect();
          }
        },
        loop: true
      });
    }
  }

  stopPrisonerShiverTimer() {
    if (this.prisonerShiverTimer) {
      this.prisonerShiverTimer.destroy();
      this.prisonerShiverTimer = null;
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
