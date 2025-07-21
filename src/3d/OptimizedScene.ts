import * as THREE from 'three';

export class OptimizedScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Calculate camera FOV based on viewport
    const aspect = container.clientWidth / container.clientHeight;
    const fov = aspect > 1 ? 50 : 70; // Wider FOV for portrait
    
    this.camera = new THREE.PerspectiveCamera(
      fov,
      aspect,
      0.1,
      100
    );
    
    // Position camera to show entire cube
    const distance = aspect > 1 ? 8 : 10;
    this.camera.position.set(0, 0, distance);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // Disable shadows for performance
    
    container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.setupParticles();
    this.handleResize();
  }

  private setupLights(): void {
    // Ambient light for base visibility
    const ambientLight = new THREE.AmbientLight(0x00FF41, 0.4);
    this.scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0x00FF41, 0.8);
    mainLight.position.set(5, 5, 5);
    this.scene.add(mainLight);

    // Accent light
    const accentLight = new THREE.DirectionalLight(0x00FFFF, 0.4);
    accentLight.position.set(-5, -5, 5);
    this.scene.add(accentLight);
  }

  private setupParticles(): void {
    const particleCount = 50; // Reduced for performance
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 15;
      positions[i + 1] = (Math.random() - 0.5) * 15;
      positions[i + 2] = (Math.random() - 0.5) * 15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00FF41,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Slow rotation for ambiance
    const animate = () => {
      particles.rotation.y += 0.0005;
      requestAnimationFrame(animate);
    };
    animate();
  }

  private handleResize(): void {
    const resizeObserver = new ResizeObserver(() => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      const aspect = width / height;

      // Adjust camera based on aspect ratio
      this.camera.aspect = aspect;
      this.camera.fov = aspect > 1 ? 50 : 70;
      this.camera.position.z = aspect > 1 ? 8 : 10;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    });

    resizeObserver.observe(this.container);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
  }
}