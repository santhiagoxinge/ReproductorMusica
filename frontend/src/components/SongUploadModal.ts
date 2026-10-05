import { CreateSongPayload } from '../models/Song';
import { StorageService } from '../services/StorageService';

export interface SongUploadModalCallbacks {
  onAddSong: (
    payload: CreateSongPayload,
    positionType: 'beginning' | 'end' | 'position',
    targetIndex?: number
  ) => void;
}

export class SongUploadModal {
  private modalContainer: HTMLElement;
  private callbacks: SongUploadModalCallbacks;
  private storageService: StorageService;
  private selectedAudioBlob: Blob | null = null;
  private selectedCoverUrl: string = '/assets/covers/cover_default.png';

  constructor(
    modalContainer: HTMLElement,
    storageService: StorageService,
    callbacks: SongUploadModalCallbacks
  ) {
    this.modalContainer = modalContainer;
    this.storageService = storageService;
    this.callbacks = callbacks;
  }

  public open(positionHint: 'head' | 'tail' | 'custom' = 'tail', listSize: number = 0): void {
    this.selectedAudioBlob = null;
    this.selectedCoverUrl = '/assets/covers/cover_default.png';

    const defaultPos = positionHint === 'head' ? 'beginning' : positionHint === 'tail' ? 'end' : 'position';

    this.modalContainer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">🎵 Agregar Canción a la Lista Doble</h3>
            <button id="btn-close-modal" class="btn-close">✕</button>
          </div>

          <div class="modal-body">
            <!-- Insertion Mode -->
            <div class="form-group">
              <label class="form-label">📍 Tipo de Inserción en la Lista:</label>
              <div class="radio-cards">
                <label class="radio-card ${defaultPos === 'beginning' ? 'selected' : ''}">
                  <input type="radio" name="insert-mode" value="beginning" ${defaultPos === 'beginning' ? 'checked' : ''} />
                  <div class="radio-card-body">
                    <strong>Al Inicio (HEAD)</strong>
                    <small>insertAtBeginning() • O(1)</small>
                  </div>
                </label>

                <label class="radio-card ${defaultPos === 'end' ? 'selected' : ''}">
                  <input type="radio" name="insert-mode" value="end" ${defaultPos === 'end' ? 'checked' : ''} />
                  <div class="radio-card-body">
                    <strong>Al Final (TAIL)</strong>
                    <small>insertAtEnd() • O(1)</small>
                  </div>
                </label>

                <label class="radio-card ${defaultPos === 'position' ? 'selected' : ''}">
                  <input type="radio" name="insert-mode" value="position" ${defaultPos === 'position' ? 'checked' : ''} />
                  <div class="radio-card-body">
                    <strong>En Posición</strong>
                    <small>insertAtPosition(pos) • O(N)</small>
                  </div>
                </label>
              </div>
            </div>

            <!-- Position index input (shown if position is selected) -->
            <div id="index-group" class="form-group" style="display: ${defaultPos === 'position' ? 'block' : 'none'};">
              <label class="form-label">Índice objetivo (0 a ${listSize}):</label>
              <input type="number" id="input-position-index" min="0" max="${listSize}" value="0" class="form-input" />
            </div>

            <!-- Audio File Source -->
            <div class="form-group">
              <label class="form-label">Archivo de Audio (Local o Demo):</label>
              <div class="file-picker-box">
                <input type="file" id="file-audio" accept="audio/*" class="file-hidden-input" />
                <button type="button" id="btn-choose-file" class="btn-secondary-glow">
                  📂 Seleccionar audio de tu equipo (.mp3, .wav, .aac)
                </button>
                <div id="file-chosen-name" class="file-status-text">O selecciona una pista demo predeterminada abajo:</div>
              </div>

              <div class="preset-audio-chips">
                <button type="button" class="chip-audio active" data-src="/assets/audio/song_1.wav">Sintetizador C Mayor</button>
                <button type="button" class="chip-audio" data-src="/assets/audio/song_2.wav">Chillwave A Menor</button>
                <button type="button" class="chip-audio" data-src="/assets/audio/song_3.wav">Dream Pop F Mayor</button>
                <button type="button" class="chip-audio" data-src="/assets/audio/song_4.wav">Sunset Vibes G Mayor</button>
              </div>
            </div>

            <!-- Metadata -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Título:</label>
                <input type="text" id="input-title" placeholder="Ej: Algoritmo Estelar" class="form-input" value="Canción Nueva" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Artista:</label>
                <input type="text" id="input-artist" placeholder="Ej: Nodo Sonora" class="form-input" value="Artista Universitario" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Álbum:</label>
              <input type="text" id="input-album" placeholder="Ej: Listas Dobles 2026" class="form-input" value="Taller Algoritmos" />
            </div>

            <!-- Cover Preset Selection -->
            <div class="form-group">
              <label class="form-label">Portada del Álbum:</label>
              <div class="cover-selector-grid">
                <img src="/assets/covers/cover_1.png" class="cover-thumb selected" data-cover="/assets/covers/cover_1.png" />
                <img src="/assets/covers/cover_2.png" class="cover-thumb" data-cover="/assets/covers/cover_2.png" />
                <img src="/assets/covers/cover_3.png" class="cover-thumb" data-cover="/assets/covers/cover_3.png" />
                <img src="/assets/covers/cover_4.png" class="cover-thumb" data-cover="/assets/covers/cover_4.png" />
                <img src="/assets/covers/cover_5.png" class="cover-thumb" data-cover="/assets/covers/cover_5.png" />
                <img src="/assets/covers/cover_default.png" class="cover-thumb" data-cover="/assets/covers/cover_default.png" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button id="btn-cancel-modal" class="btn-subtle">Cancelar</button>
            <button id="btn-confirm-add" class="btn-primary-glow">✓ Insertar en Lista Doble</button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(listSize);
  }

  private attachEvents(listSize: number): void {
    const backdrop = this.modalContainer.querySelector('.modal-backdrop');
    const closeBtn = this.modalContainer.querySelector('#btn-close-modal');
    const cancelBtn = this.modalContainer.querySelector('#btn-cancel-modal');
    const confirmBtn = this.modalContainer.querySelector('#btn-confirm-add');

    const close = () => {
      this.modalContainer.innerHTML = '';
    };

    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);

    // Radio change
    const radios = this.modalContainer.querySelectorAll('input[name="insert-mode"]');
    const indexGroup = this.modalContainer.querySelector('#index-group') as HTMLElement;
    radios.forEach((r) => {
      r.addEventListener('change', (e) => {
        const val = (e.target as HTMLInputElement).value;
        this.modalContainer.querySelectorAll('.radio-card').forEach((c) => c.classList.remove('selected'));
        (e.target as HTMLElement).closest('.radio-card')?.classList.add('selected');
        if (indexGroup) indexGroup.style.display = val === 'position' ? 'block' : 'none';
      });
    });

    // File input
    const fileInput = this.modalContainer.querySelector('#file-audio') as HTMLInputElement;
    const chooseBtn = this.modalContainer.querySelector('#btn-choose-file');
    const chosenName = this.modalContainer.querySelector('#file-chosen-name');
    let chosenAudioUrl = '/assets/audio/song_1.wav';

    chooseBtn?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        this.selectedAudioBlob = file;
        chosenAudioUrl = URL.createObjectURL(file);
        if (chosenName) {
          chosenName.textContent = `Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        }
        // Auto fill title if empty
        const titleInput = this.modalContainer.querySelector('#input-title') as HTMLInputElement;
        if (titleInput && titleInput.value === 'Canción Nueva') {
          titleInput.value = file.name.replace(/\.[^/.]+$/, '');
        }
        // Deselect chips
        this.modalContainer.querySelectorAll('.chip-audio').forEach((ch) => ch.classList.remove('active'));
      }
    });

    // Preset audio chips
    const chips = this.modalContainer.querySelectorAll('.chip-audio');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        chosenAudioUrl = chip.getAttribute('data-src') || '/assets/audio/song_1.wav';
        this.selectedAudioBlob = null;
        if (chosenName) chosenName.textContent = `Pista demo: ${chip.textContent}`;
      });
    });

    // Cover selection
    const covers = this.modalContainer.querySelectorAll('.cover-thumb');
    covers.forEach((c) => {
      c.addEventListener('click', () => {
        covers.forEach((cv) => cv.classList.remove('selected'));
        c.classList.add('selected');
        this.selectedCoverUrl = c.getAttribute('data-cover') || '/assets/covers/cover_default.png';
      });
    });

    // Confirm button
    confirmBtn?.addEventListener('click', async () => {
      const titleInput = this.modalContainer.querySelector('#input-title') as HTMLInputElement;
      const artistInput = this.modalContainer.querySelector('#input-artist') as HTMLInputElement;
      const albumInput = this.modalContainer.querySelector('#input-album') as HTMLInputElement;
      const modeRadio = this.modalContainer.querySelector('input[name="insert-mode"]:checked') as HTMLInputElement;
      const indexInput = this.modalContainer.querySelector('#input-position-index') as HTMLInputElement;

      const title = titleInput.value.trim() || 'Canción Sin Título';
      const artist = artistInput.value.trim() || 'Artista Desconocido';
      const album = albumInput.value.trim() || 'Álbum Desconocido';
      const positionType = (modeRadio?.value || 'end') as 'beginning' | 'end' | 'position';
      const targetIndex = indexInput ? Math.max(0, Math.min(listSize, parseInt(indexInput.value, 10) || 0)) : 0;

      let finalAudioUrl = chosenAudioUrl;

      // If user uploaded a local file, persist in IndexedDB
      if (this.selectedAudioBlob) {
        const id = `upload-${Date.now()}`;
        try {
          finalAudioUrl = await this.storageService.storeAudioBlob(id, this.selectedAudioBlob);
        } catch {
          finalAudioUrl = URL.createObjectURL(this.selectedAudioBlob);
        }
      }

      const payload: CreateSongPayload = {
        title,
        artist,
        album,
        duration: 12,
        coverUrl: this.selectedCoverUrl,
        audioUrl: finalAudioUrl,
        isCustomUpload: !!this.selectedAudioBlob
      };

      close();
      this.callbacks.onAddSong(payload, positionType, targetIndex);
    });
  }
}
