import Phaser from 'phaser';
import { TOWN, DEPTH, MAP } from '../config/constants.js';
import { Door } from '../entities/Door.js';

/**
 * Procedural town generator with buildings, roads, and decorations
 */
export class TownGenerator {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = MAP.TILE_SIZE;

    // Town data storage
    this.buildings = [];
    this.roads = [];
    this.trees = [];
    this.roofTiles = [];

    // Key locations
    this.policeStation = null;
    this.store = null;
    this.fountain = null;
    this.townSquareCenter = null;

    // Grid for collision/placement checking
    this.grid = [];
  }

  /**
   * Generate the complete town
   */
  generate(mapWidth, mapHeight) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // Initialize empty grid
    this.initializeGrid();

    // Calculate town layout
    this.calculateLayout();

    // Generate in order
    this.generateRoads();
    this.generateTownSquare();
    this.generatePoliceStation();
    this.generateStore();
    this.generateHouses();
    this.generateTrees();

    // Render everything
    this.renderGround();
    this.renderBuildings();
    this.renderDecorations();

    return this.getTownData();
  }

  /**
   * Initialize grid for tracking placed elements
   */
  initializeGrid() {
    this.grid = [];
    for (let x = 0; x < this.mapWidth; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.mapHeight; y++) {
        this.grid[x][y] = { type: 'empty', buildingId: null };
      }
    }
  }

  /**
   * Calculate the overall town layout
   */
  calculateLayout() {
    const centerX = Math.floor(this.mapWidth / 2);
    const centerY = Math.floor(this.mapHeight / 2);

    this.townSquareCenter = { x: centerX, y: centerY };

    // Main roads run through center
    this.mainRoadH = centerY;
    this.mainRoadV = centerX;
  }

  /**
   * Generate road network
   */
  generateRoads() {
    const roadWidth = TOWN.ROAD_WIDTH;
    const mainWidth = TOWN.MAIN_ROAD_WIDTH;

    // Main horizontal road
    this.addRoad(0, this.mainRoadH - Math.floor(mainWidth / 2), this.mapWidth, mainWidth);

    // Main vertical road
    this.addRoad(this.mainRoadV - Math.floor(mainWidth / 2), 0, mainWidth, this.mapHeight);

    // Secondary roads - grid pattern
    const blockSize = TOWN.BLOCK_SIZE;
    const startX = this.mainRoadV % blockSize;
    const startY = this.mainRoadH % blockSize;

    // Horizontal secondary roads
    for (let y = startY; y < this.mapHeight; y += blockSize) {
      if (Math.abs(y - this.mainRoadH) > mainWidth) {
        this.addRoad(0, y, this.mapWidth, roadWidth);
      }
    }

    // Vertical secondary roads
    for (let x = startX; x < this.mapWidth; x += blockSize) {
      if (Math.abs(x - this.mainRoadV) > mainWidth) {
        this.addRoad(x, 0, roadWidth, this.mapHeight);
      }
    }
  }

  /**
   * Add a road to the grid
   */
  addRoad(x, y, width, height) {
    const road = { x, y, width, height };
    this.roads.push(road);

    // Mark grid
    for (let tx = x; tx < x + width && tx < this.mapWidth; tx++) {
      for (let ty = y; ty < y + height && ty < this.mapHeight; ty++) {
        if (tx >= 0 && ty >= 0) {
          this.grid[tx][ty] = { type: 'road', buildingId: null };
        }
      }
    }
  }

  /**
   * Generate town square in center
   */
  generateTownSquare() {
    const size = TOWN.TOWN_SQUARE_SIZE;
    const cx = this.townSquareCenter.x;
    const cy = this.townSquareCenter.y;
    const halfSize = Math.floor(size / 2);

    // Mark town square area (will be grass/plaza)
    for (let x = cx - halfSize; x < cx + halfSize; x++) {
      for (let y = cy - halfSize; y < cy + halfSize; y++) {
        if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
          if (this.grid[x][y].type !== 'road') {
            this.grid[x][y] = { type: 'plaza', buildingId: null };
          }
        }
      }
    }

    // Fountain in center - mark as obstacle in grid
    this.fountain = {
      x: cx * this.tileSize,
      y: cy * this.tileSize
    };
    this.grid[cx][cy] = { type: 'fountain', buildingId: null };
  }

  /**
   * Generate police station (at edge of town)
   */
  generatePoliceStation() {
    const width = TOWN.POLICE_STATION_WIDTH;
    const height = TOWN.POLICE_STATION_HEIGHT;

    // Place at top-right area
    const x = this.mapWidth - width - 10;
    const y = 10;

    this.policeStation = this.addBuilding('police_station', x, y, width, height);
  }

  /**
   * Generate general store (near town square)
   */
  generateStore() {
    const width = TOWN.STORE_WIDTH;
    const height = TOWN.STORE_HEIGHT;

    // Place near town square
    const cx = this.townSquareCenter.x;
    const cy = this.townSquareCenter.y;
    const halfSquare = Math.floor(TOWN.TOWN_SQUARE_SIZE / 2);

    const x = cx + halfSquare + 2;
    const y = cy - Math.floor(height / 2);

    this.store = this.addBuilding('store', x, y, width, height);
  }

  /**
   * Generate houses in available blocks
   */
  generateHouses() {
    const blockSize = TOWN.BLOCK_SIZE;
    const houseW = TOWN.HOUSE_WIDTH;
    const houseH = TOWN.HOUSE_HEIGHT;
    const roadWidth = TOWN.ROAD_WIDTH;

    let houseId = 0;

    // Iterate through blocks
    for (let blockX = 0; blockX < this.mapWidth; blockX += blockSize) {
      for (let blockY = 0; blockY < this.mapHeight; blockY += blockSize) {
        // Check if this block is suitable for a house
        const houseX = blockX + roadWidth + 1;
        const houseY = blockY + roadWidth + 1;

        if (this.canPlaceBuilding(houseX, houseY, houseW, houseH)) {
          const house = this.addBuilding('house', houseX, houseY, houseW, houseH, houseId);
          if (house) {
            houseId++;
          }
        }

        // Try to place a second house in larger blocks
        const house2X = blockX + roadWidth + houseW + 3;
        if (this.canPlaceBuilding(house2X, houseY, houseW, houseH)) {
          const house = this.addBuilding('house', house2X, houseY, houseW, houseH, houseId);
          if (house) {
            houseId++;
          }
        }
      }
    }
  }

  /**
   * Check if a building can be placed at location
   */
  canPlaceBuilding(x, y, width, height) {
    // Boundary check
    if (x < 2 || y < 2 || x + width >= this.mapWidth - 2 || y + height >= this.mapHeight - 2) {
      return false;
    }

    // Check if area is clear
    for (let tx = x - 1; tx < x + width + 1; tx++) {
      for (let ty = y - 1; ty < y + height + 1; ty++) {
        if (tx < 0 || ty < 0 || tx >= this.mapWidth || ty >= this.mapHeight) {
          return false;
        }
        const cell = this.grid[tx][ty];
        if (cell.type !== 'empty' && cell.type !== 'grass') {
          return false;
        }
      }
    }

    // Check distance from town square center
    const cx = x + width / 2;
    const cy = y + height / 2;
    const dist = Math.sqrt(
      Math.pow(cx - this.townSquareCenter.x, 2) +
      Math.pow(cy - this.townSquareCenter.y, 2)
    );

    // Don't place in town square area
    if (dist < TOWN.TOWN_SQUARE_SIZE / 2 + 2) {
      return false;
    }

    return true;
  }

  /**
   * Add a building to the town
   */
  addBuilding(type, x, y, width, height, id = null) {
    // Determine door position (bottom center)
    const doorX = x + Math.floor(width / 2);
    const doorY = y + height - 1;

    const building = {
      type,
      id: id !== null ? id : this.buildings.length,
      x,
      y,
      width,
      height,
      doorX,
      doorY,
      // Pixel coordinates for center
      centerPixelX: (x + width / 2) * this.tileSize,
      centerPixelY: (y + height / 2) * this.tileSize,
      doorPixelX: (doorX + 0.5) * this.tileSize,
      doorPixelY: (doorY + 1) * this.tileSize
    };

    this.buildings.push(building);

    // Mark grid
    for (let tx = x; tx < x + width; tx++) {
      for (let ty = y; ty < y + height; ty++) {
        if (tx === doorX && ty === doorY) {
          this.grid[tx][ty] = { type: 'door', buildingId: building.id };
        } else if (tx === x || tx === x + width - 1 || ty === y || ty === y + height - 1) {
          this.grid[tx][ty] = { type: 'wall', buildingId: building.id };
        } else {
          this.grid[tx][ty] = { type: 'floor', buildingId: building.id };
        }
      }
    }

    return building;
  }

  /**
   * Generate trees in empty spaces
   */
  generateTrees() {
    for (let x = 2; x < this.mapWidth - 2; x++) {
      for (let y = 2; y < this.mapHeight - 2; y++) {
        if (this.grid[x][y].type === 'empty' && Math.random() < TOWN.TREE_DENSITY) {
          // Check adjacent cells are also empty
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
            this.grid[x][y] = { type: 'tree', buildingId: null };
          }
        }
      }
    }
  }

  /**
   * Render ground tiles (grass, roads)
   */
  renderGround() {
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const cell = this.grid[x][y];
        const px = x * this.tileSize + this.tileSize / 2;
        const py = y * this.tileSize + this.tileSize / 2;

        let textureKey = 'grass';
        let depth = DEPTH.FLOOR;

        if (cell.type === 'road') {
          textureKey = 'road';
          depth = DEPTH.ROAD;
        } else if (cell.type === 'floor') {
          textureKey = 'house_floor';
        } else if (cell.type === 'door') {
          textureKey = 'house_floor';
        } else if (cell.type === 'plaza') {
          textureKey = 'road'; // Use road texture for plaza
          depth = DEPTH.ROAD;
        }

        const tile = this.scene.add.image(px, py, textureKey);
        tile.setDepth(depth);

        if (this.scene.hud) {
          this.scene.hud.ignoreGameObject(tile);
        }
      }
    }
  }

  /**
   * Render building walls and roofs
   */
  renderBuildings() {
    for (const building of this.buildings) {
      this.renderBuilding(building);
    }
  }

  /**
   * Render a single building
   */
  renderBuilding(building) {
    const { type, x, y, width, height, doorX, doorY } = building;

    // Determine textures based on building type
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
      default:
        wallTexture = 'house_wall';
        roofTexture = 'house_roof';
    }

    // Render walls
    for (let tx = x; tx < x + width; tx++) {
      for (let ty = y; ty < y + height; ty++) {
        const px = tx * this.tileSize + this.tileSize / 2;
        const py = ty * this.tileSize + this.tileSize / 2;

        // Perimeter walls
        if (tx === x || tx === x + width - 1 || ty === y || ty === y + height - 1) {
          // Door position - create Door entity for houses only
          if (tx === doorX && ty === doorY) {
            if (type === 'house') {
              const door = new Door(this.scene, px, py, building.id);
              if (this.scene.doors) {
                this.scene.doors.push(door);
              }
            } else {
              // Police station and store get regular door images (always open)
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

        // Roof (covers entire building)
        const roof = this.scene.add.image(px, py, roofTexture);
        roof.setDepth(DEPTH.ROOF);
        // Store roof is more transparent so you can see the door
        roof.setAlpha(type === 'store' ? 0.5 : 0.85);
        roof.buildingId = building.id;
        this.roofTiles.push(roof);

        if (this.scene.hud) this.scene.hud.ignoreGameObject(roof);
      }
    }

    // Add simple furniture inside houses
    if (type === 'house') {
      this.addFurniture(building);
    }

    // Add police sign in front of police station
    if (type === 'police_station') {
      this.addPoliceSign(building);
    }
  }

  /**
   * Add police sign in front of police station
   */
  addPoliceSign(building) {
    const signX = building.doorPixelX;
    const signY = building.doorPixelY + this.tileSize; // Below the door

    const sign = this.scene.add.image(signX, signY, 'police_sign');
    sign.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(sign);
  }

  /**
   * Add furniture inside a house
   */
  addFurniture(building) {
    const { x, y, width, height } = building;

    // Bed in corner
    const bedX = (x + 1) * this.tileSize + this.tileSize / 2;
    const bedY = (y + 1) * this.tileSize + this.tileSize / 2;
    const bed = this.scene.add.image(bedX, bedY, 'furniture_bed');
    bed.setDepth(DEPTH.FURNITURE);
    if (this.scene.hud) this.scene.hud.ignoreGameObject(bed);

    // Table in middle
    if (width > 4 && height > 4) {
      const tableX = (x + Math.floor(width / 2)) * this.tileSize + this.tileSize / 2;
      const tableY = (y + Math.floor(height / 2)) * this.tileSize + this.tileSize / 2;
      const table = this.scene.add.image(tableX, tableY, 'furniture_table');
      table.setDepth(DEPTH.FURNITURE);
      if (this.scene.hud) this.scene.hud.ignoreGameObject(table);
    }
  }

  /**
   * Render trees and fountain
   */
  renderDecorations() {
    // Trees
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

    // Fountain
    if (this.fountain) {
      const fountainSprite = this.scene.add.image(this.fountain.x, this.fountain.y, 'fountain');
      fountainSprite.setDepth(DEPTH.FURNITURE);
      if (this.scene.hud) this.scene.hud.ignoreGameObject(fountainSprite);

      // Make fountain collidable
      const fountainBody = this.scene.physics.add.staticImage(
        this.fountain.x, this.fountain.y, 'fountain'
      );
      fountainBody.setVisible(false);
      fountainBody.body.setCircle(12);
      if (this.scene.walls) {
        this.scene.walls.add(fountainBody);
      }
    }
  }

  /**
   * Update roof visibility based on player position
   */
  updateRoofVisibility(playerX, playerY) {
    const playerTileX = Math.floor(playerX / this.tileSize);
    const playerTileY = Math.floor(playerY / this.tileSize);

    // Check which building player is in
    let playerBuildingId = null;
    if (playerTileX >= 0 && playerTileX < this.mapWidth &&
        playerTileY >= 0 && playerTileY < this.mapHeight) {
      const cell = this.grid[playerTileX][playerTileY];
      if (cell.buildingId !== null) {
        playerBuildingId = cell.buildingId;
      }
    }

    // Update roof visibility
    for (const roof of this.roofTiles) {
      if (roof.buildingId === playerBuildingId) {
        roof.setAlpha(0.2); // Very transparent when inside
      } else {
        roof.setAlpha(0.85); // Mostly opaque when outside
      }
    }
  }

  /**
   * Get all town data for other systems
   */
  getTownData() {
    return {
      buildings: this.buildings,
      roads: this.roads,
      trees: this.trees,
      policeStation: this.policeStation,
      store: this.store,
      fountain: this.fountain,
      grid: this.grid,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      tileSize: this.tileSize
    };
  }

  /**
   * Get houses only
   */
  getHouses() {
    return this.buildings.filter(b => b.type === 'house');
  }

  /**
   * Get police station spawn point
   */
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
