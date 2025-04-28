import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.player = null;
    this.cursors = null;
    this.bullets = null;
    this.enemies = null;
    this.score = 0;
    this.level = parseInt(localStorage.getItem('currentLevel')) || 1;
    this.maxLevel = 20;
    this.enemiesKilled = 0;
    this.totalEnemiesCreated = 0;
    this.enemiesPerWave = 10;
    this.enemySpeed = 100;
    this.debugText = null;
    this.lastFired = 0;
    this.fireRate = 200;
    this.background = null;
    this.backgrounds = [
      'space-bg',
      'desert-bg',
      'snow-bg',
      'ocean-bg',
      'jungle-bg',
      'city-bg'
    ];
    this.bulletColors = {
      'space-bg': 0xffffff,    // White for space
      'desert-bg': 0x00ffff,   // Cyan for desert
      'snow-bg': 0xff0000,     // Red for snow
      'ocean-bg': 0xffff00,    // Yellow for ocean
      'jungle-bg': 0xff00ff,   // Magenta for jungle
      'city-bg': 0xff00ff      // Magenta for city
    };
    this.gameStarted = false;
    this.waveArea = {
      left: 200,
      right: 600
    };
    this.maxBullets = 0;
    this.bulletsUsed = 0;
    this.levelTransition = false;
    this.levelTransitionText = null;
    this.isPlayerShooting = false;
    
    // Initialize scores
    this.totalScore = parseInt(localStorage.getItem('totalScore')) || 0;
    this.highestScore = parseInt(localStorage.getItem('highestScore')) || 0;
    this.levelScores = JSON.parse(localStorage.getItem('levelScores')) || {};
    this.currentLevelScore = 0;
  }

  init() {
    console.log('GameScene init');
  }

  preload() {
    console.log('GameScene preload');
    this.load.image('player', '/src/assets/images/player.svg');
    this.load.image('enemy', '/src/assets/images/enemy.svg');
    this.load.image('bullet', '/src/assets/images/bullet.svg');
    
    // Load backgrounds
    this.load.image('space-bg', '/src/assets/images/backgrounds/space.svg');
    this.load.image('desert-bg', '/src/assets/images/backgrounds/desert.svg');
    this.load.image('snow-bg', '/src/assets/images/backgrounds/snow.svg');
    this.load.image('ocean-bg', '/src/assets/images/backgrounds/ocean.svg');
    this.load.image('jungle-bg', '/src/assets/images/backgrounds/jungle.svg');
    this.load.image('city-bg', '/src/assets/images/backgrounds/city.svg');
  }

  create() {
    console.log('GameScene create');
    
    // Set up background based on level
    this.setBackground();
    
    // Create player with adjusted scale
    this.player = this.physics.add.sprite(400, this.cameras.main.height - 100, 'player');
    this.player.setScale(1.8);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.player.setDamping(false);
    this.player.setDrag(0);
    this.player.setMaxVelocity(300);
    this.player.body.setSize(50, 60);
    this.player.body.setOffset(25, 20);
    this.player.body.setGravityY(0);
    this.player.setDepth(1000);
    this.player.setPipeline('TextureTintPipeline');

    // Create bullet group with precise hit boxes and larger pool
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: 'bullet',
      maxSize: 150, // Increased to handle maximum bullets at level 20
      createCallback: (bullet) => {
        bullet.body.setSize(8, 16);
        bullet.body.setOffset(1, 2);
        bullet.body.setBounce(0);
        bullet.body.setCollideWorldBounds(false);
        bullet.setDepth(999);
        bullet.setPipeline('TextureTintPipeline'); // Use a simpler pipeline
      }
    });

    // Create enemy group with precise hit boxes
    this.enemies = this.physics.add.group({
      createCallback: (enemy) => {
        enemy.body.setSize(30, 30);
        enemy.body.setOffset(5, 10);
        enemy.body.setImmovable(true);
        enemy.body.setBounce(0);
        enemy.body.setCollideWorldBounds(false);
        enemy.setDepth(998);
        enemy.setPipeline('TextureTintPipeline'); // Use a simpler pipeline
      }
    });
    
    // Set up collisions with precise hit boxes
    this.physics.add.collider(this.bullets, this.enemies, this.handleBulletEnemyCollision, null, this);
    this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // Set up controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on('pointerdown', this.shoot, this);

    // Add debug text with larger font and better visibility
    this.debugText = this.add.text(16, 16, '', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      stroke: '#000000',
      strokeThickness: 2
    });
    this.debugText.setScrollFactor(0);
    this.debugText.setDepth(1001);

    // Initialize game state
    this.gameStarted = false;
    this.enemiesKilled = 0;
    this.bulletsUsed = 0;
    this.score = 0;
    this.levelTransition = false;
    
    // If we're loading a saved level, show the level transition popup
    if (this.level > 1) {
      this.showLevelTransition();
    }
  }

  setBackground() {
    // Remove existing background if any
    if (this.background) {
      this.background.destroy();
    }

    // Randomly select a background
    const randomIndex = Phaser.Math.Between(0, this.backgrounds.length - 1);
    this.currentBackground = this.backgrounds[randomIndex];

    // Create new background
    this.background = this.add.image(400, this.cameras.main.height / 2, this.currentBackground);
    this.background.setDisplaySize(800, this.cameras.main.height);
    this.background.setScrollFactor(0);

    // Log the current background and bullet color for debugging
    console.log('Current background:', this.currentBackground);
    console.log('Bullet color:', this.bulletColors[this.currentBackground]);
  }

  showLevelTransition() {
    this.levelTransition = true;
    this.gameStarted = false;
    
    localStorage.setItem('currentLevel', this.level);
    
    const currentLevel = this.level - 1;
    const nextLevel = this.level;
    const baseEnemies = 25;
    const enemiesPerLevel = 5;
    const nextEnemies = baseEnemies + (nextLevel - 1) * enemiesPerLevel;
    const bulletPercentage = Math.min(150, 120 + (nextLevel - 1) * 1.5);
    const nextBullets = Math.floor(nextEnemies * (bulletPercentage / 100));
    const requiredKills = Math.floor(nextEnemies * 0.9);
    
    // Add current level score to total score
    this.totalScore += this.currentLevelScore;
    localStorage.setItem('totalScore', this.totalScore);
    
    // Update level scores
    this.levelScores[this.level] = this.currentLevelScore;
    localStorage.setItem('levelScores', JSON.stringify(this.levelScores));
    
    // Update highest score if needed
    if (this.totalScore > this.highestScore) {
      this.highestScore = this.totalScore;
      localStorage.setItem('highestScore', this.highestScore);
    }
    
    // Create semi-transparent overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.75);
    overlay.setDepth(1002);
    
    // Create level completion text
    this.levelTransitionText = this.add.text(400, 150, `Level ${currentLevel} Completed!`, {
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    this.levelTransitionText.setDepth(1003);
    
    // Create divider line
    const divider = this.add.rectangle(400, 200, 400, 2, 0xffffff, 1);
    divider.setDepth(1003);
    
    // Show next level details
    const nextLevelText = this.add.text(400, 250, 
      `Level ${nextLevel}`,
      {
        fontSize: '32px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    nextLevelText.setDepth(1003);

    // Create stats container
    const statsContainer = this.add.container(400, 320);
    statsContainer.setDepth(1003);

    const stats = [
      { label: 'Enemies', value: nextEnemies },
      { label: 'Bullets', value: nextBullets },
      { label: 'Required Kills', value: requiredKills },
      { label: 'Current Score', value: this.totalScore },
      { label: 'Highest Score', value: this.highestScore }
    ];

    stats.forEach((stat, index) => {
      const y = index * 45;
      
      // Create stat background
      const statBg = this.add.rectangle(0, y, 300, 35, 0x4a4a4a, 0.5);
      statBg.setOrigin(0.5);
      statBg.setDepth(1003);
      
      const label = this.add.text(-130, y, stat.label + ':', {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      label.setDepth(1004);
      
      const value = this.add.text(130, y, stat.value.toString(), {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);
      value.setDepth(1004);
      
      statsContainer.add([statBg, label, value]);
    });

    // Create continue button
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = 400;
    const buttonY = 550;
    
    const continueButtonBg = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x4a4a4a);
    continueButtonBg.setStrokeStyle(2, 0xffffff);
    continueButtonBg.setDepth(1003);
    
    const continueButtonText = this.add.text(buttonX, buttonY, 'CONTINUE', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    continueButtonText.setDepth(1004);

    // Create start from beginning button with larger width
    const restartButtonWidth = 300;
    const restartButtonBg = this.add.rectangle(buttonX, buttonY + 70, restartButtonWidth, buttonHeight, 0x4a4a4a);
    restartButtonBg.setStrokeStyle(2, 0xffffff);
    restartButtonBg.setDepth(1003);
    
    const restartButtonText = this.add.text(buttonX, buttonY + 70, 'START FROM BEGINNING', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    restartButtonText.setDepth(1004);

    // Make buttons interactive
    continueButtonBg.setInteractive();
    continueButtonText.setInteractive();
    restartButtonBg.setInteractive();
    restartButtonText.setInteractive();
    
    const buttonHover = (button, text) => {
      button.setFillStyle(0x666666);
      text.setStyle({ fill: '#ffff00' });
    };
    
    const buttonOut = (button, text) => {
      button.setFillStyle(0x4a4a4a);
      text.setStyle({ fill: '#ffffff' });
    };
    
    continueButtonBg.on('pointerover', () => buttonHover(continueButtonBg, continueButtonText));
    continueButtonBg.on('pointerout', () => buttonOut(continueButtonBg, continueButtonText));
    continueButtonText.on('pointerover', () => buttonHover(continueButtonBg, continueButtonText));
    continueButtonText.on('pointerout', () => buttonOut(continueButtonBg, continueButtonText));
    
    restartButtonBg.on('pointerover', () => buttonHover(restartButtonBg, restartButtonText));
    restartButtonBg.on('pointerout', () => buttonOut(restartButtonBg, restartButtonText));
    restartButtonText.on('pointerover', () => buttonHover(restartButtonBg, restartButtonText));
    restartButtonText.on('pointerout', () => buttonOut(restartButtonBg, restartButtonText));
    
    const startNextLevel = () => {
      overlay.destroy();
      this.levelTransitionText.destroy();
      divider.destroy();
      nextLevelText.destroy();
      statsContainer.destroy();
      continueButtonBg.destroy();
      continueButtonText.destroy();
      restartButtonBg.destroy();
      restartButtonText.destroy();
      this.levelTransition = false;
      this.startWave();
    };
    
    const restartFromBeginning = () => {
      this.level = 1;
      this.score = 0;
      this.totalScore = 0;
      this.currentLevelScore = 0;
      localStorage.setItem('currentLevel', 1);
      localStorage.setItem('totalScore', 0);
      this.levelScores = {};
      localStorage.setItem('levelScores', JSON.stringify({}));
      startNextLevel();
    };
    
    continueButtonBg.on('pointerdown', startNextLevel);
    continueButtonText.on('pointerdown', startNextLevel);
    restartButtonBg.on('pointerdown', restartFromBeginning);
    restartButtonText.on('pointerdown', restartFromBeginning);
  }

  showFailurePopup() {
    this.levelTransition = true;
    this.gameStarted = false;
    
    // Create semi-transparent overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.75);
    overlay.setDepth(1002);
    
    // Create failure text
    const failureText = this.add.text(400, 150, 'Level Failed!', {
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);
    failureText.setDepth(1003);
    
    // Create divider line
    const divider = this.add.rectangle(400, 200, 400, 2, 0xffffff, 1);
    divider.setDepth(1003);
    
    // Show kills made
    const killsText = this.add.text(400, 250, 
      `Kills Made: ${this.enemiesKilled}/${Math.floor(this.enemiesPerWave * 0.9)}`,
      {
        fontSize: '32px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    killsText.setDepth(1003);

    // Create stats container
    const statsContainer = this.add.container(400, 320);
    statsContainer.setDepth(1003);

    const stats = [
      { label: 'Enemies', value: this.enemiesPerWave },
      { label: 'Bullets Used', value: this.bulletsUsed },
      { label: 'Required Kills', value: Math.floor(this.enemiesPerWave * 0.9) },
      { label: 'Current Score', value: this.totalScore },
      { label: 'Highest Score', value: this.highestScore }
    ];

    stats.forEach((stat, index) => {
      const y = index * 45;
      
      // Create stat background
      const statBg = this.add.rectangle(0, y, 300, 35, 0x4a4a4a, 0.5);
      statBg.setOrigin(0.5);
      statBg.setDepth(1003);
      
      const label = this.add.text(-130, y, stat.label + ':', {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      label.setDepth(1004);
      
      const value = this.add.text(130, y, stat.value.toString(), {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);
      value.setDepth(1004);
      
      statsContainer.add([statBg, label, value]);
    });

    // Create restart button
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = 400;
    const buttonY = 550;
    
    const restartButtonBg = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x4a4a4a);
    restartButtonBg.setStrokeStyle(2, 0xffffff);
    restartButtonBg.setDepth(1003);
    
    const restartButtonText = this.add.text(buttonX, buttonY, 'RESTART', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    restartButtonText.setDepth(1004);

    // Create start from beginning button with larger width
    const startFromBeginningButtonWidth = 300;
    const startFromBeginningButtonBg = this.add.rectangle(buttonX, buttonY + 70, startFromBeginningButtonWidth, buttonHeight, 0x4a4a4a);
    startFromBeginningButtonBg.setStrokeStyle(2, 0xffffff);
    startFromBeginningButtonBg.setDepth(1003);
    
    const startFromBeginningButtonText = this.add.text(buttonX, buttonY + 70, 'START FROM BEGINNING', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    startFromBeginningButtonText.setDepth(1004);

    // Make buttons interactive
    restartButtonBg.setInteractive();
    restartButtonText.setInteractive();
    startFromBeginningButtonBg.setInteractive();
    startFromBeginningButtonText.setInteractive();
    
    const buttonHover = (button, text) => {
      button.setFillStyle(0x666666);
      text.setStyle({ fill: '#ffff00' });
    };
    
    const buttonOut = (button, text) => {
      button.setFillStyle(0x4a4a4a);
      text.setStyle({ fill: '#ffffff' });
    };
    
    restartButtonBg.on('pointerover', () => buttonHover(restartButtonBg, restartButtonText));
    restartButtonBg.on('pointerout', () => buttonOut(restartButtonBg, restartButtonText));
    restartButtonText.on('pointerover', () => buttonHover(restartButtonBg, restartButtonText));
    restartButtonText.on('pointerout', () => buttonOut(restartButtonBg, restartButtonText));
    
    startFromBeginningButtonBg.on('pointerover', () => buttonHover(startFromBeginningButtonBg, startFromBeginningButtonText));
    startFromBeginningButtonBg.on('pointerout', () => buttonOut(startFromBeginningButtonBg, startFromBeginningButtonText));
    startFromBeginningButtonText.on('pointerover', () => buttonHover(startFromBeginningButtonBg, startFromBeginningButtonText));
    startFromBeginningButtonText.on('pointerout', () => buttonOut(startFromBeginningButtonBg, startFromBeginningButtonText));
    
    const restartLevel = () => {
      overlay.destroy();
      failureText.destroy();
      divider.destroy();
      killsText.destroy();
      statsContainer.destroy();
      restartButtonBg.destroy();
      restartButtonText.destroy();
      startFromBeginningButtonBg.destroy();
      startFromBeginningButtonText.destroy();
      this.levelTransition = false;
      this.startWave();
    };
    
    const restartFromBeginning = () => {
      this.level = 1;
      this.score = 0;
      this.totalScore = 0;
      this.currentLevelScore = 0;
      localStorage.setItem('currentLevel', 1);
      localStorage.setItem('totalScore', 0);
      this.levelScores = {};
      localStorage.setItem('levelScores', JSON.stringify({}));
      restartLevel();
    };
    
    restartButtonBg.on('pointerdown', restartLevel);
    restartButtonText.on('pointerdown', restartLevel);
    startFromBeginningButtonBg.on('pointerdown', restartFromBeginning);
    startFromBeginningButtonText.on('pointerdown', restartFromBeginning);
  }

  update(time, delta) {
    if (!this.gameStarted || this.levelTransition) return;
    if (!this.player.active) return;

    // Player movement - only horizontal
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(300);
    } else {
      this.player.setVelocityX(0);
    }

    // Ensure player stays at the same Y position and within bounds
    // Use lerp for smoother movement
    const targetY = this.cameras.main.height - 100;
    const targetX = Phaser.Math.Clamp(this.player.x, 50, 750);
    
    this.player.y = Phaser.Math.Linear(this.player.y, targetY, 0.1);
    this.player.x = Phaser.Math.Linear(this.player.x, targetX, 0.1);

    // Spacebar shooting
    if (this.spacebar.isDown && this.time.now > this.lastFired) {
      this.shoot();
      this.lastFired = this.time.now + this.fireRate;
    }

    // Check for bullets that have gone off-screen
    this.bullets.getChildren().forEach(bullet => {
      if (bullet.y < -50) {
        bullet.destroy();
      }
    });

    // Check for enemies that have gone off-screen
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.y > this.cameras.main.height + 50) {
        enemy.destroy();
      }
    });

   //  Score is equal to toalscore + currentleevl score. the totoal score calcualtions at end of level will still
    // Update debug text
    this.debugText.setText([
      `Level: ${this.level}/${this.maxLevel}`,
      `Score: ${this.totalScore} + ${this.currentLevelScore}`,
      `Highest Score: ${this.highestScore}`,
      `Enemies: ${this.enemiesKilled}/${this.enemiesPerWave}`,
      `Required Kills: ${Math.floor(this.enemiesPerWave * 0.9)}`,
      `Bullets: ${this.bulletsUsed}/${this.maxBullets}`
    ]);

    // Check if wave is complete (90% requirement)
    const requiredKills = Math.floor(this.enemiesPerWave * 0.9);
    
    // Only check for level completion/failure if:
    // 1. All bullets are used AND no bullets are active on screen AND not enough kills
    // 2. OR all enemies are destroyed (either killed or passed screen)
    if ((this.enemies.countActive() === 0 && this.totalEnemiesCreated === this.enemiesPerWave) || 
        (this.bulletsUsed >= this.maxBullets && this.bullets.countActive() === 0)) {
        
        if (this.enemiesKilled >= requiredKills) {
            this.levelUp();
        } else {
            this.showFailurePopup();
        }
        return; // Stop further updates
    }
  }

  shoot() {
    if (!this.gameStarted || this.levelTransition || !this.player.active) return;
    if (this.bulletsUsed >= this.maxBullets) return;

    const bullet = this.bullets.get();
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setPosition(this.player.x, this.player.y - 20);
      bullet.setScale(0.8);
      bullet.setTint(this.bulletColors[this.currentBackground]);
      bullet.setVelocityY(-400);
      this.bulletsUsed++; // Increment immediately when firing
    }
  }

  startWave() {
    if (this.levelTransition) return;
    
    console.log('Starting wave');
    this.gameStarted = true;
    this.enemiesKilled = 0;
    this.totalEnemiesCreated = 0;
    this.bulletsUsed = 0;
    this.currentLevelScore = 0; // Reset current level score
    
    // Clear any existing bullets and enemies
    this.bullets.clear(true, true);
    this.enemies.clear(true, true);
    
    // Calculate level-specific values
    const baseEnemies = 25; // Changed from 10 to 25
    const enemiesPerLevel = 5;
    const baseSpeed = 100; // Back to 100
    const speedIncrease = 20;
    
    // Calculate wave properties based on level
    this.enemiesPerWave = baseEnemies + (this.level - 1) * enemiesPerLevel;
    this.enemySpeed = baseSpeed + (this.level - 1) * speedIncrease;
    
    // Calculate bullet percentage (starts at 130%, increases to 160%)
    const bulletPercentage = Math.min(160, 130 + (this.level - 1) * 1);
    this.maxBullets = Math.floor(this.enemiesPerWave * (bulletPercentage / 100));
    
    // Less aggressive wave area narrowing
    const narrowingFactor = Math.min(0.95, 0.7 + (this.level - 1) * 0.01);
    const center = 400;
    const width = 400 * narrowingFactor;
    this.waveArea.left = center - width / 2;
    this.waveArea.right = center + width / 2;

    // Spawn enemies with adjusted scale and random colors
    for (let i = 0; i < this.enemiesPerWave; i++) {
      this.time.delayedCall(i * 500, () => {
        const x = Phaser.Math.Between(this.waveArea.left, this.waveArea.right);
        const enemy = this.enemies.create(x, -50, 'enemy');
        if (enemy) {
          enemy.setScale(1.4);
          enemy.setVelocityY(this.enemySpeed);
          enemy.body.setSize(30, 30);
          enemy.body.setOffset(5, 10);
          enemy.body.setImmovable(true);
          enemy.body.setBounce(0);
          enemy.body.setCollideWorldBounds(false);
          enemy.health = 1;
          this.totalEnemiesCreated++;
          
          // Randomly set enemy color to red or yellow
          const isRed = Phaser.Math.Between(0, 1) === 0;
          enemy.setTint(isRed ? 0xff0000 : 0xffff00);
        }
      });
    }
  }

  levelUp() {
    if (this.level < this.maxLevel) {
      this.level++;
      this.setBackground();
      this.showLevelTransition();
    } else {
      this.gameCompleted();
    }
  }

  handleBulletEnemyCollision(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    
    bullet.destroy();
    enemy.destroy();
    
    this.enemiesKilled++;
    this.currentLevelScore += 10; // Add to current level score
    
    const requiredKills = Math.floor(this.enemiesPerWave * 0.9);
    if (this.enemies.countActive() === 0 && this.enemiesKilled >= requiredKills) {
      this.levelUp();
    }
  }

  handlePlayerEnemyCollision(player, enemy) {
    // Check if enemy is still active
    if (!enemy.active) return;
    
    // Immediately destroy enemy
    enemy.destroy();
  }

  gameCompleted() {
    this.player.setActive(false);
    this.player.setVisible(false);
    this.add.text(400, 300, 'Game Completed!', {
      fontSize: '64px',
      fill: '#00ff00'
    }).setOrigin(0.5);
  }
}

export default GameScene; 