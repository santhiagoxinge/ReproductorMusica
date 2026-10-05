import { Router } from 'express';
import { PlaylistController } from '../controllers/PlaylistController';
import { PlaylistService } from '../services/PlaylistService';
import { MemoryPlaylistRepository } from '../repositories/MemoryPlaylistRepository';

export const createPlaylistRouter = (): Router => {
  const router = Router();
  const repository = new MemoryPlaylistRepository();
  const service = new PlaylistService(repository);
  const controller = new PlaylistController(service);

  router.get('/', controller.getAll);
  router.post('/', controller.create);
  router.get('/:id', controller.getById);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
};
