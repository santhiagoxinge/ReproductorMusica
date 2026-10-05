import { DoublyLinkedList } from './data-structures/DoublyLinkedList';
import { Song, CreateSongPayload } from './models/Song';
import { Playlist, CreatePlaylistPayload } from './models/Playlist';
import { AudioManager } from './services/AudioManager';
import { StorageService } from './services/StorageService';
import { ApiService } from './services/ApiService';
import { SceneManager } from './three/SceneManager';
import { AudioPlayer, RepeatMode } from './components/AudioPlayer';
import { PlaylistView } from './components/PlaylistView';
import { EducationalPanel } from './components/EducationalPanel';
import { SongUploadModal } from './components/SongUploadModal';
import { PlaylistManagerModal } from './components/PlaylistManagerModal';
import { SAMPLE_SONGS } from './utils/SampleSongs';

class MusicPlayerApp {
  private list: DoublyLinkedList<Song>;
  private audioManager: AudioManager;
  private storageService: StorageService;
  private apiService: ApiService;
  private sceneManager!: SceneManager;

  private audioPlayer!: AudioPlayer;
  private playlistView!: PlaylistView;
  private educationalPanel!: EducationalPanel;
  private songUploadModal!: SongUploadModal;
  private playlistManagerModal!: PlaylistManagerModal;

  private playlists: Playlist[] = [];
  private activePlaylistId: string = 'default-playlist-1';
  private repeatMode: RepeatMode = 'none';

  constructor() {
    this.list = new DoublyLinkedList<Song>();
    this.audioManager = new AudioManager();
    this.storageService = new StorageService();
    this.apiService = new ApiService();
  }

  public async init(): Promise<void> {
    console.log('[MusicPlayerApp] Initializing workshop application...');

    // 1. Initialize Storage
    await this.storageService.init();

    // 2. Setup 3D Scene
    const viewportContainer = document.getElementById('three-canvas-container');
    if (!viewportContainer) throw new Error('Viewport container missing in DOM');
    this.sceneManager = new SceneManager(viewportContainer);

    // 3. Load or Seed Playlists
    await this.loadInitialPlaylists();

    // 4. Initialize UI Components
    this.initUIComponents();

    // 5. Connect Audio Manager Events
    this.setupAudioListeners();

    // 6. Connect Header & Global Listeners
    this.setupGlobalListeners();

    // 7. Initial Render
    this.refreshAll(true);

    this.showToast('¡Bienvenido al Taller de Listas Dobles!', 'toast-success');
    console.log('[MusicPlayerApp] Ready.');
  }

  private async loadInitialPlaylists(): Promise<void> {
    // Attempt to load from Backend API first
    const apiPlaylists = await this.apiService.fetchPlaylists();

    if (apiPlaylists.length > 0) {
      this.playlists = apiPlaylists;
    } else {
      // Check localStorage
      const localPlaylists = this.storageService.getLocalData<Playlist[]>('saved_playlists', []);
      if (localPlaylists.length > 0) {
        this.playlists = localPlaylists;
      } else {
        // Fallback default seeded playlist
        this.playlists = [
          {
            id: 'default-playlist-1',
            name: 'Cyberpunk Synthwave',
            description: 'Pistas iniciales para aprendizaje de listas dobles',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            songs: [...SAMPLE_SONGS]
          }
        ];
        this.storageService.saveLocalData('saved_playlists', this.playlists);
      }
    }

    const active = this.playlists.find((p) => p.id === this.activePlaylistId) || this.playlists[0];
    this.activePlaylistId = active.id;
    this.loadPlaylistIntoLinkedList(active);
  }

  private loadPlaylistIntoLinkedList(playlist: Playlist): void {
    this.list.clear();
    if (playlist.songs && playlist.songs.length > 0) {
      playlist.songs.forEach((song) => {
        this.list.insertAtEnd(song);
      });
    }

    this.educationalPanel?.setLastAction(
      `Cargada playlist '${playlist.name}'`,
      `list.clear(); playlist.songs.forEach(s => list.insertAtEnd(s));`
    );
  }

  private saveCurrentPlaylistState(): void {
    const currentPlaylist = this.playlists.find((p) => p.id === this.activePlaylistId);
    if (currentPlaylist) {
      currentPlaylist.songs = this.list.toArray();
      currentPlaylist.updatedAt = new Date().toISOString();
      this.storageService.saveLocalData('saved_playlists', this.playlists);
      // Sync in background with backend if available
      this.apiService.updatePlaylist(currentPlaylist.id, { songs: currentPlaylist.songs });
    }
  }

  private initUIComponents(): void {
    // 1. Audio Player Bar
    const playerContainer = document.getElementById('player-bar-container')!;
    this.audioPlayer = new AudioPlayer(playerContainer, {
      onPlay: () => this.handlePlay(),
      onPause: () => this.handlePause(),
      onNext: () => this.handleNext(),
      onPrevious: () => this.handlePrevious(),
      onSeek: (sec) => this.audioManager.seek(sec),
      onVolumeChange: (vol) => {
        this.audioManager.setVolume(vol);
        this.audioPlayer.setVolumeState(vol, this.audioManager.getIsMuted());
      },
      onToggleMute: () => {
        const isMuted = this.audioManager.toggleMute();
        this.audioPlayer.setVolumeState(this.audioManager.getVolume(), isMuted);
      },
      onToggleShuffle: () => this.handleShuffle(),
      onToggleRepeat: () => this.handleRepeatToggle()
    });

    // 2. Educational Panel
    const eduContainer = document.getElementById('edu-panel-container')!;
    this.educationalPanel = new EducationalPanel(eduContainer);

    // 3. Playlist View
    const playlistViewContainer = document.getElementById('playlist-view-container')!;
    this.playlistView = new PlaylistView(playlistViewContainer, {
      onSelectSong: (nodeId) => this.handleSelectSongById(nodeId),
      onDeleteSong: (nodeId) => this.handleDeleteSong(nodeId),
      onMoveUp: (idx) => this.handleReorder(idx, idx - 1),
      onMoveDown: (idx) => this.handleReorder(idx, idx + 1),
      onOpenUploadModal: (hint) => this.songUploadModal.open(hint, this.list.getSize())
    });

    // 4. Modals
    const modalHost = document.getElementById('modal-container')!;
    this.songUploadModal = new SongUploadModal(modalHost, this.storageService, {
      onAddSong: (payload, mode, index) => this.handleAddSong(payload, mode, index)
    });

    this.playlistManagerModal = new PlaylistManagerModal(modalHost, {
      onSelectPlaylist: (id) => this.handleSwitchPlaylist(id),
      onCreatePlaylist: (payload) => this.handleCreatePlaylist(payload),
      onDeletePlaylist: (id) => this.handleDeletePlaylist(id),
      onImportPlaylist: (data) => this.handleImportPlaylist(data),
      onExportCurrentPlaylist: () => this.handleExportPlaylist()
    });

    // 5. 3D Scene Node Click
    this.sceneManager.onNodeSelect((nodeId) => {
      this.handleSelectSongById(nodeId);
    });
  }

  private setupAudioListeners(): void {
    this.audioManager.onPlayCallback = () => {
      this.audioPlayer.updatePlaybackState(true);
      this.sceneManager.setAudioPlaying(true);
      this.sceneManager.character.setState('jump', 800);
    };

    this.audioManager.onPauseCallback = () => {
      this.audioPlayer.updatePlaybackState(false);
      this.sceneManager.setAudioPlaying(false);
      this.sceneManager.character.setState('thinking', 1500);
    };

    this.audioManager.onTimeUpdateCallback = (currentTime, duration) => {
      this.audioPlayer.updateTime(currentTime, duration);
    };

    this.audioManager.onEndedCallback = () => {
      if (this.repeatMode === 'one') {
        this.audioManager.seek(0);
        this.audioManager.play();
      } else {
        this.handleNext(true);
      }
    };
  }

  private setupGlobalListeners(): void {
    // Open Playlists Modal
    document.getElementById('btn-open-playlists')?.addEventListener('click', () => {
      this.playlistManagerModal.open(this.playlists, this.activePlaylistId);
    });

    // Open Upload Modal
    document.getElementById('btn-open-upload')?.addEventListener('click', () => {
      this.songUploadModal.open('tail', this.list.getSize());
    });

    // Reset / Focus Camera
    document.getElementById('btn-reset-cam')?.addEventListener('click', () => {
      const cur = this.list.getCurrent();
      if (cur) {
        const idx = this.list.indexOf(cur);
        this.sceneManager.focusOnNode(idx, true);
      }
    });

    // Search Input
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value;
      this.playlistView.setSearchQuery(q, this.list);
    });

    // Playlist Drawer Toggle
    const drawer = document.getElementById('playlist-drawer');
    const drawerToggle = document.getElementById('playlist-drawer-toggle');
    drawerToggle?.addEventListener('click', () => {
      drawer?.classList.toggle('collapsed');
      if (drawerToggle) {
        drawerToggle.textContent = drawer?.classList.contains('collapsed') ? '☰' : '✕';
      }
    });
  }

  /* -------------------------------------------------------------
   * NAVIGATION & PLAYBACK LOGIC
   * Strictly uses `current.next` and `current.previous`
   * ------------------------------------------------------------- */

  private handlePlay(): void {
    const cur = this.list.getCurrent();
    if (!cur) {
      this.showToast('No hay canciones en la lista', 'toast-warning');
      this.sceneManager.character.setState('confused', 1500);
      return;
    }
    this.audioManager.play();
  }

  private handlePause(): void {
    this.audioManager.pause();
  }

  /**
   * Navigates to the next song using current.next.
   */
  public handleNext(isAutoAdvance: boolean = false): void {
    const current = this.list.getCurrent();

    if (!current) {
      this.showToast('Lista vacía', 'toast-warning');
      this.sceneManager.character.performBoundaryRecoil('next');
      return;
    }

    const nextNode = current.next;

    if (nextNode) {
      const currIdx = this.list.indexOf(current);
      const nextIdx = this.list.indexOf(nextNode);

      const fromPos = this.sceneManager.getNodeCardPosition(currIdx);
      const toPos = this.sceneManager.getNodeCardPosition(nextIdx);

      if (fromPos && toPos) {
        // Animate character along the 3D connection arc
        this.sceneManager.character.moveToNextNode(fromPos, toPos, () => {
          // Conceptually: current = current.next
          this.list.moveNext();
          this.onSongNavigated(this.list.getCurrent()?.data || null, 'siguiente', 'current = current.next;');
        });
      } else {
        this.list.moveNext();
        this.onSongNavigated(this.list.getCurrent()?.data || null, 'siguiente', 'current = current.next;');
      }
    } else {
      // At tail
      if (this.repeatMode === 'all' && this.list.head) {
        // Loop back to head
        this.list.setCurrent(this.list.head);
        this.showToast('Repitiendo playlist desde HEAD', 'toast-success');
        this.sceneManager.character.setState('jump', 1000);
        this.onSongNavigated(this.list.getCurrent()?.data || null, 'repetición', 'current = this.head;');
      } else {
        this.sceneManager.character.performBoundaryRecoil('next');
        this.showToast('No hay siguiente canción (Límite TAIL)', 'toast-warning');
        this.educationalPanel.setLastAction(
          'Intento de avance fallido: current.next es null',
          'if (!current.next) { /* Límite alcanzado en TAIL */ }'
        );
      }
    }
  }

  /**
   * Navigates to the previous song using current.previous.
   */
  public handlePrevious(): void {
    const current = this.list.getCurrent();

    if (!current) {
      this.showToast('Lista vacía', 'toast-warning');
      this.sceneManager.character.performBoundaryRecoil('prev');
      return;
    }

    const prevNode = current.previous;

    if (prevNode) {
      const currIdx = this.list.indexOf(current);
      const prevIdx = this.list.indexOf(prevNode);

      const fromPos = this.sceneManager.getNodeCardPosition(currIdx);
      const toPos = this.sceneManager.getNodeCardPosition(prevIdx);

      if (fromPos && toPos) {
        this.sceneManager.character.moveToPreviousNode(fromPos, toPos, () => {
          // Conceptually: current = current.previous
          this.list.movePrevious();
          this.onSongNavigated(this.list.getCurrent()?.data || null, 'anterior', 'current = current.previous;');
        });
      } else {
        this.list.movePrevious();
        this.onSongNavigated(this.list.getCurrent()?.data || null, 'anterior', 'current = current.previous;');
      }
    } else {
      // At head
      this.sceneManager.character.performBoundaryRecoil('prev');
      this.showToast('No hay canción anterior (Límite HEAD)', 'toast-warning');
      this.educationalPanel.setLastAction(
        'Intento de retroceso fallido: current.previous es null',
        'if (!current.previous) { /* Límite alcanzado en HEAD */ }'
      );
    }
  }

  private onSongNavigated(song: Song | null, actionName: string, code: string): void {
    if (song) {
      this.audioManager.loadSong(song);
      this.audioManager.play();
    }
    this.educationalPanel.setLastAction(`Navegación hacia ${actionName}: ${song?.title || 'Ninguna'}`, code);
    this.refreshAll();
  }

  public handleSelectSongById(nodeId: string): void {
    const changed = this.list.setCurrentById(nodeId);
    if (changed) {
      const song = this.list.getCurrent()?.data;
      if (song) {
        this.audioManager.loadSong(song);
        this.audioManager.play();
      }
      this.sceneManager.character.setState('jump', 800);
      this.educationalPanel.setLastAction(
        `Selección directa de nodo 0x${nodeId.slice(-6).toUpperCase()}`,
        `list.setCurrentById('${nodeId}');`
      );
      this.refreshAll();
    }
  }

  /* -------------------------------------------------------------
   * INSERTION & DELETION
   * Demonstrates Doubly Linked List dynamic modification
   * ------------------------------------------------------------- */

  public handleAddSong(
    payload: CreateSongPayload,
    mode: 'beginning' | 'end' | 'position',
    targetIndex: number = 0
  ): void {
    const newSong: Song = {
      id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: payload.title,
      artist: payload.artist,
      album: payload.album || 'Single',
      duration: payload.duration || 12,
      coverUrl: payload.coverUrl || '/assets/covers/cover_default.png',
      audioUrl: payload.audioUrl,
      isCustomUpload: payload.isCustomUpload
    };

    let codeSnippet = '';
    let msg = '';

    if (mode === 'beginning') {
      this.list.insertAtBeginning(newSong);
      codeSnippet = `const newNode = new SongNode(newSong);\nnewNode.next = this.head;\nthis.head.previous = newNode;\nthis.head = newNode;`;
      msg = `Canción insertada al inicio (nuevo HEAD): ${newSong.title}`;
    } else if (mode === 'position') {
      this.list.insertAtPosition(targetIndex, newSong);
      codeSnippet = `// Inserción en índice ${targetIndex}\nprevNode.next = newNode;\nnewNode.previous = prevNode;\nnewNode.next = targetNode;\ntargetNode.previous = newNode;`;
      msg = `Canción insertada en la posición ${targetIndex + 1}: ${newSong.title}`;
    } else {
      this.list.insertAtEnd(newSong);
      codeSnippet = `const newNode = new SongNode(newSong);\nthis.tail.next = newNode;\nnewNode.previous = this.tail;\nthis.tail = newNode;`;
      msg = `Canción insertada al final (nuevo TAIL): ${newSong.title}`;
    }

    this.sceneManager.character.celebrate();
    this.showToast(msg, 'toast-success');
    this.educationalPanel.setLastAction(msg, codeSnippet);

    this.saveCurrentPlaylistState();
    this.refreshAll(true);
  }

  public handleDeleteSong(nodeId: string): void {
    const nodeToDelete = this.list.getAllNodes().find((n) => n.id === nodeId);
    if (!nodeToDelete) return;

    const title = nodeToDelete.data.title;
    const deleted = this.list.delete(nodeId);

    if (deleted) {
      this.sceneManager.character.sad();
      this.showToast(`Canción eliminada: ${title}`, 'toast-error');

      const codeSnippet = `// Reconexión de punteros adyacentes\nprevNode.next = nextNode;\nnextNode.previous = prevNode;`;
      this.educationalPanel.setLastAction(`Nodo eliminado: ${title}`, codeSnippet);

      // If current was deleted and audio was playing, load new current
      const cur = this.list.getCurrent();
      if (cur) {
        this.audioManager.loadSong(cur.data);
      } else {
        this.audioManager.pause();
      }

      this.saveCurrentPlaylistState();
      this.refreshAll(true);
    }
  }

  /* -------------------------------------------------------------
   * SHUFFLE & REORDER
   * ------------------------------------------------------------- */

  public handleShuffle(): void {
    if (this.list.getSize() <= 1) {
      this.showToast('Se necesitan al menos 2 canciones para mezclar', 'toast-warning');
      this.sceneManager.character.setState('confused', 1500);
      return;
    }

    this.list.shuffle();
    this.sceneManager.character.setState('reach', 1200);
    this.showToast('Lista mezclada (Punteros reconstruidos)', 'toast-success');

    this.educationalPanel.setLastAction(
      'Algoritmo de mezcla ejecutado',
      `// Reconexión física de punteros en orden aleatorio\nnodes.forEach((n, i) => {\n  n.prev = nodes[i-1] || null;\n  n.next = nodes[i+1] || null;\n});`
    );

    this.saveCurrentPlaylistState();
    this.refreshAll(true);
  }

  public handleReorder(fromIndex: number, toIndex: number): void {
    const success = this.list.reorder(fromIndex, toIndex);
    if (success) {
      this.sceneManager.character.setState('reach', 1200);
      this.showToast(`Nodo movido de posición ${fromIndex + 1} a ${toIndex + 1}`, 'toast-success');

      this.educationalPanel.setLastAction(
        `Nodo reordenado (${fromIndex + 1} ➔ ${toIndex + 1})`,
        `// Desconexión de posición actual y re-inserción con actualización de prev y next\nlist.reorder(${fromIndex}, ${toIndex});`
      );

      this.saveCurrentPlaylistState();
      this.refreshAll(true);
    }
  }

  public handleRepeatToggle(): void {
    if (this.repeatMode === 'none') {
      this.repeatMode = 'one';
      this.showToast('Repetición: Canción actual activada', 'toast-success');
    } else if (this.repeatMode === 'one') {
      this.repeatMode = 'all';
      this.showToast('Repetición: Toda la playlist activada', 'toast-success');
    } else {
      this.repeatMode = 'none';
      this.showToast('Repetición desactivada', 'toast-warning');
    }
    this.audioPlayer.setRepeatMode(this.repeatMode);
  }

  /* -------------------------------------------------------------
   * PLAYLIST MANAGEMENT & IMPORT / EXPORT
   * ------------------------------------------------------------- */

  public handleSwitchPlaylist(playlistId: string): void {
    const target = this.playlists.find((p) => p.id === playlistId);
    if (!target) return;

    this.activePlaylistId = target.id;
    this.loadPlaylistIntoLinkedList(target);

    const first = this.list.getCurrent();
    if (first) {
      this.audioManager.loadSong(first.data);
    } else {
      this.audioManager.pause();
    }

    this.sceneManager.character.setState('celebrate', 1500);
    this.showToast(`Cargada playlist: ${target.name}`, 'toast-success');
    this.refreshAll(true);
  }

  public async handleCreatePlaylist(payload: CreatePlaylistPayload): Promise<void> {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: payload.name,
      description: payload.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songs: payload.songs || []
    };

    this.playlists.push(newPl);
    this.storageService.saveLocalData('saved_playlists', this.playlists);
    await this.apiService.createPlaylist(payload);

    this.handleSwitchPlaylist(newPl.id);
  }

  public async handleDeletePlaylist(id: string): Promise<void> {
    this.playlists = this.playlists.filter((p) => p.id !== id);
    this.storageService.saveLocalData('saved_playlists', this.playlists);
    await this.apiService.deletePlaylist(id);

    if (this.activePlaylistId === id && this.playlists.length > 0) {
      this.handleSwitchPlaylist(this.playlists[0].id);
    } else {
      this.refreshAll(true);
    }
  }

  public handleExportPlaylist(): void {
    const active = this.playlists.find((p) => p.id === this.activePlaylistId);
    if (!active) return;

    const exportData = {
      name: active.name,
      description: active.description,
      exportedAt: new Date().toISOString(),
      songs: this.list.toArray()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.name.toLowerCase().replace(/\s+/g, '_')}_playlist.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('Playlist exportada a JSON exitosamente', 'toast-success');
  }

  public handleImportPlaylist(data: { name: string; description?: string; songs: Song[] }): void {
    const newPl: Playlist = {
      id: `import-${Date.now()}`,
      name: data.name,
      description: data.description || 'Importada desde JSON',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songs: data.songs
    };

    this.playlists.push(newPl);
    this.storageService.saveLocalData('saved_playlists', this.playlists);
    this.apiService.createPlaylist({ name: newPl.name, description: newPl.description, songs: newPl.songs });

    this.handleSwitchPlaylist(newPl.id);
    this.showToast(`Playlist '${newPl.name}' importada exitosamente`, 'toast-success');
  }

  /* -------------------------------------------------------------
   * SYNCHRONIZATION & RENDER DISPATCH
   * ------------------------------------------------------------- */

  private refreshAll(rebuild3D: boolean = false): void {
    if (rebuild3D) {
      this.sceneManager.rebuildFromList(this.list);
    } else {
      this.sceneManager.updatePointers(this.list);
    }

    const cur = this.list.getCurrent();
    this.audioPlayer.updateSong(cur?.data || null);
    this.playlistView.render(this.list);
    this.educationalPanel.render(this.list);

    if (cur) {
      const idx = this.list.indexOf(cur);
      this.sceneManager.focusOnNode(idx, true);
    }
  }

  private showToast(message: string, type: 'toast-success' | 'toast-warning' | 'toast-error' = 'toast-success'): void {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'toast-success' ? '✔' : type === 'toast-warning' ? '⚠' : '✖';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new MusicPlayerApp();
  app.init().catch((err) => console.error('[Fatal Error]:', err));
});
