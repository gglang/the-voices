import Phaser from 'phaser';
import { RITUAL, DEPTH, EFFECTS } from '../config/constants.js';

/**
 * Manages satanic ritual sites and sacrifices
 */
export class RitualSystem {
  constructor(scene) {
    this.scene = scene;
    this.sites = [];
  }

  /**
   * Spawn ritual sites across the map
   */
  spawnSites(mapWidth, mapHeight, tileSize, walls) {
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;

    for (let i = 0; i < RITUAL.SITE_COUNT; i++) {
      const position = this.findValidPosition(
        mapWidth, mapHeight, tileSize, centerX, centerY, walls
      );

      if (position) {
        this.createSite(position.x, position.y);
      }
    }
  }

  /**
   * Find a valid position for a ritual site
   */
  findValidPosition(mapWidth, mapHeight, tileSize, centerX, centerY, walls) {
    const maxAttempts = 50;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const tileX = Phaser.Math.Between(10, mapWidth - 10);
      const tileY = Phaser.Math.Between(10, mapHeight - 10);

      // Check distance from center
      const distFromCenter = Math.sqrt(
        Math.pow(tileX - centerX, 2) + Math.pow(tileY - centerY, 2)
      );
      if (distFromCenter < RITUAL.MIN_DIST_FROM_CENTER) continue;

      const x = tileX * tileSize + 8;
      const y = tileY * tileSize + 8;

      // Check if not in a wall
      if (this.isPointInWall(x, y, walls)) continue;

      // Check distance from other sites
      if (this.isTooCloseToOtherSites(x, y)) continue;

      return { x, y };
    }

    return null;
  }

  /**
   * Check if point is inside a wall
   */
  isPointInWall(x, y, walls) {
    if (!walls) return false;

    let inWall = false;
    walls.children.iterate(wall => {
      if (!wall) return;
      if (Math.abs(wall.x - x) < 16 && Math.abs(wall.y - y) < 16) {
        inWall = true;
      }
    });
    return inWall;
  }

  /**
   * Check if position is too close to existing sites
   */
  isTooCloseToOtherSites(x, y) {
    for (const site of this.sites) {
      const dx = x - site.x;
      const dy = y - site.y;
      if (Math.sqrt(dx * dx + dy * dy) < RITUAL.MIN_DIST_BETWEEN_SITES) {
        return true;
      }
    }
    return false;
  }

  /**
   * Create a ritual site at position
   */
  createSite(x, y) {
    const sprite = this.scene.add.image(x, y, 'pentagram');
    sprite.setDepth(DEPTH.RITUAL_SITE);

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(sprite);
    }

    const siteData = {
      sprite,
      x,
      y,
      radius: RITUAL.ACTIVATION_RADIUS
    };

    this.sites.push(siteData);
    return siteData;
  }

  /**
   * Get ritual site at position (if any)
   */
  getSiteAt(x, y) {
    for (const site of this.sites) {
      const dx = x - site.x;
      const dy = y - site.y;
      if (Math.sqrt(dx * dx + dy * dy) <= site.radius) {
        return site;
      }
    }
    return null;
  }

  /**
   * Perform a sacrifice
   */
  performSacrifice(corpse, site, corpseManager) {
    // Dark fire explosion effect
    this.createDarkFireExplosion(site.x, site.y);

    // Player flashes dark purple
    this.scene.player.sprite.setTint(0x6a00a0);
    this.scene.time.delayedCall(300, () => {
      if (this.scene.player.sprite.active) {
        this.scene.player.sprite.clearTint();
      }
    });

    // Handle cop sacrifice - special effect
    if (corpse.isPolice) {
      this.performCopSacrifice(corpse, corpseManager);
      return;
    }

    // Check if preferred target
    const isPreferred = corpse.hairColor === this.scene.targetHairColor &&
                        corpse.skinColor === this.scene.targetSkinColor;

    const points = isPreferred ? RITUAL.SACRIFICE_POINTS_PREFERRED : RITUAL.SACRIFICE_POINTS_OTHER;

    // Destroy corpse
    corpseManager.destroy(corpse);

    // Add points
    this.scene.addScore(points);

    // Show notification
    if (isPreferred) {
      this.scene.hud?.showNotification('DARK SACRIFICE!\n+5 points', 2000);
    } else {
      this.scene.hud?.showNotification('Dark sacrifice...\n+1 point', 2000);
    }
  }

  /**
   * Sacrifice a cop corpse - transforms player and removes identification
   */
  performCopSacrifice(corpse, corpseManager) {
    // Destroy corpse
    corpseManager.destroy(corpse);

    // Transform player appearance
    this.scene.transformPlayerAppearance();

    // Remove identification
    this.scene.identificationSystem.reset();

    // Show notification
    this.scene.hud?.showNotification('COP SACRIFICE!\nIdentity cleansed!\nNew disguise acquired!', 3000);
  }

  /**
   * Create dark fire explosion effect
   */
  createDarkFireExplosion(x, y) {
    // Radial particles
    for (let i = 0; i < EFFECTS.SACRIFICE_PARTICLE_COUNT; i++) {
      const angle = (i / EFFECTS.SACRIFICE_PARTICLE_COUNT) * Math.PI * 2;
      const fire = this.scene.add.image(x, y, 'darkfire');
      fire.setDepth(DEPTH.EFFECTS);
      fire.setAlpha(0.9);

      if (this.scene.hud) {
        this.scene.hud.ignoreGameObject(fire);
      }

      const distance = Phaser.Math.Between(20, 40);
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: fire,
        x: targetX,
        y: targetY - 20,
        alpha: 0,
        scale: { from: 1.5, to: 0.3 },
        duration: 600,
        ease: 'Power2',
        onComplete: () => fire.destroy()
      });
    }

    // Central burst
    const centralFire = this.scene.add.image(x, y, 'darkfire');
    centralFire.setDepth(DEPTH.EFFECTS + 1);
    centralFire.setScale(2);

    if (this.scene.hud) {
      this.scene.hud.ignoreGameObject(centralFire);
    }

    this.scene.tweens.add({
      targets: centralFire,
      y: y - 30,
      alpha: 0,
      scale: 0.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => centralFire.destroy()
    });
  }

  /**
   * Get all sites
   */
  getAll() {
    return this.sites;
  }
}
