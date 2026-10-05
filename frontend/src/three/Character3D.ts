import * as THREE from 'three';
import gsap from 'gsap';
import { CharacterAnimator, CharacterState } from '../animations/CharacterAnimator';

export class Character3D {
  public group: THREE.Group;
  private spriteMesh: THREE.Mesh;
  private spriteMaterial: THREE.MeshBasicMaterial;
  private pedestalMesh: THREE.Mesh;
  private animator: CharacterAnimator;
  private baseHeight: number = 2.4;
  private isTransitioning: boolean = false;

  constructor() {
    this.group = new THREE.Group();
    this.animator = new CharacterAnimator();

    // Sprite billboard material
    this.spriteMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Sprite plane geometry (approx ratio of character)
    const spriteGeo = new THREE.PlaneGeometry(1.6, 2.4);
    this.spriteMesh = new THREE.Mesh(spriteGeo, this.spriteMaterial);
    this.spriteMesh.position.y = 1.2;
    this.group.add(this.spriteMesh);

    // Glowing base pedestal at feet
    const pedGeo = new THREE.RingGeometry(0.5, 0.85, 32);
    pedGeo.rotateX(-Math.PI / 2);
    const pedMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    this.pedestalMesh = new THREE.Mesh(pedGeo, pedMat);
    this.pedestalMesh.position.y = 0.05;
    this.group.add(this.pedestalMesh);

    // Listen to frame changes from animator
    this.animator.onFrameChange((texture) => {
      this.spriteMaterial.map = texture;
      this.spriteMaterial.needsUpdate = true;
    });

    // Initial state
    this.animator.setState('wave', 2500); // Friendly welcome wave on start!
  }

  public setPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y + this.baseHeight, z);
  }

  public animate(elapsedTime: number, deltaTime: number): void {
    this.animator.update(deltaTime);

    if (!this.isTransitioning) {
      // Subtle hovering breathing
      const bob = Math.sin(elapsedTime * 3) * 0.06;
      this.spriteMesh.position.y = 1.2 + bob;
      this.pedestalMesh.rotation.y = elapsedTime * 1.5;
    }
  }

  public setState(state: CharacterState, durationMs?: number): void {
    this.animator.setState(state, durationMs);
  }

  /**
   * Animates the character moving forward to the next node.
   * Uses arc trajectory and GSAP.
   */
  public async moveToNextNode(
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3,
    onComplete: () => void
  ): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.animator.setState('walk_forward');

    const startX = fromPos.x;
    const endX = toPos.x;
    const startY = fromPos.y + this.baseHeight;
    const endY = toPos.y + this.baseHeight;
    const midX = (startX + endX) / 2;
    const peakY = Math.max(startY, endY) + 1.2;

    const progressObj = { t: 0 };

    gsap.to(progressObj, {
      t: 1,
      duration: 0.85,
      ease: 'power2.inOut',
      onUpdate: () => {
        const t = progressObj.t;
        // Quadratic bezier arc
        const currX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
        const currY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * peakY + t * t * endY;
        this.group.position.set(currX, currY, fromPos.z);
      },
      onComplete: () => {
        this.isTransitioning = false;
        this.animator.setState('jump', 600);
        setTimeout(() => {
          this.animator.setState('idle');
          onComplete();
        }, 600);
      }
    });
  }

  /**
   * Animates the character moving backward to the previous node.
   */
  public async moveToPreviousNode(
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3,
    onComplete: () => void
  ): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.animator.setState('walk_backward');

    const startX = fromPos.x;
    const endX = toPos.x;
    const startY = fromPos.y + this.baseHeight;
    const endY = toPos.y + this.baseHeight;
    const midX = (startX + endX) / 2;
    const peakY = Math.max(startY, endY) + 1.0;

    const progressObj = { t: 0 };

    gsap.to(progressObj, {
      t: 1,
      duration: 0.85,
      ease: 'power2.inOut',
      onUpdate: () => {
        const t = progressObj.t;
        const currX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
        const currY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * peakY + t * t * endY;
        this.group.position.set(currX, currY, fromPos.z);
      },
      onComplete: () => {
        this.isTransitioning = false;
        this.animator.setState('jump', 500);
        setTimeout(() => {
          this.animator.setState('idle');
          onComplete();
        }, 500);
      }
    });
  }

  /**
   * Plays a recoil/bounce animation when reaching list boundary (head or tail).
   */
  public performBoundaryRecoil(direction: 'next' | 'prev'): void {
    this.animator.setState('bounce', 1200);

    const deltaX = direction === 'next' ? 0.6 : -0.6;
    const origX = this.group.position.x;

    gsap.timeline()
      .to(this.group.position, {
        x: origX + deltaX,
        y: this.group.position.y + 0.3,
        duration: 0.2,
        ease: 'power1.out'
      })
      .to(this.group.position, {
        x: origX,
        y: this.group.position.y,
        duration: 0.35,
        ease: 'elastic.out(1, 0.4)',
        onComplete: () => {
          this.animator.setState('confused', 1400);
        }
      });
  }

  /**
   * Reaction when a song is successfully added.
   */
  public celebrate(): void {
    this.animator.setState('celebrate', 2000);
    gsap.timeline()
      .to(this.spriteMesh.position, { y: 1.8, duration: 0.25, yoyo: true, repeat: 2, ease: 'power1.out' });
  }

  /**
   * Reaction when a song is deleted.
   */
  public sad(): void {
    this.animator.setState('sad', 2000);
    gsap.timeline()
      .to(this.spriteMesh.rotation, { z: 0.15, duration: 0.3, yoyo: true, repeat: 1 });
  }

  /**
   * Reaction when an invalid action occurs.
   */
  public angry(): void {
    this.animator.setState('angry', 1800);
    const origX = this.group.position.x;
    gsap.timeline()
      .to(this.group.position, { x: origX - 0.2, duration: 0.05, repeat: 5, yoyo: true });
  }

  /**
   * Thinking animation for loading or pause.
   */
  public think(): void {
    this.animator.setState('thinking', 2000);
  }

  public dispose(): void {
    this.spriteMesh.geometry.dispose();
    this.spriteMaterial.dispose();
    this.pedestalMesh.geometry.dispose();
    (this.pedestalMesh.material as THREE.Material).dispose();
  }
}
