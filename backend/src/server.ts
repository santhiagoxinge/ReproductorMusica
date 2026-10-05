import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createPlaylistRouter } from './routes/playlistRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3001;

// Global middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Music Player Doubly Linked List API'
  });
});

// Playlists API
app.use('/api/playlists', createPlaylistRouter());

// Error handler middleware
app.use(errorHandler);

// Start server if not imported
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Backend Server] Running on http://localhost:${PORT}`);
  });
}
