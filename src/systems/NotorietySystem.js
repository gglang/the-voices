/**
 * NotorietySystem - Manages player notoriety (leveling system)
 *
 * Max level: 10
 * Starting level: 1
 * Level 2 requires 10 XP
 * Each subsequent level requires 50% more XP (compounding)
 *
 * XP Sources:
 * - Witnessed kill (human/cop): 1 XP per witness (max 3)
 * - Witnessed pet kill: 1 XP (max 1)
 * - Body discovered by human/cop: 2 XP (once per body)
 * - Completing objectives: varies by objective
 */
export class NotorietySystem {
  constructor(scene) {
    this.scene = scene;

    // Current state
    this.level = 1;
    this.currentXP = 0;
    this.totalXP = 0;  // Lifetime XP earned

    // Configuration
    this.maxLevel = 10;
    this.baseXPForLevel2 = 10;
    this.compoundRate = 1.5;  // 50% more each level

    // Pre-calculate XP thresholds
    this.xpThresholds = this.calculateXPThresholds();

    // Track bodies that have been discovered (to prevent duplicate XP)
    this.discoveredBodies = new Set();
  }

  /**
   * Calculate XP thresholds for each level
   * Level 2: 10 XP
   * Level 3: 15 XP (10 * 1.5)
   * Level 4: 23 XP (15 * 1.5, rounded)
   * etc.
   */
  calculateXPThresholds() {
    const thresholds = [0, 0];  // Level 0 and 1 don't exist / start at 0

    let required = this.baseXPForLevel2;
    for (let level = 2; level <= this.maxLevel; level++) {
      thresholds[level] = Math.round(required);
      required *= this.compoundRate;
    }

    return thresholds;
  }

  /**
   * Get XP required for a specific level
   * @param {number} level
   * @returns {number}
   */
  getXPForLevel(level) {
    if (level < 2 || level > this.maxLevel) return 0;
    return this.xpThresholds[level];
  }

  /**
   * Get XP required for next level from current level
   * @returns {number}
   */
  getXPForNextLevel() {
    if (this.level >= this.maxLevel) return 0;
    return this.xpThresholds[this.level + 1];
  }

  /**
   * Add XP and check for level up
   * @param {number} amount - XP to add
   * @param {string} source - Source description for notification
   */
  addXP(amount, source = '') {
    if (this.level >= this.maxLevel) return;

    this.currentXP += amount;
    this.totalXP += amount;

    // Show notification
    const message = source
      ? `+${amount} notoriety (${source})`
      : `+${amount} notoriety`;
    this.scene.showNotification(message);

    // Check for level up
    this.checkLevelUp();
  }

  /**
   * Check if player has enough XP to level up
   */
  checkLevelUp() {
    while (this.level < this.maxLevel) {
      const xpNeeded = this.getXPForNextLevel();
      if (this.currentXP >= xpNeeded) {
        this.currentXP -= xpNeeded;
        this.level++;
        this.onLevelUp();
      } else {
        break;
      }
    }
  }

  /**
   * Called when player levels up
   */
  onLevelUp() {
    // Show level up notification
    this.scene.showNotification(`NOTORIETY LEVEL ${this.level}!`);

    // Emit event for other systems to react
    this.scene.events.emit('notorietyLevelUp', { level: this.level });

    // Could add effects here (screen flash, sound, etc.)
  }

  /**
   * Award XP for witnessed kill
   * @param {number} witnessCount - Number of witnesses
   * @param {boolean} isPetKill - Whether this was a pet kill
   */
  awardWitnessedKillXP(witnessCount, isPetKill = false) {
    if (witnessCount <= 0) return;

    if (isPetKill) {
      // Pet kills give max 1 XP regardless of witness count
      this.addXP(1, 'witnessed pet kill');
    } else {
      // Human/cop kills give 1 XP per witness, max 3
      const xp = Math.min(witnessCount, 3);
      const source = xp === 1 ? 'witnessed kill' : `${xp} witnesses`;
      this.addXP(xp, source);
    }
  }

  /**
   * Award XP for body discovery
   * @param {object} corpse - The corpse that was discovered
   * @returns {boolean} Whether XP was awarded
   */
  awardBodyDiscoveryXP(corpse) {
    // Only award XP for human and cop kills, not pets
    if (corpse.isPet) return false;

    // Check if we already gave XP for this body
    const bodyId = corpse.id || `${corpse.x}_${corpse.y}_${corpse.textureKey}`;
    if (this.discoveredBodies.has(bodyId)) return false;

    // Mark as discovered
    this.discoveredBodies.add(bodyId);
    corpse.discovered = true;

    // Award 2 XP
    const source = corpse.isPolice ? 'cop body found' : 'body found';
    this.addXP(2, source);

    return true;
  }

  /**
   * Award XP for completing an objective
   * @param {number} amount - XP amount specified by objective
   * @param {string} objectiveName - Name of completed objective
   */
  awardObjectiveXP(amount, objectiveName = '') {
    if (amount <= 0) return;

    const source = objectiveName ? `completed: ${objectiveName}` : 'objective';
    this.addXP(amount, source);
  }

  /**
   * Get current progress as a percentage (0-1)
   * @returns {number}
   */
  getProgressPercent() {
    if (this.level >= this.maxLevel) return 1;

    const xpNeeded = this.getXPForNextLevel();
    if (xpNeeded <= 0) return 1;

    return Math.min(this.currentXP / xpNeeded, 1);
  }

  /**
   * Get current level
   * @returns {number}
   */
  getLevel() {
    return this.level;
  }

  /**
   * Get current XP
   * @returns {number}
   */
  getCurrentXP() {
    return this.currentXP;
  }

  /**
   * Check if at max level
   * @returns {boolean}
   */
  isMaxLevel() {
    return this.level >= this.maxLevel;
  }

  /**
   * Get display string for current progress (e.g., "5/15")
   * @returns {string}
   */
  getProgressString() {
    if (this.level >= this.maxLevel) {
      return 'MAX';
    }
    return `${this.currentXP}/${this.getXPForNextLevel()}`;
  }

  /**
   * Get save data for game saving
   * @returns {object}
   */
  getSaveData() {
    return {
      level: this.level,
      currentXP: this.currentXP,
      totalXP: this.totalXP,
      discoveredBodies: Array.from(this.discoveredBodies)
    };
  }

  /**
   * Load save data
   * @param {object} data
   */
  loadSaveData(data) {
    if (data) {
      this.level = data.level || 1;
      this.currentXP = data.currentXP || 0;
      this.totalXP = data.totalXP || 0;
      this.discoveredBodies = new Set(data.discoveredBodies || []);
    }
  }
}
