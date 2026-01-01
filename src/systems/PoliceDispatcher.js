import Phaser from 'phaser';
import { POLICE } from '../config/constants.js';

/**
 * Manages police dispatch and respawning
 */
export class PoliceDispatcher {
  constructor(scene) {
    this.scene = scene;
    this.backupQueue = [];
  }

  /**
   * Queue backup cops after a body is confirmed by investigating officer
   */
  queueBackup(x, y, isPoliceBody = false) {
    const arrivalTime = this.scene.time.now + POLICE.BACKUP_DELAY;
    const batchId = Date.now() + Math.random();

    this.backupQueue.push({
      time: arrivalTime,
      x,
      y,
      batchId,
      isPoliceBody,
      notified: false
    });
  }

  /**
   * Alert nearby cops to investigate a disturbance
   */
  alertToDisturbance(x, y) {
    const availableCops = this.scene.police.filter(cop =>
      cop.isAlive && cop.state === 'wandering'
    );

    // Sort by distance
    availableCops.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.sprite.x - x, 2) + Math.pow(a.sprite.y - y, 2));
      const distB = Math.sqrt(Math.pow(b.sprite.x - x, 2) + Math.pow(b.sprite.y - y, 2));
      return distA - distB;
    });

    // Send up to 2 closest cops
    const copsToSend = Math.min(2, availableCops.length);
    for (let i = 0; i < copsToSend; i++) {
      availableCops[i].assignInvestigation(x, y);
    }

    this.scene.hud?.showNotification('Cops called to investigate disturbance', 3000);
  }

  /**
   * Process the backup queue
   */
  processQueue(currentTime) {
    const remaining = [];

    for (const entry of this.backupQueue) {
      if (currentTime >= entry.time) {
        // Spawn backup cops
        this.spawnBackup(entry);
      } else {
        remaining.push(entry);
      }
    }

    this.backupQueue = remaining;
  }

  /**
   * Spawn backup cops at location
   */
  spawnBackup(entry) {
    const bounds = this.scene.physics.world.bounds;

    for (let i = 0; i < POLICE.BACKUP_COUNT; i++) {
      const offsetX = Phaser.Math.Between(-50, 50);
      const offsetY = Phaser.Math.Between(-50, 50);
      const x = Phaser.Math.Clamp(entry.x + offsetX, bounds.x + 32, bounds.right - 32);
      const y = Phaser.Math.Clamp(entry.y + offsetY, bounds.y + 32, bounds.bottom - 32);
      this.scene.spawnSingleCop(x, y);
    }

    this.scene.hud?.showNotification('Backup has arrived!', 3000);
  }
}
