import { HAIR_COLORS, SKIN_COLORS } from '../config/constants.js';

/**
 * Factory class for generating all game textures programmatically
 */
export class TextureFactory {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Generate all game textures
   */
  createAll() {
    this.createPlayer();
    this.createFloor();
    this.createWall();
    this.createPolice();
    this.createBlood();
    this.createCage();
    this.createPentagram();
    this.createDarkFire();
    this.createExclamation();
    this.createAllHumans();
    this.createAllCorpses();
    this.createPoliceCorpse();
    // Town textures
    this.createRoad();
    this.createGrass();
    this.createHouseWall();
    this.createHouseFloor();
    this.createHouseRoof();
    this.createDoor();
    this.createPoliceStationWall();
    this.createPoliceStationRoof();
    this.createStoreWall();
    this.createStoreRoof();
    this.createFountain();
    this.createTree();
    this.createFurniture();
    this.createPoliceSign();
  }

  /**
   * Player sprite texture
   */
  createPlayer() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x6b8cff);
    g.fillRect(2, 0, 12, 4);  // head
    g.fillStyle(0x4a6cd4);
    g.fillRect(2, 4, 12, 8);  // body
    g.fillStyle(0x3d5a9e);
    g.fillRect(4, 12, 3, 4);  // left leg
    g.fillRect(9, 12, 3, 4);  // right leg
    g.generateTexture('player', 16, 16);
  }

  /**
   * Floor tile texture
   */
  createFloor() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x3d3d5c);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(0x4a4a6a);
    g.fillRect(0, 0, 1, 16);
    g.fillRect(0, 0, 16, 1);
    g.generateTexture('floor', 16, 16);
  }

  /**
   * Wall tile texture
   */
  createWall() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1a1a2e);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(0x2a2a4e);
    g.fillRect(1, 1, 14, 14);
    g.fillStyle(0x1a1a2e);
    g.fillRect(4, 4, 8, 8);
    g.generateTexture('wall', 16, 16);
  }

  /**
   * Police officer texture
   */
  createPolice() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1a237e);  // dark blue cap
    g.fillRect(1, 0, 14, 4);
    g.fillStyle(0xFFDBC4);  // face
    g.fillRect(4, 2, 8, 3);
    g.fillStyle(0x283593);  // uniform body
    g.fillRect(2, 5, 12, 7);
    g.fillStyle(0xffd700);  // gold badge
    g.fillRect(5, 6, 3, 3);
    g.fillStyle(0x1a237e);  // legs
    g.fillRect(4, 12, 3, 4);
    g.fillRect(9, 12, 3, 4);
    g.generateTexture('police', 16, 16);
  }

  /**
   * Blood splatter texture
   */
  createBlood() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x8B0000);
    g.fillCircle(8, 8, 6);
    g.fillStyle(0xB22222);
    g.fillCircle(4, 6, 3);
    g.fillCircle(12, 10, 3);
    g.fillCircle(6, 12, 2);
    g.generateTexture('blood', 16, 16);
  }

  /**
   * Cage texture for game over
   */
  createCage() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(2, 0x333333);
    for (let i = 2; i < 16; i += 4) {
      g.lineBetween(i, 0, i, 16);
    }
    g.lineBetween(0, 2, 16, 2);
    g.lineBetween(0, 14, 16, 14);
    g.generateTexture('cage', 16, 16);
  }

  /**
   * Pentagram altar texture (32x32)
   */
  createPentagram() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = 14;
    const innerRadius = 6;

    // Dark stone floor base
    g.fillStyle(0x1a1a1a);
    g.fillCircle(cx, cy, 15);

    // Outer circle (dark red)
    g.lineStyle(2, 0x8B0000);
    g.strokeCircle(cx, cy, outerRadius);

    // Draw pentagram (5-pointed star)
    g.lineStyle(1, 0xff0000);
    const points = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
      points.push({
        x: cx + Math.cos(angle) * outerRadius,
        y: cy + Math.sin(angle) * outerRadius
      });
    }

    for (let i = 0; i < 5; i++) {
      const next = (i + 2) % 5;
      g.lineBetween(points[i].x, points[i].y, points[next].x, points[next].y);
    }

    // Inner circle
    g.lineStyle(1, 0x660000);
    g.strokeCircle(cx, cy, innerRadius);

    // Glowing center dot
    g.fillStyle(0xff3300);
    g.fillCircle(cx, cy, 2);

    g.generateTexture('pentagram', size, size);
  }

  /**
   * Dark fire particle texture
   */
  createDarkFire() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x4a0080);
    g.fillCircle(8, 12, 6);
    g.fillStyle(0x6a00a0);
    g.fillCircle(5, 8, 4);
    g.fillCircle(11, 8, 4);
    g.fillStyle(0x8800cc);
    g.fillCircle(8, 5, 3);
    g.fillStyle(0xaa00ff);
    g.fillCircle(8, 3, 2);
    g.generateTexture('darkfire', 16, 16);
  }

  /**
   * Yellow exclamation mark texture
   */
  createExclamation() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffff00);
    g.fillRect(6, 0, 4, 10);
    g.fillRect(6, 12, 4, 4);
    g.lineStyle(1, 0x000000);
    g.strokeRect(6, 0, 4, 10);
    g.strokeRect(6, 12, 4, 4);
    g.generateTexture('exclamation', 16, 16);
  }

  /**
   * Generate human textures for all color combinations
   */
  createAllHumans() {
    for (const hairColor of Object.values(HAIR_COLORS)) {
      for (const skinColor of Object.values(SKIN_COLORS)) {
        this.createHuman(hairColor, skinColor);
      }
    }
  }

  /**
   * Single human texture
   */
  createHuman(hairColor, skinColor) {
    const key = `human_${hairColor}_${skinColor}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(hairColor);
    g.fillRect(2, 0, 12, 4);
    g.fillStyle(skinColor);
    g.fillRect(4, 2, 8, 3);
    g.fillStyle(0x666666);
    g.fillRect(2, 5, 12, 7);
    g.fillStyle(0x444444);
    g.fillRect(4, 12, 3, 4);
    g.fillRect(9, 12, 3, 4);
    g.generateTexture(key, 16, 16);
  }

  /**
   * Generate corpse textures for all color combinations
   */
  createAllCorpses() {
    for (const hairColor of Object.values(HAIR_COLORS)) {
      for (const skinColor of Object.values(SKIN_COLORS)) {
        this.createCorpse(hairColor, skinColor);
      }
    }
  }

  /**
   * Apply greenish-gray death tint to a color
   */
  tintColor(color) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const newR = Math.floor(r * 0.4 + 70 * 0.6);
    const newG = Math.floor(g * 0.4 + 90 * 0.6);
    const newB = Math.floor(b * 0.4 + 70 * 0.6);
    return (newR << 16) | (newG << 8) | newB;
  }

  /**
   * Draw X eyes on a corpse
   */
  drawXEyes(g) {
    g.lineStyle(1, 0x000000);
    g.lineBetween(5, 2, 7, 4);
    g.lineBetween(5, 4, 7, 2);
    g.lineBetween(9, 2, 11, 4);
    g.lineBetween(9, 4, 11, 2);
  }

  /**
   * Single corpse texture
   */
  createCorpse(hairColor, skinColor) {
    const key = `corpse_${hairColor}_${skinColor}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(this.tintColor(hairColor));
    g.fillRect(2, 0, 12, 4);
    g.fillStyle(this.tintColor(skinColor));
    g.fillRect(4, 2, 8, 3);
    this.drawXEyes(g);
    g.fillStyle(this.tintColor(0x666666));
    g.fillRect(2, 5, 12, 7);
    g.fillStyle(this.tintColor(0x444444));
    g.fillRect(4, 12, 3, 4);
    g.fillRect(9, 12, 3, 4);
    g.generateTexture(key, 16, 16);
  }

  /**
   * Police corpse texture
   */
  createPoliceCorpse() {
    const key = 'corpse_police';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(this.tintColor(0x1a237e));
    g.fillRect(1, 0, 14, 4);
    g.fillStyle(this.tintColor(0xFFDBC4));
    g.fillRect(4, 2, 8, 3);
    this.drawXEyes(g);
    g.fillStyle(this.tintColor(0x283593));
    g.fillRect(2, 5, 12, 7);
    g.fillStyle(this.tintColor(0xffd700));
    g.fillRect(5, 6, 3, 3);
    g.fillStyle(this.tintColor(0x1a237e));
    g.fillRect(4, 12, 3, 4);
    g.fillRect(9, 12, 3, 4);
    g.generateTexture(key, 16, 16);
  }

  // ==================== Town Textures ====================

  /**
   * Road tile texture
   */
  createRoad() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Asphalt base
    g.fillStyle(0x3a3a3a);
    g.fillRect(0, 0, 16, 16);
    // Subtle texture variation
    g.fillStyle(0x404040);
    g.fillRect(2, 2, 4, 4);
    g.fillRect(10, 8, 4, 4);
    g.fillStyle(0x353535);
    g.fillRect(6, 10, 3, 3);
    g.generateTexture('road', 16, 16);
  }

  /**
   * Grass tile texture
   */
  createGrass() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Base grass
    g.fillStyle(0x2d5a1e);
    g.fillRect(0, 0, 16, 16);
    // Grass variation
    g.fillStyle(0x3d6a2e);
    g.fillRect(1, 1, 3, 2);
    g.fillRect(8, 5, 4, 2);
    g.fillRect(3, 11, 3, 2);
    g.fillStyle(0x1d4a0e);
    g.fillRect(12, 2, 2, 2);
    g.fillRect(5, 8, 2, 2);
    g.generateTexture('grass', 16, 16);
  }

  /**
   * House wall texture (brown wood)
   */
  createHouseWall() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Wood planks
    g.fillStyle(0x8B4513);
    g.fillRect(0, 0, 16, 16);
    // Plank lines
    g.lineStyle(1, 0x6B3503);
    g.lineBetween(0, 4, 16, 4);
    g.lineBetween(0, 8, 16, 8);
    g.lineBetween(0, 12, 16, 12);
    // Vertical detail
    g.lineBetween(8, 0, 8, 16);
    g.generateTexture('house_wall', 16, 16);
  }

  /**
   * House floor texture (wooden planks)
   */
  createHouseFloor() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Wood floor
    g.fillStyle(0xA0522D);
    g.fillRect(0, 0, 16, 16);
    // Plank lines
    g.lineStyle(1, 0x8B4513);
    g.lineBetween(0, 0, 16, 0);
    g.lineBetween(4, 0, 4, 16);
    g.lineBetween(12, 0, 12, 16);
    g.generateTexture('house_floor', 16, 16);
  }

  /**
   * House roof texture
   */
  createHouseRoof() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Roof shingles
    g.fillStyle(0x8B0000);
    g.fillRect(0, 0, 16, 16);
    // Shingle pattern
    g.fillStyle(0x6B0000);
    g.fillRect(0, 0, 8, 4);
    g.fillRect(8, 4, 8, 4);
    g.fillRect(0, 8, 8, 4);
    g.fillRect(8, 12, 8, 4);
    g.generateTexture('house_roof', 16, 16);
  }

  /**
   * Door textures (closed, open, broken)
   */
  createDoor() {
    // Closed door
    let g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Door frame
    g.fillStyle(0x4a3728);
    g.fillRect(0, 0, 16, 16);
    // Door
    g.fillStyle(0x5c4033);
    g.fillRect(2, 0, 12, 14);
    // Door handle
    g.fillStyle(0xffd700);
    g.fillCircle(11, 8, 2);
    g.generateTexture('door', 16, 16);

    // Open door (shows doorway/floor)
    g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Frame
    g.fillStyle(0x4a3728);
    g.fillRect(0, 0, 16, 16);
    // Doorway (dark interior)
    g.fillStyle(0x2a1a10);
    g.fillRect(2, 0, 12, 14);
    // Hint of floor inside
    g.fillStyle(0xA0522D);
    g.fillRect(3, 12, 10, 2);
    g.generateTexture('door_open', 16, 16);

    // Broken door
    g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Frame (damaged)
    g.fillStyle(0x3a2718);
    g.fillRect(0, 0, 16, 16);
    // Broken door pieces
    g.fillStyle(0x4c3023);
    g.fillRect(2, 0, 5, 10); // Left piece tilted
    g.fillRect(9, 2, 5, 8);  // Right piece
    // Splinters
    g.fillStyle(0x5c4033);
    g.fillRect(7, 0, 2, 4);
    g.fillRect(6, 10, 3, 2);
    // Dark interior visible
    g.fillStyle(0x2a1a10);
    g.fillRect(4, 11, 8, 3);
    g.generateTexture('door_broken', 16, 16);
  }

  /**
   * Police station wall texture (blue brick)
   */
  createPoliceStationWall() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Blue brick
    g.fillStyle(0x1a237e);
    g.fillRect(0, 0, 16, 16);
    // Brick pattern
    g.lineStyle(1, 0x0d1642);
    g.lineBetween(0, 4, 16, 4);
    g.lineBetween(0, 8, 16, 8);
    g.lineBetween(0, 12, 16, 12);
    g.lineBetween(8, 0, 8, 4);
    g.lineBetween(4, 4, 4, 8);
    g.lineBetween(12, 4, 12, 8);
    g.lineBetween(8, 8, 8, 12);
    g.lineBetween(4, 12, 4, 16);
    g.lineBetween(12, 12, 12, 16);
    g.generateTexture('police_wall', 16, 16);
  }

  /**
   * Police station roof texture
   */
  createPoliceStationRoof() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Gray roof
    g.fillStyle(0x444444);
    g.fillRect(0, 0, 16, 16);
    // Pattern
    g.fillStyle(0x333333);
    g.fillRect(0, 0, 8, 8);
    g.fillRect(8, 8, 8, 8);
    g.generateTexture('police_roof', 16, 16);
  }

  /**
   * Store wall texture (tan/beige)
   */
  createStoreWall() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Beige wall
    g.fillStyle(0xdaa520);
    g.fillRect(0, 0, 16, 16);
    // Window detail
    g.fillStyle(0x87ceeb);
    g.fillRect(3, 3, 10, 8);
    g.fillStyle(0xffffff);
    g.fillRect(4, 4, 3, 3);
    g.generateTexture('store_wall', 16, 16);
  }

  /**
   * Store roof texture
   */
  createStoreRoof() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Striped awning
    g.fillStyle(0xff4444);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 16);
    g.fillRect(8, 0, 4, 16);
    g.generateTexture('store_roof', 16, 16);
  }

  /**
   * Fountain texture (for town square)
   */
  createFountain() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const size = 32;
    // Stone base
    g.fillStyle(0x666666);
    g.fillCircle(16, 16, 14);
    // Water
    g.fillStyle(0x4169e1);
    g.fillCircle(16, 16, 10);
    // Center pillar
    g.fillStyle(0x888888);
    g.fillCircle(16, 16, 4);
    // Water spray effect
    g.fillStyle(0x87ceeb);
    g.fillCircle(16, 12, 2);
    g.fillCircle(14, 14, 1);
    g.fillCircle(18, 14, 1);
    g.generateTexture('fountain', size, size);
  }

  /**
   * Tree texture
   */
  createTree() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Trunk
    g.fillStyle(0x5c4033);
    g.fillRect(6, 10, 4, 6);
    // Foliage
    g.fillStyle(0x228b22);
    g.fillCircle(8, 6, 6);
    g.fillStyle(0x2e8b2e);
    g.fillCircle(6, 5, 4);
    g.fillCircle(10, 5, 4);
    g.generateTexture('tree', 16, 16);
  }

  /**
   * Furniture textures
   */
  createFurniture() {
    // Bed
    let g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x8B4513);
    g.fillRect(0, 0, 16, 24);
    g.fillStyle(0xffffff);
    g.fillRect(2, 2, 12, 8);
    g.fillStyle(0x4169e1);
    g.fillRect(2, 10, 12, 12);
    g.generateTexture('furniture_bed', 16, 24);

    // Table
    g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x8B4513);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(0xA0522D);
    g.fillRect(2, 2, 12, 12);
    g.generateTexture('furniture_table', 16, 16);

    // Chair
    g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x8B4513);
    g.fillRect(2, 0, 12, 4);
    g.fillRect(4, 4, 8, 8);
    g.generateTexture('furniture_chair', 16, 12);
  }

  /**
   * Police sign texture
   */
  createPoliceSign() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Sign background (blue)
    g.fillStyle(0x1a237e);
    g.fillRect(0, 0, 32, 12);
    // Border
    g.lineStyle(1, 0xffd700);
    g.strokeRect(0, 0, 32, 12);
    // "POLICE" text effect (simplified as white blocks)
    g.fillStyle(0xffffff);
    // P
    g.fillRect(2, 2, 1, 8);
    g.fillRect(3, 2, 2, 1);
    g.fillRect(3, 5, 2, 1);
    g.fillRect(5, 3, 1, 2);
    // O
    g.fillRect(7, 2, 1, 8);
    g.fillRect(11, 2, 1, 8);
    g.fillRect(8, 2, 3, 1);
    g.fillRect(8, 9, 3, 1);
    // L
    g.fillRect(13, 2, 1, 8);
    g.fillRect(14, 9, 3, 1);
    // I
    g.fillRect(18, 2, 1, 8);
    // C
    g.fillRect(20, 2, 1, 8);
    g.fillRect(21, 2, 3, 1);
    g.fillRect(21, 9, 3, 1);
    // E
    g.fillRect(25, 2, 1, 8);
    g.fillRect(26, 2, 3, 1);
    g.fillRect(26, 5, 2, 1);
    g.fillRect(26, 9, 3, 1);

    g.generateTexture('police_sign', 32, 12);
  }
}
