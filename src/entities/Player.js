export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 80;

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

    // Set up collision with walls after they're created
    scene.events.once('update', () => {
      if (scene.walls) {
        scene.physics.add.collider(this.sprite, scene.walls);
      }
    });
  }

  update() {
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
}
