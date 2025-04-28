# Shooter Game

A fast-paced arcade-style shooter game built with React and Phaser 3. Test your reflexes and accuracy as you progress through increasingly challenging levels.

## Game Features

- Progressive difficulty with 20 unique levels
- Dynamic enemy spawning and movement patterns
- Score tracking and high score system
- Level progression with increasing challenges
- Responsive controls (keyboard and mouse)
- Multiple background themes
- Local storage for game progress

## Game Mechanics

- **Controls**:
  - Left/Right Arrow Keys: Move player
  - Spacebar or Mouse Click: Shoot bullets
  - ESC: Pause game

- **Scoring**:
  - Points earned for each enemy hit
  - Bonus points for completing levels
  - High score tracking

- **Level Progression**:
  - Each level increases in difficulty
  - More enemies per wave
  - Faster enemy movement
  - Limited bullet count
  - Must achieve 90% kill rate to progress

## Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shooter.git
cd shooter
```

2. Install dependencies:
```bash
npm install
```

## Running the Game

### Development Mode
```bash
npm run dev
```
- Runs the game in development mode
- Hot reloading enabled
- Access at http://localhost:3000

### Preview Production Build
```bash
npm run build
npm run preview
```
- Builds and previews the production version
- Access at http://localhost:4173/shooter/

### Production Deployment
```bash
npm run build
```
- Creates optimized production build in `dist` directory
- Ready for deployment to GitHub Pages or other hosting

## Game Rules

1. **Objective**: Destroy enemies while conserving bullets
2. **Level Completion**: 
   - Must destroy 90% of enemies
   - Limited bullet count per level
3. **Failure Conditions**:
   - Running out of bullets
   - Not meeting kill requirement
4. **Scoring**:
   - 10 points per enemy hit
   - Bonus points for level completion
   - High score tracking across sessions

## Technical Details

- Built with React and Phaser 3
- Uses Vite for development and building
- Responsive design for different screen sizes
- Local storage for game state persistence
- SVG graphics for crisp visuals

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License. 