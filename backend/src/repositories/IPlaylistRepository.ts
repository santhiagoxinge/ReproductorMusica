import { PlaylistDTO } from '../models/PlaylistDTO';

export interface IPlaylistRepository {
  findAll(): Promise<PlaylistDTO[]>;
  findById(id: string): Promise<PlaylistDTO | null>;
  create(playlist: PlaylistDTO): Promise<PlaylistDTO>;
  update(id: string, playlist: Partial<PlaylistDTO>): Promise<PlaylistDTO | null>;
  delete(id: string): Promise<boolean>;
}
