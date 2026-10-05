import * as THREE from 'three';

export class ConnectionLine3D {
  public group: THREE.Group;
  private nextCurve: THREE.QuadraticBezierCurve3;
  private prevCurve: THREE.QuadraticBezierCurve3;
  private nextTubeMesh: THREE.Mesh;
  private prevTubeMesh: THREE.Mesh;
  private nextArrow: THREE.Mesh;
  private prevArrow: THREE.Mesh;
  private pulseParticleNext: THREE.Mesh;
  private pulseParticlePrev: THREE.Mesh;
  private nextMaterial: THREE.MeshStandardMaterial;
  private prevMaterial: THREE.MeshStandardMaterial;

  constructor(fromPos: THREE.Vector3, toPos: THREE.Vector3) {
    this.group = new THREE.Group();

    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    const midZ = (fromPos.z + toPos.z) / 2;

    // 1. Next curve: arcs slightly UP and FORWARD (Cyan)
    const nextMid = new THREE.Vector3(midX, midY + 0.6, midZ + 0.2);
    this.nextCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(fromPos.x + 1.2, fromPos.y + 0.5, fromPos.z),
      nextMid,
      new THREE.Vector3(toPos.x - 1.2, toPos.y + 0.5, toPos.z)
    );

    // 2. Previous curve: arcs slightly DOWN and BACKWARD (Purple/Magenta)
    const prevMid = new THREE.Vector3(midX, midY - 0.6, midZ - 0.2);
    this.prevCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(toPos.x - 1.2, toPos.y - 0.5, toPos.z),
      prevMid,
      new THREE.Vector3(fromPos.x + 1.2, fromPos.y - 0.5, fromPos.z)
    );

    // Materials
    this.nextMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });

    this.prevMaterial = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });

    // Next Tube
    const nextGeo = new THREE.TubeGeometry(this.nextCurve, 32, 0.04, 8, false);
    this.nextTubeMesh = new THREE.Mesh(nextGeo, this.nextMaterial);
    this.group.add(this.nextTubeMesh);

    // Previous Tube
    const prevGeo = new THREE.TubeGeometry(this.prevCurve, 32, 0.04, 8, false);
    this.prevTubeMesh = new THREE.Mesh(prevGeo, this.prevMaterial);
    this.group.add(this.prevTubeMesh);

    // Next Arrow Cone pointing right (towards toPos)
    const arrowGeo = new THREE.ConeGeometry(0.12, 0.35, 12);
    arrowGeo.rotateZ(-Math.PI / 2); // point right (+X)
    this.nextArrow = new THREE.Mesh(arrowGeo, this.nextMaterial);
    this.nextArrow.position.set(toPos.x - 1.2, toPos.y + 0.5, toPos.z);
    this.group.add(this.nextArrow);

    // Prev Arrow Cone pointing left (towards fromPos)
    const prevArrowGeo = new THREE.ConeGeometry(0.12, 0.35, 12);
    prevArrowGeo.rotateZ(Math.PI / 2); // point left (-X)
    this.prevArrow = new THREE.Mesh(prevArrowGeo, this.prevMaterial);
    this.prevArrow.position.set(fromPos.x + 1.2, fromPos.y - 0.5, fromPos.z);
    this.group.add(this.prevArrow);

    // Animated pulse spheres travelling along pointers
    const pulseGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const pulseMatNext = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const pulseMatPrev = new THREE.MeshBasicMaterial({ color: 0xe879f9 });

    this.pulseParticleNext = new THREE.Mesh(pulseGeo, pulseMatNext);
    this.pulseParticlePrev = new THREE.Mesh(pulseGeo, pulseMatPrev);

    this.group.add(this.pulseParticleNext);
    this.group.add(this.pulseParticlePrev);
  }

  public animate(elapsedTime: number): void {
    // Pulse on next pointer moves forward: 0 -> 1
    const tNext = (elapsedTime * 0.8) % 1.0;
    const ptNext = this.nextCurve.getPoint(tNext);
    this.pulseParticleNext.position.copy(ptNext);

    // Pulse on prev pointer moves backward: 0 -> 1 (which flows towards fromPos)
    const tPrev = (elapsedTime * 0.8) % 1.0;
    const ptPrev = this.prevCurve.getPoint(tPrev);
    this.pulseParticlePrev.position.copy(ptPrev);
  }

  public getNextPointAt(t: number): THREE.Vector3 {
    return this.nextCurve.getPoint(t);
  }

  public getPrevPointAt(t: number): THREE.Vector3 {
    return this.prevCurve.getPoint(t);
  }

  public dispose(): void {
    this.nextTubeMesh.geometry.dispose();
    this.prevTubeMesh.geometry.dispose();
    this.nextArrow.geometry.dispose();
    this.prevArrow.geometry.dispose();
    this.pulseParticleNext.geometry.dispose();
    this.pulseParticlePrev.geometry.dispose();
    this.nextMaterial.dispose();
    this.prevMaterial.dispose();
  }
}
