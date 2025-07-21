import * as THREE from 'three';

export class EnhancedScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private animationId: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

    // Create camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(this.renderer.domElement);

    // Add lights
    this.setupLights();

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private setupLights(): void {
    // Ambient light for base visibility
    const ambientLight = new THREE.AmbientLight(0x00FF41, 0.3);
    this.scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0x00FF41, 0.8);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    this.scene.add(mainLight);

    // Secondary light for balance
    const secondaryLight = new THREE.DirectionalLight(0x00FFAA, 0.4);
    secondaryLight.position.set(-5, 3, -5);
    this.scene.add(secondaryLight);

    // Point lights for glow effects
    const glowLight1 = new THREE.PointLight(0x00FF41, 0.5, 20);
    glowLight1.position.set(0, 0, 5);
    this.scene.add(glowLight1);

    const glowLight2 = new THREE.PointLight(0x00FFFF, 0.3, 20);
    glowLight2.position.set(0, 0, -5);
    this.scene.add(glowLight2);
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  public render(): void {
    if (this.animationId === null) {
      const animate = () => {
        this.animationId = requestAnimationFrame(animate);
        this.renderer.render(this.scene, this.camera);
      };
      animate();
    }
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    window.removeEventListener('resize', this.handleResize.bind(this));
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}