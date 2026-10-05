import * as THREE from 'three';
import { SongNode } from '../data-structures/SongNode';
import { Song } from '../models/Song';

export class NodeCard3D {
  public group: THREE.Group;
  public node: SongNode<Song>;
  public targetPosition: THREE.Vector3;
  private cardMesh: THREE.Mesh;
  private glowMesh: THREE.Mesh;
  private canvasTexture: THREE.CanvasTexture | null = null;
  private textureCanvas: HTMLCanvasElement;
  private textureContext: CanvasRenderingContext2D;
  private isHovered: boolean = false;
  private isCurrent: boolean = false;
  private isHead: boolean = false;
  private isTail: boolean = false;
  private initialY: number = 0;
  private floatOffset: number;

  constructor(node: SongNode<Song>, position: THREE.Vector3) {
    this.node = node;
    this.targetPosition = position.clone();
    this.floatOffset = Math.random() * Math.PI * 2;
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.initialY = position.y;

    // Canvas for dynamic node text & badges
    this.textureCanvas = document.createElement('canvas');
    this.textureCanvas.width = 512;
    this.textureCanvas.height = 640;
    this.textureContext = this.textureCanvas.getContext('2d')!;

    // 3D Card Geometry
    const cardGeometry = new THREE.BoxGeometry(2.4, 3.2, 0.15);
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x1a1e2e, roughness: 0.4 }), // right
      new THREE.MeshStandardMaterial({ color: 0x1a1e2e, roughness: 0.4 }), // left
      new THREE.MeshStandardMaterial({ color: 0x1a1e2e, roughness: 0.4 }), // top
      new THREE.MeshStandardMaterial({ color: 0x1a1e2e, roughness: 0.4 }), // bottom
      new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.2 }), // FRONT (canvas)
      new THREE.MeshStandardMaterial({ color: 0x0f111a, roughness: 0.8 })  // back
    ];

    this.cardMesh = new THREE.Mesh(cardGeometry, materials);
    this.cardMesh.castShadow = true;
    this.cardMesh.receiveShadow = true;
    this.cardMesh.userData = { nodeId: node.id, card: this };
    this.group.add(this.cardMesh);

    // Glow border mesh
    const glowGeo = new THREE.BoxGeometry(2.52, 3.32, 0.18);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glowMesh);

    // Initial texture render
    this.updateTexture();
  }

  public updateState(isCurrent: boolean, isHead: boolean, isTail: boolean, index: number): void {
    const changed =
      this.isCurrent !== isCurrent ||
      this.isHead !== isHead ||
      this.isTail !== isTail;

    this.isCurrent = isCurrent;
    this.isHead = isHead;
    this.isTail = isTail;

    if (this.isCurrent) {
      (this.glowMesh.material as THREE.MeshBasicMaterial).color.setHex(0xfacc15); // Vibrant Yellow
      (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
    } else if (this.isHead) {
      (this.glowMesh.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4); // Cyan
      (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
    } else if (this.isTail) {
      (this.glowMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e); // Rose
      (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
    } else {
      (this.glowMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8); // Sky blue
      (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.25;
    }

    this.updateTexture(index);
  }

  public setHovered(hovered: boolean): void {
    this.isHovered = hovered;
    if (hovered && !this.isCurrent) {
      (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.7;
    } else if (!hovered && !this.isCurrent) {
      (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = 0.25;
    }
  }

  private updateTexture(index: number = 0): void {
    const ctx = this.textureContext;
    const song = this.node.data;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 640);
    bgGradient.addColorStop(0, '#111827');
    bgGradient.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 512, 640);

    // Inner card border
    ctx.strokeStyle = this.isCurrent ? '#facc15' : this.isHead ? '#06b6d4' : this.isTail ? '#f43f5e' : '#334155';
    ctx.lineWidth = this.isCurrent ? 8 : 4;
    ctx.strokeRect(12, 12, 488, 616);

    // Top Header: Node Index & Address Simulation
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`NODO #${index + 1}`, 30, 48);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`0x${this.node.id.slice(-6).toUpperCase()}`, 380, 48);

    // Badges: HEAD, TAIL, ACTUAL
    let badgeX = 30;
    if (this.isHead) {
      this.drawBadge(ctx, 'HEAD (Inicio)', badgeX, 64, '#06b6d4');
      badgeX += 135;
    }
    if (this.isTail) {
      this.drawBadge(ctx, 'TAIL (Fin)', badgeX, 64, '#f43f5e');
      badgeX += 115;
    }
    if (this.isCurrent) {
      this.drawBadge(ctx, '★ ACTUAL', badgeX, 64, '#facc15', '#000000');
    }

    // Cover placeholder/illustration
    const coverY = 110;
    const coverH = 300;
    const coverW = 452;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(30, coverY, coverW, coverH);

    // Decorative soundwave graphic inside cover
    ctx.strokeStyle = this.isCurrent ? '#facc15' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 40; x < 470; x += 12) {
      const h = Math.sin((x + index * 30) * 0.05) * 50 + Math.cos((x * 0.1)) * 30;
      ctx.moveTo(x, coverY + coverH / 2 - h / 2);
      ctx.lineTo(x, coverY + coverH / 2 + h / 2);
    }
    ctx.stroke();

    // Song Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px system-ui, sans-serif';
    const cleanTitle = song.title.length > 22 ? song.title.substring(0, 20) + '...' : song.title;
    ctx.fillText(cleanTitle, 30, 460);

    // Artist & Album
    ctx.fillStyle = '#38bdf8';
    ctx.font = '24px system-ui, sans-serif';
    const cleanArtist = song.artist.length > 26 ? song.artist.substring(0, 24) + '...' : song.artist;
    ctx.fillText(cleanArtist, 30, 500);

    ctx.fillStyle = '#64748b';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`Álbum: ${song.album || 'Single'}`, 30, 535);

    // Pointer Footers (Educational)
    const prevText = this.node.previous ? `◄ Prev: ${this.node.previous.data.title.substring(0, 10)}` : '◄ Prev: null';
    const nextText = this.node.next ? `Next: ${this.node.next.data.title.substring(0, 10)} ►` : 'Next: null ►';

    ctx.fillStyle = this.node.previous ? '#c084fc' : '#475569';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(prevText, 30, 595);

    ctx.fillStyle = this.node.next ? '#38bdf8' : '#475569';
    ctx.fillText(nextText, 280, 595);

    // Update texture
    if (!this.canvasTexture) {
      this.canvasTexture = new THREE.CanvasTexture(this.textureCanvas);
      this.canvasTexture.colorSpace = THREE.SRGBColorSpace;
      const frontMat = (this.cardMesh.material as THREE.Material[])[4] as THREE.MeshStandardMaterial;
      frontMat.map = this.canvasTexture;
      frontMat.needsUpdate = true;
    } else {
      this.canvasTexture.needsUpdate = true;
    }
  }

  private drawBadge(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    bgColor: string,
    textColor: string = '#ffffff'
  ): void {
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, ctx.measureText(text).width + 20, 26, 6);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(text, x + 10, y + 18);
  }

  public animate(elapsedTime: number): void {
    // Subtle float & rotation bobbing
    const bob = Math.sin(elapsedTime * 2 + this.floatOffset) * 0.08;
    this.group.position.y = this.initialY + (this.isCurrent ? 0.3 : 0) + bob;

    if (this.isCurrent) {
      this.group.scale.set(1.08, 1.08, 1.08);
      this.group.rotation.y = Math.sin(elapsedTime * 1.5) * 0.04;
    } else if (this.isHovered) {
      this.group.scale.set(1.04, 1.04, 1.04);
    } else {
      this.group.scale.set(1.0, 1.0, 1.0);
      this.group.rotation.y = 0;
    }
  }

  public dispose(): void {
    this.cardMesh.geometry.dispose();
    if (Array.isArray(this.cardMesh.material)) {
      this.cardMesh.material.forEach((m) => m.dispose());
    }
    this.glowMesh.geometry.dispose();
    (this.glowMesh.material as THREE.Material).dispose();
    if (this.canvasTexture) {
      this.canvasTexture.dispose();
    }
  }
}
