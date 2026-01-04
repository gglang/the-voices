import Phaser from 'phaser';

/**
 * Circular clock widget showing time of day
 *
 * Time blocks (colored segments):
 * - 9am-5pm: Yellow (day)
 * - 5pm-7pm: Orange (sunset)
 * - 7pm-4am: Dark blue (night)
 * - 4am-6am: Red (sleepy warning)
 * - 6am-9am: Light blue (early morning/pass out zone)
 */
export class ClockWidget {
  constructor(scene, dayNightSystem) {
    this.scene = scene;
    this.dayNightSystem = dayNightSystem;

    // Widget configuration
    this.x = 50;
    this.y = 50;
    this.radius = 30;
    this.innerRadius = 15;

    // Colors for each time block
    this.BLOCK_COLORS = {
      DAY: 0xffdd44,       // Yellow
      SUNSET: 0xff8844,    // Orange
      NIGHT: 0x2a2a6a,     // Dark blue
      SLEEPY: 0xaa2222,    // Red
      PASSOUT: 0x6688aa    // Light blue (won't normally see this)
    };

    // Pulse state
    this.isPulsing = false;
    this.pulseGraphics = null;
    this.pulseAlpha = 0;
    this.pulseDirection = 1;

    // Create graphics
    this.container = scene.add.container(this.x, this.y);
    this.container.setScrollFactor(0);
    this.container.setDepth(1100);

    this.background = scene.add.graphics();
    this.clockFace = scene.add.graphics();
    this.hand = scene.add.graphics();
    this.timeText = scene.add.text(0, this.radius + 12, '', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Date text below time
    this.dateText = scene.add.text(0, this.radius + 24, '', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.container.add([this.background, this.clockFace, this.hand, this.timeText, this.dateText]);

    // Create pulse graphics (behind clock)
    this.pulseGraphics = scene.add.graphics();
    this.pulseGraphics.setScrollFactor(0);
    this.pulseGraphics.setDepth(1099);

    // Initial draw
    this.drawClockFace();
  }

  /**
   * Draw the static clock face with time block segments
   */
  drawClockFace() {
    this.clockFace.clear();
    this.background.clear();

    // Background circle
    this.background.fillStyle(0x000000, 0.7);
    this.background.fillCircle(0, 0, this.radius + 4);

    // Draw each time block as a pie segment
    // Angles: 12 o'clock = -90 degrees, clockwise
    // We map 24 hours to 360 degrees, starting from 12 o'clock

    const blocks = [
      { start: 9, end: 17, color: this.BLOCK_COLORS.DAY },      // 9am-5pm
      { start: 17, end: 19, color: this.BLOCK_COLORS.SUNSET },  // 5pm-7pm
      { start: 19, end: 28, color: this.BLOCK_COLORS.NIGHT },   // 7pm-4am (28 = 4am next day)
      { start: 28, end: 30, color: this.BLOCK_COLORS.SLEEPY },  // 4am-6am
      { start: 30, end: 33, color: this.BLOCK_COLORS.PASSOUT }  // 6am-9am (wraps to next 9am)
    ];

    for (const block of blocks) {
      this.drawPieSegment(block.start, block.end, block.color);
    }

    // Inner circle (dark center)
    this.clockFace.fillStyle(0x1a1a1a, 1);
    this.clockFace.fillCircle(0, 0, this.innerRadius);

    // Border
    this.clockFace.lineStyle(2, 0x444444, 1);
    this.clockFace.strokeCircle(0, 0, this.radius);

    // Hour markers
    this.clockFace.lineStyle(1, 0xffffff, 0.5);
    for (let h = 0; h < 24; h += 3) {
      const angle = this.hourToAngle(h);
      const innerX = Math.cos(angle) * (this.innerRadius + 2);
      const innerY = Math.sin(angle) * (this.innerRadius + 2);
      const outerX = Math.cos(angle) * (this.radius - 2);
      const outerY = Math.sin(angle) * (this.radius - 2);
      this.clockFace.lineBetween(innerX, innerY, outerX, outerY);
    }
  }

  /**
   * Draw a pie segment for a time block
   */
  drawPieSegment(startHour, endHour, color) {
    const startAngle = this.hourToAngle(startHour);
    const endAngle = this.hourToAngle(endHour);

    this.clockFace.fillStyle(color, 1);
    this.clockFace.slice(0, 0, this.radius, startAngle, endAngle, false);
    this.clockFace.fillPath();
  }

  /**
   * Convert hour to angle (radians)
   * 12 o'clock (noon/midnight) = -PI/2 (top)
   * Hours go clockwise
   */
  hourToAngle(hour) {
    // Normalize hour to 0-24 range
    hour = hour % 24;
    // Convert to angle: 0 hours = top (-PI/2), clockwise
    return ((hour / 24) * Math.PI * 2) - Math.PI / 2;
  }

  /**
   * Update the clock hand and time display
   */
  update() {
    if (!this.dayNightSystem) return;

    // Get current time
    const hour = this.dayNightSystem.getHour();
    const minute = this.dayNightSystem.getMinute();
    const timeString = this.dayNightSystem.getTimeString();
    const dateString = this.dayNightSystem.getDateString();

    // Update time and date text
    this.timeText.setText(timeString);
    this.dateText.setText(dateString);

    // Draw hand
    this.hand.clear();

    const currentHour = hour + minute / 60;
    const angle = this.hourToAngle(currentHour);

    // Hand
    this.hand.lineStyle(3, 0xff0000, 1);
    this.hand.lineBetween(0, 0, Math.cos(angle) * (this.radius - 5), Math.sin(angle) * (this.radius - 5));

    // Center dot
    this.hand.fillStyle(0xff0000, 1);
    this.hand.fillCircle(0, 0, 3);

    // Update pulse effect if active
    if (this.isPulsing) {
      this.updatePulse();
    }
  }

  /**
   * Start the red pulse effect (when sleepy)
   */
  startPulse() {
    this.isPulsing = true;
    this.pulseAlpha = 0;
    this.pulseDirection = 1;
  }

  /**
   * Stop the pulse effect
   */
  stopPulse() {
    this.isPulsing = false;
    this.pulseGraphics.clear();
  }

  /**
   * Update the pulse animation
   */
  updatePulse() {
    // Animate pulse alpha
    this.pulseAlpha += this.pulseDirection * 0.03;

    if (this.pulseAlpha >= 0.6) {
      this.pulseDirection = -1;
    } else if (this.pulseAlpha <= 0) {
      this.pulseDirection = 1;
    }

    // Draw pulse circle
    this.pulseGraphics.clear();
    this.pulseGraphics.fillStyle(0xff0000, this.pulseAlpha);
    this.pulseGraphics.fillCircle(this.x, this.y, this.radius + 10);
  }

  /**
   * Register with HUD camera system
   */
  registerWithHUD(hud) {
    if (hud) {
      // Make main camera ignore clock
      this.scene.cameras.main.ignore([
        this.container,
        this.pulseGraphics
      ]);
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.container.destroy();
    this.pulseGraphics.destroy();
  }
}
