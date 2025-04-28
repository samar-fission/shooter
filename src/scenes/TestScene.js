import Phaser from 'phaser';

export default class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' });
  }

  create() {
    console.log('TestScene create called');
    
    // Create a simple rectangle
    const rect = this.add.rectangle(400, 300, 100, 100, 0xff0000);
    console.log('Rectangle created:', rect);

    // Add some text
    const text = this.add.text(400, 300, 'Test Scene', {
      fontSize: '32px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 10, y: 5 }
    });
    text.setOrigin(0.5);
    console.log('Text created:', text);
  }
} 