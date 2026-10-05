import { Playlist, CreatePlaylistPayload } from '../models/Playlist';
import { Song } from '../models/Song';
import { escapeHtml } from '../utils/Formatters';

export interface PlaylistManagerCallbacks {
  onSelectPlaylist: (playlistId: string) => void;
  onCreatePlaylist: (payload: CreatePlaylistPayload) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onImportPlaylist: (playlistData: { name: string; description?: string; songs: Song[] }) => void;
  onExportCurrentPlaylist: () => void;
}

export class PlaylistManagerModal {
  private container: HTMLElement;
  private callbacks: PlaylistManagerCallbacks;

  constructor(container: HTMLElement, callbacks: PlaylistManagerCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public open(playlists: Playlist[], activePlaylistId: string): void {
    const listHtml = playlists
      .map((pl) => {
        const isActive = pl.id === activePlaylistId;
        return `
        <div class="playlist-manager-row ${isActive ? 'active-pl-row' : ''}">
          <div class="pl-meta">
            <div class="pl-name">
              ${escapeHtml(pl.name)} ${isActive ? '<span class="badge-active">ACTIVA</span>' : ''}
            </div>
            <div class="pl-sub">${pl.songs?.length || 0} canciones • ${escapeHtml(pl.description || 'Sin descripción')}</div>
          </div>
          <div class="pl-actions">
            ${
              !isActive
                ? `<button class="btn-secondary-glow btn-load-pl" data-id="${pl.id}">Cargar</button>`
                : '<span class="loaded-check">✔ En Uso</span>'
            }
            ${
              playlists.length > 1
                ? `<button class="btn-action-icon btn-delete-pl" data-id="${pl.id}" title="Eliminar playlist">🗑</button>`
                : ''
            }
          </div>
        </div>
      `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">📂 Gestión de Listas de Reproducción</h3>
            <button id="btn-close-pl-modal" class="btn-close">✕</button>
          </div>

          <div class="modal-body">
            <!-- Active Playlists List -->
            <div class="form-group">
              <label class="form-label">Tus Listas Disponibles:</label>
              <div class="playlist-manager-list">
                ${listHtml}
              </div>
            </div>

            <hr class="modal-divider" />

            <!-- Create New Playlist Form -->
            <div class="form-group">
              <label class="form-label">Crear Nueva Lista:</label>
              <div class="form-row">
                <input type="text" id="input-new-pl-name" placeholder="Nombre de la nueva playlist..." class="form-input flex-1" />
                <button id="btn-create-pl" class="btn-primary-glow">➕ Crear Lista</button>
              </div>
            </div>

            <hr class="modal-divider" />

            <!-- Import / Export Section -->
            <div class="form-group">
              <label class="form-label">📥 Importar y Exportar JSON:</label>
              <div class="import-export-row">
                <button id="btn-export-json" class="btn-secondary-glow">
                  📤 Exportar Lista Actual a JSON
                </button>

                <div class="import-file-wrap">
                  <input type="file" id="input-import-json" accept=".json" class="file-hidden-input" />
                  <button id="btn-trigger-import" class="btn-secondary-glow">
                    📥 Importar desde archivo JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button id="btn-done-pl-modal" class="btn-subtle">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const backdrop = this.container.querySelector('.modal-backdrop');
    const closeBtn = this.container.querySelector('#btn-close-pl-modal');
    const doneBtn = this.container.querySelector('#btn-done-pl-modal');

    const close = () => {
      this.container.innerHTML = '';
    };

    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
    closeBtn?.addEventListener('click', close);
    doneBtn?.addEventListener('click', close);

    // Load buttons
    this.container.querySelectorAll('.btn-load-pl').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) {
          close();
          this.callbacks.onSelectPlaylist(id);
        }
      });
    });

    // Delete buttons
    this.container.querySelectorAll('.btn-delete-pl').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id && confirm('¿Estás seguro de eliminar esta playlist?')) {
          this.callbacks.onDeletePlaylist(id);
          close();
        }
      });
    });

    // Create playlist
    const createBtn = this.container.querySelector('#btn-create-pl');
    createBtn?.addEventListener('click', () => {
      const nameInput = this.container.querySelector('#input-new-pl-name') as HTMLInputElement;
      const name = nameInput.value.trim();
      if (!name) {
        alert('Por favor escribe un nombre para la lista');
        return;
      }
      this.callbacks.onCreatePlaylist({ name, description: 'Creada por el usuario', songs: [] });
      close();
    });

    // Export JSON
    this.container.querySelector('#btn-export-json')?.addEventListener('click', () => {
      this.callbacks.onExportCurrentPlaylist();
    });

    // Import JSON
    const fileInput = this.container.querySelector('#input-import-json') as HTMLInputElement;
    const triggerBtn = this.container.querySelector('#btn-trigger-import');
    triggerBtn?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target?.result as string);
            if (!parsed.name || !Array.isArray(parsed.songs)) {
              alert('Formato JSON inválido. Debe contener "name" y un array de "songs".');
              return;
            }
            this.callbacks.onImportPlaylist(parsed);
            close();
          } catch (err) {
            alert('Error leyendo archivo JSON: ' + (err as Error).message);
          }
        };
        reader.readAsText(file);
      }
    });
  }
}
