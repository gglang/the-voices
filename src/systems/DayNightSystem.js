import Phaser from 'phaser';

/**
 * Day/Night cycle system
 *
 * Time blocks:
 * - 9am-5pm: Full daylight
 * - 5pm-7pm: Sunset
 * - 7pm-4am: Night
 * - 4am-6am: Sleepy warning (player gets drowsy)
 * - 6am-9am: Pass out / new day
 */
export class DayNightSystem {
  constructor(scene) {
    this.scene = scene;

    // Time configuration (in game minutes)
    this.MINUTES_PER_HOUR = 60;
    this.HOURS_PER_DAY = 24;
    this.START_HOUR = 9; // 9am

    // Real-time to game-time ratio (1 real second = X game minutes)
    // Target: 21 hours of gameplay = ~666 seconds (31.7 seconds per game hour)
    // DEBUG: Reduced to 30 seconds total (21 hours / 30 seconds = 42 game minutes per second)
    this.GAME_MINUTES_PER_SECOND = (21 * 60) / 30; // 42 game minutes per second for 30-second day

    // Current time (in game minutes from midnight)
    this.currentTime = this.START_HOUR * this.MINUTES_PER_HOUR; // Start at 9am

    // Date system: 4 seasons, 28 days each
    this.SEASONS = ['Summer', 'Fall', 'Winter', 'Spring'];
    this.DAYS_PER_SEASON = 28;
    this.currentDay = 1;
    this.currentSeason = 0; // 0 = Summer

    // Time block definitions (in hours)
    this.TIME_BLOCKS = {
      DAY: { start: 9, end: 17 },      // 9am-5pm
      SUNSET: { start: 17, end: 19 },  // 5pm-7pm
      NIGHT: { start: 19, end: 4 },    // 7pm-4am (wraps around midnight)
      SLEEPY: { start: 4, end: 6 },    // 4am-6am
      PASSOUT: { start: 6, end: 9 }    // 6am-9am
    };

    // State
    this.isSleepy = false;
    this.hasShownSleepyWarning = false;
    this.isPaused = false;

    // Tint colors for each time block
    this.TINT_COLORS = {
      DAY: { r: 255, g: 255, b: 255, a: 0 },           // No tint
      SUNSET: { r: 255, g: 180, b: 100, a: 0.2 },     // Warm orange
      NIGHT: { r: 30, g: 30, b: 80, a: 0.5 },         // Dark blue
      SLEEPY: { r: 20, g: 20, b: 60, a: 0.6 },        // Darker blue
      PASSOUT: { r: 0, g: 0, b: 0, a: 1 }             // Black (won't reach this)
    };

    // Create tint overlay
    this.createTintOverlay();
  }

  /**
   * Create the screen tint overlay
   */
  createTintOverlay() {
    // Create a graphics object that covers the entire screen
    this.tintOverlay = this.scene.add.graphics();
    this.tintOverlay.setScrollFactor(0);
    this.tintOverlay.setDepth(1000); // Above most things but below UI

    // Initial draw
    this.updateTintOverlay();
  }

  /**
   * Update the tint overlay based on current time
   */
  updateTintOverlay() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const tint = this.getCurrentTint();

    this.tintOverlay.clear();

    if (tint.a > 0) {
      this.tintOverlay.fillStyle(
        Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b),
        tint.a
      );
      this.tintOverlay.fillRect(0, 0, width, height);
    }
  }

  /**
   * Get the current time block
   */
  getCurrentTimeBlock() {
    const hour = this.getHour();

    if (hour >= 9 && hour < 17) return 'DAY';
    if (hour >= 17 && hour < 19) return 'SUNSET';
    if (hour >= 19 || hour < 4) return 'NIGHT';
    if (hour >= 4 && hour < 6) return 'SLEEPY';
    return 'PASSOUT';
  }

  /**
   * Get interpolated tint based on current time
   */
  getCurrentTint() {
    const hour = this.getHour();
    const minute = this.getMinute();
    const progress = minute / 60; // Progress through current hour

    // Determine which transition we're in
    if (hour >= 9 && hour < 17) {
      // Full daylight
      return this.TINT_COLORS.DAY;
    } else if (hour >= 17 && hour < 19) {
      // Sunset transition (5pm-7pm)
      const t = ((hour - 17) + progress) / 2;
      return this.lerpTint(this.TINT_COLORS.DAY, this.TINT_COLORS.SUNSET, t);
    } else if (hour >= 19 && hour < 20) {
      // Sunset to night transition (7pm-8pm)
      const t = progress;
      return this.lerpTint(this.TINT_COLORS.SUNSET, this.TINT_COLORS.NIGHT, t);
    } else if ((hour >= 20) || (hour < 4)) {
      // Full night
      return this.TINT_COLORS.NIGHT;
    } else if (hour >= 4 && hour < 6) {
      // Sleepy time - slightly darker
      const t = ((hour - 4) + progress) / 2;
      return this.lerpTint(this.TINT_COLORS.NIGHT, this.TINT_COLORS.SLEEPY, t);
    }

    return this.TINT_COLORS.NIGHT;
  }

  /**
   * Linear interpolate between two tint values
   */
  lerpTint(from, to, t) {
    return {
      r: Math.floor(from.r + (to.r - from.r) * t),
      g: Math.floor(from.g + (to.g - from.g) * t),
      b: Math.floor(from.b + (to.b - from.b) * t),
      a: from.a + (to.a - from.a) * t
    };
  }

  /**
   * Get current hour (0-23)
   */
  getHour() {
    return Math.floor(this.currentTime / this.MINUTES_PER_HOUR) % this.HOURS_PER_DAY;
  }

  /**
   * Get current minute (0-59)
   */
  getMinute() {
    return Math.floor(this.currentTime % this.MINUTES_PER_HOUR);
  }

  /**
   * Get formatted time string (12-hour format, 10-minute increments)
   */
  getTimeString() {
    const hour24 = this.getHour();
    const minute = this.getMinute();
    // Round down to nearest 10 minutes for display
    const displayMinute = Math.floor(minute / 10) * 10;
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 < 12 ? 'AM' : 'PM';
    const minuteStr = displayMinute.toString().padStart(2, '0');
    return `${hour12}:${minuteStr} ${ampm}`;
  }

  /**
   * Get the current season name
   */
  getSeasonName() {
    return this.SEASONS[this.currentSeason];
  }

  /**
   * Get formatted date string (e.g., "Summer 1")
   */
  getDateString() {
    return `${this.getSeasonName()} ${this.currentDay}`;
  }

  /**
   * Advance to the next day
   */
  advanceDay() {
    this.currentDay++;
    if (this.currentDay > this.DAYS_PER_SEASON) {
      this.currentDay = 1;
      this.currentSeason = (this.currentSeason + 1) % this.SEASONS.length;
    }
  }

  /**
   * Start a new day at 9am (called after sleeping)
   */
  startNewDay() {
    this.advanceDay();
    this.currentTime = this.START_HOUR * this.MINUTES_PER_HOUR;
    this.isSleepy = false;
    this.hasShownSleepyWarning = false;

    // Stop player sleepy effect
    if (this.scene.player) {
      this.scene.player.stopSleepyEffect();
    }

    // Stop clock pulse
    if (this.scene.clockWidget) {
      this.scene.clockWidget.stopPulse();
    }

    // Update tint immediately
    this.updateTintOverlay();
  }

  /**
   * Update the system each frame
   */
  update(delta) {
    if (this.isPaused || this.scene.isGameOver) return;

    // Advance time
    const deltaSeconds = delta / 1000;
    this.currentTime += deltaSeconds * this.GAME_MINUTES_PER_SECOND;

    // Wrap around midnight
    if (this.currentTime >= this.HOURS_PER_DAY * this.MINUTES_PER_HOUR) {
      this.currentTime -= this.HOURS_PER_DAY * this.MINUTES_PER_HOUR;
    }

    // Check for sleepy warning
    const hour = this.getHour();
    if (hour >= 4 && hour < 6 && !this.isSleepy) {
      this.triggerSleepyWarning();
    } else if (hour >= 6 && hour < 9 && this.isSleepy) {
      this.triggerPassOut();
    } else if (hour >= 9 && hour < 17) {
      // Reset sleepy state during day
      this.isSleepy = false;
      this.hasShownSleepyWarning = false;
    }

    // Update tint
    this.updateTintOverlay();
  }

  /**
   * Trigger the sleepy warning
   */
  triggerSleepyWarning() {
    this.isSleepy = true;

    if (!this.hasShownSleepyWarning) {
      this.hasShownSleepyWarning = true;

      // Show notification
      if (this.scene.hud) {
        this.scene.hud.showNotification("You're getting sleepy...", 3000);
      }

      // Start zzz effect on player
      if (this.scene.player) {
        this.scene.player.startSleepyEffect();
      }

      // Notify clock widget to pulse
      if (this.scene.clockWidget) {
        this.scene.clockWidget.startPulse();
      }
    }
  }

  /**
   * Trigger pass out - behavior depends on player location
   */
  triggerPassOut() {
    if (this.scene.isGameOver || this.scene.isSleeping) return;

    const playerLocation = this.getPlayerLocation();

    if (playerLocation === 'street') {
      // Game over - found in the street
      this.scene.triggerPassOutGameOver();
    } else if (playerLocation === 'home') {
      // Fitful sleep at home (not in bed)
      this.scene.triggerFitfulSleep();
    }
    // If in bed, they would have used "Go to Bed" action
  }

  /**
   * Check where the player currently is
   * Returns: 'street', 'home', or 'other_building'
   */
  getPlayerLocation() {
    if (!this.scene.player?.sprite || !this.scene.townGenerator) {
      return 'street';
    }

    const playerX = this.scene.player.sprite.x;
    const playerY = this.scene.player.sprite.y;
    const tileSize = this.scene.tileSize;
    const tileX = Math.floor(playerX / tileSize);
    const tileY = Math.floor(playerY / tileSize);

    const grid = this.scene.townData?.grid;
    if (!grid || !grid[tileX] || !grid[tileX][tileY]) {
      return 'street';
    }

    const cell = grid[tileX][tileY];
    const playerHome = this.scene.townGenerator.getPlayerHome();

    if (cell.buildingId && playerHome && cell.buildingId === playerHome.id) {
      return 'home';
    } else if (cell.buildingId) {
      return 'other_building';
    }

    return 'street';
  }

  /**
   * Pause time progression
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume time progression
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * Set time to a specific hour
   */
  setTime(hour, minute = 0) {
    this.currentTime = hour * this.MINUTES_PER_HOUR + minute;
  }

  /**
   * Get progress through the day (0-1, starting from 9am)
   */
  getDayProgress() {
    // Calculate minutes since 9am
    let minutesSince9am = this.currentTime - (9 * this.MINUTES_PER_HOUR);
    if (minutesSince9am < 0) {
      minutesSince9am += this.HOURS_PER_DAY * this.MINUTES_PER_HOUR;
    }
    return minutesSince9am / (this.HOURS_PER_DAY * this.MINUTES_PER_HOUR);
  }

  /**
   * Check if it's currently night
   */
  isNight() {
    const block = this.getCurrentTimeBlock();
    return block === 'NIGHT' || block === 'SLEEPY';
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.tintOverlay) {
      this.tintOverlay.destroy();
    }
  }
}
