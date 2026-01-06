import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Human } from '../entities/Human.js';
import { Police } from '../entities/Police.js';
import { Pet } from '../entities/Pet.js';
import { Rat } from '../entities/Rat.js';
import { Cage } from '../entities/Cage.js';
import { HUD } from '../ui/HUD.js';
import { Minimap } from '../ui/Minimap.js';
import { ActionPopup } from '../ui/ActionPopup.js';
import { ClockWidget } from '../ui/ClockWidget.js';
import { SleepTransition } from '../ui/SleepTransition.js';
import { TextureFactory } from '../utils/TextureFactory.js';
import { CorpseManager } from '../systems/CorpseManager.js';
import { IdentificationSystem } from '../systems/IdentificationSystem.js';
import { RitualSystem } from '../systems/RitualSystem.js';
import { PoliceDispatcher } from '../systems/PoliceDispatcher.js';
import { TownGenerator } from '../systems/TownGenerator.js';
import { ActionSystem } from '../systems/ActionSystem.js';
import { DayNightSystem } from '../systems/DayNightSystem.js';
import { ObjectiveSystem } from '../systems/ObjectiveSystem.js';
import { SanitySystem } from '../systems/SanitySystem.js';
import { ObjectiveActionSystem } from '../systems/ObjectiveActionSystem.js';
import { PlayerLocationSystem } from '../systems/PlayerLocationSystem.js';
import { NotorietySystem } from '../systems/NotorietySystem.js';
import { ObjectivesWidget } from '../ui/ObjectivesWidget.js';
import { ObjectivePopup } from '../ui/ObjectivePopup.js';
import {
  MAP, DEPTH, TOWN,
  RACES, HUMAN_GENDERS,
  PET_TYPES, HOUSEHOLD_PETS
} from '../config/constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.mapWidth = MAP.WIDTH;
    this.mapHeight = MAP.HEIGHT;
    this.tileSize = MAP.TILE_SIZE;
  }

  preload() {
    const textureFactory = new TextureFactory(this);
    textureFactory.createAll();
  }

  create() {
    this.initializeGameState();
    this.initializeSystems();
    this.createTown();
    this.spawnEntities();
    this.createHUD();
    this.createMinimap();
    this.createDayNightSystem();
    this.createObjectivesSystem();
    this.createPauseMenu();
  }

  /**
   * Initialize core game state
   */
  initializeGameState() {
    this.isGameOver = false;
    this.isSleeping = false;
    this.isPaused = false;
    this.humans = [];
    this.police = [];
    this.pets = [];
    this.rats = [];
    this.cages = [];
    this.lamps = [];
  }

  /**
   * Initialize game systems
   */
  initializeSystems() {
    this.corpseManager = new CorpseManager(this);
    this.identificationSystem = new IdentificationSystem(this);
    this.ritualSystem = new RitualSystem(this);
    this.policeDispatcher = new PoliceDispatcher(this);
    this.townGenerator = new TownGenerator(this);
    this.actionSystem = new ActionSystem(this);
    this.sanitySystem = new SanitySystem(this);
    this.objectiveActionSystem = new ObjectiveActionSystem(this);
    this.playerLocationSystem = new PlayerLocationSystem(this);
    this.notorietySystem = new NotorietySystem(this);

    // Link ActionSystem to ObjectiveActionSystem
    this.actionSystem.setObjectiveActionSystem(this.objectiveActionSystem);

    // Door colliders - only blocks player, not NPCs
    this.doorColliders = this.physics.add.staticGroup();

    // Track doors for broken door detection
    this.doors = [];
  }

  /**
   * Create the town using TownGenerator
   */
  createTown() {
    const mapPixelWidth = this.mapWidth * this.tileSize;
    const mapPixelHeight = this.mapHeight * this.tileSize;

    this.physics.world.setBounds(0, 0, mapPixelWidth, mapPixelHeight);

    // Create walls group before town generation
    this.walls = this.physics.add.staticGroup();

    // Generate the town
    this.townData = this.townGenerator.generate(this.mapWidth, this.mapHeight);

    // Initialize player location system with town data
    this.playerLocationSystem.initialize(this.townData);

    // Spawn player inside their home
    const playerHome = this.townGenerator.getPlayerHome();
    let spawnX, spawnY;
    if (playerHome) {
      // Spawn in the center of the player's home (not in basement)
      spawnX = (playerHome.x + playerHome.width / 2 + 1) * this.tileSize;
      spawnY = (playerHome.y + playerHome.height / 2) * this.tileSize;
    } else {
      // Fallback to center
      spawnX = mapPixelWidth / 2;
      spawnY = mapPixelHeight / 2;
    }
    this.player = new Player(this, spawnX, spawnY);

    // Set up camera
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#2d5a1e'); // Green grass color
    this.cameras.main.setBounds(0, 0, mapPixelWidth, mapPixelHeight);
    this.cameras.main.setZoom(4);

    this.physics.add.collider(this.player.sprite, this.walls);
    this.physics.add.collider(this.player.sprite, this.doorColliders);
  }

  /**
   * Spawn all entities
   */
  spawnEntities() {
    this.spawnHumans();
    this.spawnPets();
    this.spawnRats();
    this.spawnPolice();
    this.spawnCages();

    // Register player home's basement ritual site with the ritual system
    const playerHome = this.townGenerator.getPlayerHome();
    if (playerHome?.ritualSite) {
      this.ritualSystem.registerSite(playerHome.ritualSite);
    }

    // Also spawn additional ritual sites in remote areas (corners of map)
    this.ritualSystem.spawnSites(this.mapWidth, this.mapHeight, this.tileSize, this.walls);
  }

  /**
   * Create the HUD
   */
  createHUD() {
    this.hud = new HUD(this);

    // Create action popup for object interactions
    this.actionPopup = new ActionPopup(this);
  }

  /**
   * Create the minimap
   */
  createMinimap() {
    if (this.townData) {
      this.minimap = new Minimap(this, this.townData);
      this.minimap.registerWithHUD(this.hud);
    }
  }

  /**
   * Create day/night cycle system and clock widget
   */
  createDayNightSystem() {
    this.dayNightSystem = new DayNightSystem(this);
    this.clockWidget = new ClockWidget(this, this.dayNightSystem);
    this.clockWidget.registerWithHUD(this.hud);
    this.sleepTransition = new SleepTransition(this);
  }

  /**
   * Create objectives system and UI
   */
  createObjectivesSystem() {
    // Create popup first (widget needs reference to it)
    this.objectivePopup = new ObjectivePopup(this);

    // Create objectives widget
    this.objectivesWidget = new ObjectivesWidget(this);
    this.objectivesWidget.registerWithHUD(this.hud);

    // Create objectives system
    this.objectiveSystem = new ObjectiveSystem(this);

    // Add initial daily objective
    this.objectiveSystem.addDailyObjective();
  }

  /**
   * Create pause menu overlay
   */
  createPauseMenu() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Semi-transparent background
    this.pauseOverlay = this.add.graphics();
    this.pauseOverlay.setScrollFactor(0);
    this.pauseOverlay.setDepth(3000);
    this.pauseOverlay.fillStyle(0x000000, 0.7);
    this.pauseOverlay.fillRect(0, 0, width, height);
    this.pauseOverlay.setVisible(false);

    // PAUSED text
    this.pauseText = this.add.text(width / 2, height / 2 - 20, 'PAUSED', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.pauseText.setOrigin(0.5);
    this.pauseText.setScrollFactor(0);
    this.pauseText.setDepth(3001);
    this.pauseText.setVisible(false);

    // Resume hint
    this.pauseHint = this.add.text(width / 2, height / 2 + 20, 'Press ESC to resume', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.pauseHint.setOrigin(0.5);
    this.pauseHint.setScrollFactor(0);
    this.pauseHint.setDepth(3001);
    this.pauseHint.setVisible(false);

    // Restart button
    this.restartButton = this.add.text(width / 2, height / 2 + 50, '[ Restart Game ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ff6666',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.restartButton.setOrigin(0.5);
    this.restartButton.setScrollFactor(0);
    this.restartButton.setDepth(3001);
    this.restartButton.setVisible(false);
    this.restartButton.setInteractive({ useHandCursor: true });
    this.restartButton.on('pointerover', () => this.restartButton.setColor('#ffffff'));
    this.restartButton.on('pointerout', () => this.restartButton.setColor('#ff6666'));
    this.restartButton.on('pointerdown', () => this.scene.restart());

    // Make main camera ignore pause elements
    this.cameras.main.ignore([this.pauseOverlay, this.pauseText, this.pauseHint, this.restartButton]);

    // ESC key handler - close popups first, then toggle pause
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.isGameOver || this.isSleeping) return;

      // If there's an active popup, close it instead of toggling pause
      if (this.activePopup) {
        this.activePopup.hide();
        return;
      }

      this.togglePause();
    });
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    this.isPaused = !this.isPaused;

    this.pauseOverlay.setVisible(this.isPaused);
    this.pauseText.setVisible(this.isPaused);
    this.pauseHint.setVisible(this.isPaused);
    this.restartButton.setVisible(this.isPaused);

    if (this.isPaused) {
      this.dayNightSystem?.pause();
      this.player?.disableControl();
      this.physics.pause();
    } else {
      this.dayNightSystem?.resume();
      if (this.player) this.player.canControl = true;
      this.physics.resume();
    }
  }

  update(time, delta) {
    if (this.isGameOver || this.isPaused) return;

    this.player.update(time, delta);
    this.humans.forEach(human => human.update(delta));
    this.pets.forEach(pet => pet.update(delta));
    this.rats.forEach(rat => rat.update(delta));
    this.police.forEach(cop => cop.update(delta));
    this.policeDispatcher.processQueue(time);

    // Update action system and popup
    if (this.actionSystem) {
      this.actionSystem.update();
    }
    if (this.actionPopup) {
      this.actionPopup.update(this.actionSystem);
    }

    // Update roof visibility based on player position
    if (this.townGenerator && this.player?.sprite) {
      this.townGenerator.updateRoofVisibility(
        this.player.sprite.x,
        this.player.sprite.y
      );
    }

    // Update player location system
    if (this.playerLocationSystem) {
      this.playerLocationSystem.update();
    }

    // Update minimap
    if (this.minimap) {
      this.minimap.update(delta);
    }

    // Update day/night system
    if (this.dayNightSystem) {
      this.dayNightSystem.update(delta);
    }

    // Update lamp lights (affected by day/night)
    if (this.townGenerator && this.lamps) {
      for (const lamp of this.lamps) {
        this.townGenerator.updateLampLight(lamp);
      }
    }

    // Update clock widget
    if (this.clockWidget) {
      this.clockWidget.update();
    }

    // Update sanity system
    if (this.sanitySystem) {
      this.sanitySystem.update(delta);
    }
  }

  // ==================== Entity Spawning ====================

  spawnHumans() {
    const houses = this.townGenerator.getHouses();

    for (const house of houses) {
      // Determine household composition
      const numAdults = Phaser.Math.Between(1, 3);
      const numChildren = Phaser.Math.Between(0, 2);

      // 50% chance of uni-racial household
      const isUniRacial = Math.random() < 0.5;
      const householdRace = RACES[Phaser.Math.Between(0, RACES.length - 1)];

      // Track adult races for children inheritance
      const adultRaces = [];

      let spawnIndex = 0;

      // Spawn adults first
      for (let a = 0; a < numAdults; a++) {
        const race = isUniRacial ? householdRace : RACES[Phaser.Math.Between(0, RACES.length - 1)];
        adultRaces.push(race);
        const gender = HUMAN_GENDERS[Phaser.Math.Between(0, HUMAN_GENDERS.length - 1)];

        const offsetX = (spawnIndex - 1) * 8;
        const offsetY = (spawnIndex % 2) * 8;

        const human = new Human(
          this,
          house.centerPixelX + offsetX,
          house.centerPixelY + offsetY,
          race,
          gender,
          'adult',
          house
        );

        this.humans.push(human);
        this.physics.add.collider(human.sprite, this.walls);

        if (this.hud) {
          this.hud.ignoreGameObject(human.sprite);
        }

        spawnIndex++;
      }

      // Spawn children (inherit race from one of the adults)
      for (let c = 0; c < numChildren; c++) {
        // Child inherits race from a random adult in the household
        const race = adultRaces[Phaser.Math.Between(0, adultRaces.length - 1)];
        const gender = HUMAN_GENDERS[Phaser.Math.Between(0, HUMAN_GENDERS.length - 1)];

        const offsetX = (spawnIndex - 1) * 8;
        const offsetY = (spawnIndex % 2) * 8;

        const human = new Human(
          this,
          house.centerPixelX + offsetX,
          house.centerPixelY + offsetY,
          race,
          gender,
          'child',
          house
        );

        this.humans.push(human);
        this.physics.add.collider(human.sprite, this.walls);

        if (this.hud) {
          this.hud.ignoreGameObject(human.sprite);
        }

        spawnIndex++;
      }
    }
  }

  spawnPets() {
    const houses = this.townGenerator.getHouses();
    const playerHome = this.townGenerator.getPlayerHome();

    // Always spawn a pet at player's home
    if (playerHome) {
      const petType = Math.random() < 0.5 ? 'dog' : 'cat';
      const colors = PET_TYPES[petType].colors;
      const colorVariant = colors[Phaser.Math.Between(0, colors.length - 1)];

      const pet = new Pet(
        this,
        playerHome.centerPixelX,
        playerHome.centerPixelY,
        petType,
        colorVariant,
        playerHome
      );

      this.pets.push(pet);
      this.physics.add.collider(pet.sprite, this.walls);

      if (this.hud) {
        this.hud.ignoreGameObject(pet.sprite);
      }
    }

    for (const house of houses) {
      // Skip player's home - already spawned a pet there
      if (playerHome && house.id === playerHome.id) {
        continue;
      }

      // Determine pet composition
      // 50% petless, 30% single pet, 20% multiple pets
      const roll = Math.random();

      if (roll < HOUSEHOLD_PETS.PETLESS_CHANCE) {
        // No pets
        continue;
      }

      let numDogs = 0;
      let numCats = 0;

      if (roll < HOUSEHOLD_PETS.PETLESS_CHANCE + HOUSEHOLD_PETS.SINGLE_PET_CHANCE) {
        // Single pet - 50/50 dog or cat
        if (Math.random() < 0.5) {
          numDogs = 1;
        } else {
          numCats = 1;
        }
      } else {
        // Multiple pets (remaining 20%)
        numDogs = Phaser.Math.Between(0, HOUSEHOLD_PETS.MAX_DOGS);
        numCats = Phaser.Math.Between(0, HOUSEHOLD_PETS.MAX_CATS);
        // Ensure at least one pet
        if (numDogs === 0 && numCats === 0) {
          if (Math.random() < 0.5) {
            numDogs = 1;
          } else {
            numCats = 1;
          }
        }
      }

      // Spawn dogs
      const dogColors = PET_TYPES.dog.colors;
      for (let d = 0; d < numDogs; d++) {
        const colorVariant = dogColors[Phaser.Math.Between(0, dogColors.length - 1)];
        const offsetX = Phaser.Math.Between(-16, 16);
        const offsetY = Phaser.Math.Between(-16, 16);

        const pet = new Pet(
          this,
          house.centerPixelX + offsetX,
          house.centerPixelY + offsetY,
          'dog',
          colorVariant,
          house
        );

        this.pets.push(pet);
        this.physics.add.collider(pet.sprite, this.walls);

        if (this.hud) {
          this.hud.ignoreGameObject(pet.sprite);
        }
      }

      // Spawn cats
      const catColors = PET_TYPES.cat.colors;
      for (let c = 0; c < numCats; c++) {
        const colorVariant = catColors[Phaser.Math.Between(0, catColors.length - 1)];
        const offsetX = Phaser.Math.Between(-16, 16);
        const offsetY = Phaser.Math.Between(-16, 16);

        const pet = new Pet(
          this,
          house.centerPixelX + offsetX,
          house.centerPixelY + offsetY,
          'cat',
          colorVariant,
          house
        );

        this.pets.push(pet);
        this.physics.add.collider(pet.sprite, this.walls);

        if (this.hud) {
          this.hud.ignoreGameObject(pet.sprite);
        }
      }
    }
  }

  /**
   * Spawn rats in downtown (poor neighborhood) area
   * Rats wander around the central core of the map
   */
  spawnRats() {
    const RAT_COUNT = 20;
    const centerX = (this.mapWidth / 2) * this.tileSize;
    const centerY = (this.mapHeight / 2) * this.tileSize;
    const downtownRadius = 45 * this.tileSize;  // Poor neighborhood is within radius 45 tiles

    for (let i = 0; i < RAT_COUNT; i++) {
      // Random position within downtown (poor neighborhood core)
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * downtownRadius * 0.8;  // Stay well within downtown

      let spawnX = centerX + Math.cos(angle) * distance;
      let spawnY = centerY + Math.sin(angle) * distance;

      // Check if position is blocked and find valid spot
      if (this.isPositionBlocked(spawnX, spawnY)) {
        const validPos = this.findNearbyValidPosition(spawnX, spawnY);
        if (validPos) {
          spawnX = validPos.x;
          spawnY = validPos.y;
        } else {
          continue;  // Skip this rat if no valid position found
        }
      }

      const rat = new Rat(this, spawnX, spawnY);
      this.rats.push(rat);
      this.physics.add.collider(rat.sprite, this.walls);

      if (this.hud) {
        this.hud.ignoreGameObject(rat.sprite);
      }
    }
  }

  /**
   * Spawn a dead rat at a location (when a living rat is killed)
   */
  spawnDeadRat(x, y) {
    // Create a simple dead rat sprite (for pickup)
    const deadRat = this.add.sprite(x, y, 'rat_dead');
    deadRat.setDepth(DEPTH.CORPSE);
    deadRat.isDeadRat = true;
    deadRat.isCooked = false;

    if (this.hud) {
      this.hud.ignoreGameObject(deadRat);
    }

    // Register with action system for pickup
    if (this.actionSystem) {
      this.actionSystem.registerObject(deadRat, {
        owner: { type: 'dead_rat', sprite: deadRat },
        getActions: () => {
          if (this.player?.isCarryingAnything()) return [];
          return [{
            name: 'Pick Up',
            key: 'SPACE',
            keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
            callback: () => this.player?.pickupDeadRat(deadRat)
          }];
        }
      });
    }

    return deadRat;
  }

  spawnPolice() {
    // Get police station spawn point
    const spawnPoint = this.townGenerator.getPoliceSpawnPoint();

    if (spawnPoint) {
      // Store spawn point for police dispatcher
      this.policeSpawnPoint = spawnPoint;

      // Spawn initial police force from station
      // Place them in a line in front of the station door (on the road)
      for (let i = 0; i < TOWN.INITIAL_COP_COUNT; i++) {
        // Spread horizontally in front of door, offset forward (positive Y is down/forward from door)
        const offsetX = (i % 3 - 1) * 18;
        const offsetY = 16 + Math.floor(i / 3) * 18; // Start 1 tile in front of door
        this.spawnSingleCop(spawnPoint.x + offsetX, spawnPoint.y + offsetY);
      }
    }
  }

  spawnSingleCop(x, y) {
    // Find a valid spawn position near the requested location
    let spawnX = x;
    let spawnY = y;

    // Check if requested position is in a wall, and find nearby valid spot
    if (this.isPositionBlocked(x, y)) {
      const validPos = this.findNearbyValidPosition(x, y);
      if (validPos) {
        spawnX = validPos.x;
        spawnY = validPos.y;
      }
    }

    const cop = new Police(this, spawnX, spawnY);
    this.police.push(cop);
    this.physics.add.collider(cop.sprite, this.walls);

    if (this.hud) {
      this.hud.ignoreGameObject(cop.sprite);
      if (cop.healthBar) {
        this.hud.ignoreGameObject(cop.healthBar);
      }
    }

    return cop;
  }

  /**
   * Spawn cages in player's basement
   */
  spawnCages() {
    const playerHome = this.townGenerator.getPlayerHome();
    if (!playerHome?.cagePositions) return;

    for (let i = 0; i < playerHome.cagePositions.length; i++) {
      const pos = playerHome.cagePositions[i];
      const cage = new Cage(this, pos.x, pos.y, i);
      this.cages.push(cage);
    }
  }

  isPositionBlocked(x, y) {
    if (!this.townData?.grid) return false;
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    if (tileX < 0 || tileY < 0 || tileX >= this.mapWidth || tileY >= this.mapHeight) {
      return true;
    }
    const cell = this.townData.grid[tileX][tileY];
    return cell.type === 'wall' || cell.type === 'tree' || cell.type === 'fountain';
  }

  findNearbyValidPosition(x, y) {
    // Search in expanding circles for a valid position
    for (let radius = 1; radius < 5; radius++) {
      for (let angle = 0; angle < 8; angle++) {
        const checkX = x + Math.cos(angle * Math.PI / 4) * radius * this.tileSize;
        const checkY = y + Math.sin(angle * Math.PI / 4) * radius * this.tileSize;
        if (!this.isPositionBlocked(checkX, checkY)) {
          return { x: checkX, y: checkY };
        }
      }
    }
    return null;
  }

  // ==================== Public API for Systems ====================

  // Corpse management (delegated to CorpseManager)
  spawnCorpse(x, y, textureKey, isPolice = false, race = null, gender = null, age = null, isPet = false, petType = null) {
    return this.corpseManager.spawn(x, y, textureKey, isPolice, race, gender, age, isPet, petType);
  }

  spawnBloodSplatter(x, y) {
    this.corpseManager.spawnBlood(x, y);
  }

  getNearestCorpse(x, y, range) {
    return this.corpseManager.getNearest(x, y, range);
  }

  get corpses() {
    return this.corpseManager.getAll();
  }

  // Identification (delegated to IdentificationSystem)
  isPlayerDoingIllegalActivity() {
    return this.identificationSystem.isPlayerDoingIllegalActivity();
  }

  identifyPlayer(witnessSprite) {
    this.identificationSystem.identifyPlayer(witnessSprite);
  }

  get playerIdentified() {
    return this.identificationSystem.isIdentified();
  }

  markIllegalActivity() {
    this.identificationSystem.markIllegalActivity();
  }

  recordIllegalActivity() {
    this.identificationSystem.markIllegalActivity();
  }

  // Talk cooldown (delegated to HUD)
  canTalk() {
    return this.hud?.canTalk() ?? true;
  }

  triggerTalkCooldown() {
    this.hud?.triggerTalkCooldown();
  }

  // Ritual (delegated to RitualSystem)
  getRitualSiteAt(x, y) {
    return this.ritualSystem.getSiteAt(x, y);
  }

  performSacrifice(corpse, site) {
    this.ritualSystem.performSacrifice(corpse, site, this.corpseManager);
  }

  // Police dispatch (delegated to PoliceDispatcher)
  alertCopsToDisturbance(x, y) {
    this.policeDispatcher.alertToDisturbance(x, y);
  }

  alertCopsToPlayerLocation(playerX, playerY) {
    // Alert all cops to the player's current location - they will chase
    for (const cop of this.police) {
      if (cop.isAlive) {
        cop.assignChase(playerX, playerY);
      }
    }
  }

  queueCopRespawn(x, y, isCopBody = false) {
    this.policeDispatcher.queueRespawn(x, y, isCopBody);
  }

  // Cage management
  getNearestEmptyCage(x, y, range) {
    let nearest = null;
    let nearestDist = range;

    for (const cage of this.cages) {
      if (!cage.isEmpty()) continue;

      const dist = Math.sqrt(
        Math.pow(cage.x - x, 2) + Math.pow(cage.y - y, 2)
      );

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = cage;
      }
    }

    return nearest;
  }

  // ==================== Player Transformation ====================

  /**
   * Transform player appearance based on worn skin
   */
  transformPlayerToSkin(skinInfo) {
    // Track skin index for unique texture key
    if (!this.skinAppearanceIndex) {
      this.skinAppearanceIndex = 0;
    }
    this.skinAppearanceIndex++;

    if (skinInfo.isPet) {
      // Pet skin - create costume appearance
      const petType = skinInfo.petType || 'dog';
      this.createPetCostumeTexture(petType, this.skinAppearanceIndex);
      this.player.sprite.setTexture(`player_costume_${petType}_${this.skinAppearanceIndex}`);
    } else {
      // Human skin - use victim's race colors
      const race = skinInfo.victimRace;
      if (race) {
        this.createSkinDisguiseTexture(race, skinInfo.victimGender, this.skinAppearanceIndex);
        this.player.sprite.setTexture(`player_skin_${this.skinAppearanceIndex}`);
      }
    }
  }

  /**
   * Create a player texture that looks like wearing a pet costume
   */
  createPetCostumeTexture(petType, index) {
    const key = `player_costume_${petType}_${index}`;
    if (this.textures.exists(key)) return;

    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Base colors for costume
    const furColor = petType === 'dog' ? 0x8b6914 : 0x888888;
    const darkFur = petType === 'dog' ? 0x5a4510 : 0x555555;

    // Hood with ears
    g.fillStyle(furColor);
    g.fillRect(2, 0, 12, 6);  // hood

    // Ears (on top of hood)
    if (petType === 'dog') {
      g.fillRect(2, -2, 3, 3);  // left ear
      g.fillRect(11, -2, 3, 3);  // right ear
    } else {
      // Pointy cat ears
      g.fillTriangle(3, 0, 5, -3, 7, 0);
      g.fillTriangle(9, 0, 11, -3, 13, 0);
    }

    // Body (furry costume)
    g.fillStyle(darkFur);
    g.fillRect(2, 6, 12, 6);  // body

    // Legs (costume feet)
    g.fillStyle(furColor);
    g.fillRect(4, 12, 3, 4);  // left leg
    g.fillRect(9, 12, 3, 4);  // right leg

    // Snout on hood
    g.fillStyle(0xffccaa);
    g.fillRect(6, 3, 4, 2);

    g.generateTexture(key, 16, 16);
  }

  /**
   * Create a player texture with victim's skin colors
   */
  createSkinDisguiseTexture(race, gender, index) {
    const key = `player_skin_${index}`;
    if (this.textures.exists(key)) return;

    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const skinColor = race.skin;
    const hairColor = race.hair;

    // Derive darker versions for body
    const r = (skinColor >> 16) & 0xff;
    const gVal = (skinColor >> 8) & 0xff;
    const b = skinColor & 0xff;
    const bodyColor = ((Math.floor(r * 0.85)) << 16) | ((Math.floor(gVal * 0.85)) << 8) | Math.floor(b * 0.85);

    // Hair on top
    g.fillStyle(hairColor);
    g.fillRect(3, 0, 10, 2);

    // Head with victim's skin
    g.fillStyle(skinColor);
    g.fillRect(2, 2, 12, 4);

    // Body
    g.fillStyle(bodyColor);
    g.fillRect(2, 6, 12, 6);

    // Legs
    g.fillStyle(skinColor);
    g.fillRect(4, 12, 3, 4);  // left leg
    g.fillRect(9, 12, 3, 4);  // right leg

    g.generateTexture(key, 16, 16);
  }

  // ==================== Game State ====================

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.player.disableControl();

    const cage = this.add.image(this.player.sprite.x, this.player.sprite.y, 'cage');
    cage.setDepth(DEPTH.CAGE);

    if (this.hud) {
      this.hud.ignoreGameObject(cage);
    }

    this.police.forEach(cop => {
      if (cop.sprite?.active) {
        cop.sprite.clearTint();
      }
    });

    this.hud.showGameOver();
  }

  /**
   * Trigger game over when a released prisoner reaches home and reports the player
   */
  triggerPrisonerEscapeGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.player.disableControl();

    // Show custom game over message
    this.hud.showGameOver('Your secrets were reported to the police.\nYou have nowhere to hide.');
  }

  // ==================== Sleep System ====================

  /**
   * Go to bed voluntarily (from bed interaction)
   */
  goToBed() {
    if (this.isGameOver || this.isSleeping) return;

    this.isSleeping = true;
    this.player.disableControl();
    this.dayNightSystem.pause();

    // Move player to bed position
    const bedPos = this.townGenerator.getPlayerBedPosition();
    if (bedPos) {
      this.player.sprite.setPosition(bedPos.x, bedPos.y);
    }

    // Show restful sleep transition
    this.sleepTransition.showRestfulSleep(() => {
      this.wakeUp();
    });
  }

  /**
   * Trigger fitful sleep (passed out at home but not in bed)
   */
  triggerFitfulSleep() {
    if (this.isGameOver || this.isSleeping) return;

    this.isSleeping = true;
    this.player.disableControl();
    this.dayNightSystem.pause();

    // Show fitful sleep transition (player stays where they passed out)
    this.sleepTransition.showFitfulSleep(() => {
      this.wakeUp();
    });
  }

  /**
   * Trigger game over from passing out in the street
   */
  triggerPassOutGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    this.player.disableControl();

    // Show pass out message
    this.hud.showGameOver('You passed out in the street...\nYour secrets were uncovered.');
  }

  /**
   * Wake up and start a new day
   */
  wakeUp() {
    this.isSleeping = false;
    this.dayNightSystem.startNewDay();
    this.player.canControl = true;

    // Add new daily objective
    if (this.objectiveSystem) {
      this.objectiveSystem.onNewDay();
    }

    // Show the new day notification
    if (this.hud) {
      this.hud.showNotification(`${this.dayNightSystem.getDateString()} - 9:00 AM`, 2000);
    }
  }

  /**
   * Show a notification message
   */
  showNotification(message, duration = 2000) {
    if (this.hud) {
      this.hud.showNotification(message, duration);
    }
  }
}
