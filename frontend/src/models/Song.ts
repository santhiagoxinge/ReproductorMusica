/**
 * Song interface representing an audio track in the music player.
 * All property names and business types are strictly in English.
 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  isCustomUpload?: boolean;
}

/**
 * Payload used when creating or uploading a new song.
 */
export interface CreateSongPayload {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  coverUrl?: string;
  audioUrl: string;
  isCustomUpload?: boolean;
}
