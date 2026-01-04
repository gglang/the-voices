import { MINIMAP } from '../config/constants.js';

/**
 * Minimap UI component showing player, corpses, buildings, roads, and ritual sites
 */
export class Minimap {
  constructor(scene, townData) {
    this.scene = scene;
    this.townData = townData;

    // Calculate scale to fit map in minimap
    this.scaleX = MINIMAP.WIDTH / (townData.mapWidth * townData.tileSize);
    this.scaleY = MINIMAP.HEIGHT / (townData.mapHeight * townData.tileSize);

    // Create graphics objects
    this.background = scene.add.graphics();
    this.staticLayer = scene.add.graphics();
    this.dynamicLayer = scene.add.graphics();

    // Set up UI properties
    this.background.setScrollFactor(0);
    this.staticLayer.setScrollFactor(0);
    this.dynamicLayer.setScrollFactor(0);

    this.background.setDepth(999);
    this.staticLayer.setDepth(1000);
    this.dynamicLayer.setDepth(1001);

    // Store position
    this.x = 0;
    this.y = 0;

    // Calculate initial position
    this.updatePosition();

    // Draw static elements once
    this.drawStatic();

    // Listen for resize
    scene.scale.on('resize', this.updatePosition, this);
  }

  /**
   * Update minimap position on screen
   */
  updatePosition() {
    const padding = MINIMAP.PADDING;
    const height = this.scene.scale.height;

    // Bottom-left corner
    this.x = padding;
    this.y = height - padding - MINIMAP.HEIGHT;

    // Redraw background
    this.drawBackground();
    this.drawStatic();
  }

  /**
   * Draw minimap background
   */
  drawBackground() {
    this.background.clear();

    // Border
    this.background.fillStyle(MINIMAP.COLORS.BORDER);
    this.background.fillRect(
      this.x - MINIMAP.BORDER_WIDTH,
      this.y - MINIMAP.BORDER_WIDTH,
      MINIMAP.WIDTH + MINIMAP.BORDER_WIDTH * 2,
      MINIMAP.HEIGHT + MINIMAP.BORDER_WIDTH * 2
    );

    // Background
    this.background.fillStyle(MINIMAP.COLORS.BACKGROUND);
    this.background.fillRect(this.x, this.y, MINIMAP.WIDTH, MINIMAP.HEIGHT);
  }

  /**
   * Draw static elements (roads, buildings, trees)
   */
  drawStatic() {
    this.staticLayer.clear();

    // Draw roads
    this.staticLayer.fillStyle(MINIMAP.COLORS.ROAD);
    for (const road of this.townData.roads) {
      const rx = this.x + road.x * this.townData.tileSize * this.scaleX;
      const ry = this.y + road.y * this.townData.tileSize * this.scaleY;
      const rw = road.width * this.townData.tileSize * this.scaleX;
      const rh = road.height * this.townData.tileSize * this.scaleY;
      this.staticLayer.fillRect(rx, ry, rw, rh);
    }

    // Draw sidewalks
    if (this.townData.sidewalks) {
      this.staticLayer.fillStyle(MINIMAP.COLORS.SIDEWALK);
      for (const sidewalk of this.townData.sidewalks) {
        const sx = this.x + sidewalk.x * this.townData.tileSize * this.scaleX;
        const sy = this.y + sidewalk.y * this.townData.tileSize * this.scaleY;
        const sw = sidewalk.width * this.townData.tileSize * this.scaleX;
        const sh = sidewalk.height * this.townData.tileSize * this.scaleY;
        this.staticLayer.fillRect(sx, sy, sw, sh);
      }
    }

    // Draw buildings
    for (const building of this.townData.buildings) {
      let color;
      switch (building.type) {
        case 'police_station':
          color = MINIMAP.COLORS.POLICE_STATION;
          break;
        case 'store':
          color = MINIMAP.COLORS.STORE;
          break;
        case 'player_home':
          color = MINIMAP.COLORS.PLAYER_HOME;
          break;
        default:
          // Use neighborhood-specific colors for houses
          if (building.neighborhood === 'poor') {
            color = MINIMAP.COLORS.BUILDING_POOR;
          } else if (building.neighborhood === 'rich') {
            color = MINIMAP.COLORS.BUILDING_RICH;
          } else {
            color = MINIMAP.COLORS.BUILDING_MEDIUM;
          }
      }

      this.staticLayer.fillStyle(color);
      const bx = this.x + building.x * this.townData.tileSize * this.scaleX;
      const by = this.y + building.y * this.townData.tileSize * this.scaleY;
      const bw = building.width * this.townData.tileSize * this.scaleX;
      const bh = building.height * this.townData.tileSize * this.scaleY;
      this.staticLayer.fillRect(bx, by, bw, bh);
    }

    // Draw trees as small dots
    this.staticLayer.fillStyle(MINIMAP.COLORS.TREE);
    for (const tree of this.townData.trees) {
      const tx = this.x + tree.x * this.scaleX;
      const ty = this.y + tree.y * this.scaleY;
      this.staticLayer.fillCircle(tx, ty, 1);
    }
  }

  /**
   * Update dynamic elements (player, corpses, ritual sites)
   */
  update() {
    this.dynamicLayer.clear();

    // Draw ritual sites
    this.staticLayer.fillStyle(MINIMAP.COLORS.RITUAL_SITE);
    const ritualSites = this.scene.ritualSystem?.getAll() || [];
    for (const site of ritualSites) {
      const sx = this.x + site.x * this.scaleX;
      const sy = this.y + site.y * this.scaleY;
      this.dynamicLayer.fillStyle(MINIMAP.COLORS.RITUAL_SITE);
      this.dynamicLayer.fillCircle(sx, sy, 3);
    }

    // Draw corpses
    const corpses = this.scene.corpses || [];
    this.dynamicLayer.fillStyle(MINIMAP.COLORS.CORPSE);
    for (const corpse of corpses) {
      if (!corpse.isPickedUp) {
        const cx = this.x + corpse.x * this.scaleX;
        const cy = this.y + corpse.y * this.scaleY;
        this.dynamicLayer.fillCircle(cx, cy, 2);
      }
    }

    // Draw player
    const player = this.scene.player;
    if (player?.sprite) {
      const px = this.x + player.sprite.x * this.scaleX;
      const py = this.y + player.sprite.y * this.scaleY;
      this.dynamicLayer.fillStyle(MINIMAP.COLORS.PLAYER);
      this.dynamicLayer.fillCircle(px, py, 3);
    }
  }

  /**
   * Register with HUD camera system
   */
  registerWithHUD(hud) {
    if (hud) {
      hud.uiElements.push(this.background);
      hud.uiElements.push(this.staticLayer);
      hud.uiElements.push(this.dynamicLayer);

      // Make main camera ignore minimap
      this.scene.cameras.main.ignore([
        this.background,
        this.staticLayer,
        this.dynamicLayer
      ]);
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.scene.scale.off('resize', this.updatePosition, this);
    this.background.destroy();
    this.staticLayer.destroy();
    this.dynamicLayer.destroy();
  }
}
