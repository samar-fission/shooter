const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create sounds directory if it doesn't exist
const soundsDir = path.join(__dirname, 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Function to generate a simple sound using sox
function generateSound(outputFile, type) {
  let command = 'sox -n ';
  
  switch (type) {
    case 'shoot':
      command += '-r 44100 -b 16 -c 1 ' + 
                'synth 0.1 square 1000 vol 0.5 ' +
                'fade h 0.01 0.05 0.01';
      break;
    case 'enemyDeath':
      command += '-r 44100 -b 16 -c 1 ' +
                'synth 0.2 square 500:800 vol 0.5 ' +
                'fade h 0.01 0.1 0.01';
      break;
    case 'bossSpawn':
      command += '-r 44100 -b 16 -c 1 ' +
                'synth 0.5 square 200:400 vol 0.5 ' +
                'fade h 0.01 0.2 0.01';
      break;
    case 'upgrade':
      command += '-r 44100 -b 16 -c 1 ' +
                'synth 0.3 square 800:1200 vol 0.5 ' +
                'fade h 0.01 0.1 0.01';
      break;
  }
  
  command += ' ' + outputFile;
  
  try {
    execSync(command);
    console.log(`Generated ${type} sound: ${outputFile}`);
  } catch (error) {
    console.error(`Error generating ${type} sound:`, error);
  }
}

// Generate all sounds
generateSound(path.join(soundsDir, 'shoot.mp3'), 'shoot');
generateSound(path.join(soundsDir, 'enemyDeath.mp3'), 'enemyDeath');
generateSound(path.join(soundsDir, 'bossSpawn.mp3'), 'bossSpawn');
generateSound(path.join(soundsDir, 'upgrade.mp3'), 'upgrade');

console.log('All sound effects generated successfully!'); 