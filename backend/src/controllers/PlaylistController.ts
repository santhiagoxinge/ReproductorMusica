import { Request, Response, NextFunction } from 'express';
import { PlaylistService } from '../services/PlaylistService';

export class PlaylistController {
  constructor(private playlistService: PlaylistService) {}

  public getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const playlists = await this.playlistService.getAllPlaylists();
      res.status(200).json({ success: true, data: playlists });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const playlist = await this.playlistService.getPlaylistById(id);
      res.status(200).json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const playlist = await this.playlistService.createPlaylist(req.body);
      res.status(201).json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const playlist = await this.playlistService.updatePlaylist(id, req.body);
      res.status(200).json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.playlistService.deletePlaylist(id);
      res.status(200).json({ success: true, message: `Playlist '${id}' deleted successfully` });
    } catch (error) {
      next(error);
    }
  };
}
