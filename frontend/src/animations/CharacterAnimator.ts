import * as THREE from 'three';

export type CharacterState =
  | 'idle'
  | 'walk_forward'
  | 'walk_backward'
  | 'jump'
  | 'celebrate'
  | 'thinking'
  | 'confused'
  | 'sad'
  | 'angry'
  | 'bounce'
  | 'reach'
  | 'wave';

export class CharacterAnimator {
  private textures: Map<string, THREE.Texture[]> = new Map();
  private currentState: CharacterState = 'idle';
  private currentFrameIndex: number = 0;
  private frameTimer: number = 0;
  private frameInterval: number = 0.16; // ~6 fps per state frame cycle
  private lockedUntilTime: number = 0;
  private onFrameChangeCallbacks: Array<(texture: THREE.Texture) => void> = [];

  constructor() {
    this.loadAllFrames();
  }

  private loadAllFrames(): void {
    const states: CharacterState[] = [
      'idle',
      'walk_forward',
      'walk_backward',
      'jump',
      'celebrate',
      'thinking',
      'confused',
      'sad',
      'angry',
      'bounce',
      'reach',
      'wave'
    ];

    const loader = new THREE.TextureLoader();

    states.forEach((state) => {
      const stateTextures: THREE.Texture[] = [];
      for (let f = 0; f < 4; f++) {
        const path = `/assets/character/frames/${state}_${f}.png`;
        const tex = loader.load(path);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        stateTextures.push(tex);
      }
      this.textures.set(state, stateTextures);
    });
  }

  public setState(state: CharacterState, durationMs?: number): void {
    const now = performance.now();
    if (now < this.lockedUntilTime && state === 'idle') {
      return; // Do not interrupt special reaction with idle
    }

    if (this.currentState !== state) {
      this.currentState = state;
      this.currentFrameIndex = 0;
      this.frameTimer = 0;
      this.notifyFrame();
    }

    if (durationMs) {
      this.lockedUntilTime = now + durationMs;
      // Auto return to idle after duration
      setTimeout(() => {
        if (performance.now() >= this.lockedUntilTime) {
          this.setState('idle');
        }
      }, durationMs);
    }
  }

  public getState(): CharacterState {
    return this.currentState;
  }

  public onFrameChange(cb: (texture: THREE.Texture) => void): void {
    this.onFrameChangeCallbacks.push(cb);
  }

  public update(deltaTime: number): void {
    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.currentFrameIndex = (this.currentFrameIndex + 1) % 4;
      this.notifyFrame();
    }
  }

  private notifyFrame(): void {
    const frames = this.textures.get(this.currentState);
    if (frames && frames[this.currentFrameIndex]) {
      const currentTex = frames[this.currentFrameIndex];
      this.onFrameChangeCallbacks.forEach((cb) => cb(currentTex));
    }
  }

  public getCurrentTexture(): THREE.Texture | null {
    const frames = this.textures.get(this.currentState);
    return frames ? frames[this.currentFrameIndex] : null;
  }
}
