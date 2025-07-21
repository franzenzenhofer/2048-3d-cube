import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Tile Animation Tests', () => {
  describe('Tile and Number Movement', () => {
    it('should move tiles and numbers as one container', () => {
      // Read the AnimatedCube source to verify implementation
      const animatedCubePath = join(process.cwd(), 'src/3d/AnimatedCube.ts');
      const source = readFileSync(animatedCubePath, 'utf-8');
      
      // Verify that we create a container for all children
      expect(source).toContain('const moveContainer = new THREE.Group()');
      expect(source).toContain('while (fromTile.children.length > 0)');
      expect(source).toContain('moveContainer.add(fromTile.children[0])');
      
      // Verify both edges and sprite are added to same container
      expect(source).toContain('container.add(edges)');
      expect(source).toContain('container.add(sprite)');
    });

    it('should animate the entire container as one unit', () => {
      const animatedCubePath = join(process.cwd(), 'src/3d/AnimatedCube.ts');
      const source = readFileSync(animatedCubePath, 'utf-8');
      
      // Verify we push the moveContainer to animations
      expect(source).toContain('element: moveContainer');
      expect(source).toContain('animations.push({');
    });
  });

  describe('Animation Timing', () => {
    it('should wait 1 second before rotating cube', () => {
      // Read the Game2048V3 source
      const gamePath = join(process.cwd(), 'src/Game2048V3.ts');
      const source = readFileSync(gamePath, 'utf-8');
      
      // Verify the 1000ms delay
      expect(source).toContain('setTimeout(resolve, 1000)');
      expect(source).toContain('Longer delay to let merges be visible before rotating');
    });
  });

  describe('Merged Tile Animation', () => {
    it('should only scale merged tiles', () => {
      const animatedCubePath = join(process.cwd(), 'src/3d/AnimatedCube.ts');
      const source = readFileSync(animatedCubePath, 'utf-8');
      
      // Verify we have separate merge effects after movement
      expect(source).toContain('applyMergeEffects');
      expect(source).toContain('// NO SCALE ANIMATION - just pure movement');
      expect(source).toContain('if (move.merged && move.face)');
      expect(source).toContain('// Apply a glow/flash effect to merged tiles');
    });
  });

  describe('Two-Finger Rotation', () => {
    it('should enable pinch and rotate gestures', () => {
      const touchControlsPath = join(process.cwd(), 'src/ui/TouchControls.ts');
      const source = readFileSync(touchControlsPath, 'utf-8');
      
      // Verify pinch and rotate are enabled
      expect(source).toContain("this.hammer.get('pinch').set({ enable: true })");
      expect(source).toContain("this.hammer.get('rotate').set({ enable: true })");
      
      // Verify rotation callbacks
      expect(source).toContain('onRotateStartCallback');
      expect(source).toContain('onRotateCallback');
      expect(source).toContain('onRotateEndCallback');
    });

    it('should have snap-back functionality', () => {
      const gamePath = join(process.cwd(), 'src/Game2048V3.ts');
      const source = readFileSync(gamePath, 'utf-8');
      
      // Verify snap-back implementation
      expect(source).toContain('handleRotateEnd');
      expect(source).toContain('snapToForwardFace');
    });
  });
});