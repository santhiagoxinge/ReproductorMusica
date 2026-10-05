import { Song } from '../models/Song';
import { formatTime, escapeHtml } from '../utils/Formatters';

export type RepeatMode = 'none' | 'one' | 'all';

export interface PlayerCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export class AudioPlayer {
  private container: HTMLElement;
  private callbacks: PlayerCallbacks;
  private isPlaying: boolean = false;
  private repeatMode: RepeatMode = 'none';
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private currentSong: Song | null = null;
  private isSeeking: boolean = false;

  constructor(container: HTMLElement, callbacks: PlayerCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public updateSong(song: Song | null): void {
    this.currentSong = song;
    this.currentTime = 0;
    this.duration = song?.duration || 0;
    this.render();
  }

  public updatePlaybackState(isPlaying: boolean): void {
    this.isPlaying = isPlaying;
    const playBtn = this.container.querySelector('#btn-play-pause');
    if (playBtn) {
      playBtn.innerHTML = isPlaying ? '⏸' : '▶';
      playBtn.setAttribute('title', isPlaying ? 'Pausar' : 'Reproducir');
    }
  }

  public updateTime(currentTime: number, duration: number): void {
    if (this.isSeeking) return;
    this.currentTime = currentTime;
    this.duration = duration;

    const timeCurrentEl = this.container.querySelector('#time-current');
    const timeTotalEl = this.container.querySelector('#time-total');
    const seekSlider = this.container.querySelector('#seek-slider') as HTMLInputElement;

    if (timeCurrentEl) timeCurrentEl.textContent = formatTime(currentTime);
    if (timeTotalEl) timeTotalEl.textContent = formatTime(duration);
    if (seekSlider && duration > 0) {
      seekSlider.value = String((currentTime / duration) * 100);
      seekSlider.style.setProperty('--seek-progress', `${(currentTime / duration) * 100}%`);
    }
  }

  public setRepeatMode(mode: RepeatMode): void {
    this.repeatMode = mode;
    const repeatBtn = this.container.querySelector('#btn-repeat');
    if (repeatBtn) {
      repeatBtn.className = `btn-control ${mode !== 'none' ? 'active-mode' : ''}`;
      const icon = mode === 'one' ? '🔂 1' : '🔁';
      const title = mode === 'one' ? 'Repetir canción actual' : mode === 'all' ? 'Repetir toda la playlist' : 'Sin repetición';
      repeatBtn.innerHTML = icon;
      repeatBtn.setAttribute('title', title);
    }
  }

  public setVolumeState(volume: number, isMuted: boolean): void {
    this.volume = volume;
    this.isMuted = isMuted;

    const volSlider = this.container.querySelector('#volume-slider') as HTMLInputElement;
    const muteBtn = this.container.querySelector('#btn-mute');

    if (volSlider) volSlider.value = String(isMuted ? 0 : volume * 100);
    if (muteBtn) muteBtn.innerHTML = isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊';
  }

  public render(): void {
    const song = this.currentSong;
    const title = song ? escapeHtml(song.title) : 'Sin pista seleccionada';
    const artist = song ? escapeHtml(song.artist) : 'Selecciona una canción';
    const coverUrl = song?.coverUrl || '/assets/covers/cover_default.png';

    const repeatIcon = this.repeatMode === 'one' ? '🔂 1' : '🔁';
    const repeatTitle =
      this.repeatMode === 'one'
        ? 'Repetir canción actual'
        : this.repeatMode === 'all'
        ? 'Repetir toda la playlist'
        : 'Sin repetición';

    this.container.innerHTML = `
      <div class="player-bar-inner">
        <!-- Song Details -->
        <div class="player-song-info">
          <div class="player-cover-wrap">
            <img src="${coverUrl}" alt="Cover" class="player-cover-img" onerror="this.src='/assets/covers/cover_default.png'" />
          </div>
          <div class="player-text">
            <div class="player-title" title="${title}">${title}</div>
            <div class="player-artist" title="${artist}">${artist}</div>
          </div>
        </div>

        <!-- Central Controls & Progress -->
        <div class="player-center">
          <div class="player-buttons">
            <button id="btn-shuffle" class="btn-control" title="Mezclar canciones (Reordena la lista doble)">
              🔀
            </button>

            <button id="btn-prev" class="btn-control" title="Anterior (current.previous)">
              ⏮
            </button>

            <button id="btn-play-pause" class="btn-control btn-play-main" title="${this.isPlaying ? 'Pausar' : 'Reproducir'}">
              ${this.isPlaying ? '⏸' : '▶'}
            </button>

            <button id="btn-next" class="btn-control" title="Siguiente (current.next)">
              ⏭
            </button>

            <button id="btn-repeat" class="btn-control ${this.repeatMode !== 'none' ? 'active-mode' : ''}" title="${repeatTitle}">
              ${repeatIcon}
            </button>
          </div>

          <div class="player-progress-row">
            <span id="time-current" class="time-label">${formatTime(this.currentTime)}</span>
            <div class="slider-wrapper">
              <input type="range" id="seek-slider" min="0" max="100" value="0" class="progress-bar-slider" />
            </div>
            <span id="time-total" class="time-label">${formatTime(this.duration)}</span>
          </div>
        </div>

        <!-- Volume & Quick Settings -->
        <div class="player-right">
          <button id="btn-mute" class="btn-control btn-subtle" title="Silenciar / Activar sonido">
            ${this.isMuted || this.volume === 0 ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            id="volume-slider"
            min="0"
            max="100"
            value="${this.isMuted ? 0 : this.volume * 100}"
            class="volume-slider"
            title="Volumen"
          />
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const playBtn = this.container.querySelector('#btn-play-pause');
    const prevBtn = this.container.querySelector('#btn-prev');
    const nextBtn = this.container.querySelector('#btn-next');
    const shuffleBtn = this.container.querySelector('#btn-shuffle');
    const repeatBtn = this.container.querySelector('#btn-repeat');
    const muteBtn = this.container.querySelector('#btn-mute');
    const volSlider = this.container.querySelector('#volume-slider') as HTMLInputElement;
    const seekSlider = this.container.querySelector('#seek-slider') as HTMLInputElement;

    playBtn?.addEventListener('click', () => {
      if (this.isPlaying) {
        this.callbacks.onPause();
      } else {
        this.callbacks.onPlay();
      }
    });

    prevBtn?.addEventListener('click', () => this.callbacks.onPrevious());
    nextBtn?.addEventListener('click', () => this.callbacks.onNext());
    shuffleBtn?.addEventListener('click', () => this.callbacks.onToggleShuffle());
    repeatBtn?.addEventListener('click', () => this.callbacks.onToggleRepeat());

    muteBtn?.addEventListener('click', () => this.callbacks.onToggleMute());

    volSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value) / 100;
      this.callbacks.onVolumeChange(val);
    });

    seekSlider?.addEventListener('mousedown', () => {
      this.isSeeking = true;
    });

    seekSlider?.addEventListener('mouseup', (e) => {
      this.isSeeking = false;
      const pct = parseFloat((e.target as HTMLInputElement).value) / 100;
      this.callbacks.onSeek(pct * this.duration);
    });

    seekSlider?.addEventListener('input', (e) => {
      const pct = parseFloat((e.target as HTMLInputElement).value) / 100;
      const timeCurrentEl = this.container.querySelector('#time-current');
      if (timeCurrentEl) {
        timeCurrentEl.textContent = formatTime(pct * this.duration);
      }
    });
  }
}
