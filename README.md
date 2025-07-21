# 3D 2048: Six Games in One 🎮 ✨ FULLY WORKING! ✨

A revolutionary take on the classic 2048 game - play 6 independent 2048 games simultaneously on the faces of a rotating 3D cube!

## 🎉 IT'S ALIVE AND FULLY FUNCTIONAL! 
**Version 2.2.20** - All features working perfectly! Proper 2048 rules, smooth animations, and full 3D cube inspection!

## 🎲 Play Now

**[Play 3D 2048 Online](https://2048-3d-cube.franzai.com)**

Also available at:
- https://2048-3d-cube.pages.dev
- https://990c3c08.2048-3d-cube.pages.dev

## 🚀 Revolutionary Concept

**You're not playing one 2048 game - you're playing SIX at once!**

- Each face of the cube is a complete, independent 2048 game
- One swipe moves tiles on ALL six faces simultaneously
- After each move, the cube rotates to show you a different face
- Win by reaching 2048 on ANY face
- Game ends only when ALL faces have no valid moves

### 🧠 NEW: Rotation-Aware Mode (Ultimate Challenge)

We've implemented an **EXTREME DIFFICULTY** mode where:
- After each cube rotation, the concept of "up", "down", "left", and "right" changes for each face
- Each face interprets swipes based on the cube's current 3D orientation
- What was "up" might now be "left" or "right" after rotation!
- This creates 576 possible direction transformations to track mentally

**Warning**: This mode is extraordinarily difficult and requires exceptional spatial reasoning skills!

## 🎯 How to Play

1. **Swipe** in any direction (up, down, left, right)
2. **All 6 faces** move their tiles in the same direction
3. **New tiles** spawn on all faces after each move
4. **Cube rotates** to show you a different face after each move
5. **Strategy** - Think about how each move affects all 6 games!

### Controls
- **Mobile**: Swipe gestures
- **Desktop**: Arrow keys or WASD
- **Restart**: Double tap or press R
- **Two-Finger Rotation**: Full 360° cube inspection (mobile/trackpad)
- **Pinch-to-Zoom**: Zoom in/out to see details (0.5x - 2x scale)
- **Rotation Mode**: Long press (0.5s) to enter rotation mode
  - Visual indicator shows when active
  - Two-finger pan for full 360° rotation on all axes
  - Swipe to exit mode and make your move
  - Perfect for inspecting all sides before deciding

## 🎨 Features

- **6 Independent Games**: Each cube face runs its own 2048 game
- **Unified Controls**: One swipe controls all games simultaneously  
- **3D Visualization**: Beautiful rotating cube with neon green aesthetic
- **Mobile First**: Optimized for touch controls and mobile devices
- **Smooth Animations**: Tile movements, merges, and cube rotations
- **Combined Score**: Track your performance across all 6 games
- **High Performance**: Built with Three.js for smooth 60fps gameplay

## 🏗️ Tech Stack

- **TypeScript** - Type-safe development
- **Three.js** - 3D graphics and WebGL rendering
- **Hammer.js** - Touch gesture recognition
- **Vite** - Lightning fast build tool
- **Vitest** - Unit testing framework
- **Playwright** - E2E testing
- **Cloudflare Pages** - Global edge deployment

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/franzenzenhofer/2048-3d-cube.git
cd 2048-3d-cube
npm install
```

### Development Server

```bash
npm run dev
```

Open http://localhost:5173 to play locally.

### Build

```bash
npm run build
```

### Test

```bash
npm test        # Run unit tests
npm run e2e     # Run E2E tests (coming soon)
```

### Deploy

```bash
./deploy.sh     # Deploy to Cloudflare Pages
```

## 🎮 Game Mechanics

### The Revolutionary Concept
Instead of one 2048 game, you're playing 6 at once! Each face of the cube is an independent 4x4 grid following standard 2048 rules.

### Movement
- **Unified Direction**: All 6 faces interpret swipes the same way
- **No Manual Rotation**: The cube rotates automatically after moves
- **Smart Rotation**: Shows the opposite face after each swipe
  - Swipe LEFT → See RIGHT face
  - Swipe RIGHT → See LEFT face  
  - Swipe UP → See BOTTOM face
  - Swipe DOWN → See TOP face

### Tile Spawning
- After each move, ALL faces spawn new tiles
- Standard 2048 probabilities: 90% chance of 2, 10% chance of 4
- Each face manages its own tile spawning independently

### Winning & Losing
- **Win**: Reach 2048 on ANY of the 6 faces
- **Game Over**: Only when ALL 6 faces have no valid moves
- **Score**: Combined score from all 6 games

### Strategy Tips
- Think ahead about how moves affect all 6 games
- Some faces might be close to game over while others thrive
- Balance risk across all faces
- Use the rotation preview to plan your next move

## 📐 Architecture

### Key Components

```
src/
├── game/
│   └── CubeGameV3Fixed.ts    # Core logic for 6 independent games
├── 3d/
│   ├── AnimatedCube.ts       # 3D visualization and animations
│   └── EnhancedScene.ts      # Three.js scene management
├── ui/
│   ├── TouchControls.ts      # Swipe gesture handling
│   └── MinimalUI.ts          # Clean, mobile-first interface
└── main.ts                   # Application entry point
```

### Design Philosophy

- **KISS Principle**: Each face is truly independent - no complex coordinate mapping
- **DRY Code**: Shared logic for all 6 game boards
- **Mobile First**: Touch controls and responsive design
- **Performance**: Optimized rendering and animations
- **Clean Architecture**: Separated concerns for game logic, rendering, and UI

## 🧪 Testing

The game includes comprehensive test coverage:
- Unit tests for game logic
- Integration tests for multi-face coordination
- Spawn probability validation
- Win/loss condition verification

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Follow TypeScript best practices
2. Write tests for new features
3. Ensure mobile compatibility
4. Keep performance in mind

## 📄 License

MIT License - feel free to use this code for your own projects!

## 🙏 Acknowledgments

- Original 2048 by Gabriele Cirulli
- Three.js community for excellent documentation
- Inspired by various 3D puzzle games

## 📊 Version History

- **v2.2.23** - 🎮 **ROTATION MODE SYSTEM!**
  - Added long-press (0.5s) to enter rotation mode
  - Visual indicator shows when rotation mode is active
  - Two-finger pan for full 360° rotation on all axes in rotation mode
  - Swipe to exit rotation mode and make your move
  - Perfect for strategic planning - inspect all sides before deciding
  - Comprehensive test coverage with TDD approach
- **v2.2.20** - 🎉 **COMPLETE & FULLY FUNCTIONAL!** 
  - Added full 360° cube inspection with two-finger rotation
  - Implemented pinch-to-zoom (0.5x - 2x scale)
  - No more snap-back - freely explore the cube
  - All animations perfected
- **v2.2.19** - Fixed all tile animations and movement rules
  - Tiles now correctly slide without jumping over others
  - Only merged tiles show pulse effect
  - Proper 2048 rules implementation
- **v2.2.0** - Added Rotation-Aware Mode (extreme difficulty)
- **v2.1.0** - Revolutionary 6-games-in-one concept
- **v2.0.0** - Complete rewrite with proper 3D mechanics
- **v1.0.0** - Initial 3D implementation

## 📚 Technical Documentation

### Rotation-Aware Coordinate System
See [docs/ROTATION_AWARE_COORDINATE_SYSTEM.md](docs/ROTATION_AWARE_COORDINATE_SYSTEM.md) for detailed explanation of the mathematical transformations and spatial reasoning challenges.

### Implementation Plan
See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for the technical architecture and development roadmap.

---

**Created by Franz Enzenhofer** | [GitHub](https://github.com/franzenzenhofer)

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>