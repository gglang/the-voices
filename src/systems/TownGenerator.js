import Phaser from 'phaser';
import { TOWN, DEPTH, MAP, NEIGHBORHOODS, HOUSE_TYPES } from '../config/constants.js';
import { Door } from '../entities/Door.js';

/**
 * Hand-crafted town generator with distinct neighborhood layouts.
 * Uses predefined layouts rather than procedural generation for reliable results.
 *
 * Layout: 200x200 tile map
 * - Poor (center): Dense irregular housing, ~30 houses
 * - Medium (south): Suburban layout, ~30 houses
 * - Rich (north): Spacious estates, ~15 houses
 */
export class TownGenerator {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = MAP.TILE_SIZE;

    // Town data storage
    this.buildings = [];
    this.roads = [];
    this.sidewalks = [];
    this.trees = [];
    this.roofTiles = [];

    // Key locations
    this.policeStation = null;
    this.store = null;
    this.fountain = null;
    this.townSquareCenter = null;
    this.playerHome = null;

    // Grid for collision/placement checking
    this.grid = [];
  }

  /**
   * Generate the complete town using hand-crafted layout
   */
  generate(mapWidth, mapHeight) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // Initialize empty grid
    this.initializeGrid();

    // Place roads using hand-crafted layout
    this.generateRoadNetwork();

    // Generate sidewalks alongside roads
    this.generateSidewalks();

    // Place key buildings
    this.generateTownSquare();
    this.generatePoliceStation();
    this.generateStore();

    // Generate player home first
    this.generatePlayerHome();

    // Place houses using predefined positions
    this.placeNeighborhoodHouses();

    // Fill empty spaces with trees
    this.generateTrees();

    // Render everything
    this.renderGround();
    this.renderBuildings();
    this.renderDecorations();

    return this.getTownData();
  }

  /**
   * Initialize grid
   */
  initializeGrid() {
    this.grid = [];
    for (let x = 0; x < this.mapWidth; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.mapHeight; y++) {
        this.grid[x][y] = { type: 'empty', buildingId: null, neighborhood: null };
      }
    }
    this.townSquareCenter = { x: Math.floor(this.mapWidth / 2), y: Math.floor(this.mapHeight / 2) };
  }

  /**
   * Get neighborhood at a tile position
   * Poor is a central core, rich wraps around north/east, medium wraps around south/west
   */
  getNeighborhoodAt(tileX, tileY) {
    const centerX = this.mapWidth / 2;
    const centerY = this.mapHeight / 2;
    const distFromCenter = Math.sqrt(
      Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
    );

    // Poor: Central core (radius ~45 tiles from center)
    if (distFromCenter < 45) {
      return NEIGHBORHOODS.POOR;
    }

    // Outside the core: rich in north/northeast, medium in south/southwest
    if (tileY < centerY) {
      return NEIGHBORHOODS.RICH;  // North half outside core
    }
    return NEIGHBORHOODS.MEDIUM;  // South half outside core
  }

  // ==================== HAND-CRAFTED ROAD NETWORK ====================

  /**
   * Generate the entire road network with distinct styles per neighborhood
   */
  generateRoadNetwork() {
    // Main arterials (cross the whole map)
    this.addRoad(0, 98, this.mapWidth, 4);   // Main east-west through center
    this.addRoad(98, 0, 4, this.mapHeight);  // Main north-south through center

    // Ring road around the poor core (roughly at radius 45-50)
    this.addRoad(50, 50, 100, 3);  // Top of ring
    this.addRoad(50, 147, 100, 3); // Bottom of ring
    this.addRoad(50, 50, 3, 100);  // Left of ring
    this.addRoad(147, 50, 3, 100); // Right of ring

    // Rich neighborhood roads (north, outside the core)
    this.generateRichRoads();

    // Poor neighborhood roads (center core, dense irregular grid)
    this.generatePoorRoads();

    // Medium neighborhood roads (south, outside the core)
    this.generateMediumRoads();
  }

  /**
   * Rich neighborhood: Winding boulevards (north of center, outside core)
   */
  generateRichRoads() {
    // Curved boulevards in the north
    this.addCurvedRoad(5, 25, 195, 30, 10);
    this.addCurvedRoad(5, 40, 45, 42, 5);
    this.addCurvedRoad(155, 40, 195, 42, -5);

    // Vertical connectors in rich area
    this.addRoad(20, 5, 2, 43);
    this.addRoad(40, 5, 2, 43);
    this.addRoad(160, 5, 2, 43);
    this.addRoad(180, 5, 2, 43);

    // Cul-de-sacs in corners
    this.addCulDeSac(10, 25, 0, -1, 12);
    this.addCulDeSac(30, 25, 0, -1, 10);
    this.addCulDeSac(170, 25, 0, -1, 12);
    this.addCulDeSac(190, 25, 0, -1, 10);
  }

  /**
   * Poor neighborhood: Dense irregular streets (central core, radius < 45)
   */
  generatePoorRoads() {
    // Horizontal streets within the core (55 to 145)
    this.addRoad(55, 70, 90, 2);
    this.addRoad(58, 80, 84, 2);
    this.addRoad(55, 90, 90, 2);
    this.addRoad(55, 110, 90, 2);
    this.addRoad(58, 120, 84, 2);
    this.addRoad(55, 130, 90, 2);

    // Vertical alleys within the core
    this.addRoad(60, 55, 2, 90);
    this.addRoad(72, 58, 2, 84);
    this.addRoad(85, 55, 2, 90);
    this.addRoad(112, 55, 2, 90);
    this.addRoad(125, 58, 2, 84);
    this.addRoad(138, 55, 2, 90);

    // Cross alleys for density
    this.addRoad(62, 75, 20, 2);
    this.addRoad(115, 75, 20, 2);
    this.addRoad(62, 85, 20, 2);
    this.addRoad(115, 85, 20, 2);
    this.addRoad(62, 115, 20, 2);
    this.addRoad(115, 115, 20, 2);
    this.addRoad(62, 125, 20, 2);
    this.addRoad(115, 125, 20, 2);
  }

  /**
   * Medium neighborhood: Suburban grid (south of center, outside core)
   */
  generateMediumRoads() {
    // Horizontal streets in south
    this.addRoad(5, 160, 190, 3);
    this.addRoad(5, 180, 190, 3);

    // Curved roads connecting to core
    this.addCurvedRoad(5, 155, 45, 150, -5);
    this.addCurvedRoad(155, 150, 195, 155, 5);

    // Vertical connectors in medium area
    this.addRoad(20, 155, 2, 40);
    this.addRoad(40, 155, 2, 40);
    this.addRoad(160, 155, 2, 40);
    this.addRoad(180, 155, 2, 40);

    // Cul-de-sacs in corners
    this.addCulDeSac(10, 175, 0, 1, 12);
    this.addCulDeSac(30, 175, 0, 1, 10);
    this.addCulDeSac(170, 175, 0, 1, 12);
    this.addCulDeSac(190, 175, 0, 1, 10);
  }

  /**
   * Add a curved road between two points
   */
  addCurvedRoad(x1, y1, x2, y2, curve) {
    const steps = Math.abs(x2 - x1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.floor(x1 + (x2 - x1) * t);
      // Sinusoidal curve
      const yOffset = Math.sin(t * Math.PI) * curve;
      const y = Math.floor(y1 + (y2 - y1) * t + yOffset);

      // Road width of 3
      for (let w = -1; w <= 1; w++) {
        if (y + w >= 0 && y + w < this.mapHeight && x >= 0 && x < this.mapWidth) {
          const neighborhood = this.getNeighborhoodAt(x, y + w);
          this.grid[x][y + w] = { type: 'road', buildingId: null, neighborhood: neighborhood.name };
        }
      }
    }
  }

  /**
   * Add a cul-de-sac (dead-end with turning circle)
   */
  addCulDeSac(startX, startY, dx, dy, length) {
    // Main road
    for (let i = 0; i < length; i++) {
      const x = startX + dx * i;
      const y = startY + dy * i;

      // Width of 2
      for (let w = -1; w <= 0; w++) {
        const tx = dx === 0 ? x + w : x;
        const ty = dy === 0 ? y + w : y;
        if (tx >= 0 && tx < this.mapWidth && ty >= 0 && ty < this.mapHeight) {
          const neighborhood = this.getNeighborhoodAt(tx, ty);
          this.grid[tx][ty] = { type: 'road', buildingId: null, neighborhood: neighborhood.name };
        }
      }
    }

    // Turning circle at end
    const endX = startX + dx * length;
    const endY = startY + dy * length;
    this.addRoadCircle(endX, endY, 3);
  }

  /**
   * Add a circular road area
   */
  addRoadCircle(cx, cy, radius) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            const neighborhood = this.getNeighborhoodAt(x, y);
            this.grid[x][y] = { type: 'road', buildingId: null, neighborhood: neighborhood.name };
          }
        }
      }
    }
  }

  /**
   * Add a rectangular road
   */
  addRoad(x, y, width, height) {
    this.roads.push({ x, y, width, height });

    for (let tx = x; tx < x + width && tx < this.mapWidth; tx++) {
      for (let ty = y; ty < y + height && ty < this.mapHeight; ty++) {
        if (tx >= 0 && ty >= 0) {
          const neighborhood = this.getNeighborhoodAt(tx, ty);
          this.grid[tx][ty] = { type: 'road', buildingId: null, neighborhood: neighborhood.name };
        }
      }
    }
  }

  // ==================== SIDEWALKS ====================

  generateSidewalks() {
    for (let x = 1; x < this.mapWidth - 1; x++) {
      for (let y = 1; y < this.mapHeight - 1; y++) {
        if (this.grid[x][y].type === 'road') {
          for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
              if (this.grid[nx][ny].type === 'empty') {
                const neighborhood = this.getNeighborhoodAt(nx, ny);
                this.grid[nx][ny] = { type: 'sidewalk', buildingId: null, neighborhood: neighborhood.name };
              }
            }
          }
        }
      }
    }
  }

  // ==================== KEY BUILDINGS ====================

  generateTownSquare() {
    const size = TOWN.TOWN_SQUARE_SIZE;
    const cx = this.townSquareCenter.x;
    const cy = this.townSquareCenter.y;
    const halfSize = Math.floor(size / 2);

    for (let x = cx - halfSize; x < cx + halfSize; x++) {
      for (let y = cy - halfSize; y < cy + halfSize; y++) {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
          if (this.grid[x][y].type !== 'road') {
            this.grid[x][y] = { type: 'plaza', buildingId: null, neighborhood: 'poor' };
          }
        }
      }
    }

    this.fountain = { x: cx * this.tileSize, y: cy * this.tileSize };
    this.grid[cx][cy] = { type: 'fountain', buildingId: null, neighborhood: 'poor' };
  }

  generatePoliceStation() {
    const width = TOWN.POLICE_STATION_WIDTH;
    const height = TOWN.POLICE_STATION_HEIGHT;
    // Place in rich area, northeast
    const x = 180;
    const y = 5;

    this.clearAreaForBuilding(x, y, width, height);
    this.policeStation = this.addBuilding('police_station', x, y, width, height);
    this.addRoad(x + Math.floor(width / 2) - 1, y + height, 3, 15);
  }

  generateStore() {
    const width = TOWN.STORE_WIDTH;
    const height = TOWN.STORE_HEIGHT;
    const x = 108;
    const y = 94;

    this.clearAreaForBuilding(x, y, width, height);
    this.store = this.addBuilding('store', x, y, width, height);
  }

  generatePlayerHome() {
    const houseType = HOUSE_TYPES.player_home;
    const width = houseType.width;
    const height = houseType.height;

    // Place in medium neighborhood (southwest corner, outside core)
    const x = 25;
    const y = 165;

    this.clearAreaForBuilding(x, y, width, height);
    this.playerHome = this.addBuilding('player_home', x, y, width, height, 'player_home', 'player_home');
    this.addDoorPath(this.playerHome);
  }

  clearAreaForBuilding(x, y, width, height) {
    for (let tx = x - 1; tx < x + width + 1; tx++) {
      for (let ty = y - 1; ty < y + height + 1; ty++) {
        if (tx >= 0 && tx < this.mapWidth && ty >= 0 && ty < this.mapHeight) {
          const cell = this.grid[tx][ty];
          if (cell.type !== 'road' && cell.type !== 'sidewalk') {
            this.grid[tx][ty] = { type: 'empty', buildingId: null, neighborhood: this.getNeighborhoodAt(tx, ty).name };
          }
        }
      }
    }
  }

  // ==================== HOUSE PLACEMENT ====================

  /**
   * Place houses using predefined positions for each neighborhood
   */
  placeNeighborhoodHouses() {
    // Poor neighborhood: ~30 houses, densely packed
    this.placePoorHouses();

    // Medium neighborhood: ~30 houses, suburban layout
    this.placeMediumHouses();

    // Rich neighborhood: ~15 houses, spacious estates
    this.placeRichHouses();
  }

  /**
   * Poor neighborhood houses - dense, small, in the central core
   */
  placePoorHouses() {
    const poorPositions = [
      // Top row of core (y ~58-65)
      { x: 63, y: 58 }, { x: 75, y: 58 }, { x: 88, y: 58 },
      { x: 115, y: 58 }, { x: 128, y: 58 }, { x: 140, y: 58 },
      // Row 2 (y ~72)
      { x: 63, y: 72 }, { x: 75, y: 72 }, { x: 88, y: 72 },
      { x: 115, y: 72 }, { x: 128, y: 72 }, { x: 140, y: 72 },
      // Row 3 (y ~82)
      { x: 63, y: 82 }, { x: 75, y: 82 }, { x: 88, y: 82 },
      { x: 115, y: 82 }, { x: 128, y: 82 }, { x: 140, y: 82 },
      // Row 4 (y ~102) - below main road
      { x: 63, y: 103 }, { x: 75, y: 103 }, { x: 88, y: 103 },
      { x: 115, y: 103 }, { x: 128, y: 103 }, { x: 140, y: 103 },
      // Row 5 (y ~112)
      { x: 63, y: 112 }, { x: 75, y: 112 }, { x: 88, y: 112 },
      { x: 115, y: 112 }, { x: 128, y: 112 }, { x: 140, y: 112 },
      // Row 6 (y ~122)
      { x: 63, y: 122 }, { x: 75, y: 122 }, { x: 88, y: 122 },
      { x: 115, y: 122 }, { x: 128, y: 122 }, { x: 140, y: 122 },
      // Row 7 (y ~133)
      { x: 63, y: 133 }, { x: 75, y: 133 }, { x: 88, y: 133 },
      { x: 115, y: 133 }, { x: 128, y: 133 }, { x: 140, y: 133 },
    ];

    for (const pos of poorPositions) {
      const houseType = this.selectHouseType(NEIGHBORHOODS.POOR);
      this.tryPlaceHouse(pos.x, pos.y, houseType, 'poor');
    }
  }

  /**
   * Medium neighborhood houses - suburban, wrapping around south of core
   */
  placeMediumHouses() {
    const mediumPositions = [
      // Southwest corner (outside core)
      { x: 8, y: 152 }, { x: 24, y: 152 }, { x: 42, y: 152 },
      { x: 8, y: 165 }, { x: 24, y: 165 }, { x: 42, y: 165 },
      { x: 8, y: 182 }, { x: 24, y: 182 }, { x: 42, y: 182 },
      // Southeast corner (outside core)
      { x: 155, y: 152 }, { x: 170, y: 152 }, { x: 185, y: 152 },
      { x: 155, y: 165 }, { x: 170, y: 165 }, { x: 185, y: 165 },
      { x: 155, y: 182 }, { x: 170, y: 182 }, { x: 185, y: 182 },
      // Bottom center (below core, outside ring road)
      { x: 55, y: 155 }, { x: 72, y: 155 }, { x: 88, y: 155 },
      { x: 108, y: 155 }, { x: 125, y: 155 }, { x: 142, y: 155 },
      // Far south
      { x: 55, y: 170 }, { x: 72, y: 170 }, { x: 88, y: 170 },
      { x: 108, y: 170 }, { x: 125, y: 170 }, { x: 142, y: 170 },
      { x: 55, y: 185 }, { x: 72, y: 185 }, { x: 88, y: 185 },
      { x: 108, y: 185 }, { x: 125, y: 185 }, { x: 142, y: 185 },
    ];

    for (const pos of mediumPositions) {
      // Skip if too close to player home
      if (Math.abs(pos.x - 25) < 10 && Math.abs(pos.y - 165) < 10) continue;

      const houseType = this.selectHouseType(NEIGHBORHOODS.MEDIUM);
      this.tryPlaceHouse(pos.x, pos.y, houseType, 'medium');
    }
  }

  /**
   * Rich neighborhood houses - spacious estates, wrapping around north of core
   */
  placeRichHouses() {
    const richPositions = [
      // Northwest corner (outside core)
      { x: 8, y: 8 }, { x: 25, y: 8 }, { x: 42, y: 8 },
      { x: 8, y: 28 }, { x: 25, y: 28 }, { x: 42, y: 28 },
      // Northeast corner (outside core)
      { x: 155, y: 8 }, { x: 175, y: 8 },
      { x: 155, y: 28 }, { x: 175, y: 28 },
      // Top center (above core, outside ring road)
      { x: 55, y: 8 }, { x: 75, y: 8 }, { x: 120, y: 8 }, { x: 140, y: 8 },
      { x: 55, y: 30 }, { x: 75, y: 30 }, { x: 120, y: 30 }, { x: 140, y: 30 },
    ];

    for (const pos of richPositions) {
      // Skip if too close to police station
      if (pos.x > 150 && pos.y < 25) continue;

      const houseType = this.selectHouseType(NEIGHBORHOODS.RICH);
      this.tryPlaceHouse(pos.x, pos.y, houseType, 'rich');
    }
  }

  /**
   * Try to place a house at position
   */
  tryPlaceHouse(x, y, houseType, neighborhoodName) {
    const width = houseType.config.width;
    const height = houseType.config.height;

    // Check if we can place here
    if (this.canPlaceBuilding(x, y, width, height)) {
      const house = this.addBuilding('house', x, y, width, height, this.buildings.length, houseType.name);
      if (house) {
        house.neighborhood = neighborhoodName;
        this.addDoorPath(house);
      }
      return true;
    }

    // Try nearby positions
    for (let ox = -3; ox <= 3; ox += 2) {
      for (let oy = -3; oy <= 3; oy += 2) {
        if (this.canPlaceBuilding(x + ox, y + oy, width, height)) {
          const house = this.addBuilding('house', x + ox, y + oy, width, height, this.buildings.length, houseType.name);
          if (house) {
            house.neighborhood = neighborhoodName;
            this.addDoorPath(house);
          }
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Select a random house type for neighborhood
   */
  selectHouseType(neighborhood) {
    const houseTypes = neighborhood.houses;
    const typeName = houseTypes[Phaser.Math.Between(0, houseTypes.length - 1)];
    return { name: typeName, config: HOUSE_TYPES[typeName] };
  }

  /**
   * Check if building can be placed
   */
  canPlaceBuilding(x, y, width, height) {
    if (x < 2 || y < 2 || x + width >= this.mapWidth - 2 || y + height >= this.mapHeight - 2) {
      return false;
    }

    for (let tx = x - 1; tx < x + width + 1; tx++) {
      for (let ty = y - 1; ty < y + height + 1; ty++) {
        if (tx < 0 || ty < 0 || tx >= this.mapWidth || ty >= this.mapHeight) {
          return false;
        }
        const cell = this.grid[tx][ty];
        if (cell.type !== 'empty' && cell.type !== 'sidewalk') {
          return false;
        }
      }
    }

    // Don't place in town square
    const cx = x + width / 2;
    const cy = y + height / 2;
    const dist = Math.sqrt(
      Math.pow(cx - this.townSquareCenter.x, 2) +
      Math.pow(cy - this.townSquareCenter.y, 2)
    );
    if (dist < TOWN.TOWN_SQUARE_SIZE / 2 + 3) {
      return false;
    }

    return true;
  }

  /**
   * Add a sidewalk path from door to nearest road
   */
  addDoorPath(building) {
    const doorX = building.doorX;
    const doorY = building.doorY;

    // Search in expanding squares from door, prioritizing downward (south) direction
    // First check directly south
    for (let dist = 1; dist < 20; dist++) {
      const ty = doorY + dist;
      if (ty < this.mapHeight && this.grid[doorX]?.[ty]?.type === 'road') {
        this.addSidewalkPath(doorX, doorY + 1, doorX, ty);
        return;
      }
      // Also check slightly left/right of south
      for (const offsetX of [-1, 1, -2, 2]) {
        const tx = doorX + offsetX;
        if (tx >= 0 && tx < this.mapWidth && ty < this.mapHeight) {
          if (this.grid[tx]?.[ty]?.type === 'road') {
            this.addSidewalkPath(doorX, doorY + 1, tx, ty);
            return;
          }
        }
      }
    }

    // If no road found south, search in all directions
    for (let radius = 1; radius < 25; radius++) {
      for (let angle = 0; angle < 16; angle++) {
        const dx = Math.round(Math.cos(angle * Math.PI / 8) * radius);
        const dy = Math.round(Math.sin(angle * Math.PI / 8) * radius);
        const tx = doorX + dx;
        const ty = doorY + dy;

        if (tx >= 0 && tx < this.mapWidth && ty >= 0 && ty < this.mapHeight) {
          if (this.grid[tx][ty].type === 'road') {
            this.addSidewalkPath(doorX, doorY + 1, tx, ty);
            return;
          }
        }
      }
    }
  }

  addSidewalkPath(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = Math.floor(x1 + dx * t);
      const y = Math.floor(y1 + dy * t);

      if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
        const cell = this.grid[x][y];
        if (cell.type === 'empty') {
          const neighborhood = this.getNeighborhoodAt(x, y);
          this.grid[x][y] = { type: 'sidewalk', buildingId: null, neighborhood: neighborhood.name };
        }
      }
    }
  }

  /**
   * Add a building
   */
  addBuilding(type, x, y, width, height, id = null, houseType = null) {
    const doorX = x + Math.floor(width / 2);
    const doorY = y + height - 1;
    const neighborhood = this.getNeighborhoodAt(x + width / 2, y + height / 2);

    const building = {
      type,
      id: id !== null ? id : this.buildings.length,
      x,
      y,
      width,
      height,
      doorX,
      doorY,
      houseType: houseType || type,
      neighborhood: neighborhood.name,
      centerPixelX: (x + width / 2) * this.tileSize,
      centerPixelY: (y + height / 2) * this.tileSize,
      doorPixelX: (doorX + 0.5) * this.tileSize,
      doorPixelY: (doorY + 1) * this.tileSize,
      hasBasement: type === 'player_home'
    };

    this.buildings.push(building);

    // Mark grid
    for (let tx = x; tx < x + width; tx++) {
      for (let ty = y; ty < y + height; ty++) {
        if (tx === doorX && ty === doorY) {
          this.grid[tx][ty] = { type: 'door', buildingId: building.id, neighborhood: neighborhood.name };
        } else if (tx === x || tx === x + width - 1 || ty === y || ty === y + height - 1) {
          this.grid[tx][ty] = { type: 'wall', buildingId: building.id, neighborhood: neighborhood.name };
        } else {
          this.grid[tx][ty] = { type: 'floor', buildingId: building.id, neighborhood: neighborhood.name };
        }
      }
    }

    if (type === 'player_home') {
      this.markBasementArea(building);
    }

    return building;
  }

  markBasementArea(building) {
    // Larger basement for player home with cages (5x5 in upper portion of building, away from front door)
    const basementSize = 5;
    const basementX = building.x + 1;
    const basementY = building.y + 1;  // Upper portion (back of house, away from door)

    building.basementArea = {
      x: basementX,
      y: basementY,
      width: basementSize,
      height: basementSize,
      centerX: (basementX + basementSize / 2) * this.tileSize,
      centerY: (basementY + basementSize / 2) * this.tileSize
    };

    // Mark basement floor tiles
    for (let tx = basementX; tx < basementX + basementSize; tx++) {
      for (let ty = basementY; ty < basementY + basementSize; ty++) {
        if (tx < building.x + building.width - 1 && ty < building.y + building.height - 1) {
          this.grid[tx][ty] = {
            type: 'basement',
            buildingId: building.id,
            neighborhood: building.neighborhood
          };
        }
      }
    }

    // Add interior walls around basement (only hatch allows entry)
    this.addBasementInteriorWalls(building, basementX, basementY, basementSize);
  }

  addBasementInteriorWalls(building, basementX, basementY, basementSize) {
    // Mark interior wall tiles below the basement (separating basement from main floor)
    // The wall is at basementY + basementSize (below the basement)
    const wallY = basementY + basementSize;

    for (let tx = basementX; tx < basementX + basementSize; tx++) {
      // Don't put a wall where the hatch will be
      const hatchTileX = building.x + Math.floor(building.width / 2);
      if (tx !== hatchTileX) {
        this.grid[tx][wallY] = {
          type: 'wall',
          buildingId: building.id,
          neighborhood: building.neighborhood
        };
      }
    }
  }

  // ==================== TREES ====================

  generateTrees() {
    for (let x = 2; x < this.mapWidth - 2; x++) {
      for (let y = 2; y < this.mapHeight - 2; y++) {
        if (this.grid[x][y].type === 'empty') {
          const neighborhood = this.getNeighborhoodAt(x, y);
          let density = TOWN.TREE_DENSITY;

          if (neighborhood.name === 'rich') {
            density *= 2.0; // Lush in rich area
          } else if (neighborhood.name === 'poor') {
            density *= 0.3; // Sparse in poor area
          }

          if (Math.random() < density) {
            let canPlace = true;
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const cell = this.grid[x + dx]?.[y + dy];
                if (!cell || cell.type !== 'empty') {
                  canPlace = false;
                }
              }
            }

            if (canPlace) {
              this.trees.push({
                x: x * this.tileSize + this.tileSize / 2,
                y: y * this.tileSize + this.tileSize / 2
              });
              this.grid[x][y] = { type: 'tree', buildingId: null, neighborhood: neighborhood.name };
            }
          }
        }
      }
    }
  }

  // ==================== RENDERING ====================

  renderGround() {
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const cell = this.grid[x][y];
        const px = x * this.tileSize + this.tileSize / 2;
        const py = y * this.tileSize + this.tileSize / 2;

        const neighborhood = cell.neighborhood || this.getNeighborhoodAt(x, y).name;

        let textureKey = `grass_${neighborhood}`;
        let depth = DEPTH.FLOOR;

        if (cell.type === 'road') {
          textureKey = `road_${neighborhood}`;
          depth = DEPTH.ROAD;
        } else if (cell.type === 'sidewalk') {
          textureKey = `sidewalk_${neighborhood}`;
          depth = DEPTH.ROAD;
        } else if (cell.type === 'floor') {
          const building = this.buildings.find(b => b.id === cell.buildingId);
          textureKey = building ? `floor_${building.houseType}` : 'house_floor';
        } else if (cell.type === 'basement') {
          textureKey = 'basement_floor';
        } else if (cell.type === 'door') {
          const building = this.buildings.find(b => b.id === cell.buildingId);
          textureKey = building ? `floor_${building.houseType}` : 'house_floor';
        } else if (cell.type === 'plaza') {
          textureKey = `sidewalk_${neighborhood}`;
          depth = DEPTH.ROAD;
        } else if (cell.type === 'wall' && cell.buildingId !== null) {
          // Interior walls still need floor underneath
          const building = this.buildings.find(b => b.id === cell.buildingId);
          textureKey = building ? `floor_${building.houseType}` : 'house_floor';
        }

        const tile = this.scene.add.image(px, py, textureKey);
        tile.setDepth(depth);

        if (this.scene.hud) {
          this.scene.hud.ignoreGameObject(tile);
        }
      }
    }
  }

  renderBuildings() {
    for (const building of this.buildings) {
      this.renderBuilding(building);
    }
  }

  renderBuilding(building) {
    const { type, x, y, width, height, doorX, doorY, houseType } = building;

    let wallTexture, roofTexture;
    switch (type) {
      case 'police_station':
        wallTexture = 'police_wall';
        roofTexture = 'police_roof';
        break;
      case 'store':
        wallTexture = 'store_wall';
        roofTexture = 'store_roof';
        break;
      case 'player_home':
      case 'house':
        wallTexture = `wall_${houseType}`;
        roofTexture = `roof_${houseType}`;
        break;
      default:
        wallTexture = 'house_wall';
        roofTexture = 'house_roof';
    }

    for (let tx = x; tx < x + width; tx++) {
      for (let ty = y; ty < y + height; ty++) {
        const px = tx * this.tileSize + this.tileSize / 2;
        const py = ty * this.tileSize + this.tileSize / 2;

        // Walls on perimeter
        if (tx === x || tx === x + width - 1 || ty === y || ty === y + height - 1) {
          if (tx === doorX && ty === doorY) {
            if (type === 'house' || type === 'player_home') {
              const door = new Door(this.scene, px, py, building.id);
              if (this.scene.doors) {
                this.scene.doors.push(door);
              }
            } else {
              const doorImg = this.scene.add.image(px, py, 'door_open');
              doorImg.setDepth(DEPTH.WALLS);
              if (this.scene.hud) this.scene.hud.ignoreGameObject(doorImg);
            }
          } else {
            const wall = this.scene.physics.add.staticImage(px, py, wallTexture);
            wall.setDepth(DEPTH.WALLS);
            wall.body.setSize(this.tileSize, this.tileSize);
            if (this.scene.walls) {
              this.scene.walls.add(wall);
            }
            if (this.scene.hud) this.scene.hud.ignoreGameObject(wall);
          }
        }

        // Roof
        const roof = this.scene.add.image(px, py, roofTexture);
        roof.setDepth(DEPTH.ROOF);
        roof.setAlpha(type === 'store' ? 0.5 : 0.85);
        roof.buildingId = building.id;
        this.roofTiles.push(roof);

        if (this.scene.hud) this.scene.hud.ignoreGameObject(roof);
      }
    }

    if (type === 'house') {
      this.addFurniture(building);
    }

    if (type === 'player_home') {
      this.addPlayerHomeDecorations(building);
    }

    if (type === 'police_station') {
      this.addPoliceSign(building);
    }
  }

  addPlayerHomeDecorations(building) {
    // Skull marker in front yard
    const markerX = building.doorPixelX;
    const markerY = building.doorPixelY + this.tileSize * 1.5;
    const marker = this.scene.add.image(markerX, markerY, 'player_home_marker');
    marker.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(marker);

    // Pentagram in basement
    if (building.basementArea) {
      const pentagramX = building.basementArea.centerX;
      const pentagramY = building.basementArea.centerY;
      const pentagram = this.scene.add.image(pentagramX, pentagramY, 'pentagram');
      pentagram.setDepth(DEPTH.RITUAL_SITE);
      if (this.scene.hud) this.scene.hud.ignoreGameObject(pentagram);

      building.ritualSite = {
        sprite: pentagram,
        x: pentagramX,
        y: pentagramY,
        radius: 20
      };

      // Calculate cage positions around pentagram (3 cages)
      const cageSpacing = 32;
      building.cagePositions = [
        { x: pentagramX - cageSpacing, y: pentagramY - cageSpacing / 2 },  // Left of pentagram
        { x: pentagramX + cageSpacing, y: pentagramY - cageSpacing / 2 },  // Right of pentagram
        { x: pentagramX, y: pentagramY + cageSpacing }                     // Below pentagram
      ];
    }

    // Floor hatch - positioned at center of building, below basement area (at the wall gap)
    const hatchX = (building.x + Math.floor(building.width / 2)) * this.tileSize + this.tileSize / 2;
    const hatchY = (building.basementArea.y + building.basementArea.height) * this.tileSize + this.tileSize / 2;
    const hatch = this.scene.add.image(hatchX, hatchY, 'floor_hatch');
    hatch.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(hatch);

    this.addFurniture(building);
  }

  addPoliceSign(building) {
    const signX = building.doorPixelX;
    const signY = building.doorPixelY + this.tileSize;
    const sign = this.scene.add.image(signX, signY, 'police_sign');
    sign.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(sign);
  }

  addFurniture(building) {
    const { x, y, width, height, type } = building;

    // For player home, bed is in top right corner (away from basement in upper left)
    const startX = type === 'player_home' ? x + width - 2 : x + 1;
    const startY = type === 'player_home' ? y + 1 : y + 1;

    // Bed
    const bedX = startX * this.tileSize + this.tileSize / 2;
    const bedY = startY * this.tileSize + this.tileSize / 2;
    const bed = this.scene.add.image(bedX, bedY, 'furniture_bed');
    bed.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(bed);

    // For player's home, store bed reference and register for interaction
    if (type === 'player_home') {
      building.bed = {
        sprite: bed,
        x: bedX,
        y: bedY
      };
      this.playerHomeBed = bed;
      this.registerBedAction(bed);
    }

    // Table
    if (width > 4 && height > 4) {
      const tableX = (x + Math.floor(width / 2) + 1) * this.tileSize + this.tileSize / 2;
      const tableY = (y + Math.floor(height / 2)) * this.tileSize + this.tileSize / 2;
      const table = this.scene.add.image(tableX, tableY, 'furniture_table');
      table.setDepth(DEPTH.FURNITURE);
      if (this.scene.hud) this.scene.hud.ignoreGameObject(table);
    }

    // Add kitchen furniture to all houses
    this.addKitchen(building);

    // Add lamp to all houses
    this.addLamp(building);
  }

  /**
   * Add kitchen furniture (stove, sink, counter, fridge) to a building
   * Kitchen is placed along the bottom wall (above the door), away from basement and beds
   */
  addKitchen(building) {
    const { x, y, width, height, type } = building;

    // Kitchen is placed along the bottom wall (left side, away from door which is center)
    // This keeps it away from:
    // - Basement/dungeon (upper-left corner in player_home)
    // - Bed (upper-right corner in player_home, upper-left in regular houses)
    let kitchenBaseX, kitchenBaseY;

    if (type === 'player_home') {
      // For player home: bottom-left corner of main living area
      // Basement is at y+1 to y+6, bed is at top-right
      // Place kitchen along bottom wall, left side
      kitchenBaseX = x + 1;
      kitchenBaseY = y + height - 2;  // Bottom wall (1 tile from edge for wall)
    } else {
      // For regular houses: bottom wall, left side (door is center-bottom)
      kitchenBaseX = x + 1;
      kitchenBaseY = y + height - 2;  // Bottom wall
    }

    // Place kitchen horizontally along the bottom wall
    const stoveX = kitchenBaseX * this.tileSize + this.tileSize / 2;
    const stoveY = kitchenBaseY * this.tileSize + this.tileSize / 2;

    // Stove (interactable for cooking)
    const stove = this.scene.add.image(stoveX, stoveY, 'furniture_stove');
    stove.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(stove);

    // Store stove reference for interaction
    building.stove = {
      sprite: stove,
      x: stoveX,
      y: stoveY
    };

    // Register stove for cooking action
    this.registerStoveAction(stove, building);

    // Counter (next to stove, to the right along the wall)
    const counterX = (kitchenBaseX + 1) * this.tileSize + this.tileSize / 2;
    const counter = this.scene.add.image(counterX, stoveY, 'furniture_counter');
    counter.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(counter);

    // Only add sink and fridge if building is large enough and won't overlap door
    const doorTileX = Math.floor(width / 2);  // Door is at center

    if (width >= 5 && kitchenBaseX + 2 < x + doorTileX - 1) {
      // Sink (next to counter along wall)
      const sinkX = (kitchenBaseX + 2) * this.tileSize + this.tileSize / 2;
      const sink = this.scene.add.image(sinkX, stoveY, 'furniture_sink');
      sink.setDepth(DEPTH.FURNITURE);
      if (this.scene.hud) this.scene.hud.ignoreGameObject(sink);

      // Fridge (next to sink if room)
      if (width >= 7 && kitchenBaseX + 3 < x + doorTileX - 1) {
        const fridgeX = (kitchenBaseX + 3) * this.tileSize + this.tileSize / 2;
        const fridge = this.scene.add.image(fridgeX, stoveY, 'furniture_fridge');
        fridge.setDepth(DEPTH.FURNITURE);
        if (this.scene.hud) this.scene.hud.ignoreGameObject(fridge);
      }
    }
  }

  /**
   * Register a stove for cooking action
   */
  registerStoveAction(stove, building) {
    if (!this.scene.actionSystem) return;

    this.scene.actionSystem.registerObject(stove, {
      owner: building,
      getActions: () => this.getStoveActions(building)
    });
  }

  /**
   * Get available actions for a stove
   */
  getStoveActions(building) {
    const actions = [];

    // Show cook action if player is carrying an uncoooked body part
    if (this.scene.player?.carriedBodyPart && !this.scene.player.carriedBodyPart.isCooked) {
      actions.push({
        name: 'Cook',
        key: 'C',
        keyCode: Phaser.Input.Keyboard.KeyCodes.C,
        callback: () => this.scene.player.cookBodyPart()
      });
    }

    // Show cook action if player is carrying an uncooked rat (living or dead)
    if (this.scene.player?.carriedRat && !this.scene.player.carriedRat.isCooked) {
      actions.push({
        name: 'Cook',
        key: 'C',
        keyCode: Phaser.Input.Keyboard.KeyCodes.C,
        callback: () => this.scene.player.cookRat()
      });
    }

    return actions;
  }

  /**
   * Add a lamp to a building
   * Lamp is placed near the table or in a corner
   */
  addLamp(building) {
    const { x, y, width, height, type } = building;

    // Place lamp near the center-right of the room (on or near the table area)
    let lampTileX, lampTileY;

    if (type === 'player_home') {
      // For player home: place in the main living area, center-ish
      lampTileX = x + Math.floor(width / 2) + 2;
      lampTileY = y + Math.floor(height / 2) - 1;
    } else {
      // For regular houses: near the table
      lampTileX = x + Math.floor(width / 2) + 1;
      lampTileY = y + Math.floor(height / 2) - 1;
    }

    const lampX = lampTileX * this.tileSize + this.tileSize / 2;
    const lampY = lampTileY * this.tileSize + this.tileSize / 2;

    const lamp = this.scene.add.image(lampX, lampY, 'furniture_lamp');
    lamp.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(lamp);

    // Create lamp data object
    const lampData = {
      sprite: lamp,
      x: lampX,
      y: lampY,
      isOn: true,  // Lamps start on
      lightGraphics: null,
      building: building
    };

    // Store lamp reference
    building.lamp = lampData;
    this.scene.lamps.push(lampData);

    // Register lamp for actions
    this.registerLampAction(lampData);

    // Create light effect (will be updated by day/night system)
    this.createLampLight(lampData);
  }

  /**
   * Create the light effect for a lamp
   */
  createLampLight(lampData) {
    const light = this.scene.add.graphics();
    light.setDepth(DEPTH.FURNITURE - 1);  // Just below furniture
    lampData.lightGraphics = light;

    if (this.scene.hud) this.scene.hud.ignoreGameObject(light);

    // Initial update
    this.updateLampLight(lampData);
  }

  /**
   * Update lamp light visibility based on time and lamp state
   */
  updateLampLight(lampData) {
    if (!lampData.lightGraphics) return;

    lampData.lightGraphics.clear();

    // Only show light at night and when lamp is on
    const isNight = this.scene.dayNightSystem?.isNight() || false;
    if (lampData.isOn && isNight) {
      // Draw warm light glow
      lampData.lightGraphics.fillStyle(0xffeeaa, 0.15);
      lampData.lightGraphics.fillCircle(lampData.x, lampData.y, 48);
      lampData.lightGraphics.fillStyle(0xffdd88, 0.2);
      lampData.lightGraphics.fillCircle(lampData.x, lampData.y, 32);
      lampData.lightGraphics.fillStyle(0xffcc66, 0.3);
      lampData.lightGraphics.fillCircle(lampData.x, lampData.y, 16);
    }
  }

  /**
   * Register a lamp for pickup and toggle actions
   */
  registerLampAction(lampData) {
    if (!this.scene.actionSystem) return;

    this.scene.actionSystem.registerObject(lampData.sprite, {
      owner: lampData,
      getActions: () => this.getLampActions(lampData)
    });
  }

  /**
   * Get available actions for a lamp
   */
  getLampActions(lampData) {
    const actions = [];

    // Toggle on/off action
    actions.push({
      name: lampData.isOn ? 'Turn Off' : 'Turn On',
      key: 'T',
      keyCode: Phaser.Input.Keyboard.KeyCodes.T,
      callback: () => this.toggleLamp(lampData)
    });

    // Pickup action (only if not carrying anything)
    if (!this.scene.player?.isCarryingAnything()) {
      actions.push({
        name: 'Pick Up',
        key: 'SPACE',
        keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
        callback: () => this.pickupLamp(lampData)
      });
    }

    return actions;
  }

  /**
   * Toggle a lamp on/off
   */
  toggleLamp(lampData) {
    lampData.isOn = !lampData.isOn;
    this.updateLampLight(lampData);

    // Show notification
    const message = lampData.isOn ? '*click* light on' : '*click* light off';
    this.scene.showNotification(message);
  }

  /**
   * Pick up a lamp
   */
  pickupLamp(lampData) {
    if (this.scene.player?.isCarryingAnything()) return;

    // Unregister from action system
    if (this.scene.actionSystem) {
      this.scene.actionSystem.unregisterObject(lampData.sprite);
    }

    // Destroy light graphics
    if (lampData.lightGraphics) {
      lampData.lightGraphics.destroy();
      lampData.lightGraphics = null;
    }

    // Destroy sprite
    lampData.sprite.destroy();

    // Remove from lamps array
    const index = this.scene.lamps.indexOf(lampData);
    if (index > -1) {
      this.scene.lamps.splice(index, 1);
    }

    // Player picks up the lamp
    this.scene.player.pickupLamp(lampData);
  }

  /**
   * Register the bed as an interactable object
   */
  registerBedAction(bed) {
    if (!this.scene.actionSystem) return;

    this.scene.actionSystem.registerObject(bed, {
      owner: this,
      getActions: () => this.getBedActions()
    });
  }

  /**
   * Get available actions for the player's bed
   */
  getBedActions() {
    return [
      {
        name: 'Go to Bed',
        key: 'T',
        keyCode: Phaser.Input.Keyboard.KeyCodes.T,
        callback: () => this.scene.goToBed()
      }
    ];
  }

  /**
   * Get the player's bed position
   */
  getPlayerBedPosition() {
    if (this.playerHome?.bed) {
      return { x: this.playerHome.bed.x, y: this.playerHome.bed.y };
    }
    return null;
  }

  renderDecorations() {
    for (const tree of this.trees) {
      const treeSprite = this.scene.physics.add.staticImage(tree.x, tree.y, 'tree');
      treeSprite.setDepth(DEPTH.WALLS);
      treeSprite.body.setSize(8, 8);
      treeSprite.body.setOffset(4, 8);

      if (this.scene.walls) {
        this.scene.walls.add(treeSprite);
      }
      if (this.scene.hud) this.scene.hud.ignoreGameObject(treeSprite);
    }

    if (this.fountain) {
      const fountainSprite = this.scene.add.image(this.fountain.x, this.fountain.y, 'fountain');
      fountainSprite.setDepth(DEPTH.FURNITURE);
      if (this.scene.hud) this.scene.hud.ignoreGameObject(fountainSprite);

      const fountainBody = this.scene.physics.add.staticImage(this.fountain.x, this.fountain.y, 'fountain');
      fountainBody.setVisible(false);
      fountainBody.body.setCircle(12);
      if (this.scene.walls) {
        this.scene.walls.add(fountainBody);
      }
    }

    // Add neighborhood-specific decorations
    this.addNeighborhoodDecorations();
  }

  /**
   * Add flowers in rich yards, dirt/trash in poor areas
   */
  addNeighborhoodDecorations() {
    const flowerTypes = ['flower_red', 'flower_yellow', 'flower_purple', 'flower_pink', 'flower_white'];

    // For each building, add appropriate decorations around it
    for (const building of this.buildings) {
      if (building.type !== 'house') continue;

      const neighborhood = building.neighborhood;

      if (neighborhood === 'rich') {
        // Add flowers around rich houses (in yard area)
        this.addFlowersAroundBuilding(building, flowerTypes);
      } else if (neighborhood === 'poor') {
        // Add dirt patches and trash around poor houses
        this.addDebrisAroundBuilding(building);
      }
    }

    // Also scatter some decorations in empty grass areas
    this.scatterNeighborhoodDecorations(flowerTypes);
  }

  /**
   * Add flowers around a rich building
   */
  addFlowersAroundBuilding(building, flowerTypes) {
    const { x, y, width, height, doorX } = building;

    // Place 3-6 flowers around the building perimeter
    const flowerCount = Phaser.Math.Between(3, 6);
    const positions = [];

    // Generate potential positions around the building
    // Front yard (below door)
    for (let fx = x; fx < x + width; fx++) {
      positions.push({ x: fx, y: y + height + 1 });
      positions.push({ x: fx, y: y + height + 2 });
    }
    // Sides
    for (let fy = y; fy < y + height; fy++) {
      positions.push({ x: x - 1, y: fy });
      positions.push({ x: x + width, y: fy });
    }

    // Shuffle and pick random positions
    Phaser.Utils.Array.Shuffle(positions);

    let placed = 0;
    for (const pos of positions) {
      if (placed >= flowerCount) break;
      if (pos.x < 0 || pos.x >= this.mapWidth || pos.y < 0 || pos.y >= this.mapHeight) continue;

      const cell = this.grid[pos.x][pos.y];
      // Only place on empty grass
      if (cell.type === 'empty') {
        const flowerType = flowerTypes[Phaser.Math.Between(0, flowerTypes.length - 1)];
        const px = pos.x * this.tileSize + this.tileSize / 2;
        const py = pos.y * this.tileSize + this.tileSize / 2;

        const flower = this.scene.add.image(px, py, flowerType);
        flower.setDepth(DEPTH.FURNITURE);
        if (this.scene.hud) this.scene.hud.ignoreGameObject(flower);
        placed++;
      }
    }
  }

  /**
   * Add dirt and trash around a poor building
   */
  addDebrisAroundBuilding(building) {
    const { x, y, width, height } = building;

    // Place 2-4 pieces of debris around the building
    const debrisCount = Phaser.Math.Between(2, 4);
    const positions = [];

    // Around the building
    for (let fx = x - 1; fx <= x + width; fx++) {
      positions.push({ x: fx, y: y + height + 1 });
      positions.push({ x: fx, y: y - 1 });
    }
    for (let fy = y; fy < y + height; fy++) {
      positions.push({ x: x - 1, y: fy });
      positions.push({ x: x + width, y: fy });
    }

    Phaser.Utils.Array.Shuffle(positions);

    let placed = 0;
    for (const pos of positions) {
      if (placed >= debrisCount) break;
      if (pos.x < 0 || pos.x >= this.mapWidth || pos.y < 0 || pos.y >= this.mapHeight) continue;

      const cell = this.grid[pos.x][pos.y];
      if (cell.type === 'empty' || cell.type === 'sidewalk') {
        const textureType = Math.random() < 0.5 ? 'dirt_patch' : 'trash';
        const px = pos.x * this.tileSize + this.tileSize / 2;
        const py = pos.y * this.tileSize + this.tileSize / 2;

        const debris = this.scene.add.image(px, py, textureType);
        debris.setDepth(DEPTH.FURNITURE);
        if (this.scene.hud) this.scene.hud.ignoreGameObject(debris);
        placed++;
      }
    }
  }

  /**
   * Scatter decorations in open neighborhood areas
   */
  scatterNeighborhoodDecorations(flowerTypes) {
    // Scan grid for empty grass tiles and add sparse decorations
    for (let x = 2; x < this.mapWidth - 2; x++) {
      for (let y = 2; y < this.mapHeight - 2; y++) {
        const cell = this.grid[x][y];
        if (cell.type !== 'empty') continue;

        const neighborhood = this.getNeighborhoodAt(x, y);

        if (neighborhood.name === 'rich') {
          // 2% chance of flower in rich grass
          if (Math.random() < 0.02) {
            const flowerType = flowerTypes[Phaser.Math.Between(0, flowerTypes.length - 1)];
            const px = x * this.tileSize + this.tileSize / 2;
            const py = y * this.tileSize + this.tileSize / 2;
            const flower = this.scene.add.image(px, py, flowerType);
            flower.setDepth(DEPTH.FURNITURE);
            if (this.scene.hud) this.scene.hud.ignoreGameObject(flower);
          }
        } else if (neighborhood.name === 'poor') {
          // 1% chance of trash/dirt in poor grass
          if (Math.random() < 0.01) {
            const textureType = Math.random() < 0.6 ? 'dirt_patch' : 'trash';
            const px = x * this.tileSize + this.tileSize / 2;
            const py = y * this.tileSize + this.tileSize / 2;
            const debris = this.scene.add.image(px, py, textureType);
            debris.setDepth(DEPTH.FURNITURE);
            if (this.scene.hud) this.scene.hud.ignoreGameObject(debris);
          }
        }
      }
    }
  }

  updateRoofVisibility(playerX, playerY) {
    const playerTileX = Math.floor(playerX / this.tileSize);
    const playerTileY = Math.floor(playerY / this.tileSize);

    let playerBuildingId = null;
    if (playerTileX >= 0 && playerTileX < this.mapWidth &&
        playerTileY >= 0 && playerTileY < this.mapHeight) {
      const cell = this.grid[playerTileX][playerTileY];
      if (cell.buildingId !== null) {
        playerBuildingId = cell.buildingId;
      }
    }

    for (const roof of this.roofTiles) {
      if (roof.buildingId === playerBuildingId) {
        roof.setAlpha(0.2);
      } else {
        roof.setAlpha(0.85);
      }
    }
  }

  // ==================== PUBLIC API ====================

  getTownData() {
    return {
      buildings: this.buildings,
      roads: this.roads,
      sidewalks: this.sidewalks,
      trees: this.trees,
      policeStation: this.policeStation,
      store: this.store,
      fountain: this.fountain,
      playerHome: this.playerHome,
      grid: this.grid,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      tileSize: this.tileSize
    };
  }

  getHouses() {
    return this.buildings.filter(b => b.type === 'house');
  }

  getPlayerHome() {
    return this.playerHome;
  }

  getPoliceSpawnPoint() {
    if (this.policeStation) {
      return {
        x: this.policeStation.doorPixelX,
        y: this.policeStation.doorPixelY
      };
    }
    return null;
  }
}
