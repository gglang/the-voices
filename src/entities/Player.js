export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 80;
    this.canControl = true;

    // Create the player sprite with physics
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(false);
    this.sprite.body.setSize(12, 12);
    this.sprite.body.setOffset(2, 4);

    // Set up keyboard input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Spacebar for killing
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', () => this.tryKill());

    // Set up collision with walls after they're created
    scene.events.once('update', () => {
      if (scene.walls) {
        scene.physics.add.collider(this.sprite, scene.walls);
      }
    });
  }

  tryKill() {
    if (!this.canControl || this.scene.isGameOver) return;

    const killRange = 16; // 1 tile
    let nearestTarget = null;
    let nearestDistance = killRange;

    // Check humans
    if (this.scene.humans) {
      this.scene.humans.forEach(human => {
        if (!human.isAlive) return;
        const dx = human.sprite.x - this.sprite.x;
        const dy = human.sprite.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestTarget = human;
        }
      });
    }

    // Check police
    if (this.scene.police) {
      this.scene.police.forEach(cop => {
        if (!cop.isAlive) return;
        const dx = cop.sprite.x - this.sprite.x;
        const dy = cop.sprite.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestTarget = cop;
        }
      });
    }

    // Kill the nearest target
    if (nearestTarget) {
      nearestTarget.kill();

      // Check if it's a human and matches target preference
      if (nearestTarget.hairColor !== undefined) {
        // It's a human
        if (nearestTarget.hairColor === this.scene.targetHairColor &&
            nearestTarget.skinColor === this.scene.targetSkinColor) {
          this.scene.addScore(1);
        }
      }
    }
  }

  update() {
    if (!this.canControl) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    const velocity = { x: 0, y: 0 };

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      velocity.x = -this.speed;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      velocity.x = this.speed;
    }

    // Vertical movement
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      velocity.y = -this.speed;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      velocity.y = this.speed;
    }

    // Normalize diagonal movement
    if (velocity.x !== 0 && velocity.y !== 0) {
      velocity.x *= 0.707;
      velocity.y *= 0.707;
    }

    this.sprite.setVelocity(velocity.x, velocity.y);
  }

  disableControl() {
    this.canControl = false;
    this.sprite.setVelocity(0, 0);
  }
}
