import * as THREE from 'three';
import { GameBoard } from '../game/GameBoard';

export class CubeMatrix {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private cubes: THREE.Mesh[][][] = [];
  private tileColors: Map<number, string> = new Map([
    [0, '#111111'],
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
  ]);
  private textMeshes: THREE.Mesh[][][] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.createCubeMatrix();
  }

  private createCubeMatrix(): void {
    const size = 4;
    const cubeSize = 1;
    const spacing = 0.2;
    const totalSize = (cubeSize + spacing) * size - spacing;
    const offset = -totalSize / 2 + cubeSize / 2;

    for (let x = 0; x < size; x++) {
      this.cubes[x] = [];
      this.textMeshes[x] = [];
      for (let y = 0; y < size; y++) {
        this.cubes[x][y] = [];
        this.textMeshes[x][y] = [];
        for (let z = 0; z < size; z++) {
          const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
          const material = new THREE.MeshPhongMaterial({
            color: this.tileColors.get(0),
            emissive: '#00FF41',
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.8,
          });
          
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(
            offset + x * (cubeSize + spacing),
            offset + y * (cubeSize + spacing),
            offset + z * (cubeSize + spacing)
          );
          
          const edges = new THREE.EdgesGeometry(geometry);
          const edgeMaterial = new THREE.LineBasicMaterial({ color: '#00FF41' });
          const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
          cube.add(edgeLines);
          
          this.group.add(cube);
          this.cubes[x][y][z] = cube;
        }
      }
    }
  }

  public updateFromBoard(board: GameBoard): void {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const value = board.grid[row][col];
        const cube = this.cubes[col][0][row];
        
        if (cube.material instanceof THREE.MeshPhongMaterial) {
          const color = this.tileColors.get(value) || '#FF00FF';
          cube.material.color.setStyle(color);
          cube.material.emissiveIntensity = value > 0 ? 0.3 : 0.1;
          cube.material.opacity = value > 0 ? 1 : 0.3;
          
          if (value >= 2048) {
            cube.material.emissive.setStyle('#FF00FF');
            cube.material.emissiveIntensity = 0.8;
          }
        }
        
        this.updateTextMesh(col, 0, row, value);
      }
    }
  }

  private updateTextMesh(x: number, y: number, z: number, value: number): void {
    if (this.textMeshes[x][y][z]) {
      this.cubes[x][y][z].remove(this.textMeshes[x][y][z]);
      this.textMeshes[x][y][z].geometry.dispose();
    }

    if (value > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d')!;
      
      context.fillStyle = '#000000';
      context.fillRect(0, 0, 256, 256);
      
      context.font = 'bold 80px Arial';
      context.fillStyle = '#00FF41';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(value.toString(), 128, 128);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.5, 0.5, 1);
      sprite.position.set(0, 0, 0.51);
      
      this.cubes[x][y][z].add(sprite);
      this.textMeshes[x][y][z] = sprite as any;
    }
  }

  public rotateAfterMove(direction: string): Promise<void> {
    return new Promise((resolve) => {
      const targetRotation = new THREE.Euler();
      
      switch(direction) {
        case 'LEFT':
          targetRotation.y = this.group.rotation.y - Math.PI / 2;
          break;
        case 'RIGHT':
          targetRotation.y = this.group.rotation.y + Math.PI / 2;
          break;
        case 'UP':
          targetRotation.x = this.group.rotation.x - Math.PI / 2;
          break;
        case 'DOWN':
          targetRotation.x = this.group.rotation.x + Math.PI / 2;
          break;
      }
      
      const startRotation = {
        x: this.group.rotation.x,
        y: this.group.rotation.y,
        z: this.group.rotation.z
      };
      
      const duration = 500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeInOutCubic(progress);
        
        this.group.rotation.x = startRotation.x + (targetRotation.x - startRotation.x) * eased;
        this.group.rotation.y = startRotation.y + (targetRotation.y - startRotation.y) * eased;
        
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

  public dispose(): void {
    this.cubes.forEach(layer => {
      layer.forEach(row => {
        row.forEach(cube => {
          cube.geometry.dispose();
          if (cube.material instanceof THREE.Material) {
            cube.material.dispose();
          }
          this.group.remove(cube);
        });
      });
    });
    this.scene.remove(this.group);
  }
}