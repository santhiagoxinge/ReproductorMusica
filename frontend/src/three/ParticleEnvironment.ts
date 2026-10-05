import * as THREE from 'three';

export class ParticleEnvironment {
  public points: THREE.Points;
  private particleCount: number = 300;
  private initialY: Float32Array;

  constructor() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    this.initialY = new Float32Array(this.particleCount);

    const palette = [
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0xa855f7), // Purple
      new THREE.Color(0xf43f5e), // Pink
      new THREE.Color(0xfacc15)  // Yellow
    ];

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 30 - 5;
      this.initialY[i] = positions[i3 + 1];

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geometry, material);
  }

  public animate(elapsedTime: number, isPlaying: boolean): void {
    const posAttr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    const speed = isPlaying ? 1.5 : 0.5;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      array[i3 + 1] = this.initialY[i] + Math.sin(elapsedTime * speed + i) * 0.4;
    }
    posAttr.needsUpdate = true;
  }

  public dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
