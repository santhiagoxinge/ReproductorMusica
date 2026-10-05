import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { DoublyLinkedList } from '../data-structures/DoublyLinkedList';
import { Song } from '../models/Song';
import { NodeCard3D } from './NodeCard3D';
import { ConnectionLine3D } from './ConnectionLine3D';
import { Character3D } from './Character3D';
import { ParticleEnvironment } from './ParticleEnvironment';

export class SceneManager {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public character: Character3D;
  private particles: ParticleEnvironment;
  private nodeCards: NodeCard3D[] = [];
  private connectionLines: ConnectionLine3D[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredCard: NodeCard3D | null = null;
  private clock: THREE.Clock;
  private nodeSpacing: number = 4.2;
  private onNodeSelectCallback?: (nodeId: string) => void;
  private isAudioPlaying: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c16);
    this.scene.fog = new THREE.FogExp2(0x0a0c16, 0.025);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, 4, 12);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 35;
    this.controls.target.set(0, 0, 0);

    // Lighting
    this.setupLighting();

    // Floor Grid
    const grid = new THREE.GridHelper(60, 40, 0x1e293b, 0x0f172a);
    grid.position.y = -2.5;
    this.scene.add(grid);

    // Environment Particles
    this.particles = new ParticleEnvironment();
    this.scene.add(this.particles.points);

    // Character
    this.character = new Character3D();
    this.scene.add(this.character.group);

    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.setupEventListeners();
    this.startLoop();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x38bdf8, 0.6);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 12, 8);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 1.8, 25);
    cyanPoint.position.set(-6, 4, 4);
    this.scene.add(cyanPoint);

    const purplePoint = new THREE.PointLight(0xa855f7, 1.8, 25);
    purplePoint.position.set(6, 4, 4);
    this.scene.add(purplePoint);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize);

    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.checkHover();
    });

    this.container.addEventListener('click', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = this.nodeCards.map((nc) => nc.group.children[0]);
      const intersects = this.raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const nodeId = hit.userData?.nodeId;
        if (nodeId && this.onNodeSelectCallback) {
          this.onNodeSelectCallback(nodeId);
        }
      }
    });
  }

  private checkHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.nodeCards.map((nc) => nc.group.children[0]);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const card = intersects[0].object.userData?.card as NodeCard3D;
      if (this.hoveredCard !== card) {
        if (this.hoveredCard) this.hoveredCard.setHovered(false);
        this.hoveredCard = card;
        if (this.hoveredCard) this.hoveredCard.setHovered(true);
        this.container.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredCard) {
        this.hoveredCard.setHovered(false);
        this.hoveredCard = null;
        this.container.style.cursor = 'default';
      }
    }
  }

  public setAudioPlaying(playing: boolean): void {
    this.isAudioPlaying = playing;
  }

  public onNodeSelect(cb: (nodeId: string) => void): void {
    this.onNodeSelectCallback = cb;
  }

  /**
   * Rebuilds the entire 3D doubly linked list graph when items are added, deleted, or loaded.
   */
  public rebuildFromList(list: DoublyLinkedList<Song>): void {
    // Clear old cards
    this.nodeCards.forEach((c) => {
      this.scene.remove(c.group);
      c.dispose();
    });
    this.nodeCards = [];

    // Clear old connection lines
    this.connectionLines.forEach((l) => {
      this.scene.remove(l.group);
      l.dispose();
    });
    this.connectionLines = [];

    const nodes = list.getAllNodes();
    const count = nodes.length;

    if (count === 0) {
      // Empty list state
      this.character.setPosition(0, 0, 0);
      return;
    }

    // Center nodes horizontally around X=0
    const startX = -((count - 1) * this.nodeSpacing) / 2;

    nodes.forEach((node, idx) => {
      const pos = new THREE.Vector3(startX + idx * this.nodeSpacing, 0, 0);
      const card = new NodeCard3D(node, pos);
      this.nodeCards.push(card);
      this.scene.add(card.group);
    });

    // Create bidirectional connection lines between consecutive nodes
    for (let i = 0; i < count - 1; i++) {
      const posA = this.nodeCards[i].targetPosition;
      const posB = this.nodeCards[i + 1].targetPosition;
      const conn = new ConnectionLine3D(posA, posB);
      this.connectionLines.push(conn);
      this.scene.add(conn.group);
    }

    this.updatePointers(list);
  }

  /**
   * Updates state badges, highlights, and character positioning based on list current/head/tail.
   */
  public updatePointers(list: DoublyLinkedList<Song>): void {
    const current = list.getCurrent();
    const head = list.head;
    const tail = list.tail;

    let currentIndex = -1;

    this.nodeCards.forEach((card, idx) => {
      const isCur = card.node === current || card.node.id === current?.id;
      const isHd = card.node === head || card.node.id === head?.id;
      const isTl = card.node === tail || card.node.id === tail?.id;

      card.updateState(isCur, isHd, isTl, idx);

      if (isCur) {
        currentIndex = idx;
      }
    });

    if (currentIndex >= 0 && this.nodeCards[currentIndex]) {
      const targetPos = this.nodeCards[currentIndex].group.position;
      this.character.setPosition(targetPos.x, targetPos.y, targetPos.z);
    }
  }

  /**
   * Smoothly pans the camera and controls target towards the current node.
   */
  public focusOnNode(index: number, animate: boolean = true): void {
    if (index < 0 || index >= this.nodeCards.length) return;

    const targetPos = this.nodeCards[index].group.position;

    if (animate) {
      gsap.to(this.controls.target, {
        x: targetPos.x,
        y: targetPos.y + 0.5,
        z: targetPos.z,
        duration: 0.8,
        ease: 'power2.out'
      });

      gsap.to(this.camera.position, {
        x: targetPos.x,
        y: targetPos.y + 3.5,
        z: targetPos.z + 9.5,
        duration: 0.8,
        ease: 'power2.out'
      });
    } else {
      this.controls.target.set(targetPos.x, targetPos.y + 0.5, targetPos.z);
      this.camera.position.set(targetPos.x, targetPos.y + 3.5, targetPos.z + 9.5);
    }
  }

  public getNodeCardPosition(index: number): THREE.Vector3 | null {
    if (index < 0 || index >= this.nodeCards.length) return null;
    return this.nodeCards[index].group.position;
  }

  private onResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private startLoop(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      const deltaTime = this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();

      // Controls
      this.controls.update();

      // Ambient particles
      this.particles.animate(elapsedTime, this.isAudioPlaying);

      // Node cards floating motion
      this.nodeCards.forEach((card) => card.animate(elapsedTime));

      // Connection lines pulse
      this.connectionLines.forEach((conn) => conn.animate(elapsedTime));

      // Character
      this.character.animate(elapsedTime, deltaTime);

      // Render
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.nodeCards.forEach((c) => c.dispose());
    this.connectionLines.forEach((l) => l.dispose());
    this.particles.dispose();
    this.character.dispose();
    this.renderer.dispose();
  }
}
