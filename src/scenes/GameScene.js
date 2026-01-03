import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Human } from '../entities/Human.js';
import { Police } from '../entities/Police.js';
import { HUD } from '../ui/HUD.js';
import { Minimap } from '../ui/Minimap.js';
import { ActionPopup } from '../ui/ActionPopup.js';
import { TextureFactory } from '../utils/TextureFactory.js';
import { CorpseManager } from '../systems/CorpseManager.js';
import { IdentificationSystem } from '../systems/IdentificationSystem.js';
import { RitualSystem } from '../systems/RitualSystem.js';
import { PoliceDispatcher } from '../systems/PoliceDispatcher.js';
import { TownGenerator } from '../systems/TownGenerator.js';
import { ActionSystem } from '../systems/ActionSystem.js';
import {
  MAP, DEPTH, TOWN,
  HAIR_COLORS, SKIN_COLORS
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
  }

  /**
   * Initialize core game state
   */
  initializeGameState() {
    this.score = 0;
    this.isGameOver = false;
    this.humans = [];
    this.police = [];

    // Randomize target preference
    const hairKeys = Object.keys(HAIR_COLORS);
    const skinKeys = Object.keys(SKIN_COLORS);
    this.targetHairColor = HAIR_COLORS[hairKeys[Phaser.Math.Between(0, hairKeys.length - 1)]];
    this.targetSkinColor = SKIN_COLORS[skinKeys[Phaser.Math.Between(0, skinKeys.length - 1)]];
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

    // Find a good spawn point for player (near town center, on road)
    const centerX = mapPixelWidth / 2;
    const centerY = mapPixelHeight / 2;
    this.player = new Player(this, centerX, centerY);

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
    this.spawnPolice();
    // Spawn ritual sites in remote areas (corners of map)
    this.ritualSystem.spawnSites(this.mapWidth, this.mapHeight, this.tileSize, this.walls);
  }

  /**
   * Create the HUD
   */
  createHUD() {
    this.hud = new HUD(this);
    this.hud.setTargetPreference(this.targetHairColor, this.targetSkinColor);
    this.hud.setScore(0);

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

  update(time, delta) {
    if (this.isGameOver) return;

    this.player.update();
    this.humans.forEach(human => human.update(delta));
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

    // Update minimap
    if (this.minimap) {
      this.minimap.update();
    }
  }

  // ==================== Entity Spawning ====================

  spawnHumans() {
    const hairColors = Object.values(HAIR_COLORS);
    const skinColors = Object.values(SKIN_COLORS);
    const houses = this.townGenerator.getHouses();

    let spawnIndex = 0;

    // Spawn 1-3 humans per house
    for (const house of houses) {
      const humansInHouse = Phaser.Math.Between(
        TOWN.HUMANS_PER_HOUSE_MIN,
        TOWN.HUMANS_PER_HOUSE_MAX
      );

      for (let h = 0; h < humansInHouse; h++) {
        let hairColor, skinColor;

        // Every 3rd human matches the target preference
        if (spawnIndex % 3 === 0) {
          hairColor = this.targetHairColor;
          skinColor = this.targetSkinColor;
        } else {
          do {
            hairColor = hairColors[Phaser.Math.Between(0, hairColors.length - 1)];
            skinColor = skinColors[Phaser.Math.Between(0, skinColors.length - 1)];
          } while (hairColor === this.targetHairColor && skinColor === this.targetSkinColor);
        }

        // Offset spawn position slightly for multiple humans
        const offsetX = (h - 1) * 8;
        const offsetY = (h % 2) * 8;

        const human = new Human(
          this,
          house.centerPixelX + offsetX,
          house.centerPixelY + offsetY,
          hairColor,
          skinColor,
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
  spawnCorpse(x, y, textureKey, isPolice = false, hairColor = null, skinColor = null) {
    return this.corpseManager.spawn(x, y, textureKey, isPolice, hairColor, skinColor);
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

  // ==================== Player Transformation ====================

  /**
   * Transform player appearance after cop sacrifice
   */
  transformPlayerAppearance() {
    // Cycle through different player appearances
    if (!this.playerAppearanceIndex) {
      this.playerAppearanceIndex = 0;
    }
    this.playerAppearanceIndex = (this.playerAppearanceIndex + 1) % 4;

    // Apply different tints based on appearance index
    const appearances = [
      0x6b8cff, // Original blue
      0x8b6bff, // Purple
      0xff6b8c, // Pink
      0x6bff8c  // Green
    ];

    const color = appearances[this.playerAppearanceIndex];
    this.player.sprite.setTint(color);

    // Create new player texture with different color
    this.createPlayerTexture(color);
    this.player.sprite.setTexture(`player_${this.playerAppearanceIndex}`);
    this.player.sprite.clearTint();
  }

  /**
   * Create a player texture with custom color
   */
  createPlayerTexture(color) {
    const key = `player_${this.playerAppearanceIndex}`;
    if (this.textures.exists(key)) return;

    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Derive colors from base
    const r = (color >> 16) & 0xff;
    const gVal = (color >> 8) & 0xff;
    const b = color & 0xff;

    const bodyColor = ((Math.floor(r * 0.7)) << 16) | ((Math.floor(gVal * 0.7)) << 8) | Math.floor(b * 0.7);
    const legColor = ((Math.floor(r * 0.5)) << 16) | ((Math.floor(gVal * 0.5)) << 8) | Math.floor(b * 0.5);

    g.fillStyle(color);
    g.fillRect(2, 0, 12, 4);  // head
    g.fillStyle(bodyColor);
    g.fillRect(2, 4, 12, 8);  // body
    g.fillStyle(legColor);
    g.fillRect(4, 12, 3, 4);  // left leg
    g.fillRect(9, 12, 3, 4);  // right leg

    g.generateTexture(key, 16, 16);
  }

  // ==================== Score & Game State ====================

  addScore(points) {
    this.score += points;
    this.hud.setScore(this.score);
  }

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

    this.hud.showGameOver(this.score);
  }
}
