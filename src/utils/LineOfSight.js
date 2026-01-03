/**
 * Utility functions for line of sight calculations
 */
export class LineOfSight {
  /**
   * Check if there's a clear line of sight between two points
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @param {Phaser.Physics.Arcade.StaticGroup} walls - Wall group to check against
   * @returns {boolean} True if line of sight is clear
   */
  static hasLineOfSight(startX, startY, targetX, targetY, walls) {
    if (!walls) return true;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance / 8);

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = startX + dx * t;
      const checkY = startY + dy * t;

      if (this.isPointInWall(checkX, checkY, walls)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a point is inside any wall
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Phaser.Physics.Arcade.StaticGroup} walls - Wall group
   * @returns {boolean} True if point is in a wall
   */
  static isPointInWall(x, y, walls) {
    if (!walls) return false;

    let inWall = false;
    walls.children.iterate(wall => {
      if (!wall) return;
      const dx = Math.abs(wall.x - x);
      const dy = Math.abs(wall.y - y);
      if (dx < 16 && dy < 16) {
        inWall = true;
      }
    });
    return inWall;
  }

  /**
   * Calculate distance between two points
   */
  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}