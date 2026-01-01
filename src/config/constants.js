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
  RITUAL_SITE: 0.5,
  BLOOD: 1,
  CORPSE: 2,
  NPC: 10,
  PLAYER: 10,
  HEALTH_BAR: 50,
  EFFECTS: 50,
  CARRIED_CORPSE: 100,
  CAGE: 100,
  EXCLAMATION: 150
};
