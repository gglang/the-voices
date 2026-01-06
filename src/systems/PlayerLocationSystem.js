import { MAP } from '../config/constants.js';

/**
 * Location types that can be detected for objectives
 */
export const LocationType = {
  WOODS: 'woods',
  DOWNTOWN: 'downtown',           // Poor neighborhood
  YOUR_HOME: 'yourHome',
  DOWNLANDS: 'downlands',         // Middle class neighborhood
  UPLANDS: 'uplands',             // Upper class neighborhood
  NEAR_POLICE_STATION: 'nearPoliceStation'
};

/**
 * Player-facing names for locations
 */
export const LocationNames = {
  [LocationType.WOODS]: 'Woods',
  [LocationType.DOWNTOWN]: 'Downtown',
  [LocationType.YOUR_HOME]: 'Your Home',
  [LocationType.DOWNLANDS]: 'Downlands',
  [LocationType.UPLANDS]: 'Uplands',
  [LocationType.NEAR_POLICE_STATION]: 'Near Police Station'
};

/**
 * PlayerLocationSystem - Detects the player's current location
 * and tracks which locations are highlighted for objectives
 */
export class PlayerLocationSystem {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = MAP.TILE_SIZE;

    // Current player location(s) - player can be in multiple at once
    this.currentLocations = new Set();

    // Locations to highlight on minimap (set by objectives)
    this.highlightedLocations = new Set();

    // Cache for location bounds (computed once after town generation)
    this.locationBounds = {};

    // Police station proximity (5 tiles)
    this.policeProximityTiles = 5;
  }

  /**
   * Initialize location bounds after town is generated
   * @param {Object} townData - Data from TownGenerator
   */
  initialize(townData) {
    this.townData = townData;
    this.grid = townData.grid;
    this.mapWidth = townData.mapWidth;
    this.mapHeight = townData.mapHeight;

    // Compute bounds for each location type
    this.computeLocationBounds();
  }

  /**
   * Compute the bounds for each location type
   */
  computeLocationBounds() {
    const centerX = this.mapWidth / 2;
    const centerY = this.mapHeight / 2;

    // Downtown (Poor): Central core, radius < 45 tiles
    this.locationBounds[LocationType.DOWNTOWN] = {
      type: 'circle',
      centerX: centerX,
      centerY: centerY,
      radius: 45
    };

    // Uplands (Rich): North half outside the core (y < centerY and dist >= 45)
    this.locationBounds[LocationType.UPLANDS] = {
      type: 'custom',
      check: (tileX, tileY) => {
        const distFromCenter = Math.sqrt(
          Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
        );
        return distFromCenter >= 45 && tileY < centerY;
      }
    };

    // Downlands (Medium): South half outside the core (y >= centerY and dist >= 45)
    this.locationBounds[LocationType.DOWNLANDS] = {
      type: 'custom',
      check: (tileX, tileY) => {
        const distFromCenter = Math.sqrt(
          Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
        );
        return distFromCenter >= 45 && tileY >= centerY;
      }
    };

    // Woods: Any tile that is a tree or empty (grass) and not on road/building
    this.locationBounds[LocationType.WOODS] = {
      type: 'custom',
      check: (tileX, tileY) => {
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
          return false;
        }
        const cell = this.grid[tileX][tileY];
        return cell.type === 'tree' || cell.type === 'empty';
      }
    };

    // Your Home: Inside player's home building
    if (this.townData.playerHome) {
      const home = this.townData.playerHome;
      this.locationBounds[LocationType.YOUR_HOME] = {
        type: 'rect',
        x: home.x,
        y: home.y,
        width: home.width,
        height: home.height
      };
    }

    // Near Police Station: Within 5 tiles of police station
    if (this.townData.policeStation) {
      const police = this.townData.policeStation;
      this.locationBounds[LocationType.NEAR_POLICE_STATION] = {
        type: 'proximity',
        centerX: police.x + police.width / 2,
        centerY: police.y + police.height / 2,
        radiusTiles: this.policeProximityTiles,
        // Also include inside the building
        buildingBounds: {
          x: police.x,
          y: police.y,
          width: police.width,
          height: police.height
        }
      };
    }
  }

  /**
   * Update player's current locations
   */
  update() {
    const player = this.scene.player;
    if (!player?.sprite) return;

    const playerX = player.sprite.x;
    const playerY = player.sprite.y;
    const tileX = Math.floor(playerX / this.tileSize);
    const tileY = Math.floor(playerY / this.tileSize);

    // Clear previous locations
    this.currentLocations.clear();

    // Check each location type
    for (const locationType of Object.values(LocationType)) {
      if (this.isInLocation(tileX, tileY, locationType)) {
        this.currentLocations.add(locationType);
      }
    }
  }

  /**
   * Check if a tile position is within a location
   * @param {number} tileX
   * @param {number} tileY
   * @param {string} locationType
   * @returns {boolean}
   */
  isInLocation(tileX, tileY, locationType) {
    const bounds = this.locationBounds[locationType];
    if (!bounds) return false;

    switch (bounds.type) {
      case 'circle':
        const distFromCenter = Math.sqrt(
          Math.pow(tileX - bounds.centerX, 2) + Math.pow(tileY - bounds.centerY, 2)
        );
        return distFromCenter < bounds.radius;

      case 'rect':
        return tileX >= bounds.x && tileX < bounds.x + bounds.width &&
               tileY >= bounds.y && tileY < bounds.y + bounds.height;

      case 'proximity':
        // Check if inside building
        const bb = bounds.buildingBounds;
        if (bb && tileX >= bb.x && tileX < bb.x + bb.width &&
            tileY >= bb.y && tileY < bb.y + bb.height) {
          return true;
        }
        // Check proximity
        const distFromPolice = Math.sqrt(
          Math.pow(tileX - bounds.centerX, 2) + Math.pow(tileY - bounds.centerY, 2)
        );
        return distFromPolice <= bounds.radiusTiles;

      case 'custom':
        return bounds.check(tileX, tileY);

      default:
        return false;
    }
  }

  /**
   * Check if player is currently in a specific location
   * @param {string} locationType
   * @returns {boolean}
   */
  isPlayerInLocation(locationType) {
    return this.currentLocations.has(locationType);
  }

  /**
   * Get all current player locations
   * @returns {Set<string>}
   */
  getCurrentLocations() {
    return this.currentLocations;
  }

  /**
   * Add a location to be highlighted on the minimap
   * @param {string} locationType
   */
  highlightLocation(locationType) {
    this.highlightedLocations.add(locationType);
  }

  /**
   * Remove a location from minimap highlighting
   * @param {string} locationType
   */
  unhighlightLocation(locationType) {
    this.highlightedLocations.delete(locationType);
  }

  /**
   * Clear all highlighted locations
   */
  clearHighlights() {
    this.highlightedLocations.clear();
  }

  /**
   * Get all highlighted locations
   * @returns {Set<string>}
   */
  getHighlightedLocations() {
    return this.highlightedLocations;
  }

  /**
   * Get the bounds for a location (for minimap rendering)
   * @param {string} locationType
   * @returns {Object|null}
   */
  getLocationBounds(locationType) {
    return this.locationBounds[locationType] || null;
  }

  /**
   * Get minimap-friendly bounds for rendering highlights
   * Returns an array of rectangles in tile coordinates
   * @param {string} locationType
   * @returns {Array<{x, y, width, height}>}
   */
  getMinimapBounds(locationType) {
    const bounds = this.locationBounds[locationType];
    if (!bounds) return [];

    const results = [];

    switch (bounds.type) {
      case 'circle':
        // Return a bounding rectangle for the circle
        results.push({
          x: bounds.centerX - bounds.radius,
          y: bounds.centerY - bounds.radius,
          width: bounds.radius * 2,
          height: bounds.radius * 2,
          shape: 'circle',
          centerX: bounds.centerX,
          centerY: bounds.centerY,
          radius: bounds.radius
        });
        break;

      case 'rect':
        results.push({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          shape: 'rect'
        });
        break;

      case 'proximity':
        // Circle around police station
        results.push({
          x: bounds.centerX - bounds.radiusTiles,
          y: bounds.centerY - bounds.radiusTiles,
          width: bounds.radiusTiles * 2,
          height: bounds.radiusTiles * 2,
          shape: 'circle',
          centerX: bounds.centerX,
          centerY: bounds.centerY,
          radius: bounds.radiusTiles
        });
        break;

      case 'custom':
        // For Uplands/Downlands, return approximate rectangular regions
        if (locationType === LocationType.UPLANDS) {
          // North section outside core
          results.push({
            x: 0,
            y: 0,
            width: this.mapWidth,
            height: this.mapHeight / 2 - 10,
            shape: 'region',
            excludeCircle: {
              centerX: this.mapWidth / 2,
              centerY: this.mapHeight / 2,
              radius: 45
            }
          });
        } else if (locationType === LocationType.DOWNLANDS) {
          // South section outside core
          results.push({
            x: 0,
            y: this.mapHeight / 2 + 10,
            width: this.mapWidth,
            height: this.mapHeight / 2 - 10,
            shape: 'region',
            excludeCircle: {
              centerX: this.mapWidth / 2,
              centerY: this.mapHeight / 2,
              radius: 45
            }
          });
        }
        // Woods is too scattered to highlight meaningfully
        break;
    }

    return results;
  }

  /**
   * Get the display name for a location
   * @param {string} locationType
   * @returns {string}
   */
  getLocationName(locationType) {
    return LocationNames[locationType] || locationType;
  }
}
