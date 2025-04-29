import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

function App() {
  const gameRef = useRef(null);
  const [gameState, setGameState] = useState('start');
  const [gameStarted, setGameStarted] = useState(false);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    console.log('Initializing game...');
    try {
      const handleResize = () => {
        if (gameRef.current && isMobile) {
          const width = window.innerWidth;
          const height = window.innerHeight;
          gameRef.current.scale.resize(width, height);
          gameRef.current.scale.setGameSize(width, height);
        }
      };

      const gameConfig = {
        type: Phaser.AUTO,
        width: isMobile ? window.innerWidth : 800,
        height: isMobile ? window.innerHeight : window.innerHeight,
        parent: 'game-container',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scene: GameScene,
        scale: {
          mode: isMobile ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          parent: 'game-container',
          width: isMobile ? window.innerWidth : 800,
          height: isMobile ? window.innerHeight : window.innerHeight,
          expandParent: true
        },
        backgroundColor: '#1a1a1a',
        autoStart: false
      };

      console.log('Creating Phaser game instance with config:', gameConfig);
      gameRef.current = new Phaser.Game(gameConfig);
      console.log('Phaser game instance created:', gameRef.current);

      // Handle window resize
      window.addEventListener('resize', handleResize);

      // Check for existing game data
      const currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
      const totalScore = parseInt(localStorage.getItem('totalScore')) || 0;
      
      // If there's existing game data, start the game immediately
      if (currentLevel > 1 || totalScore > 0) {
        setGameState('playing');
        const scene = gameRef.current.scene.getScene('GameScene');
        if (scene) {
          scene.startWave();
        }
      } else {
        // Pause the game scene if no existing data
        const scene = gameRef.current.scene.getScene('GameScene');
        if (scene) {
          scene.scene.pause();
        }
      }

      return () => {
        console.log('Cleaning up game...');
        window.removeEventListener('resize', handleResize);
        if (gameRef.current) {
          gameRef.current.destroy(true);
        }
      };
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }, []);

  const startGame = () => {
    console.log('Starting game...');
    console.log('Current game state:', gameState);
    console.log('Game instance:', gameRef.current);
    
    try {
      setGameState('playing');
      if (gameRef.current) {
        console.log('Starting GameScene...');
        const scene = gameRef.current.scene.getScene('GameScene');
        console.log('GameScene instance:', scene);
        
        if (scene) {
          scene.startWave();
          console.log('GameScene wave started');
        } else {
          console.error('GameScene not found');
        }
      } else {
        console.error('Game instance not found');
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className={`${isMobile ? 'w-full h-screen' : 'w-[800px] h-screen'} relative bg-[#1a1a1a] ${!isMobile ? 'shadow-2xl border-4 border-white' : ''}`}>
        <div 
          id="game-container" 
          className="w-full h-full overflow-hidden"
          style={{
            position: 'relative',
            zIndex: 1
          }}
        ></div>
        
        {gameState === 'start' && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50"
            style={{ zIndex: 2 }}
          >
            <h1 className="text-6xl font-bold text-white mb-8 text-shadow-lg shadow-cyan-500/50">
              Galactic Guardian
            </h1>
            <button
              onClick={startGame}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '20px 40px',
                fontSize: '24px',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                zIndex: 3
              }}
            >
              Start Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 