import { IPlaylistRepository } from '../repositories/IPlaylistRepository';
import { PlaylistDTO, CreatePlaylistInput, UpdatePlaylistInput } from '../models/PlaylistDTO';

export class PlaylistService {
  constructor(private playlistRepository: IPlaylistRepository) {}

  public async getAllPlaylists(): Promise<PlaylistDTO[]> {
    return this.playlistRepository.findAll();
  }

  public async getPlaylistById(id: string): Promise<PlaylistDTO> {
    const playlist = await this.playlistRepository.findById(id);
    if (!playlist) {
      throw new Error(`Playlist with ID '${id}' was not found`);
    }
    return playlist;
  }

  public async createPlaylist(input: CreatePlaylistInput): Promise<PlaylistDTO> {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Playlist name is required and cannot be empty');
    }

    const newPlaylist: PlaylistDTO = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: input.name.trim(),
      description: input.description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      songs: input.songs || []
    };

    return this.playlistRepository.create(newPlaylist);
  }

  public async updatePlaylist(id: string, input: UpdatePlaylistInput): Promise<PlaylistDTO> {
    const existing = await this.playlistRepository.findById(id);
    if (!existing) {
      throw new Error(`Playlist with ID '${id}' was not found`);
    }

    const updated = await this.playlistRepository.update(id, input);
    if (!updated) {
      throw new Error(`Failed to update playlist '${id}'`);
    }

    return updated;
  }

  public async deletePlaylist(id: string): Promise<boolean> {
    const existing = await this.playlistRepository.findById(id);
    if (!existing) {
      throw new Error(`Playlist with ID '${id}' was not found`);
    }
    return this.playlistRepository.delete(id);
  }
}
