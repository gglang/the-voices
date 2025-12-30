import Phaser from 'phaser';
import { Player } from '../entities/Player.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // Create placeholder graphics
    this.createPlaceholderAssets();
  }

  create() {
    // Create a simple floor
    this.createFloor();

    // Create the player
    this.player = new Player(this, 160, 120);

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setBackgroundColor('#2d1b2e');

    // Create some obstacles/walls
    this.createWalls();
  }

  update() {
    this.player.update();
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
  }

  createFloor() {
    // Create a larger floor area for exploration
    for (let x = -10; x < 30; x++) {
      for (let y = -10; y < 25; y++) {
        this.add.image(x * 16 + 8, y * 16 + 8, 'floor');
      }
    }
  }

  createWalls() {
    this.walls = this.physics.add.staticGroup();

    // Create a simple room layout
    const wallPositions = [
      // Top wall
      ...Array.from({ length: 12 }, (_, i) => ({ x: i * 16 + 8, y: 8 })),
      // Bottom wall
      ...Array.from({ length: 12 }, (_, i) => ({ x: i * 16 + 8, y: 232 })),
      // Left wall
      ...Array.from({ length: 14 }, (_, i) => ({ x: 8, y: i * 16 + 24 })),
      // Right wall
      ...Array.from({ length: 14 }, (_, i) => ({ x: 184, y: i * 16 + 24 })),
      // Some interior walls/obstacles
      { x: 72, y: 72 }, { x: 88, y: 72 }, { x: 104, y: 72 },
      { x: 72, y: 168 }, { x: 88, y: 168 },
      { x: 136, y: 120 }, { x: 152, y: 120 },
    ];

    wallPositions.forEach(pos => {
      this.walls.create(pos.x, pos.y, 'wall');
    });

    // Set up collision between player and walls
    this.physics.add.collider(this.player?.sprite, this.walls);
  }
}
