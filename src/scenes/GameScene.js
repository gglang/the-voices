import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Human } from '../entities/Human.js';
import { Police } from '../entities/Police.js';
import { HUD } from '../ui/HUD.js';

// Color palettes
const HAIR_COLORS = {
  black: 0x1a1a1a,
  brown: 0x8B4513,
  blonde: 0xF4D03F,
  red: 0xC0392B,
  blue: 0x3498DB,
  white: 0xECECEC
};

const SKIN_COLORS = {
  light: 0xFFDBC4,
  tan: 0xE5B887,
  medium: 0xC68642,
  brown: 0x8D5524,
  dark: 0x5C3A21
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    // Map dimensions in tiles (16x16 pixels each)
    this.mapWidth = 100;
    this.mapHeight = 100;
    this.tileSize = 16;
  }

  preload() {
    // Create placeholder graphics
    this.createPlaceholderAssets();
  }

  create() {
    // Game state
    this.score = 0;
    this.isGameOver = false;
    this.humans = [];
    this.police = [];
    this.copRespawnQueue = [];

    // Randomize target preference
    const hairKeys = Object.keys(HAIR_COLORS);
    const skinKeys = Object.keys(SKIN_COLORS);
    this.targetHairColor = HAIR_COLORS[hairKeys[Phaser.Math.Between(0, hairKeys.length - 1)]];
    this.targetSkinColor = SKIN_COLORS[skinKeys[Phaser.Math.Between(0, skinKeys.length - 1)]];

    // Calculate map pixel dimensions
    const mapPixelWidth = this.mapWidth * this.tileSize;
    const mapPixelHeight = this.mapHeight * this.tileSize;

    // Set world bounds
    this.physics.world.setBounds(0, 0, mapPixelWidth, mapPixelHeight);

    // Create a simple floor
    this.createFloor();

    // Create perimeter walls and random obstacles
    this.createWalls();

    // Create the player at the center of the map
    const centerX = mapPixelWidth / 2;
    const centerY = mapPixelHeight / 2;
    this.player = new Player(this, centerX, centerY);

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#2d1b2e');
    this.cameras.main.setBounds(0, 0, mapPixelWidth, mapPixelHeight);
    this.cameras.main.setZoom(4);

    // Add collision after player is created
    this.physics.add.collider(this.player.sprite, this.walls);

    // Spawn NPCs
    this.spawnHumans();
    this.spawnPolice();

    // Create HUD
    this.hud = new HUD(this);
    this.hud.setTargetPreference(this.targetHairColor, this.targetSkinColor);
    this.hud.setScore(0);
  }

  update(time, delta) {
    if (this.isGameOver) return;

    this.player.update();

    // Update humans
    this.humans.forEach(human => human.update(delta));

    // Update police
    this.police.forEach(cop => cop.update(delta));

    // Process cop respawn queue
    this.processCopRespawnQueue(time);
  }

  createPlaceholderAssets() {
    // Player sprite (16x16 pixel character)
    const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    playerGraphics.fillStyle(0x6b8cff);
    playerGraphics.fillRect(2, 0, 12, 4);  // head
    playerGraphics.fillStyle(0x4a6cd4);
    playerGraphics.fillRect(2, 4, 12, 8);  // body
    playerGraphics.fillStyle(0x3d5a9e);
    playerGraphics.fillRect(4, 12, 3, 4);  // left leg
    playerGraphics.fillRect(9, 12, 3, 4);  // right leg
    playerGraphics.generateTexture('player', 16, 16);

    // Floor tile
    const floorGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    floorGraphics.fillStyle(0x3d3d5c);
    floorGraphics.fillRect(0, 0, 16, 16);
    floorGraphics.fillStyle(0x4a4a6a);
    floorGraphics.fillRect(0, 0, 1, 16);
    floorGraphics.fillRect(0, 0, 16, 1);
    floorGraphics.generateTexture('floor', 16, 16);

    // Wall tile
    const wallGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    wallGraphics.fillStyle(0x1a1a2e);
    wallGraphics.fillRect(0, 0, 16, 16);
    wallGraphics.fillStyle(0x2a2a4e);
    wallGraphics.fillRect(1, 1, 14, 14);
    wallGraphics.fillStyle(0x1a1a2e);
    wallGraphics.fillRect(4, 4, 8, 8);
    wallGraphics.generateTexture('wall', 16, 16);

    // Police sprite (dark blue uniform with badge)
    const policeGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    policeGraphics.fillStyle(0x1a237e);  // dark blue cap
    policeGraphics.fillRect(1, 0, 14, 4);
    policeGraphics.fillStyle(0xFFDBC4);  // face
    policeGraphics.fillRect(4, 2, 8, 3);
    policeGraphics.fillStyle(0x283593);  // uniform body
    policeGraphics.fillRect(2, 5, 12, 7);
    policeGraphics.fillStyle(0xffd700);  // gold badge
    policeGraphics.fillRect(5, 6, 3, 3);
    policeGraphics.fillStyle(0x1a237e);  // legs
    policeGraphics.fillRect(4, 12, 3, 4);
    policeGraphics.fillRect(9, 12, 3, 4);
    policeGraphics.generateTexture('police', 16, 16);

    // Generate human textures for all color combinations
    for (const hairColor of Object.values(HAIR_COLORS)) {
      for (const skinColor of Object.values(SKIN_COLORS)) {
        this.createHumanTexture(hairColor, skinColor);
      }
    }

    // Blood splatter texture
    const bloodGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    bloodGraphics.fillStyle(0x8B0000);
    bloodGraphics.fillCircle(8, 8, 6);
    bloodGraphics.fillStyle(0xB22222);
    bloodGraphics.fillCircle(4, 6, 3);
    bloodGraphics.fillCircle(12, 10, 3);
    bloodGraphics.fillCircle(6, 12, 2);
    bloodGraphics.generateTexture('blood', 16, 16);

    // Cage texture for game over
    const cageGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    cageGraphics.lineStyle(2, 0x333333);
    // Vertical bars
    for (let i = 2; i < 16; i += 4) {
      cageGraphics.lineBetween(i, 0, i, 16);
    }
    // Horizontal bars
    cageGraphics.lineBetween(0, 2, 16, 2);
    cageGraphics.lineBetween(0, 14, 16, 14);
    cageGraphics.generateTexture('cage', 16, 16);
  }

  createHumanTexture(hairColor, skinColor) {
    const key = `human_${hairColor}_${skinColor}`;

    // Check if texture already exists
    if (this.textures.exists(key)) return;

    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Hair (top of head)
    graphics.fillStyle(hairColor);
    graphics.fillRect(2, 0, 12, 4);

    // Face/skin
    graphics.fillStyle(skinColor);
    graphics.fillRect(4, 2, 8, 3);

    // Body (neutral gray shirt)
    graphics.fillStyle(0x666666);
    graphics.fillRect(2, 5, 12, 7);

    // Legs (darker gray pants)
    graphics.fillStyle(0x444444);
    graphics.fillRect(4, 12, 3, 4);
    graphics.fillRect(9, 12, 3, 4);

    graphics.generateTexture(key, 16, 16);
  }

  createFloor() {
    // Create floor tiles for the entire map
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        this.add.image(x * this.tileSize + 8, y * this.tileSize + 8, 'floor');
      }
    }
  }

  createWalls() {
    this.walls = this.physics.add.staticGroup();

    // Create perimeter walls
    // Top and bottom walls
    for (let x = 0; x < this.mapWidth; x++) {
      this.walls.create(x * this.tileSize + 8, 8, 'wall');
      this.walls.create(x * this.tileSize + 8, (this.mapHeight - 1) * this.tileSize + 8, 'wall');
    }

    // Left and right walls (excluding corners already placed)
    for (let y = 1; y < this.mapHeight - 1; y++) {
      this.walls.create(8, y * this.tileSize + 8, 'wall');
      this.walls.create((this.mapWidth - 1) * this.tileSize + 8, y * this.tileSize + 8, 'wall');
    }

    // Generate random obstacles throughout the map
    this.generateRandomObstacles();
  }

  generateRandomObstacles() {
    const numObstacles = 150;
    const centerX = this.mapWidth / 2;
    const centerY = this.mapHeight / 2;
    const safeRadius = 5; // Keep area around spawn clear

    for (let i = 0; i < numObstacles; i++) {
      // Random position (avoiding perimeter)
      const tileX = Phaser.Math.Between(2, this.mapWidth - 3);
      const tileY = Phaser.Math.Between(2, this.mapHeight - 3);

      // Skip if too close to center spawn point
      const distFromCenter = Math.sqrt(
        Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
      );
      if (distFromCenter < safeRadius) {
        continue;
      }

      // Create obstacle cluster (1-4 tiles)
      const clusterSize = Phaser.Math.Between(1, 4);
      const clusterType = Phaser.Math.Between(0, 2); // 0=horizontal, 1=vertical, 2=L-shape

      for (let j = 0; j < clusterSize; j++) {
        let offsetX = 0;
        let offsetY = 0;

        if (clusterType === 0) {
          offsetX = j;
        } else if (clusterType === 1) {
          offsetY = j;
        } else {
          // L-shape
          if (j < 2) offsetX = j;
          else offsetY = j - 1;
        }

        const finalX = tileX + offsetX;
        const finalY = tileY + offsetY;

        // Make sure we're still in bounds
        if (finalX > 1 && finalX < this.mapWidth - 2 &&
            finalY > 1 && finalY < this.mapHeight - 2) {
          this.walls.create(
            finalX * this.tileSize + 8,
            finalY * this.tileSize + 8,
            'wall'
          );
        }
      }
    }
  }

  spawnHumans() {
    const gridSize = 20; // 20x20 tile sections
    const hairColors = Object.values(HAIR_COLORS);
    const skinColors = Object.values(SKIN_COLORS);
    const centerX = this.mapWidth / 2;
    const centerY = this.mapHeight / 2;

    // Count spawns to ensure 1/3 are target preference
    let spawnIndex = 0;

    for (let gridX = 0; gridX < this.mapWidth; gridX += gridSize) {
      for (let gridY = 0; gridY < this.mapHeight; gridY += gridSize) {
        // Random position within this grid section
        const tileX = gridX + Phaser.Math.Between(2, gridSize - 3);
        const tileY = gridY + Phaser.Math.Between(2, gridSize - 3);

        // Skip if too close to center (player spawn)
        const distFromCenter = Math.sqrt(
          Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
        );
        if (distFromCenter < 8) continue;

        // Convert to pixels
        const x = tileX * this.tileSize + 8;
        const y = tileY * this.tileSize + 8;

        let hairColor, skinColor;

        // Every 3rd human matches target preference (1/3 of population)
        if (spawnIndex % 3 === 0) {
          hairColor = this.targetHairColor;
          skinColor = this.targetSkinColor;
        } else {
          // Random colors, but avoid matching target exactly
          do {
            hairColor = hairColors[Phaser.Math.Between(0, hairColors.length - 1)];
            skinColor = skinColors[Phaser.Math.Between(0, skinColors.length - 1)];
          } while (hairColor === this.targetHairColor && skinColor === this.targetSkinColor);
        }

        const human = new Human(this, x, y, hairColor, skinColor);
        this.humans.push(human);

        // Add collision with walls
        this.physics.add.collider(human.sprite, this.walls);

        spawnIndex++;
      }
    }
  }

  spawnPolice() {
    const gridSize = 50; // 50x50 tile sections
    const centerX = this.mapWidth / 2;
    const centerY = this.mapHeight / 2;

    for (let gridX = 0; gridX < this.mapWidth; gridX += gridSize) {
      for (let gridY = 0; gridY < this.mapHeight; gridY += gridSize) {
        // Random position within this grid section
        const tileX = gridX + Phaser.Math.Between(5, gridSize - 6);
        const tileY = gridY + Phaser.Math.Between(5, gridSize - 6);

        // Skip if too close to center (player spawn)
        const distFromCenter = Math.sqrt(
          Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
        );
        if (distFromCenter < 10) continue;

        // Convert to pixels
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

    // Make UI camera ignore this new sprite
    if (this.hud) {
      this.hud.ignoreGameObject(cop.sprite);
    }
  }

  spawnBloodSplatter(x, y) {
    const blood = this.add.image(x, y, 'blood');
    blood.setDepth(1);

    // Make UI camera ignore this new object
    if (this.hud) {
      this.hud.ignoreGameObject(blood);
    }

    // Fade out blood after a while
    this.tweens.add({
      targets: blood,
      alpha: 0.3,
      delay: 2000,
      duration: 3000
    });
  }

  addScore(points) {
    this.score += points;
    this.hud.setScore(this.score);
  }

  queueCopRespawn(x, y, isHumanKill = false) {
    // Queue 3 cops to spawn in 30 seconds
    const spawnTime = this.time.now + 30000;

    // Create a batch ID to track this group of cops
    const batchId = Date.now() + Math.random();

    for (let i = 0; i < 3; i++) {
      this.copRespawnQueue.push({
        time: spawnTime,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-50, 50),
        batchId: batchId
      });
    }

    // Show notification based on kill type
    if (isHumanKill) {
      this.hud.showNotification('A body was discovered!\n3 police have been dispatched', 3000);
    } else {
      this.hud.showNotification('An officer is down!\n3 police have been dispatched', 3000);
    }
  }

  processCopRespawnQueue(currentTime) {
    const toSpawn = [];
    const remaining = [];

    this.copRespawnQueue.forEach(entry => {
      if (currentTime >= entry.time) {
        toSpawn.push(entry);
      } else {
        remaining.push(entry);
      }
    });

    this.copRespawnQueue = remaining;

    // Track which batches we're spawning to show notification once per batch
    const spawnedBatches = new Set();

    toSpawn.forEach(entry => {
      // Clamp to world bounds
      const bounds = this.physics.world.bounds;
      const x = Phaser.Math.Clamp(entry.x, bounds.x + 32, bounds.right - 32);
      const y = Phaser.Math.Clamp(entry.y, bounds.y + 32, bounds.bottom - 32);
      this.spawnSingleCop(x, y);

      spawnedBatches.add(entry.batchId);
    });

    // Show notification if any cops spawned
    if (spawnedBatches.size > 0) {
      const totalCops = toSpawn.length;
      this.hud.showNotification(`${totalCops} police have arrived!`, 3000);
    }
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Disable player control
    this.player.disableControl();

    // Spawn cage over player
    const cage = this.add.image(this.player.sprite.x, this.player.sprite.y, 'cage');
    cage.setDepth(100);

    // Make UI camera ignore the cage
    if (this.hud) {
      this.hud.ignoreGameObject(cage);
    }

    // Stop all police flashing
    this.police.forEach(cop => {
      cop.sprite.clearTint();
    });

    // Show game over UI
    this.hud.showGameOver(this.score);
  }
}
