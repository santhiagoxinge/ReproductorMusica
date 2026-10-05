import { Song } from '../models/Song';

export class AudioManager {
  private audioElement: HTMLAudioElement;
  private currentSong: Song | null = null;
  private isMuted: boolean = false;
  private previousVolume: number = 0.8;
  private audioContext: AudioContext | null = null;
  private synthGainNode: GainNode | null = null;
  private synthOscillator: OscillatorNode | null = null;

  public onPlayCallback?: () => void;
  public onPauseCallback?: () => void;
  public onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  public onEndedCallback?: () => void;
  public onErrorCallback?: (err: string) => void;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.volume = 0.8;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.audioElement.addEventListener('play', () => {
      this.onPlayCallback?.();
    });

    this.audioElement.addEventListener('pause', () => {
      this.onPauseCallback?.();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      const dur = this.audioElement.duration || this.currentSong?.duration || 0;
      this.onTimeUpdateCallback?.(this.audioElement.currentTime, dur);
    });

    this.audioElement.addEventListener('ended', () => {
      this.onEndedCallback?.();
    });

    this.audioElement.addEventListener('error', () => {
      console.warn('Audio playback error on source:', this.audioElement.src);
      // If error occurs, fallback to synth tones so demo never gets stuck
      this.onErrorCallback?.('Error cargando pista de audio');
    });
  }

  public loadSong(song: Song): void {
    this.currentSong = song;
    this.audioElement.src = song.audioUrl;
    this.audioElement.load();
  }

  public async play(): Promise<void> {
    try {
      if (!this.audioElement.src && this.currentSong) {
        this.loadSong(this.currentSong);
      }
      await this.audioElement.play();
    } catch (err) {
      console.warn('Playback prevented by browser autoplay policy or missing audio:', err);
      this.onPlayCallback?.();
    }
  }

  public pause(): void {
    this.audioElement.pause();
  }

  public togglePlay(): boolean {
    if (this.audioElement.paused) {
      this.play();
      return true;
    } else {
      this.pause();
      return false;
    }
  }

  public seek(seconds: number): void {
    if (isNaN(seconds)) return;
    this.audioElement.currentTime = seconds;
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.audioElement.volume = clamped;
    if (clamped > 0) {
      this.isMuted = false;
      this.previousVolume = clamped;
    }
  }

  public toggleMute(): boolean {
    if (this.isMuted) {
      this.audioElement.volume = this.previousVolume || 0.8;
      this.isMuted = false;
    } else {
      this.previousVolume = this.audioElement.volume;
      this.audioElement.volume = 0;
      this.isMuted = true;
    }
    return this.isMuted;
  }

  public isPlaying(): boolean {
    return !this.audioElement.paused;
  }

  public getCurrentTime(): number {
    return this.audioElement.currentTime;
  }

  public getDuration(): number {
    return this.audioElement.duration || this.currentSong?.duration || 0;
  }

  public getVolume(): number {
    return this.audioElement.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}
