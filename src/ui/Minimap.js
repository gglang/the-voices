import { MINIMAP } from '../config/constants.js';
import { LocationType } from '../systems/PlayerLocationSystem.js';

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
    this.highlightLayer = scene.add.graphics();  // Layer for location highlights

    // Pulse animation state
    this.pulseTime = 0;
    this.pulseSpeed = 2;  // Cycles per second

    // Set up UI properties
    this.background.setScrollFactor(0);
    this.staticLayer.setScrollFactor(0);
    this.dynamicLayer.setScrollFactor(0);
    this.highlightLayer.setScrollFactor(0);

    this.background.setDepth(999);
    this.staticLayer.setDepth(1000);
    this.highlightLayer.setDepth(1001);  // Above static, below dynamic
    this.dynamicLayer.setDepth(1002);

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
   * Update dynamic elements (player, corpses, ritual sites, location highlights)
   */
  update(delta) {
    this.dynamicLayer.clear();

    // Update pulse animation
    this.pulseTime += (delta || 16) / 1000;

    // Draw location highlights
    this.drawLocationHighlights();

    // Draw ritual site highlight if one is marked
    this.drawRitualSiteHighlight();

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
   * Draw pulsing yellow highlight around the marked ritual site
   */
  drawRitualSiteHighlight() {
    const objectiveSystem = this.scene.objectiveSystem;
    if (!objectiveSystem) return;

    const highlightedSite = objectiveSystem.getHighlightedRitualSite();
    if (!highlightedSite) return;

    // Calculate pulse alpha (oscillates between 0.3 and 0.8)
    const pulseAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(this.pulseTime * Math.PI * this.pulseSpeed));
    const borderColor = 0xffff00;  // Yellow

    const sx = this.x + highlightedSite.x * this.scaleX;
    const sy = this.y + highlightedSite.y * this.scaleY;
    const radius = 8;  // Larger circle around the ritual site

    this.highlightLayer.lineStyle(2, borderColor, pulseAlpha);
    this.highlightLayer.strokeCircle(sx, sy, radius);
  }

  /**
   * Draw pulsing yellow borders for highlighted locations
   */
  drawLocationHighlights() {
    this.highlightLayer.clear();

    const locationSystem = this.scene.playerLocationSystem;
    if (!locationSystem) return;

    const highlightedLocations = locationSystem.getHighlightedLocations();
    if (highlightedLocations.size === 0) return;

    // Calculate pulse alpha (oscillates between 0.3 and 0.8)
    const pulseAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(this.pulseTime * Math.PI * this.pulseSpeed));
    const borderColor = 0xffff00;  // Yellow
    const borderWidth = 2;

    this.highlightLayer.lineStyle(borderWidth, borderColor, pulseAlpha);

    for (const locationType of highlightedLocations) {
      const bounds = locationSystem.getMinimapBounds(locationType);

      for (const bound of bounds) {
        this.drawLocationBound(bound);
      }
    }
  }

  /**
   * Draw a single location bound on the minimap
   * @param {Object} bound - Bound object from PlayerLocationSystem
   */
  drawLocationBound(bound) {
    // Convert tile coordinates to minimap coordinates
    const tileSize = this.townData.tileSize;

    switch (bound.shape) {
      case 'rect':
        const rx = this.x + bound.x * tileSize * this.scaleX;
        const ry = this.y + bound.y * tileSize * this.scaleY;
        const rw = bound.width * tileSize * this.scaleX;
        const rh = bound.height * tileSize * this.scaleY;
        this.highlightLayer.strokeRect(rx, ry, rw, rh);
        break;

      case 'circle':
        const cx = this.x + bound.centerX * tileSize * this.scaleX;
        const cy = this.y + bound.centerY * tileSize * this.scaleY;
        const radius = bound.radius * tileSize * this.scaleX;  // Use scaleX for uniform scaling
        this.highlightLayer.strokeCircle(cx, cy, radius);
        break;

      case 'region':
        // For complex regions (Uplands/Downlands), draw the bounding area
        // but with visual indication it's a partial region
        const regionX = this.x + bound.x * tileSize * this.scaleX;
        const regionY = this.y + bound.y * tileSize * this.scaleY;
        const regionW = bound.width * tileSize * this.scaleX;
        const regionH = bound.height * tileSize * this.scaleY;

        // Draw dashed-style rectangle (using multiple small segments)
        this.drawDashedRect(regionX, regionY, regionW, regionH);
        break;
    }
  }

  /**
   * Draw a dashed rectangle for region bounds
   */
  drawDashedRect(x, y, width, height) {
    const dashLength = 4;
    const gapLength = 4;

    // Top edge
    this.drawDashedLine(x, y, x + width, y, dashLength, gapLength);
    // Bottom edge
    this.drawDashedLine(x, y + height, x + width, y + height, dashLength, gapLength);
    // Left edge
    this.drawDashedLine(x, y, x, y + height, dashLength, gapLength);
    // Right edge
    this.drawDashedLine(x + width, y, x + width, y + height, dashLength, gapLength);
  }

  /**
   * Draw a dashed line
   */
  drawDashedLine(x1, y1, x2, y2, dashLength, gapLength) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / distance;
    const unitY = dy / distance;

    let currentDist = 0;
    let drawing = true;

    while (currentDist < distance) {
      const segmentLength = drawing ? dashLength : gapLength;
      const endDist = Math.min(currentDist + segmentLength, distance);

      if (drawing) {
        const startX = x1 + unitX * currentDist;
        const startY = y1 + unitY * currentDist;
        const endX = x1 + unitX * endDist;
        const endY = y1 + unitY * endDist;

        this.highlightLayer.beginPath();
        this.highlightLayer.moveTo(startX, startY);
        this.highlightLayer.lineTo(endX, endY);
        this.highlightLayer.strokePath();
      }

      currentDist = endDist;
      drawing = !drawing;
    }
  }

  /**
   * Register with HUD camera system
   */
  registerWithHUD(hud) {
    if (hud) {
      hud.uiElements.push(this.background);
      hud.uiElements.push(this.staticLayer);
      hud.uiElements.push(this.highlightLayer);
      hud.uiElements.push(this.dynamicLayer);

      // Make main camera ignore minimap
      this.scene.cameras.main.ignore([
        this.background,
        this.staticLayer,
        this.highlightLayer,
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
    this.highlightLayer.destroy();
    this.dynamicLayer.destroy();
  }
}
