import * as THREE from 'three';
import { CubeGame, CubeFace, TileMovement } from '../game/CubeGame';

export class IsometricCube {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private faceGroups: Map<CubeFace, THREE.Group> = new Map();
  private tileGroups: Map<CubeFace, THREE.Group[][]> = new Map();
  private trails: THREE.Line[] = [];
  
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

  private readonly tileColors: Map<number, number> = new Map([
    [0, 0x2a2a2a],
    [2, 0x00FF41],
    [4, 0x00FF7F],
    [8, 0x00FFAA],
    [16, 0x00FFD4],
    [32, 0x00FFFF],
    [64, 0x00D4FF],
    [128, 0x00AAFF],
    [256, 0x007FFF],
    [512, 0x0055FF],
    [1024, 0x002AFF],
    [2048, 0xFF00FF],
    [4096, 0xFF00AA],
    [8192, 0xFF0055]
  ]);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.createCubeFaces();
  }

  private createCubeFaces(): void {
    Object.values(CubeFace).forEach(face => {
      const faceGroup = new THREE.Group();
      const position = this.facePositions.get(face as CubeFace)!;
      const rotation = this.faceRotations.get(face as CubeFace)!;
      
      faceGroup.position.copy(position);
      faceGroup.rotation.copy(rotation);
      
      // Create face background
      const faceGeometry = new THREE.PlaneGeometry(3.8, 3.8);
      const faceMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: 0x00FF41,
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
      faceMesh.position.z = -0.05;
      faceGroup.add(faceMesh);

      // Create grid lines
      const gridMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00FF41, 
        opacity: 0.3,
        transparent: true 
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
            0
          );
          faceGroup.add(tileGroup);
          tiles[r][c] = tileGroup;
        }
      }

      this.faceGroups.set(face as CubeFace, faceGroup);
      this.tileGroups.set(face as CubeFace, tiles);
      this.group.add(faceGroup);
    });

    // Set initial rotation for isometric view
    this.group.rotation.x = -Math.PI / 6;
    this.group.rotation.y = Math.PI / 4;
  }

  public updateFromGame(game: CubeGame): void {
    // Clear existing tiles
    this.tileGroups.forEach((tiles, face) => {
      tiles.forEach(row => {
        row.forEach(tileGroup => {
          while (tileGroup.children.length > 0) {
            const child = tileGroup.children[0];
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (child.material instanceof THREE.Material) {
                child.material.dispose();
              }
            }
            tileGroup.remove(child);
          }
        });
      });
    });

    // Update tiles for each face
    game.getUnlockedFaces().forEach(face => {
      const grid = game.getFaceGrid(face);
      const tiles = this.tileGroups.get(face)!;
      const faceGroup = this.faceGroups.get(face)!;
      
      // Show unlocked faces
      faceGroup.visible = true;
      
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const value = grid[r][c];
          if (value > 0) {
            this.createTile(tiles[r][c], value);
          }
        }
      }
    });

    // Hide locked faces
    Object.values(CubeFace).forEach(face => {
      if (!game.getUnlockedFaces().includes(face as CubeFace)) {
        const faceGroup = this.faceGroups.get(face as CubeFace)!;
        faceGroup.visible = false;
      }
    });
  }

  private createTile(container: THREE.Group, value: number): void {
    // Create tile mesh
    const geometry = new THREE.BoxGeometry(0.85, 0.85, 0.1);
    const color = this.tileColors.get(value) || 0xFF00FF;
    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    
    const tile = new THREE.Mesh(geometry, material);
    container.add(tile);

    // Add edge glow
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ 
      color: color,
      linewidth: 2
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    container.add(edges);

    // Create number text
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.font = 'bold 80px Orbitron';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.toString(), 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      opacity: 0.9
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.7, 0.7, 1);
    sprite.position.z = 0.1;
    container.add(sprite);

    // Add entrance animation
    tile.scale.set(0, 0, 1);
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 300, 1);
      const scale = this.easeOutBack(progress);
      tile.scale.set(scale, scale, 1);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  public animateMovements(movements: TileMovement[]): Promise<void> {
    return new Promise(resolve => {
      // Clear old trails
      this.clearTrails();
      
      // Create movement trails
      movements.forEach(move => {
        this.createMovementTrail(move);
      });

      // Animate trails
      setTimeout(() => {
        this.clearTrails();
        resolve();
      }, 500);
    });
  }

  private createMovementTrail(movement: TileMovement): void {
    const fromFaceGroup = this.faceGroups.get(movement.fromFace)!;
    const toFaceGroup = this.faceGroups.get(movement.toFace)!;
    
    const fromTile = this.tileGroups.get(movement.fromFace)![movement.fromPos[0]][movement.fromPos[1]];
    const toTile = this.tileGroups.get(movement.toFace)![movement.toPos[0]][movement.toPos[1]];
    
    // Get world positions
    const fromWorld = new THREE.Vector3();
    fromTile.getWorldPosition(fromWorld);
    
    const toWorld = new THREE.Vector3();
    toTile.getWorldPosition(toWorld);
    
    // Create trail
    const points = [];
    const segments = 20;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(fromWorld, toWorld, t);
      points.push(point);
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: movement.merged ? 0xFF00FF : 0x00FF41,
      linewidth: 3,
      opacity: 0.8,
      transparent: true
    });
    
    const trail = new THREE.Line(geometry, material);
    this.scene.add(trail);
    this.trails.push(trail);
    
    // Animate trail
    let startTime = Date.now();
    const animateTrail = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 300, 1);
      
      material.opacity = 0.8 * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animateTrail);
      }
    };
    animateTrail();
  }

  private clearTrails(): void {
    this.trails.forEach(trail => {
      trail.geometry.dispose();
      if (trail.material instanceof THREE.Material) {
        trail.material.dispose();
      }
      this.scene.remove(trail);
    });
    this.trails = [];
  }

  public rotateToAngle(targetRotation: {x: number, y: number}, duration: number = 500): Promise<void> {
    return new Promise(resolve => {
      const startRotation = {
        x: this.group.rotation.x,
        y: this.group.rotation.y
      };
      
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeInOutCubic(progress);
        
        this.group.rotation.x = startRotation.x + (targetRotation.x * Math.PI / 180 - startRotation.x) * eased;
        this.group.rotation.y = startRotation.y + (targetRotation.y * Math.PI / 180 - startRotation.y) * eased;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
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

  public dispose(): void {
    this.clearTrails();
    
    this.faceGroups.forEach(group => {
      this.group.remove(group);
    });
    
    this.scene.remove(this.group);
  }
}