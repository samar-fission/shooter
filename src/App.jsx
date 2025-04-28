import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import GameUI from './components/GameUI';

function App() {
  const gameRef = useRef(null);
  const [gameState, setGameState] = useState('start'); // start, playing, paused
  const [gameData, setGameData] = useState({ score: 0, health: 100, level: 1 });
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    console.log('Initializing game...');
    try {
      const config = {
        type: Phaser.AUTO,
        width: 800,
        height: window.innerHeight,
        parent: 'game-container',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scene: [GameScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        backgroundColor: '#1a1a1a',
        autoStart: false // Prevent automatic start
      };

      console.log('Creating Phaser game instance with config:', config);
      gameRef.current = new Phaser.Game(config);
      console.log('Phaser game instance created:', gameRef.current);

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

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
      if (gameRef.current) {
        const scene = gameRef.current.scene.getScene('GameScene');
        if (scene) {
          scene.scene.pause();
        }
      }
    } else if (gameState === 'paused') {
      setGameState('playing');
      if (gameRef.current) {
        const scene = gameRef.current.scene.getScene('GameScene');
        if (scene) {
          scene.scene.resume();
        }
      }
    }
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="w-[800px] h-screen relative bg-[#1a1a1a] shadow-2xl border-4 border-white">
        <div 
          id="game-container" 
          className="w-full h-full"
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

        {gameState === 'playing' && (
          <>
            <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-75">
              <div className="flex justify-between items-center">
                <GameUI {...gameData} />
                <button
                  onClick={togglePause}
                  className="pause-button"
                  style={{
                    backgroundColor: '#ff4444',
                    color: 'white',
                    padding: '10px 20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    border: '2px solid white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginLeft: '20px',
                    zIndex: 3
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#ff6666'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#ff4444'}
                >
                  ⏸️ Pause
                </button>
              </div>
            </div>
          </>
        )}

        {gameState === 'paused' && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75"
            style={{ zIndex: 2 }}
          >
            <div className="text-center">
              <h2 className="text-white text-4xl font-bold mb-6">Game Paused</h2>
              <button
                onClick={togglePause}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '16px 32px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  border: '2px solid white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
              >
                ▶️ Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 