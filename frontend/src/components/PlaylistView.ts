import { DoublyLinkedList } from '../data-structures/DoublyLinkedList';
import { SongNode } from '../data-structures/SongNode';
import { Song } from '../models/Song';
import { formatTime, escapeHtml } from '../utils/Formatters';

export interface PlaylistViewCallbacks {
  onSelectSong: (nodeId: string) => void;
  onDeleteSong: (nodeId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onOpenUploadModal: (positionHint?: 'head' | 'tail' | 'custom') => void;
}

export class PlaylistView {
  private container: HTMLElement;
  private callbacks: PlaylistViewCallbacks;
  private searchQuery: string = '';

  constructor(container: HTMLElement, callbacks: PlaylistViewCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public setSearchQuery(query: string, list: DoublyLinkedList<Song>): void {
    this.searchQuery = query.toLowerCase().trim();
    this.render(list);
  }

  public render(list: DoublyLinkedList<Song>): void {
    const allNodes = list.getAllNodes();
    const current = list.getCurrent();
    const head = list.head;
    const tail = list.tail;

    // Filter view without modifying the underlying doubly linked list!
    const filtered = allNodes.filter((node) => {
      if (!this.searchQuery) return true;
      const s = node.data;
      return (
        s.title.toLowerCase().includes(this.searchQuery) ||
        s.artist.toLowerCase().includes(this.searchQuery) ||
        s.album.toLowerCase().includes(this.searchQuery)
      );
    });

    let itemsHtml = '';
    if (filtered.length === 0) {
      itemsHtml = `
        <div class="empty-list-view">
          <div class="empty-icon">🎵</div>
          <p>${this.searchQuery ? 'No se encontraron canciones para la búsqueda.' : 'No hay canciones en la lista doble.'}</p>
          <button id="btn-add-first-song" class="btn-primary-glow">
            ➕ Agregar primera canción
          </button>
        </div>
      `;
    } else {
      itemsHtml = filtered
        .map((node) => {
          const originalIndex = allNodes.indexOf(node);
          const isCurrent = node === current || node.id === current?.id;
          const isHead = node === head;
          const isTail = node === tail;
          const s = node.data;

          return `
          <div class="playlist-row ${isCurrent ? 'row-current' : ''}" data-node-id="${node.id}" data-index="${originalIndex}">
            <div class="row-left">
              <span class="row-index">#${originalIndex + 1}</span>
              <img src="${s.coverUrl || '/assets/covers/cover_default.png'}" class="row-cover" onerror="this.src='/assets/covers/cover_default.png'" />
              <div class="row-meta">
                <div class="row-title" title="${escapeHtml(s.title)}">
                  ${isCurrent ? '<span class="status-dot">●</span> ' : ''}${escapeHtml(s.title)}
                </div>
                <div class="row-sub">
                  ${escapeHtml(s.artist)} • ${escapeHtml(s.album)}
                </div>
              </div>
            </div>

            <div class="row-tags">
              ${isHead ? '<span class="tag-badge tag-head">HEAD</span>' : ''}
              ${isTail ? '<span class="tag-badge tag-tail">TAIL</span>' : ''}
              ${isCurrent ? '<span class="tag-badge tag-current">ACTUAL</span>' : ''}
            </div>

            <div class="row-duration">${formatTime(s.duration)}</div>

            <div class="row-actions">
              <button class="btn-action-icon btn-reorder-up" data-index="${originalIndex}" title="Mover arriba" ${originalIndex === 0 ? 'disabled' : ''}>
                ▲
              </button>
              <button class="btn-action-icon btn-reorder-down" data-index="${originalIndex}" title="Mover abajo" ${originalIndex === allNodes.length - 1 ? 'disabled' : ''}>
                ▼
              </button>
              <button class="btn-action-icon btn-delete-row" data-node-id="${node.id}" title="Eliminar canción (Desconectar nodo)">
                🗑
              </button>
            </div>
          </div>
        `;
        })
        .join('');
    }

    this.container.innerHTML = `
      <div class="playlist-panel-inner">
        <div class="playlist-header">
          <div class="playlist-title-wrap">
            <h3 class="panel-heading">Lista de Reproducción</h3>
            <span class="badge-count">${allNodes.length} canciones</span>
          </div>

          <div class="playlist-quick-buttons">
            <button id="btn-quick-head" class="btn-secondary-glow" title="Insertar nodo al inicio (HEAD)">
              ⇤ Insertar al Inicio
            </button>
            <button id="btn-quick-tail" class="btn-secondary-glow" title="Insertar nodo al final (TAIL)">
              Insertar al Final ⇥
            </button>
            <button id="btn-quick-pos" class="btn-primary-glow" title="Insertar en posición específica">
              ➕ Agregar Canción
            </button>
          </div>
        </div>

        <div class="playlist-list-scroll">
          ${itemsHtml}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Quick Add buttons
    this.container.querySelector('#btn-quick-head')?.addEventListener('click', () => {
      this.callbacks.onOpenUploadModal('head');
    });

    this.container.querySelector('#btn-quick-tail')?.addEventListener('click', () => {
      this.callbacks.onOpenUploadModal('tail');
    });

    this.container.querySelector('#btn-quick-pos')?.addEventListener('click', () => {
      this.callbacks.onOpenUploadModal('custom');
    });

    this.container.querySelector('#btn-add-first-song')?.addEventListener('click', () => {
      this.callbacks.onOpenUploadModal('tail');
    });

    // Row clicks (select song)
    const rows = this.container.querySelectorAll('.playlist-row');
    rows.forEach((row) => {
      row.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.row-actions')) return; // Ignore if action button clicked
        const nodeId = (row as HTMLElement).dataset.nodeId;
        if (nodeId) this.callbacks.onSelectSong(nodeId);
      });
    });

    // Delete buttons
    this.container.querySelectorAll('.btn-delete-row').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = (btn as HTMLElement).dataset.nodeId;
        if (nodeId) this.callbacks.onDeleteSong(nodeId);
      });
    });

    // Reorder buttons
    this.container.querySelectorAll('.btn-reorder-up').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLElement).dataset.index || '0', 10);
        this.callbacks.onMoveUp(idx);
      });
    });

    this.container.querySelectorAll('.btn-reorder-down').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLElement).dataset.index || '0', 10);
        this.callbacks.onMoveDown(idx);
      });
    });
  }
}
