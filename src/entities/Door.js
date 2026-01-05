import Phaser from 'phaser';
import { DEPTH, IDENTIFICATION } from '../config/constants.js';
import { LineOfSight } from '../utils/LineOfSight.js';

/**
 * Door states
 */
export const DoorState = {
  CLOSED: 'closed',
  OPEN: 'open',
  BROKEN: 'broken'
};

/**
 * Door entity with open/close/break functionality
 */
export class Door {
  constructor(scene, x, y, buildingId) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.buildingId = buildingId;
    this.state = DoorState.CLOSED;
    this.hasBeenReported = false; // For broken door detection

    this.createSprite();
    this.createCollider();
    this.registerActions();
  }

  createSprite() {
    // Visual sprite
    this.sprite = this.scene.add.sprite(this.x, this.y, 'door');
    this.sprite.setDepth(DEPTH.WALLS);
    this.sprite.parentEntity = this;

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(this.sprite);
    }
  }

  createCollider() {
    // Physics body for collision (only blocks player when closed)
    this.collider = this.scene.physics.add.staticImage(this.x, this.y, 'door');
    this.collider.setVisible(false);
    this.collider.body.setSize(16, 16);
    this.collider.parentEntity = this;

    // Add to a separate door collider group
    if (this.scene.doorColliders) {
      this.scene.doorColliders.add(this.collider);
    }
  }

  registerActions() {
    if (!this.scene.actionSystem) {
      console.warn('Door: No action system available');
      return;
    }

    this.scene.actionSystem.registerObject(this.sprite, {
      owner: this,
      getActions: () => this.getAvailableActions()
    });
  }

  /**
   * Check if this door belongs to the player's home
   */
  isPlayerHomeDoor() {
    const playerHome = this.scene.townGenerator?.getPlayerHome();
    return playerHome && playerHome.id === this.buildingId;
  }

  getAvailableActions() {
    const actions = [];
    const isPlayerHome = this.isPlayerHomeDoor();

    if (this.state === DoorState.CLOSED) {
      if (isPlayerHome) {
        // Player's own home - can open directly
        actions.push({
          name: 'Open',
          key: 'T',
          keyCode: Phaser.Input.Keyboard.KeyCodes.T,
          callback: () => this.open()
        });
      } else {
        // Other houses - must knock
        actions.push({
          name: 'Knock',
          key: 'T',
          keyCode: Phaser.Input.Keyboard.KeyCodes.T,
          callback: () => this.knock()
        });
        actions.push({
          name: 'Break',
          key: 'SPACE',
          keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
          callback: () => this.breakDown()
        });
      }
    } else if (this.state === DoorState.OPEN) {
      actions.push({
        name: 'Close',
        key: 'T',
        keyCode: Phaser.Input.Keyboard.KeyCodes.T,
        callback: () => this.close()
      });
    }
    // Broken doors have no actions

    return actions;
  }

  knock() {
    if (this.state !== DoorState.CLOSED) return;

    // Find humans in this building or within 5 tiles
    const nearbyHuman = this.findNearbyHuman();

    if (nearbyHuman) {
      // Human will come to door and open it
      nearbyHuman.respondToKnock(this);
    }

    // Visual/audio feedback
    this.flashDoor();
  }

  breakDown() {
    if (this.state !== DoorState.CLOSED) return;

    this.state = DoorState.BROKEN;
    this.updateVisuals();
    this.disableCollision();

    // Check if any NPC witnessed this
    const witness = this.findWitnessToBreaking();
    if (witness) {
      // Immediately identify player - mark door as reported to prevent double investigation
      this.hasBeenReported = true;
      this.scene.identifyPlayer(witness.sprite);
      this.scene.alertCopsToDisturbance(this.x, this.y);
    } else {
      // No witness, but still mark as illegal activity (for carrying corpse detection etc)
      this.scene.recordIllegalActivity();
    }
  }

  /**
   * Find any NPC who witnessed the door being broken
   * Either inside the building or within 5 tiles with line of sight
   */
  findWitnessToBreaking() {
    const range = IDENTIFICATION.IDENTIFY_RANGE; // 5 tiles

    // Check humans
    for (const human of this.scene.humans) {
      if (!human.isAlive) continue;

      // If in same building, they heard/saw it
      if (human.homeBuilding?.id === this.buildingId) {
        return human;
      }

      // Check if within range and has line of sight
      const distance = LineOfSight.distance(human.sprite.x, human.sprite.y, this.x, this.y);
      if (distance < range) {
        if (LineOfSight.hasLineOfSight(human.sprite.x, human.sprite.y, this.x, this.y, this.scene.walls)) {
          return human;
        }
      }
    }

    // Check police
    for (const cop of this.scene.police) {
      if (!cop.isAlive) continue;

      const distance = LineOfSight.distance(cop.sprite.x, cop.sprite.y, this.x, this.y);
      if (distance < range) {
        if (LineOfSight.hasLineOfSight(cop.sprite.x, cop.sprite.y, this.x, this.y, this.scene.walls)) {
          return cop;
        }
      }
    }

    return null;
  }

  open() {
    if (this.state !== DoorState.CLOSED) return;

    this.state = DoorState.OPEN;
    this.updateVisuals();
    this.disableCollision();
  }

  close() {
    if (this.state !== DoorState.OPEN) return;

    this.state = DoorState.CLOSED;
    this.updateVisuals();
    this.enableCollision();
  }

  findNearbyHuman() {
    const range = 5 * 16; // 5 tiles

    // Collect all eligible humans (in building or nearby)
    const eligibleHumans = [];

    for (const human of this.scene.humans) {
      if (!human.isAlive) continue;
      if (human.state === 'fleeing') continue;

      // Check if in same building
      if (human.homeBuilding?.id === this.buildingId) {
        eligibleHumans.push(human);
        continue;
      }

      // Check if within range
      const dx = human.sprite.x - this.x;
      const dy = human.sprite.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < range) {
        eligibleHumans.push(human);
      }
    }

    // Return a random eligible human (so kids can answer too)
    if (eligibleHumans.length > 0) {
      return eligibleHumans[Math.floor(Math.random() * eligibleHumans.length)];
    }

    return null;
  }

  flashDoor() {
    // Quick tint flash to indicate knock
    this.sprite.setTint(0xffffaa);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite?.active) {
        this.sprite.clearTint();
      }
    });
  }

  updateVisuals() {
    switch (this.state) {
      case DoorState.CLOSED:
        this.sprite.setTexture('door');
        this.sprite.clearTint();
        break;
      case DoorState.OPEN:
        this.sprite.setTexture('door_open');
        this.sprite.clearTint();
        break;
      case DoorState.BROKEN:
        this.sprite.setTexture('door_broken');
        this.sprite.setTint(0x888888);
        break;
    }
  }

  enableCollision() {
    if (this.collider?.body) {
      this.collider.body.enable = true;
    }
  }

  disableCollision() {
    if (this.collider?.body) {
      this.collider.body.enable = false;
    }
  }

  /**
   * Check if door blocks player (only when closed)
   */
  blocksPlayer() {
    return this.state === DoorState.CLOSED;
  }

  /**
   * Mark as reported (for broken door detection)
   */
  markAsReported() {
    this.hasBeenReported = true;
  }

  destroy() {
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(this.sprite);
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.collider) {
      this.collider.destroy();
    }
  }
}
