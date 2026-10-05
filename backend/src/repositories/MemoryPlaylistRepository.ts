import { IPlaylistRepository } from './IPlaylistRepository';
import { PlaylistDTO } from '../models/PlaylistDTO';

export class MemoryPlaylistRepository implements IPlaylistRepository {
  private playlists: Map<string, PlaylistDTO> = new Map();

  constructor() {
    this.seedDefaultPlaylists();
  }

  private seedDefaultPlaylists(): void {
    const defaultPlaylist1: PlaylistDTO = {
      id: 'default-playlist-1',
      name: 'Cyberpunk Synthwave',
      description: 'Futuristic electronic soundscapes for data structures study',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songs: [
        {
          id: 'song-1',
          title: 'Neon Odyssey',
          artist: 'Aetheric Pulse',
          album: 'Data Horizons',
          duration: 12,
          coverUrl: '/assets/covers/cover_1.png',
          audioUrl: '/assets/audio/song_1.wav'
        },
        {
          id: 'song-2',
          title: 'Binary Sunset',
          artist: 'Cyber Ghost',
          album: 'Linked Nodes Vol. 1',
          duration: 12,
          coverUrl: '/assets/covers/cover_2.png',
          audioUrl: '/assets/audio/song_2.wav'
        },
        {
          id: 'song-3',
          title: 'Quantum Drift',
          artist: 'Matrix Echo',
          album: 'Recursive Memory',
          duration: 12,
          coverUrl: '/assets/covers/cover_3.png',
          audioUrl: '/assets/audio/song_3.wav'
        },
        {
          id: 'song-4',
          title: 'Solar Flare',
          artist: 'Starlight Engine',
          album: 'Infinite Loops',
          duration: 12,
          coverUrl: '/assets/covers/cover_4.png',
          audioUrl: '/assets/audio/song_4.wav'
        }
      ]
    };

    const defaultPlaylist2: PlaylistDTO = {
      id: 'default-playlist-2',
      name: 'Estructuras Sonoras',
      description: 'Interactive Doubly Linked List workshop demo tracks',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songs: [
        {
          id: 'song-1',
          title: 'Head to Current',
          artist: 'Pointer Dynamics',
          album: 'Pointer Suite',
          duration: 12,
          coverUrl: '/assets/covers/cover_5.png',
          audioUrl: '/assets/audio/song_1.wav'
        },
        {
          id: 'song-2',
          title: 'Current to Tail',
          artist: 'Pointer Dynamics',
          album: 'Pointer Suite',
          duration: 12,
          coverUrl: '/assets/covers/cover_default.png',
          audioUrl: '/assets/audio/song_2.wav'
        }
      ]
    };

    this.playlists.set(defaultPlaylist1.id, defaultPlaylist1);
    this.playlists.set(defaultPlaylist2.id, defaultPlaylist2);
  }

  public async findAll(): Promise<PlaylistDTO[]> {
    return Array.from(this.playlists.values());
  }

  public async findById(id: string): Promise<PlaylistDTO | null> {
    return this.playlists.get(id) || null;
  }

  public async create(playlist: PlaylistDTO): Promise<PlaylistDTO> {
    this.playlists.set(playlist.id, playlist);
    return playlist;
  }

  public async update(id: string, updates: Partial<PlaylistDTO>): Promise<PlaylistDTO | null> {
    const existing = this.playlists.get(id);
    if (!existing) return null;

    const updated: PlaylistDTO = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.playlists.set(id, updated);
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    return this.playlists.delete(id);
  }
}
