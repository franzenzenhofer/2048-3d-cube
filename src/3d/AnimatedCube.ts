import * as THREE from 'three';
import { CubeGameV3Fixed, CubeFace, TileMovement, CubeRotation } from '../game/CubeGameV3Fixed';
import { CubeRotationSystem } from '../game/CubeRotationSystem';

export class AnimatedCube {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private cubeGroup: THREE.Group;
  private faceGroups: Map<CubeFace, THREE.Group> = new Map();
  private tileGroups: Map<CubeFace, THREE.Group[][]> = new Map();
  private faceHighlights: Map<CubeFace, THREE.Mesh> = new Map();
  private rotationSystem: CubeRotationSystem = new CubeRotationSystem();
  
  private readonly facePositions: Map<CubeFace, THREE.Vector3> = new Map([
    [CubeFace.FRONT, new THREE.Vector3(0, 0, 2)],
    [CubeFace.BACK, new THREE.Vector3(0, 0, -2)],
    [CubeFace.LEFT, new THREE.Vector3(-2, 0, 0)],
    [CubeFace.RIGHT, new THREE.Vector3(2, 0, 0)],
    [CubeFace.TOP, new THREE.Vector3(0, 2, 0)],
    [CubeFace.BOTTOM, new THREE.Vector3(0, -2, 0)]
  ]);

  private readonly faceRotations: Map<CubeFace, THREE.Euler> = new Map([
    [CubeFace.FRONT, new THREE.Euler(0, 0, 0)],
    [CubeFace.BACK, new THREE.Euler(0, Math.PI, 0)],
    [CubeFace.LEFT, new THREE.Euler(0, -Math.PI / 2, 0)],
    [CubeFace.RIGHT, new THREE.Euler(0, Math.PI / 2, 0)],
    [CubeFace.TOP, new THREE.Euler(-Math.PI / 2, 0, 0)],
    [CubeFace.BOTTOM, new THREE.Euler(Math.PI / 2, 0, 0)]
  ]);

  private readonly tileColors: Map<number, string> = new Map([
    [2, '#00FF41'],
    [4, '#00FF7F'],
    [8, '#00FFAA'],
    [16, '#00FFD4'],
    [32, '#00FFFF'],
    [64, '#00D4FF'],
    [128, '#00AAFF'],
    [256, '#007FFF'],
    [512, '#0055FF'],
    [1024, '#002AFF'],
    [2048, '#FF00FF'],
    [4096, '#FF00AA'],
    [8192, '#FF0055']
  ]);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.cubeGroup = new THREE.Group();
    this.group.add(this.cubeGroup);
    this.scene.add(this.group);
    this.createCubeFaces();
    
    // Start with front view
    this.group.rotation.x = 0;
    this.group.rotation.y = 0;
  }

  private createCubeFaces(): void {
    Object.values(CubeFace).forEach(face => {
      const faceGroup = new THREE.Group();
      const position = this.facePositions.get(face as CubeFace)!;
      const rotation = this.faceRotations.get(face as CubeFace)!;
      
      faceGroup.position.copy(position);
      faceGroup.rotation.copy(rotation);
      
      // Create semi-transparent face background
      const faceGeometry = new THREE.PlaneGeometry(3.8, 3.8);
      const faceMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: 0x00FF41,
        emissiveIntensity: 0.02,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
      faceMesh.position.z = -0.05;
      faceGroup.add(faceMesh);

      // Create active face highlight (initially hidden)
      const highlightGeometry = new THREE.PlaneGeometry(3.9, 3.9);
      const highlightMaterial = new THREE.MeshPhongMaterial({
        color: 0x00FF41,
        emissive: 0x00FF41,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
      highlightMesh.position.z = -0.06;
      faceGroup.add(highlightMesh);
      this.faceHighlights.set(face as CubeFace, highlightMesh);

      // Create grid lines with glow
      const gridMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00FF41, 
        opacity: 0.5,
        transparent: true,
        linewidth: 2
      });
      
      for (let i = 0; i <= 4; i++) {
        const hGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1.9, -1.9 + i * 0.95, 0),
          new THREE.Vector3(1.9, -1.9 + i * 0.95, 0)
        ]);
        const hLine = new THREE.Line(hGeometry, gridMaterial);
        faceGroup.add(hLine);

        const vGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1.9 + i * 0.95, -1.9, 0),
          new THREE.Vector3(-1.9 + i * 0.95, 1.9, 0)
        ]);
        const vLine = new THREE.Line(vGeometry, gridMaterial);
        faceGroup.add(vLine);
      }

      // Create tile containers
      const tiles: THREE.Group[][] = [];
      for (let r = 0; r < 4; r++) {
        tiles[r] = [];
        for (let c = 0; c < 4; c++) {
          const tileGroup = new THREE.Group();
          tileGroup.position.set(
            -1.425 + c * 0.95,
            1.425 - r * 0.95,
            0.1
          );
          faceGroup.add(tileGroup);
          tiles[r][c] = tileGroup;
        }
      }

      this.faceGroups.set(face as CubeFace, faceGroup);
      this.tileGroups.set(face as CubeFace, tiles);
      this.cubeGroup.add(faceGroup);
    });
  }

  public updateFromGame(game: CubeGameV3Fixed, skipAnimation: boolean = false): void {
    // Clear existing tiles
    this.tileGroups.forEach((tiles, face) => {
      tiles.forEach(row => {
        row.forEach(tileGroup => {
          while (tileGroup.children.length > 0) {
            const child = tileGroup.children[0];
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else if (child.material) {
                child.material.dispose();
              }
            }
            tileGroup.remove(child);
          }
        });
      });
    });

    // Update tiles for each face
    Object.values(CubeFace).forEach(face => {
      const grid = game.getFaceGrid(face as CubeFace);
      const tiles = this.tileGroups.get(face as CubeFace)!;
      
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const value = grid[r][c];
          if (value > 0) {
            this.createTile(tiles[r][c], value, skipAnimation);
          }
        }
      }
    });
  }

  private createTile(container: THREE.Group, value: number, skipAnimation: boolean = false): void {
    const color = this.tileColors.get(value) || '#FF00FF';
    
    // Create transparent tile with glowing edges only
    const geometry = new THREE.BoxGeometry(0.85, 0.85, 0.05);
    
    // Create edge glow effect
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ 
      color: color,
      linewidth: 3
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    container.add(edges);

    // Create number sprite with transparent background
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Clear canvas (transparent)
    ctx.clearRect(0, 0, 256, 256);
    
    // Draw number with glow effect
    ctx.font = `bold ${value >= 1000 ? '80px' : '100px'} Orbitron`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Multiple passes for glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 40;
    ctx.fillStyle = color;
    
    // Draw multiple times for stronger glow
    for (let i = 0; i < 3; i++) {
      ctx.fillText(value.toString(), 128, 128);
    }
    
    // Final pass with white core
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(value.toString(), 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 1
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.8, 0.8, 1);
    sprite.position.z = 0.1;
    container.add(sprite);

    if (!skipAnimation) {
      // Add entrance animation
      const group = new THREE.Group();
      group.add(edges);
      group.add(sprite);
      container.add(group);
      
      group.scale.set(0, 0, 1);
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 300, 1);
        const scale = this.easeOutBack(progress);
        group.scale.set(scale, scale, 1);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }

  public async animateMovements(movements: TileMovement[], activeFace: CubeFace): Promise<void> {
    // Movements happen on ALL faces simultaneously
    await this.animateMovementGroup(movements);
  }

  private animateMovementGroup(movements: TileMovement[]): Promise<void> {
    return new Promise(resolve => {
      const duration = 300;
      const startTime = Date.now();
      
      // Store initial positions
      const animations: Array<{
        element: THREE.Object3D,
        from: THREE.Vector3,
        to: THREE.Vector3,
        fromScale: number,
        toScale: number
      }> = [];
      
      movements.forEach(move => {
        // Get tiles from the face specified in the movement
        const face = move.face || CubeFace.FRONT;
        const tiles = this.tileGroups.get(face)!;
        const fromTile = tiles[move.fromPos[0]][move.fromPos[1]];
        const toTile = tiles[move.toPos[0]][move.toPos[1]];
        
        if (fromTile.children.length > 0) {
          const element = fromTile.children[0];
          const fromWorld = new THREE.Vector3();
          const toWorld = new THREE.Vector3();
          
          fromTile.getWorldPosition(fromWorld);
          toTile.getWorldPosition(toWorld);
          
          animations.push({
            element,
            from: fromWorld,
            to: toWorld,
            fromScale: 1,
            toScale: move.merged ? 1.2 : 1
          });
        }
      });
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeInOutCubic(progress);
        
        animations.forEach(anim => {
          const pos = new THREE.Vector3().lerpVectors(anim.from, anim.to, eased);
          anim.element.parent?.worldToLocal(pos);
          anim.element.position.copy(pos);
          
          const scale = anim.fromScale + (anim.toScale - anim.fromScale) * eased;
          anim.element.scale.setScalar(scale);
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  public rotateCube(rotation: CubeRotation, game: CubeGameV3Fixed): Promise<void> {
    return new Promise(resolve => {
      const duration = 500;
      const startTime = Date.now();
      
      // Update rotation system to match game state
      this.rotationSystem.forwardFacing(game.getActiveFace());
      
      // Get the programmatic rotation angles for the target face
      const targetAngles = this.rotationSystem.getRotationAngles();
      
      const startRotation = {
        x: this.cubeGroup.rotation.x,
        y: this.cubeGroup.rotation.y,
        z: this.cubeGroup.rotation.z
      };
      
      const targetRotation = {
        x: targetAngles.x * Math.PI / 180,
        y: targetAngles.y * Math.PI / 180,
        z: targetAngles.z * Math.PI / 180
      };
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeInOutCubic(progress);
        
        this.cubeGroup.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * eased;
        this.cubeGroup.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * eased;
        this.cubeGroup.rotation.z = startRotation.z + (targetRotation.z - startRotation.z) * eased;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Normalize rotation to 0-360 range
          this.cubeGroup.rotation.x = this.cubeGroup.rotation.x % (2 * Math.PI);
          this.cubeGroup.rotation.y = this.cubeGroup.rotation.y % (2 * Math.PI);
          resolve();
        }
      };
      
      animate();
    });
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  public highlightActiveFace(face: CubeFace): void {
    // Fade out all highlights
    this.faceHighlights.forEach((highlight, f) => {
      const material = highlight.material as THREE.MeshPhongMaterial;
      material.opacity = f === face ? 0.1 : 0;
    });
  }

  public setForwardFacing(face: CubeFace, game: CubeGameV3Fixed): void {
    this.rotationSystem.forwardFacing(face);
    game.forwardFacing(face);
    
    // Immediately set the rotation to show this face
    const angles = this.rotationSystem.getRotationAngles();
    this.cubeGroup.rotation.x = angles.x * Math.PI / 180;
    this.cubeGroup.rotation.y = angles.y * Math.PI / 180;
    this.cubeGroup.rotation.z = angles.z * Math.PI / 180;
  }

  public dispose(): void {
    this.faceGroups.forEach(group => {
      this.cubeGroup.remove(group);
    });
    
    this.scene.remove(this.group);
  }
}