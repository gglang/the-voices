import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Human } from '../entities/Human.js';
import { Police } from '../entities/Police.js';
import { HUD } from '../ui/HUD.js';
import { TextureFactory } from '../utils/TextureFactory.js';
import { CorpseManager } from '../systems/CorpseManager.js';
import { IdentificationSystem } from '../systems/IdentificationSystem.js';
import { RitualSystem } from '../systems/RitualSystem.js';
import { PoliceDispatcher } from '../systems/PoliceDispatcher.js';
import {
  MAP, HUMAN, POLICE, DEPTH,
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
    this.createWorld();
    this.spawnEntities();
    this.createHUD();
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
  }

  /**
   * Create the game world
   */
  createWorld() {
    const mapPixelWidth = this.mapWidth * this.tileSize;
    const mapPixelHeight = this.mapHeight * this.tileSize;

    this.physics.world.setBounds(0, 0, mapPixelWidth, mapPixelHeight);

    this.createFloor();
    this.createWalls();

    // Create player at center
    const centerX = mapPixelWidth / 2;
    const centerY = mapPixelHeight / 2;
    this.player = new Player(this, centerX, centerY);

    // Set up camera
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#2d1b2e');
    this.cameras.main.setBounds(0, 0, mapPixelWidth, mapPixelHeight);
    this.cameras.main.setZoom(4);

    this.physics.add.collider(this.player.sprite, this.walls);
  }

  /**
   * Spawn all entities
   */
  spawnEntities() {
    this.spawnHumans();
    this.spawnPolice();
    this.ritualSystem.spawnSites(this.mapWidth, this.mapHeight, this.tileSize, this.walls);
  }

  /**
   * Create the HUD
   */
  createHUD() {
    this.hud = new HUD(this);
    this.hud.setTargetPreference(this.targetHairColor, this.targetSkinColor);
    this.hud.setScore(0);
  }

  update(time, delta) {
    if (this.isGameOver) return;

    this.player.update();
    this.humans.forEach(human => human.update(delta));
    this.police.forEach(cop => cop.update(delta));
    this.policeDispatcher.processQueue(time);
  }

  // ==================== World Creation ====================

  createFloor() {
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        this.add.image(x * this.tileSize + 8, y * this.tileSize + 8, 'floor');
      }
    }
  }

  createWalls() {
    this.walls = this.physics.add.staticGroup();

    // Perimeter walls
    for (let x = 0; x < this.mapWidth; x++) {
      this.walls.create(x * this.tileSize + 8, 8, 'wall');
      this.walls.create(x * this.tileSize + 8, (this.mapHeight - 1) * this.tileSize + 8, 'wall');
    }
    for (let y = 1; y < this.mapHeight - 1; y++) {
      this.walls.create(8, y * this.tileSize + 8, 'wall');
      this.walls.create((this.mapWidth - 1) * this.tileSize + 8, y * this.tileSize + 8, 'wall');
    }

    this.generateRandomObstacles();
  }

  generateRandomObstacles() {
    const centerX = this.mapWidth / 2;
    const centerY = this.mapHeight / 2;

    for (let i = 0; i < MAP.OBSTACLE_COUNT; i++) {
      const tileX = Phaser.Math.Between(2, this.mapWidth - 3);
      const tileY = Phaser.Math.Between(2, this.mapHeight - 3);

      const distFromCenter = Math.sqrt(
        Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
      );
      if (distFromCenter < MAP.SAFE_SPAWN_RADIUS) continue;

      const clusterSize = Phaser.Math.Between(1, 4);
      const clusterType = Phaser.Math.Between(0, 2);

      for (let j = 0; j < clusterSize; j++) {
        let offsetX = 0, offsetY = 0;

        if (clusterType === 0) offsetX = j;
        else if (clusterType === 1) offsetY = j;
        else {
          if (j < 2) offsetX = j;
          else offsetY = j - 1;
        }

        const finalX = tileX + offsetX;
        const finalY = tileY + offsetY;

        if (finalX > 1 && finalX < this.mapWidth - 2 &&
            finalY > 1 && finalY < this.mapHeight - 2) {
          this.walls.create(finalX * this.tileSize + 8, finalY * this.tileSize + 8, 'wall');
        }
      }
    }
  }

  // ==================== Entity Spawning ====================

  spawnHumans() {
    const hairColors = Object.values(HAIR_COLORS);
    const skinColors = Object.values(SKIN_COLORS);
    const centerX = this.mapWidth / 2;
    const centerY = this.mapHeight / 2;
    let spawnIndex = 0;

    for (let gridX = 0; gridX < this.mapWidth; gridX += HUMAN.SPAWN_GRID_SIZE) {
      for (let gridY = 0; gridY < this.mapHeight; gridY += HUMAN.SPAWN_GRID_SIZE) {
        const tileX = gridX + Phaser.Math.Between(2, HUMAN.SPAWN_GRID_SIZE - 3);
        const tileY = gridY + Phaser.Math.Between(2, HUMAN.SPAWN_GRID_SIZE - 3);

        const distFromCenter = Math.sqrt(
          Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
        );
        if (distFromCenter < 8) continue;

        const x = tileX * this.tileSize + 8;
        const y = tileY * this.tileSize + 8;

        let hairColor, skinColor;
        if (spawnIndex % 3 === 0) {
          hairColor = this.targetHairColor;
          skinColor = this.targetSkinColor;
        } else {
          do {
            hairColor = hairColors[Phaser.Math.Between(0, hairColors.length - 1)];
            skinColor = skinColors[Phaser.Math.Between(0, skinColors.length - 1)];
          } while (hairColor === this.targetHairColor && skinColor === this.targetSkinColor);
        }

        const human = new Human(this, x, y, hairColor, skinColor);
        this.humans.push(human);
        this.physics.add.collider(human.sprite, this.walls);
        spawnIndex++;
      }
    }
  }

  spawnPolice() {
    const centerX = this.mapWidth / 2;
    const centerY = this.mapHeight / 2;

    for (let gridX = 0; gridX < this.mapWidth; gridX += POLICE.SPAWN_GRID_SIZE) {
      for (let gridY = 0; gridY < this.mapHeight; gridY += POLICE.SPAWN_GRID_SIZE) {
        const tileX = gridX + Phaser.Math.Between(5, POLICE.SPAWN_GRID_SIZE - 6);
        const tileY = gridY + Phaser.Math.Between(5, POLICE.SPAWN_GRID_SIZE - 6);

        const distFromCenter = Math.sqrt(
          Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
        );
        if (distFromCenter < 10) continue;

        const x = tileX * this.tileSize + 8;
        const y = tileY * this.tileSize + 8;
        this.spawnSingleCop(x, y);
      }
    }
  }

  spawnSingleCop(x, y) {
    const cop = new Police(this, x, y);
    this.police.push(cop);
    this.physics.add.collider(cop.sprite, this.walls);

    if (this.hud) {
      this.hud.ignoreGameObject(cop.sprite);
      if (cop.healthBar) {
        this.hud.ignoreGameObject(cop.healthBar);
      }
    }
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
