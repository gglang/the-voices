// Game configuration constants

// Map settings
export const MAP = {
  WIDTH: 200,        // tiles
  HEIGHT: 200,       // tiles
  TILE_SIZE: 16,     // pixels
  SAFE_SPAWN_RADIUS: 5,
  OBSTACLE_COUNT: 150
};

// Player settings
export const PLAYER = {
  SPEED: 80,
  ATTACK_COOLDOWN: 1000,  // ms
  ATTACK_RANGE: 16,       // pixels (1 tile)
  CORPSE_PICKUP_RANGE: 16
};

// NPC settings
export const HUMAN = {
  SPEED: 80,
  WANDER_RADIUS: 5 * 16,    // pixels
  SPAWN_GRID_SIZE: 20,
  CORPSE_DETECT_RANGE: 3 * 16,
  WAIT_TIME_MIN: 1000,
  WAIT_TIME_MAX: 3000
};

// Trust system
export const TRUST = {
  MAX_TRUST: 3,
  TALK_COOLDOWN: 1000,       // ms
  FOLLOW_MAX_TILES: 20,
  STOP_CHANCE_5_TILES: 0.10,   // 10% chance to stop at 5 tiles
  STOP_CHANCE_10_TILES: 0.30,  // 30% chance at 10 tiles
  STOP_CHANCE_15_TILES: 0.50,  // 50% chance at 15 tiles
  STOP_PAUSE_DURATION: 3000,   // 3 seconds pause when stopping
  FOLLOW_DISTANCE: 24          // pixels - how close they follow
};

// Police settings
export const POLICE = {
  BASE_SPEED: 64,
  CHASE_SPEED: 80,
  MAX_HEALTH: 2,
  HEAL_DELAY: 30000,        // ms
  CHASE_RANGE: 4 * 16,
  DETECTION_RANGE: 3 * 16,
  DETECTION_DURATION: 2000, // ms to arrest
  BODY_SIGHT_RANGE: 5 * 16, // 5 tiles - cops can see bodies this far
  SPAWN_GRID_SIZE: 50,
  BACKUP_DELAY: 30000,      // 30 seconds for backup to arrive
  BACKUP_COUNT: 3,
  WAIT_TIME_MIN: 500,
  WAIT_TIME_MAX: 1500,
  INVESTIGATION_WAIT: 2000,
  STUCK_THRESHOLD: 1000
};

// Identification system
export const IDENTIFICATION = {
  ILLEGAL_ACTIVITY_DURATION: 500, // ms
  IDENTIFY_RANGE: 5 * 16          // pixels (5 tiles)
};

// Ritual system
export const RITUAL = {
  SITE_COUNT: 5,
  MIN_DIST_BETWEEN_SITES: 25 * 16,  // 25 tiles apart
  MIN_DIST_FROM_CENTER: 15,         // tiles from center
  ACTIVATION_RADIUS: 20,
  SACRIFICE_POINTS_PREFERRED: 5,
  SACRIFICE_POINTS_OTHER: 1
};

// Color palettes
export const HAIR_COLORS = {
  black: 0x1a1a1a,
  brown: 0x8B4513,
  blonde: 0xF4D03F,
  red: 0xC0392B,
  blue: 0x3498DB,
  white: 0xECECEC
};

export const SKIN_COLORS = {
  light: 0xFFDBC4,
  tan: 0xE5B887,
  medium: 0xC68642,
  brown: 0x8D5524,
  dark: 0x5C3A21
};

// Visual effects
export const EFFECTS = {
  BLOOD_FADE_DELAY: 2000,
  BLOOD_FADE_DURATION: 3000,
  EXCLAMATION_DURATION: 2000,
  SACRIFICE_PARTICLE_COUNT: 8
};

// Depth layers for rendering order
export const DEPTH = {
  FLOOR: 0,
  ROAD: 0.25,
  RITUAL_SITE: 0.5,
  BLOOD: 1,
  CORPSE: 2,
  FURNITURE: 5,
  NPC: 10,
  PLAYER: 10,
  WALLS: 15,
  HEALTH_BAR: 50,
  EFFECTS: 50,
  ROOF: 80,
  CARRIED_CORPSE: 100,
  CAGE: 100,
  EXCLAMATION: 150
};

// Town generation settings
export const TOWN = {
  // Building sizes (in tiles)
  HOUSE_WIDTH: 6,
  HOUSE_HEIGHT: 6,
  POLICE_STATION_WIDTH: 10,
  POLICE_STATION_HEIGHT: 8,
  STORE_WIDTH: 8,
  STORE_HEIGHT: 6,

  // Road dimensions
  ROAD_WIDTH: 3,
  MAIN_ROAD_WIDTH: 4,

  // Town layout
  BLOCK_SIZE: 20,          // tiles per block (house + yard + road)
  TOWN_SQUARE_SIZE: 14,    // tiles

  // Generation
  HUMANS_PER_HOUSE_MIN: 1,
  HUMANS_PER_HOUSE_MAX: 3,
  TREE_DENSITY: 0.03,
  INITIAL_COP_COUNT: 6
};

// Neighborhood configurations
export const NEIGHBORHOODS = {
  POOR: {
    name: 'poor',
    grass: { base: 0x2a4a1a, light: 0x3a5a2a, dark: 0x1a3a0a },
    road: { base: 0x2a2a2a, light: 0x353535, dark: 0x202020 },
    sidewalk: { base: 0x666666, light: 0x777777, dark: 0x555555 },
    houses: ['shack', 'rundown', 'trailer']
  },
  MEDIUM: {
    name: 'medium',
    grass: { base: 0x2d5a1e, light: 0x3d6a2e, dark: 0x1d4a0e },
    road: { base: 0x3a3a3a, light: 0x454545, dark: 0x303030 },
    sidewalk: { base: 0x888888, light: 0x999999, dark: 0x777777 },
    houses: ['suburban', 'duplex', 'cottage']
  },
  RICH: {
    name: 'rich',
    grass: { base: 0x3d7a2e, light: 0x4d8a3e, dark: 0x2d6a1e },
    road: { base: 0x4a4a4a, light: 0x555555, dark: 0x404040 },
    sidewalk: { base: 0xaaaaaa, light: 0xbbbbbb, dark: 0x999999 },
    houses: ['mansion', 'colonial', 'modern']
  }
};

// House sizes by type
export const HOUSE_TYPES = {
  // Poor neighborhood houses - rusty browns/oranges, distinct from gray sidewalks
  shack: { width: 5, height: 5, wall: 0x7a4020, roof: 0x3a2510, floor: 0x5a3a20 },
  rundown: { width: 6, height: 5, wall: 0x8a5030, roof: 0x4a2a15, floor: 0x6a4a30 },
  trailer: { width: 8, height: 4, wall: 0x6a5545, roof: 0x4a3a30, floor: 0x5a4a3a },
  // Medium neighborhood houses
  suburban: { width: 6, height: 6, wall: 0x8B4513, roof: 0x8B0000, floor: 0xA0522D },
  duplex: { width: 7, height: 6, wall: 0x9B5523, roof: 0x7B0000, floor: 0xB0623D },
  cottage: { width: 6, height: 5, wall: 0x7B3503, roof: 0x6B0000, floor: 0x905010 },
  // Rich neighborhood houses
  mansion: { width: 10, height: 8, wall: 0xd4a574, roof: 0x2a2a4a, floor: 0xc49564 },
  colonial: { width: 8, height: 7, wall: 0xf5f5f5, roof: 0x1a1a2a, floor: 0xb08060 },
  modern: { width: 9, height: 7, wall: 0xc0c0c0, roof: 0x3a3a3a, floor: 0xa09080 },
  // Player home (medium neighborhood with basement)
  player_home: { width: 7, height: 7, wall: 0x8B4513, roof: 0x5B0000, floor: 0xA0522D, hasBasement: true }
};

// Minimap settings
export const MINIMAP = {
  WIDTH: 240,
  HEIGHT: 240,
  PADDING: 10,
  BORDER_WIDTH: 2,
  COLORS: {
    BACKGROUND: 0x1a1a1a,
    BORDER: 0x444444,
    PLAYER: 0x00ff00,
    CORPSE: 0xff0000,
    BUILDING: 0x8B4513,
    BUILDING_POOR: 0x7a4020,
    BUILDING_MEDIUM: 0x8B4513,
    BUILDING_RICH: 0xd4a574,
    PLAYER_HOME: 0x00ffff,
    POLICE_STATION: 0x1a237e,
    STORE: 0xdaa520,
    ROAD: 0x555555,
    SIDEWALK: 0x777777,
    RITUAL_SITE: 0x8800cc,
    TREE: 0x228b22
  }
};
