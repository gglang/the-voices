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
}
