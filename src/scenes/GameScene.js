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
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  getScaleFactor() {
    const baseScale = Math.min(this.cameras.main.width / 800, this.cameras.main.height / 600);
    return this.isMobile ? 2.2 * baseScale : 1.6 * baseScale;
  }

  init() {
    console.log('GameScene init');
  }

  preload() {
    console.log('GameScene preload');
    this.load.image('player', 'assets/images/player.svg');
    this.load.image('enemy', 'assets/images/enemy.svg');
    this.load.image('bullet', 'assets/images/bullet.svg');
    
    // Load backgrounds
    this.load.image('space-bg', 'assets/images/backgrounds/space.svg');
    this.load.image('desert-bg', 'assets/images/backgrounds/desert.svg');
    this.load.image('snow-bg', 'assets/images/backgrounds/snow.svg');
    this.load.image('ocean-bg', 'assets/images/backgrounds/ocean.svg');
    this.load.image('jungle-bg', 'assets/images/backgrounds/jungle.svg');
    this.load.image('city-bg', 'assets/images/backgrounds/city.svg');
  }

  create() {
    console.log('GameScene create');
    
    // Initialize game state from local storage first
    this.level = parseInt(localStorage.getItem('currentLevel')) || 1;
    this.totalScore = parseInt(localStorage.getItem('totalScore')) || 0;
    this.highestScore = parseInt(localStorage.getItem('highestScore')) || 0;
    this.levelScores = JSON.parse(localStorage.getItem('levelScores')) || {};
    this.currentLevelScore = 0;
    
    // Set up background based on level
    this.setBackground();
    
    // Create player with adjusted scale
    const scale = this.getScaleFactor();
    const playerY = this.isMobile ? this.cameras.main.height - 200 : this.cameras.main.height - 50;
    this.player = this.physics.add.sprite(this.cameras.main.width / 2, playerY, 'player');
    this.player.setScale(scale);
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.setDamping(false);
    this.player.setDrag(0);
    this.player.setMaxVelocity(300);
    this.player.body.setSize(50 * scale, 60 * scale);
    this.player.body.setOffset(25 * scale, 20 * scale);
    this.player.body.setGravityY(0);
    this.player.setDepth(1000);
    this.player.setPipeline('TextureTintPipeline');

    // Set world bounds to match camera
    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Add resize handler
    this.scale.on('resize', this.handleResize, this);

    // Create bullet group with precise hit boxes and larger pool
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: 'bullet',
      maxSize: 150,
      createCallback: (bullet) => {
        const scale = this.getScaleFactor();
        bullet.body.setSize(8 * scale, 16 * scale);
        bullet.body.setOffset(1 * scale, 2 * scale);
        bullet.body.setBounce(0);
        bullet.body.setCollideWorldBounds(false);
        bullet.setDepth(999);
        bullet.setPipeline('TextureTintPipeline');
        bullet.setScale(0.8 * scale);
      }
    });

    // Create enemy group with precise hit boxes
    this.enemies = this.physics.add.group({
      createCallback: (enemy) => {
        const scale = this.getScaleFactor();
        enemy.body.setSize(30 * scale, 30 * scale);
        enemy.body.setOffset(5 * scale, 10 * scale);
        enemy.body.setImmovable(true);
        enemy.body.setBounce(0);
        enemy.body.setCollideWorldBounds(false);
        enemy.setDepth(998);
        enemy.setPipeline('TextureTintPipeline');
        enemy.setScale(scale);
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
    const initialScale = this.isMobile ? 0.5625 : this.getScaleFactor() * 0.5;
    this.debugText = this.add.text(16, 16, '', {
      fontSize: '24px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      stroke: '#000000',
      strokeThickness: 2
    });
    this.debugText.setScrollFactor(0);
    this.debugText.setDepth(1001);
    this.debugText.setScale(initialScale);

    // Initialize game state
    this.gameStarted = true;
    this.enemiesKilled = 0;
    this.bulletsUsed = 0;
    this.score = 0;
    this.levelTransition = false;
    
    // If we're loading a saved level, show the level transition popup
    if (this.level > 1) {
      this.showLevelTransition();
    } else {
      // Start the wave only if it's a new game
      this.startWave();
    }

    // Add mobile touch controls
    if (this.isMobile) {
      // Create joystick base (visual indicator)
      const joystickBase = this.add.circle(
        80,
        this.cameras.main.height - 100,
        60,
        0x000000,
        0.3
      );
      joystickBase.setScrollFactor(0);
      joystickBase.setDepth(900);
      
      // Create joystick handle
      const joystickHandle = this.add.circle(
        80,
        this.cameras.main.height - 100,
        30,
        0xffffff,
        0.5
      );
      joystickHandle.setScrollFactor(0);
      joystickHandle.setDepth(901);
      
      // Create bullet button
      const bulletButton = this.add.circle(
        this.cameras.main.width - 100,
        this.cameras.main.height - 100,
        50,
        0x000000,
        0.3
      );
      bulletButton.setScrollFactor(0);
      bulletButton.setDepth(900);
      
      // Add bullet icon/text
      const bulletText = this.add.text(
        this.cameras.main.width - 100,
        this.cameras.main.height - 100,
        'FIRE',
        {
          fontSize: '20px',
          fill: '#ffffff',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
      bulletText.setScrollFactor(0);
      bulletText.setDepth(901);
      
      // Make controls interactive
      joystickBase.setInteractive();
      joystickHandle.setInteractive();
      bulletButton.setInteractive();
      bulletText.setInteractive();
      
      // Track touch state
      let isTouchingJoystick = false;
      let isTouchingFire = false;
      let joystickTouchId = null;
      let fireTouchId = null;
      const maxDistance = 50;  // Movement range
      const baseSpeed = 300;   // Movement speed
      const centerX = 80;      // Joystick center X
      const centerY = this.cameras.main.height - 100;  // Joystick center Y
      
      // Handle touch start
      this.input.on('pointerdown', (pointer) => {
        // Check if touch is on bullet button
        const isOnFireButton = pointer.x > this.cameras.main.width / 2;
        const isOnJoystick = pointer.x < this.cameras.main.width / 2;
        
        if (isOnFireButton && !isTouchingFire) {
          isTouchingFire = true;
          fireTouchId = pointer.id;
          if (this.gameStarted && !this.levelTransition) {
            this.shoot();
          }
        }
        
        if (isOnJoystick && !isTouchingJoystick) {
          isTouchingJoystick = true;
          joystickTouchId = pointer.id;
          updateJoystickPosition(pointer);
        }
      });
      
      // Handle touch move
      this.input.on('pointermove', (pointer) => {
        if (isTouchingJoystick && pointer.id === joystickTouchId) {
          updateJoystickPosition(pointer);
        }
      });
      
      // Handle touch end
      this.input.on('pointerup', (pointer) => {
        if (isTouchingJoystick && pointer.id === joystickTouchId) {
          isTouchingJoystick = false;
          joystickTouchId = null;
          
          // Reset joystick
          this.tweens.add({
            targets: joystickHandle,
            x: centerX,
            y: centerY,
            duration: 150,
            ease: 'Quad.easeOut'
          });
          
          // Stop player
          this.player.setVelocityX(0);
        }
        
        if (isTouchingFire && pointer.id === fireTouchId) {
          isTouchingFire = false;
          fireTouchId = null;
        }
      });
      
      // Function to update joystick position and player movement
      const updateJoystickPosition = (pointer) => {
        if (!isTouchingJoystick) return;
        
        // Calculate distance from center
        const dx = pointer.x - centerX;
        const dy = pointer.y - centerY;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
        
        // Calculate angle
        const angle = Math.atan2(dy, dx);
        
        // Update joystick handle position
        joystickHandle.x = centerX + (Math.cos(angle) * distance);
        joystickHandle.y = centerY + (Math.sin(angle) * distance);
        
        // Calculate velocity based on distance from center
        const normalizedDistance = distance / maxDistance;
        const velocity = baseSpeed * normalizedDistance;
        
        // Update player velocity
        if (this.gameStarted && !this.levelTransition) {
          this.player.setVelocityX(Math.cos(angle) * velocity);
        }
      };
      
      // Add button hover effects
      bulletButton.on('pointerover', () => {
        bulletButton.setFillStyle(0x000000, 0.5);
        bulletText.setStyle({ fill: '#ffff00' });
      });
      
      bulletButton.on('pointerout', () => {
        bulletButton.setFillStyle(0x000000, 0.3);
        bulletText.setStyle({ fill: '#ffffff' });
      });

      // Add touch events for bullet button
      bulletButton.on('pointerdown', () => {
        if (this.gameStarted && !this.levelTransition) {
          this.shoot();
        }
      });
      
      bulletText.on('pointerdown', () => {
        if (this.gameStarted && !this.levelTransition) {
          this.shoot();
        }
      });
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
    this.background = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, this.currentBackground);
    this.background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
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
    
    // Create overlay with proper scaling
    const overlay = this.add.rectangle(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2, 
      this.cameras.main.width, 
      this.cameras.main.height, 
      0x000000, 
      0.5
    );
    overlay.setScrollFactor(0);
    overlay.setDepth(1000);
    
    // Create level completion text with proper scaling
    const scale = this.getScaleFactor();
    const popupYOffset = this.isMobile ? 150 : 0; // Move up on mobile
    this.levelTransitionText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2.9 - popupYOffset, `Level ${currentLevel} Completed!`, {
      fontSize: `${20 * scale}px`,
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3 * scale,
    }).setOrigin(0.5);
    this.levelTransitionText.setDepth(1003);
    
    // Show next level details with proper scaling
    const nextLevelText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2.45 - popupYOffset, 
      `Next Level ${nextLevel}`,
      {
        fontSize: `${18 * scale}px`,
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1.5 * scale
      }
    ).setOrigin(0.5);
    nextLevelText.setDepth(1003);

    // Create stats container with proper scaling
    const statsContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2.1 - popupYOffset);
    statsContainer.setDepth(1003);

    const stats = [
      { label: 'Enemies', value: nextEnemies },
      { label: 'Bullets', value: nextBullets },
      { label: 'Required Kills', value: requiredKills },
      { label: 'Current Score', value: this.totalScore },
      { label: 'Highest Score', value: this.highestScore }
    ];

    stats.forEach((stat, index) => {
      const y = index * 30 * scale;
      
      // Create stat background with proper scaling
      const statBg = this.add.rectangle(0, y, 300 * scale, 25 * scale, 0x4a4a4a, 0.5);
      statBg.setOrigin(0.5);
      statBg.setDepth(1003);
      
      const label = this.add.text(-130 * scale, y, stat.label + ':', {
        fontSize: `${14 * scale}px`,
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      label.setDepth(1004);
      
      const value = this.add.text(130 * scale, y, stat.value.toString(), {
        fontSize: `${14 * scale}px`,
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);
      value.setDepth(1004);
      
      statsContainer.add([statBg, label, value]);
    });

    // Create continue button with proper scaling
    const buttonWidth = 160 * scale;
    const buttonHeight = 35 * scale;
    const buttonX = this.cameras.main.width / 2;
    const buttonY = this.cameras.main.height/1.3 - popupYOffset;
    
    const continueButtonBg = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x4a4a4a);
    continueButtonBg.setStrokeStyle(1.2 * scale, 0xffffff);
    continueButtonBg.setDepth(1003);
    
    const continueButtonText = this.add.text(buttonX, buttonY, 'CONTINUE', {
      fontSize: `${18 * scale}px`,
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    continueButtonText.setDepth(1004);

    // Create start from beginning button with proper scaling
    const restartButtonWidth = 300 * scale;
    const restartButtonBg = this.add.rectangle(buttonX, buttonY + 55 * scale, restartButtonWidth, buttonHeight, 0x4a4a4a);
    restartButtonBg.setStrokeStyle(1.2 * scale, 0xffffff);
    restartButtonBg.setDepth(1003);
    
    const restartButtonText = this.add.text(buttonX, buttonY + 55 * scale, 'START FROM BEGINNING', {
      fontSize: `${18 * scale}px`,
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
      // Set levelTransition to false first
      this.levelTransition = false;
      
      // Destroy all elements
      overlay.destroy();
      this.levelTransitionText.destroy();
      nextLevelText.destroy();
      statsContainer.destroy();
      continueButtonBg.destroy();
      continueButtonText.destroy();
      restartButtonBg.destroy();
      restartButtonText.destroy();
      
      // Start the next wave
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
    
    // Create semi-transparent overlay with proper scaling
    const overlay = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5);
    overlay.setScrollFactor(0);
    overlay.setDepth(1000);
    
    // Create failure text with proper scaling
    const scale = this.getScaleFactor();
    const popupYOffset = this.isMobile ? 150 : 0; // Move up on mobile
    const failureText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2.9 - popupYOffset, 'Level Failed!', {
      fontSize: `${20 * scale}px`,
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3 * scale,
    }).setOrigin(0.5);
    failureText.setDepth(1003);
    
    // Show kills made with proper scaling
    const killsText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2.45 - popupYOffset, 
      `Kills Made: ${this.enemiesKilled}/${Math.floor(this.enemiesPerWave * 0.9)}`,
      {
        fontSize: `${18 * scale}px`,
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1.5 * scale
      }
    ).setOrigin(0.5);
    killsText.setDepth(1003);

    // Create stats container with proper scaling
    const statsContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2.1 - popupYOffset);
    statsContainer.setDepth(1003);

    const stats = [
      { label: 'Enemies', value: this.enemiesPerWave },
      { label: 'Bullets Used', value: this.bulletsUsed },
      { label: 'Required Kills', value: Math.floor(this.enemiesPerWave * 0.9) },
      { label: 'Current Score', value: this.totalScore },
      { label: 'Highest Score', value: this.highestScore }
    ];

    stats.forEach((stat, index) => {
      const y = index * 30 * scale;
      
      // Create stat background with proper scaling
      const statBg = this.add.rectangle(0, y, 300 * scale, 25 * scale, 0x4a4a4a, 0.5);
      statBg.setOrigin(0.5);
      statBg.setDepth(1003);
      
      const label = this.add.text(-130 * scale, y, stat.label + ':', {
        fontSize: `${14 * scale}px`,
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      label.setDepth(1004);
      
      const value = this.add.text(130 * scale, y, stat.value.toString(), {
        fontSize: `${14 * scale}px`,
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);
      value.setDepth(1004);
      
      statsContainer.add([statBg, label, value]);
    });

    // Create restart button with proper scaling
    const buttonWidth = 160 * scale;
    const buttonHeight = 35 * scale;
    const buttonX = this.cameras.main.width / 2;
    const buttonY = this.cameras.main.height/1.3 - popupYOffset;
    
    const restartButtonBg = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x4a4a4a);
    restartButtonBg.setStrokeStyle(1.2 * scale, 0xffffff);
    restartButtonBg.setDepth(1003);
    
    const restartButtonText = this.add.text(buttonX, buttonY, 'RESTART', {
      fontSize: `${18 * scale}px`,
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    restartButtonText.setDepth(1004);

    // Create start from beginning button with proper scaling
    const startFromBeginningButtonWidth = 300 * scale;
    const startFromBeginningButtonBg = this.add.rectangle(buttonX, buttonY + 55 * scale, startFromBeginningButtonWidth, buttonHeight, 0x4a4a4a);
    startFromBeginningButtonBg.setStrokeStyle(1.2 * scale, 0xffffff);
    startFromBeginningButtonBg.setDepth(1003);
    
    const startFromBeginningButtonText = this.add.text(buttonX, buttonY + 55 * scale, 'START FROM BEGINNING', {
      fontSize: `${18 * scale}px`,
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
      // Set levelTransition to false first
      this.levelTransition = false;
      
      // Destroy all elements
      overlay.destroy();
      failureText.destroy();
      killsText.destroy();
      statsContainer.destroy();
      restartButtonBg.destroy();
      restartButtonText.destroy();
      startFromBeginningButtonBg.destroy();
      startFromBeginningButtonText.destroy();
      
      // Start the wave
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
    const targetY = this.isMobile ? this.cameras.main.height - 200 : this.cameras.main.height - 50;
    const targetX = Phaser.Math.Clamp(this.player.x, 25, this.cameras.main.width - 25);
    
    this.player.y = targetY;
    this.player.x = targetX;

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

    // Check if wave is complete (90% requirement for desktop, 80% for mobile)
    const requiredKillsPercentage = this.isMobile ? 0.8 : 0.9;
    const requiredKills = Math.floor(this.enemiesPerWave * requiredKillsPercentage);
    
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
    if (this.time.now < this.lastFired) return; // Add fire rate check

    const bullet = this.bullets.get();
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setPosition(this.player.x, this.player.y - 20);
      bullet.setScale(0.8);
      bullet.setTint(this.bulletColors[this.currentBackground]);
      bullet.setVelocityY(-400);
      this.bulletsUsed++; // Increment immediately when firing
      this.lastFired = this.time.now + this.fireRate; // Update last fired time
    }
  }

  startWave() {
    if (this.levelTransition) {
      console.log('Cannot start wave during level transition');
      return;
    }
    
    console.log('Starting wave');
    this.gameStarted = true;
    this.enemiesKilled = 0;
    this.totalEnemiesCreated = 0;
    this.bulletsUsed = 0;
    this.currentLevelScore = 0;
    this.lastFired = 0; // Reset last fired time
    
    // Clear any existing bullets and enemies
    this.bullets.clear(true, true);
    this.enemies.clear(true, true);
    
    // Calculate level-specific values
    const baseEnemies = 25;
    const enemiesPerLevel = 5;
    const baseSpeed = 100;
    const speedIncrease = 20;
    
    // Calculate wave properties based on level
    this.enemiesPerWave = baseEnemies + (this.level - 1) * enemiesPerLevel;
    // Apply slower speed for mobile
    const speedMultiplier = this.isMobile ? 0.7 : 1; // 20% slower on mobile
    this.enemySpeed = (baseSpeed + (this.level - 1) * speedIncrease) * speedMultiplier;
    
    // Calculate bullet percentage (starts at 130%, increases to 160%)
    const bulletPercentage = Math.min(160, 130 + (this.level - 1) * 1);
    // Add 10% more bullets for mobile
    const mobileBonus = this.isMobile ? 1.1 : 1;
    this.maxBullets = Math.floor(this.enemiesPerWave * (bulletPercentage / 100) * mobileBonus);
    
    // Log bullet count for debugging
    console.log(`Starting wave with ${this.maxBullets} bullets available (${this.isMobile ? 'mobile bonus applied' : 'desktop'})`);
    
    // Less aggressive wave area narrowing
    const narrowingFactor = 0.95
    const center = 400;
    const width = 400 * narrowingFactor;
    this.waveArea.left = center - width / 2;
    this.waveArea.right = center + width / 2;

    // Spawn enemies with adjusted scale and random colors
    for (let i = 0; i < this.enemiesPerWave; i++) {
      this.time.delayedCall(i * 500, () => {
        let x;
        if (this.isMobile) {
          // On mobile, spawn between 25% and 75% of screen width
          const minX = this.cameras.main.width * 0.25;
          const maxX = this.cameras.main.width * 0.75;
          x = Phaser.Math.Between(minX, maxX);
        } else {
          // On desktop, use the original wave area
          x = Phaser.Math.Between(this.waveArea.left, this.waveArea.right);
        }
        
        const enemy = this.enemies.create(x, -50, 'enemy');
        if (enemy) {
          const scale = this.getScaleFactor();
          enemy.setScale(scale);
          enemy.setVelocityY(this.enemySpeed);
          enemy.body.setSize(30 * scale, 30 * scale);
          enemy.body.setOffset(5 * scale, 10 * scale);
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
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Game Completed!', {
      fontSize: '64px',
      fill: '#00ff00'
    }).setOrigin(0.5);
  }

  handleResize(gameSize) {
    if (this.background) {
      this.background.setPosition(gameSize.width / 2, gameSize.height / 2);
      this.background.setDisplaySize(gameSize.width, gameSize.height);
    }
    
    if (this.player) {
      const scale = this.getScaleFactor();
      const playerY = this.isMobile ? this.cameras.main.height - 200 : this.cameras.main.height - 50;
      this.player.setPosition(gameSize.width / 2, playerY);
      this.player.setScale(scale);
      this.player.body.setSize(50 * scale, 60 * scale);
      this.player.body.setOffset(25 * scale, 20 * scale);
    }
    
    // Scale all bullets
    this.bullets.getChildren().forEach(bullet => {
      const scale = this.getScaleFactor();
      bullet.setScale(0.8 * scale);
      bullet.body.setSize(8 * scale, 16 * scale);
      bullet.body.setOffset(1 * scale, 2 * scale);
    });
    
    // Scale all enemies
    this.enemies.getChildren().forEach(enemy => {
      const scale = this.getScaleFactor();
      enemy.setScale(scale);
      enemy.body.setSize(30 * scale, 30 * scale);
      enemy.body.setOffset(5 * scale, 10 * scale);
    });
    
    if (this.debugText) {
      if (this.isMobile) {
        // On mobile, use fixed scale
        this.debugText.setScale(0.5625);
        this.debugText.setPosition(16, 16);
      } else {
        // On desktop, use the original scale factor
        const scale = this.getScaleFactor();
        this.debugText.setScale(scale * 0.5);
        this.debugText.setPosition(16 * scale, 16 * scale);
      }
    }
  }
}

export default GameScene; 