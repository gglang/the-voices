import { NEIGHBORHOODS, HOUSE_TYPES, RACES, HUMAN_GENDERS, HUMAN_AGES, PET_TYPES } from '../config/constants.js';

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
    // Neighborhood-specific textures
    this.createAllNeighborhoodTextures();
    this.createAllHouseTypeTextures();
    this.createPlayerHomeMarker();
    this.createBasementTextures();
    // Neighborhood decorations
    this.createFlowerTextures();
    this.createDirtPatch();
    this.createTrash();
    // Effects
    this.createZzzIcon();
    // Pets
    this.createAllPets();
    this.createAllPetCorpses();
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
   * Police officer textures - create all race/gender variants (adults only)
   */
  createPolice() {
    for (const race of RACES) {
      for (const gender of HUMAN_GENDERS) {
        this.createPoliceVariant(race, gender);
      }
    }
    // Also create default 'police' texture for backwards compatibility
    this.createPoliceVariant(RACES[0], 'male', 'police');
  }

  /**
   * Single police officer texture variant
   */
  createPoliceVariant(race, gender, keyOverride = null) {
    const key = keyOverride || `police_${race.name}_${gender}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const isFemale = gender === 'female';

    // Dark blue cap
    g.fillStyle(0x1a237e);
    g.fillRect(1, 0, 14, 4);

    // Hair showing under cap for females
    if (isFemale) {
      g.fillStyle(race.hair);
      g.fillRect(1, 3, 3, 5); // left side hair
      g.fillRect(12, 3, 3, 5); // right side hair
    }

    // Face with race-specific skin color
    g.fillStyle(race.skin);
    g.fillRect(4, 2, 8, 3);

    // Uniform body
    g.fillStyle(0x283593);
    g.fillRect(2, 5, 12, 7);

    // Gold badge
    g.fillStyle(0xffd700);
    g.fillRect(5, 6, 3, 3);

    // Legs
    g.fillStyle(0x1a237e);
    g.fillRect(4, 12, 3, 4);
    g.fillRect(9, 12, 3, 4);

    g.generateTexture(key, 16, 16);
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
   * Cage textures for game over and imprisonment
   */
  createCage() {
    // Original small cage for game over
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(2, 0x333333);
    for (let i = 2; i < 16; i += 4) {
      g.lineBetween(i, 0, i, 16);
    }
    g.lineBetween(0, 2, 16, 2);
    g.lineBetween(0, 14, 16, 14);
    g.generateTexture('cage', 16, 16);

    // Larger cage for basement imprisonment (24x24)
    this.createCageEmpty();
  }

  /**
   * Empty cage for basement (24x24)
   */
  createCageEmpty() {
    const key = 'cage_empty';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    // Base/floor (dark stone)
    g.fillStyle(0x2a2a2a);
    g.fillRect(0, 20, 24, 4);

    // Vertical bars (iron gray)
    g.lineStyle(2, 0x444444);
    for (let i = 3; i < 24; i += 5) {
      g.lineBetween(i, 2, i, 20);
    }

    // Top bar
    g.lineStyle(2, 0x555555);
    g.lineBetween(0, 2, 24, 2);

    // Bottom horizontal bar
    g.lineBetween(0, 18, 24, 18);

    // Highlight on bars (lighter reflection)
    g.lineStyle(1, 0x666666);
    for (let i = 4; i < 24; i += 5) {
      g.lineBetween(i, 3, i, 17);
    }

    // Corner brackets
    g.fillStyle(0x555555);
    g.fillRect(0, 0, 4, 4);
    g.fillRect(20, 0, 4, 4);
    g.fillRect(0, 18, 4, 4);
    g.fillRect(20, 18, 4, 4);

    g.generateTexture(key, 24, 24);
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
   * Generate human textures for all race/gender/age combinations
   */
  createAllHumans() {
    // Create textures for each race/gender/age combination
    for (const race of RACES) {
      for (const gender of HUMAN_GENDERS) {
        for (const age of HUMAN_AGES) {
          this.createHumanVariant(race, gender, age);
        }
      }
    }
  }

  /**
   * Single human texture with race/gender/age variants
   */
  createHumanVariant(race, gender, age) {
    const key = `human_${race.name}_${gender}_${age}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const isChild = age === 'child';
    const isFemale = gender === 'female';

    // Size adjustments for children (smaller sprite)
    const size = isChild ? 12 : 16;
    const scale = isChild ? 0.75 : 1;

    // Hair - females have longer hair
    g.fillStyle(race.hair);
    if (isFemale) {
      // Long hair extends down sides
      g.fillRect(Math.floor(2 * scale), 0, Math.floor(12 * scale), Math.floor(4 * scale));
      g.fillRect(Math.floor(1 * scale), Math.floor(2 * scale), Math.floor(3 * scale), Math.floor(6 * scale)); // left side
      g.fillRect(Math.floor(12 * scale), Math.floor(2 * scale), Math.floor(3 * scale), Math.floor(6 * scale)); // right side
    } else {
      // Short hair
      g.fillRect(Math.floor(2 * scale), 0, Math.floor(12 * scale), Math.floor(4 * scale));
    }

    // Face
    g.fillStyle(race.skin);
    g.fillRect(Math.floor(4 * scale), Math.floor(2 * scale), Math.floor(8 * scale), Math.floor(3 * scale));

    // Body - slightly different clothing color based on gender
    const bodyColor = isFemale ? 0x555577 : 0x666666;
    g.fillStyle(bodyColor);
    g.fillRect(Math.floor(2 * scale), Math.floor(5 * scale), Math.floor(12 * scale), Math.floor(7 * scale));

    // Legs
    g.fillStyle(0x444444);
    g.fillRect(Math.floor(4 * scale), Math.floor(12 * scale), Math.floor(3 * scale), Math.floor(4 * scale));
    g.fillRect(Math.floor(9 * scale), Math.floor(12 * scale), Math.floor(3 * scale), Math.floor(4 * scale));

    g.generateTexture(key, size, size);
  }

  /**
   * Generate corpse textures for all race/gender/age combinations
   */
  createAllCorpses() {
    for (const race of RACES) {
      for (const gender of HUMAN_GENDERS) {
        for (const age of HUMAN_AGES) {
          this.createCorpseVariant(race, gender, age);
        }
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
  drawXEyes(g, scale = 1) {
    g.lineStyle(1, 0x000000);
    g.lineBetween(Math.floor(5 * scale), Math.floor(2 * scale), Math.floor(7 * scale), Math.floor(4 * scale));
    g.lineBetween(Math.floor(5 * scale), Math.floor(4 * scale), Math.floor(7 * scale), Math.floor(2 * scale));
    g.lineBetween(Math.floor(9 * scale), Math.floor(2 * scale), Math.floor(11 * scale), Math.floor(4 * scale));
    g.lineBetween(Math.floor(9 * scale), Math.floor(4 * scale), Math.floor(11 * scale), Math.floor(2 * scale));
  }

  /**
   * Single corpse texture with race/gender/age variants
   */
  createCorpseVariant(race, gender, age) {
    const key = `corpse_${race.name}_${gender}_${age}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const isChild = age === 'child';
    const isFemale = gender === 'female';

    const size = isChild ? 12 : 16;
    const scale = isChild ? 0.75 : 1;

    // Hair - females have longer hair
    g.fillStyle(this.tintColor(race.hair));
    if (isFemale) {
      g.fillRect(Math.floor(2 * scale), 0, Math.floor(12 * scale), Math.floor(4 * scale));
      g.fillRect(Math.floor(1 * scale), Math.floor(2 * scale), Math.floor(3 * scale), Math.floor(6 * scale));
      g.fillRect(Math.floor(12 * scale), Math.floor(2 * scale), Math.floor(3 * scale), Math.floor(6 * scale));
    } else {
      g.fillRect(Math.floor(2 * scale), 0, Math.floor(12 * scale), Math.floor(4 * scale));
    }

    // Face
    g.fillStyle(this.tintColor(race.skin));
    g.fillRect(Math.floor(4 * scale), Math.floor(2 * scale), Math.floor(8 * scale), Math.floor(3 * scale));

    // X eyes
    this.drawXEyes(g, scale);

    // Body
    const bodyColor = isFemale ? 0x555577 : 0x666666;
    g.fillStyle(this.tintColor(bodyColor));
    g.fillRect(Math.floor(2 * scale), Math.floor(5 * scale), Math.floor(12 * scale), Math.floor(7 * scale));

    // Legs
    g.fillStyle(this.tintColor(0x444444));
    g.fillRect(Math.floor(4 * scale), Math.floor(12 * scale), Math.floor(3 * scale), Math.floor(4 * scale));
    g.fillRect(Math.floor(9 * scale), Math.floor(12 * scale), Math.floor(3 * scale), Math.floor(4 * scale));

    g.generateTexture(key, size, size);
  }

  /**
   * Police corpse textures - create all race/gender variants
   */
  createPoliceCorpse() {
    for (const race of RACES) {
      for (const gender of HUMAN_GENDERS) {
        this.createPoliceCorpseVariant(race, gender);
      }
    }
    // Default for backwards compatibility
    this.createPoliceCorpseVariant(RACES[0], 'male', 'corpse_police');
  }

  /**
   * Single police corpse texture variant
   */
  createPoliceCorpseVariant(race, gender, keyOverride = null) {
    const key = keyOverride || `corpse_police_${race.name}_${gender}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const isFemale = gender === 'female';

    // Dark blue cap
    g.fillStyle(this.tintColor(0x1a237e));
    g.fillRect(1, 0, 14, 4);

    // Hair showing under cap for females
    if (isFemale) {
      g.fillStyle(this.tintColor(race.hair));
      g.fillRect(1, 3, 3, 5);
      g.fillRect(12, 3, 3, 5);
    }

    // Face with race-specific skin color
    g.fillStyle(this.tintColor(race.skin));
    g.fillRect(4, 2, 8, 3);
    this.drawXEyes(g);

    // Uniform body
    g.fillStyle(this.tintColor(0x283593));
    g.fillRect(2, 5, 12, 7);

    // Gold badge
    g.fillStyle(this.tintColor(0xffd700));
    g.fillRect(5, 6, 3, 3);

    // Legs
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

  // ==================== Neighborhood Textures ====================

  /**
   * Create all neighborhood-specific ground textures
   */
  createAllNeighborhoodTextures() {
    for (const [key, config] of Object.entries(NEIGHBORHOODS)) {
      this.createNeighborhoodGrass(config.name, config.grass);
      this.createNeighborhoodRoad(config.name, config.road);
      this.createNeighborhoodSidewalk(config.name, config.sidewalk);
    }
  }

  /**
   * Create grass texture for a neighborhood
   */
  createNeighborhoodGrass(name, colors) {
    const key = `grass_${name}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Base grass
    g.fillStyle(colors.base);
    g.fillRect(0, 0, 16, 16);
    // Grass variation - lighter patches
    g.fillStyle(colors.light);
    g.fillRect(1, 1, 3, 2);
    g.fillRect(8, 5, 4, 2);
    g.fillRect(3, 11, 3, 2);
    // Darker patches
    g.fillStyle(colors.dark);
    g.fillRect(12, 2, 2, 2);
    g.fillRect(5, 8, 2, 2);
    g.generateTexture(key, 16, 16);
  }

  /**
   * Create road texture for a neighborhood
   */
  createNeighborhoodRoad(name, colors) {
    const key = `road_${name}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Asphalt base
    g.fillStyle(colors.base);
    g.fillRect(0, 0, 16, 16);
    // Subtle texture variation
    g.fillStyle(colors.light);
    g.fillRect(2, 2, 4, 4);
    g.fillRect(10, 8, 4, 4);
    g.fillStyle(colors.dark);
    g.fillRect(6, 10, 3, 3);
    // Poor roads get cracks
    if (name === 'poor') {
      g.lineStyle(1, colors.dark);
      g.lineBetween(3, 1, 7, 5);
      g.lineBetween(10, 12, 14, 8);
    }
    g.generateTexture(key, 16, 16);
  }

  /**
   * Create sidewalk texture for a neighborhood
   */
  createNeighborhoodSidewalk(name, colors) {
    const key = `sidewalk_${name}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Base concrete
    g.fillStyle(colors.base);
    g.fillRect(0, 0, 16, 16);
    // Tile pattern
    g.lineStyle(1, colors.dark);
    g.lineBetween(8, 0, 8, 16);
    g.lineBetween(0, 8, 16, 8);
    // Light edge
    g.fillStyle(colors.light);
    g.fillRect(0, 0, 16, 1);
    g.fillRect(0, 0, 1, 16);
    // Poor sidewalks get cracks
    if (name === 'poor') {
      g.lineStyle(1, colors.dark);
      g.lineBetween(2, 3, 6, 7);
      g.lineBetween(11, 10, 14, 14);
    }
    g.generateTexture(key, 16, 16);
  }

  // ==================== House Type Textures ====================

  /**
   * Create all house type textures
   */
  createAllHouseTypeTextures() {
    for (const [type, config] of Object.entries(HOUSE_TYPES)) {
      this.createHouseTypeWall(type, config.wall);
      this.createHouseTypeRoof(type, config.roof);
      this.createHouseTypeFloor(type, config.floor);
    }
  }

  /**
   * Create wall texture for a house type
   */
  createHouseTypeWall(type, color) {
    const key = `wall_${type}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Base wall color
    g.fillStyle(color);
    g.fillRect(0, 0, 16, 16);

    // Derive darker color for detail
    const r = (color >> 16) & 0xff;
    const gVal = (color >> 8) & 0xff;
    const b = color & 0xff;
    const darkColor = ((Math.floor(r * 0.7)) << 16) | ((Math.floor(gVal * 0.7)) << 8) | Math.floor(b * 0.7);

    // Plank/brick lines based on type
    g.lineStyle(1, darkColor);
    if (type === 'trailer') {
      // Metal siding
      g.lineBetween(0, 4, 16, 4);
      g.lineBetween(0, 8, 16, 8);
      g.lineBetween(0, 12, 16, 12);
    } else if (type === 'mansion' || type === 'colonial' || type === 'modern') {
      // Fancy brick pattern
      g.lineBetween(0, 4, 16, 4);
      g.lineBetween(0, 8, 16, 8);
      g.lineBetween(0, 12, 16, 12);
      g.lineBetween(4, 0, 4, 4);
      g.lineBetween(12, 0, 12, 4);
      g.lineBetween(8, 4, 8, 8);
      g.lineBetween(4, 8, 4, 12);
      g.lineBetween(12, 8, 12, 12);
      g.lineBetween(8, 12, 8, 16);
    } else {
      // Wood plank pattern
      g.lineBetween(0, 4, 16, 4);
      g.lineBetween(0, 8, 16, 8);
      g.lineBetween(0, 12, 16, 12);
      g.lineBetween(8, 0, 8, 16);
    }
    g.generateTexture(key, 16, 16);
  }

  /**
   * Create roof texture for a house type
   */
  createHouseTypeRoof(type, color) {
    const key = `roof_${type}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Base roof color
    g.fillStyle(color);
    g.fillRect(0, 0, 16, 16);

    // Derive darker color for shingles
    const r = (color >> 16) & 0xff;
    const gVal = (color >> 8) & 0xff;
    const b = color & 0xff;
    const darkColor = ((Math.floor(r * 0.7)) << 16) | ((Math.floor(gVal * 0.7)) << 8) | Math.floor(b * 0.7);

    // Shingle pattern
    g.fillStyle(darkColor);
    if (type === 'trailer') {
      // Flat metal roof
      g.fillRect(0, 7, 16, 2);
    } else if (type === 'modern') {
      // Flat modern roof
      g.fillRect(0, 0, 8, 8);
      g.fillRect(8, 8, 8, 8);
    } else {
      // Traditional shingles
      g.fillRect(0, 0, 8, 4);
      g.fillRect(8, 4, 8, 4);
      g.fillRect(0, 8, 8, 4);
      g.fillRect(8, 12, 8, 4);
    }
    g.generateTexture(key, 16, 16);
  }

  /**
   * Create floor texture for a house type
   */
  createHouseTypeFloor(type, color) {
    const key = `floor_${type}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Base floor color
    g.fillStyle(color);
    g.fillRect(0, 0, 16, 16);

    // Derive darker color for detail
    const r = (color >> 16) & 0xff;
    const gVal = (color >> 8) & 0xff;
    const b = color & 0xff;
    const darkColor = ((Math.floor(r * 0.8)) << 16) | ((Math.floor(gVal * 0.8)) << 8) | Math.floor(b * 0.8);

    // Plank lines
    g.lineStyle(1, darkColor);
    g.lineBetween(0, 0, 16, 0);
    g.lineBetween(4, 0, 4, 16);
    g.lineBetween(12, 0, 12, 16);
    g.generateTexture(key, 16, 16);
  }

  // ==================== Player Home Textures ====================

  /**
   * Create skull marker for player's home yard
   */
  createPlayerHomeMarker() {
    const key = 'player_home_marker';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    // Skull shape
    g.fillStyle(0xe0e0e0); // Bone white
    // Skull dome
    g.fillCircle(8, 6, 5);
    // Jaw
    g.fillRect(4, 8, 8, 4);
    g.fillRect(5, 12, 6, 2);

    // Eye sockets
    g.fillStyle(0x1a1a1a);
    g.fillCircle(6, 5, 2);
    g.fillCircle(10, 5, 2);

    // Nose hole
    g.fillStyle(0x2a2a2a);
    g.fillRect(7, 8, 2, 2);

    // Teeth
    g.fillStyle(0x1a1a1a);
    g.fillRect(5, 10, 1, 2);
    g.fillRect(7, 10, 1, 2);
    g.fillRect(9, 10, 1, 2);

    // Dead plant behind skull
    g.fillStyle(0x4a3a2a);
    g.fillRect(2, 2, 2, 10);
    g.fillRect(12, 3, 2, 9);
    g.fillStyle(0x3a2a1a);
    g.fillRect(1, 0, 2, 3);
    g.fillRect(13, 1, 2, 3);

    g.generateTexture(key, 16, 16);
  }

  /**
   * Create basement-specific textures
   */
  createBasementTextures() {
    this.createBasementFloor();
    this.createBasementWall();
    this.createFloorHatch();
  }

  /**
   * Create dark basement floor
   */
  createBasementFloor() {
    const key = 'basement_floor';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Dark stone
    g.fillStyle(0x2a2a2a);
    g.fillRect(0, 0, 16, 16);
    // Stone pattern
    g.fillStyle(0x3a3a3a);
    g.fillRect(1, 1, 6, 6);
    g.fillRect(9, 9, 6, 6);
    g.fillStyle(0x222222);
    g.fillRect(8, 1, 6, 6);
    g.fillRect(1, 9, 6, 6);
    // Grout lines
    g.lineStyle(1, 0x1a1a1a);
    g.lineBetween(8, 0, 8, 16);
    g.lineBetween(0, 8, 16, 8);
    g.generateTexture(key, 16, 16);
  }

  /**
   * Create basement wall (darker version)
   */
  createBasementWall() {
    const key = 'basement_wall';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Dark stone bricks
    g.fillStyle(0x3a3a3a);
    g.fillRect(0, 0, 16, 16);
    // Brick pattern
    g.lineStyle(1, 0x2a2a2a);
    g.lineBetween(0, 4, 16, 4);
    g.lineBetween(0, 8, 16, 8);
    g.lineBetween(0, 12, 16, 12);
    g.lineBetween(8, 0, 8, 4);
    g.lineBetween(4, 4, 4, 8);
    g.lineBetween(12, 4, 12, 8);
    g.lineBetween(8, 8, 8, 12);
    g.lineBetween(4, 12, 4, 16);
    g.lineBetween(12, 12, 12, 16);
    g.generateTexture(key, 16, 16);
  }

  /**
   * Create floor hatch leading to basement
   */
  createFloorHatch() {
    const key = 'floor_hatch';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    // Wooden frame
    g.fillStyle(0x5a4a3a);
    g.fillRect(0, 0, 16, 16);
    // Inner hatch
    g.fillStyle(0x4a3a2a);
    g.fillRect(2, 2, 12, 12);
    // Handle
    g.fillStyle(0x888888);
    g.fillRect(6, 7, 4, 2);
    // Hinges
    g.fillStyle(0x666666);
    g.fillRect(1, 3, 2, 3);
    g.fillRect(1, 10, 2, 3);
    // Dark gap showing basement
    g.fillStyle(0x1a1a1a);
    g.fillRect(13, 2, 1, 12);
    g.generateTexture(key, 16, 16);
  }

  // ==================== Neighborhood Decoration Textures ====================

  /**
   * Create flower textures for rich neighborhood
   */
  createFlowerTextures() {
    // Red flowers
    this.createFlower('flower_red', 0xff4444, 0xffaaaa);
    // Yellow flowers
    this.createFlower('flower_yellow', 0xffff44, 0xffffaa);
    // Purple flowers
    this.createFlower('flower_purple', 0xaa44ff, 0xddaaff);
    // Pink flowers
    this.createFlower('flower_pink', 0xff88cc, 0xffccee);
    // White flowers
    this.createFlower('flower_white', 0xeeeeee, 0xffffff);
  }

  createFlower(key, petalColor, centerColor) {
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    // Stem
    g.fillStyle(0x228822);
    g.fillRect(7, 8, 2, 8);

    // Leaves
    g.fillStyle(0x33aa33);
    g.fillRect(5, 10, 3, 2);
    g.fillRect(8, 12, 3, 2);

    // Petals (5 around center)
    g.fillStyle(petalColor);
    g.fillCircle(8, 3, 3);   // top
    g.fillCircle(5, 5, 2);   // left
    g.fillCircle(11, 5, 2);  // right
    g.fillCircle(6, 7, 2);   // bottom left
    g.fillCircle(10, 7, 2);  // bottom right

    // Center
    g.fillStyle(centerColor);
    g.fillCircle(8, 5, 2);

    g.generateTexture(key, 16, 16);
  }

  /**
   * Create dirt patch texture for poor neighborhood
   */
  createDirtPatch() {
    const key = 'dirt_patch';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    // Base dirt color
    g.fillStyle(0x4a3a2a);
    g.fillCircle(8, 8, 6);

    // Darker patches
    g.fillStyle(0x3a2a1a);
    g.fillCircle(5, 6, 2);
    g.fillCircle(10, 9, 2);
    g.fillCircle(7, 11, 2);

    // Lighter spots (dried mud)
    g.fillStyle(0x5a4a3a);
    g.fillRect(6, 4, 3, 2);
    g.fillRect(9, 7, 2, 2);

    // Cracks
    g.lineStyle(1, 0x2a1a0a);
    g.lineBetween(4, 5, 9, 10);
    g.lineBetween(6, 9, 11, 6);

    g.generateTexture(key, 16, 16);
  }

  /**
   * Create trash/debris texture for poor neighborhood
   */
  createTrash() {
    const key = 'trash';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    // Crumpled paper/bag
    g.fillStyle(0x9a8a7a);
    g.fillRect(2, 4, 5, 4);
    g.fillStyle(0x7a6a5a);
    g.fillRect(3, 5, 3, 2);

    // Can
    g.fillStyle(0x666666);
    g.fillRect(8, 6, 4, 6);
    g.fillStyle(0x888888);
    g.fillRect(9, 6, 2, 1);
    g.fillStyle(0x555555);
    g.fillRect(8, 8, 4, 2);

    // Bottle
    g.fillStyle(0x558855);
    g.fillRect(4, 9, 3, 5);
    g.fillStyle(0x446644);
    g.fillRect(5, 7, 1, 3);

    // Random debris
    g.fillStyle(0x5a4a3a);
    g.fillRect(12, 10, 2, 3);
    g.fillStyle(0x4a5a6a);
    g.fillRect(1, 11, 2, 2);

    g.generateTexture(key, 16, 16);
  }

  /**
   * Create ZZZ sleep icon for sleepy effect
   */
  createZzzIcon() {
    const key = 'zzz_icon';
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    // Draw three Z's in increasing size
    g.fillStyle(0xaaaaff);

    // Small Z (top right)
    g.fillRect(10, 1, 4, 1);
    g.fillRect(13, 2, 1, 1);
    g.fillRect(12, 3, 1, 1);
    g.fillRect(11, 4, 1, 1);
    g.fillRect(10, 5, 4, 1);

    // Medium Z (middle)
    g.fillRect(5, 5, 5, 1);
    g.fillRect(9, 6, 1, 1);
    g.fillRect(8, 7, 1, 1);
    g.fillRect(7, 8, 1, 1);
    g.fillRect(6, 9, 1, 1);
    g.fillRect(5, 10, 5, 1);

    // Large Z (bottom left)
    g.fillRect(1, 9, 6, 1);
    g.fillRect(6, 10, 1, 1);
    g.fillRect(5, 11, 1, 1);
    g.fillRect(4, 12, 1, 1);
    g.fillRect(3, 13, 1, 1);
    g.fillRect(2, 14, 1, 1);
    g.fillRect(1, 15, 6, 1);

    g.generateTexture(key, 16, 16);
  }

  // ==================== Pet Textures ====================

  /**
   * Create all pet textures (dogs and cats)
   */
  createAllPets() {
    for (const [petType, config] of Object.entries(PET_TYPES)) {
      for (const colorVariant of config.colors) {
        this.createPetTexture(petType, colorVariant);
      }
    }
  }

  /**
   * Create a single pet texture
   */
  createPetTexture(petType, colorVariant) {
    const key = `${petType}_${colorVariant.name}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    if (petType === 'dog') {
      this.drawDog(g, colorVariant.body, colorVariant.spot);
      g.generateTexture(key, 14, 14);
    } else if (petType === 'cat') {
      this.drawCat(g, colorVariant.body, colorVariant.spot);
      g.generateTexture(key, 12, 12);
    }
  }

  /**
   * Draw a dog sprite (14x14)
   */
  drawDog(g, bodyColor, spotColor) {
    // Body (larger, more dog-like)
    g.fillStyle(bodyColor);
    g.fillRect(1, 5, 10, 5);

    // Head (bigger, rounder)
    g.fillRect(9, 2, 5, 5);

    // Floppy ears
    g.fillStyle(spotColor);
    g.fillRect(9, 1, 2, 3);
    g.fillRect(12, 1, 2, 3);

    // Snout (longer)
    g.fillStyle(bodyColor);
    g.fillRect(11, 4, 3, 3);

    // Nose
    g.fillStyle(0x1a1a1a);
    g.fillRect(13, 5, 1, 1);

    // Eye
    g.fillStyle(0x000000);
    g.fillRect(10, 3, 1, 1);

    // Front legs
    g.fillStyle(bodyColor);
    g.fillRect(8, 10, 2, 4);

    // Back legs
    g.fillRect(2, 10, 2, 4);

    // Tail (wagging up)
    g.fillRect(0, 3, 2, 3);
    g.fillRect(0, 2, 1, 2);

    // Spot on body
    g.fillStyle(spotColor);
    g.fillRect(4, 6, 3, 3);

    // Collar
    g.fillStyle(0xff0000);
    g.fillRect(9, 6, 3, 1);
  }

  /**
   * Draw a cat sprite (12x12)
   */
  drawCat(g, bodyColor, spotColor) {
    // Body (slender)
    g.fillStyle(bodyColor);
    g.fillRect(2, 5, 7, 4);

    // Head (rounder than dog)
    g.fillRect(7, 2, 4, 4);

    // Ears (pointy)
    g.fillStyle(spotColor);
    g.fillRect(7, 1, 2, 2);
    g.fillRect(10, 1, 2, 2);

    // Inner ear
    g.fillStyle(0xffaaaa);
    g.fillRect(8, 1, 1, 1);
    g.fillRect(10, 1, 1, 1);

    // Eyes
    g.fillStyle(0x44aa44); // Green cat eyes
    g.fillRect(8, 3, 1, 1);
    g.fillRect(10, 3, 1, 1);

    // Nose
    g.fillStyle(0xffaaaa);
    g.fillRect(9, 4, 1, 1);

    // Legs (slender)
    g.fillStyle(bodyColor);
    g.fillRect(3, 9, 1, 3);
    g.fillRect(5, 9, 1, 3);
    g.fillRect(7, 9, 1, 3);

    // Tail (long and curved)
    g.fillRect(0, 4, 3, 1);
    g.fillRect(0, 3, 1, 2);

    // Stripes/spots
    g.fillStyle(spotColor);
    g.fillRect(4, 6, 2, 1);
    g.fillRect(3, 7, 1, 1);
  }

  /**
   * Create all pet corpse textures
   */
  createAllPetCorpses() {
    for (const [petType, config] of Object.entries(PET_TYPES)) {
      for (const colorVariant of config.colors) {
        this.createPetCorpseTexture(petType, colorVariant);
      }
    }
  }

  /**
   * Create a single pet corpse texture
   */
  createPetCorpseTexture(petType, colorVariant) {
    const key = `corpse_${petType}_${colorVariant.name}`;
    if (this.scene.textures.exists(key)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const tintedBody = this.tintColor(colorVariant.body);
    const tintedSpot = this.tintColor(colorVariant.spot);

    if (petType === 'dog') {
      this.drawDeadDog(g, tintedBody, tintedSpot);
      g.generateTexture(key, 14, 14);
    } else if (petType === 'cat') {
      this.drawDeadCat(g, tintedBody, tintedSpot);
      g.generateTexture(key, 12, 12);
    }
  }

  /**
   * Draw a dead dog sprite (14x14)
   */
  drawDeadDog(g, bodyColor, spotColor) {
    // Body on its side (larger)
    g.fillStyle(bodyColor);
    g.fillRect(1, 5, 10, 5);

    // Head on ground
    g.fillRect(9, 4, 5, 5);

    // Ears flopped
    g.fillStyle(spotColor);
    g.fillRect(11, 3, 2, 2);
    g.fillRect(9, 3, 2, 2);

    // X eyes
    g.lineStyle(1, 0x000000);
    g.lineBetween(10, 5, 11, 6);
    g.lineBetween(10, 6, 11, 5);

    // Legs sprawled
    g.fillStyle(bodyColor);
    g.fillRect(2, 10, 2, 3);
    g.fillRect(6, 10, 2, 3);
    g.fillRect(2, 3, 2, 2);

    // Tail limp
    g.fillRect(0, 6, 2, 1);

    // Spot on body
    g.fillStyle(spotColor);
    g.fillRect(4, 6, 3, 3);

    // Collar
    g.fillStyle(this.tintColor(0xff0000));
    g.fillRect(9, 7, 3, 1);
  }

  /**
   * Draw a dead cat sprite (12x12)
   */
  drawDeadCat(g, bodyColor, spotColor) {
    // Body on its side
    g.fillStyle(bodyColor);
    g.fillRect(1, 5, 8, 3);

    // Head on ground
    g.fillRect(7, 3, 4, 4);

    // Ears flopped
    g.fillStyle(spotColor);
    g.fillRect(7, 2, 2, 2);
    g.fillRect(10, 2, 2, 2);

    // X eyes
    g.lineStyle(1, 0x000000);
    g.lineBetween(8, 4, 9, 5);
    g.lineBetween(8, 5, 9, 4);
    g.lineBetween(10, 4, 11, 5);
    g.lineBetween(10, 5, 11, 4);

    // Legs sprawled
    g.fillStyle(bodyColor);
    g.fillRect(2, 8, 1, 2);
    g.fillRect(4, 8, 1, 2);
    g.fillRect(6, 8, 1, 2);
    g.fillRect(2, 3, 1, 2);

    // Tail limp
    g.fillRect(0, 5, 2, 1);
    g.fillRect(0, 6, 1, 1);

    // Stripes/spots
    g.fillStyle(spotColor);
    g.fillRect(3, 6, 2, 1);
  }
}
