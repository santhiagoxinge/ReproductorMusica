import { Song } from './Song';

/**
 * Playlist model for metadata and serialization.
 * Internal playback navigation uses DoublyLinkedList, not an array.
 */
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  songs: Song[]; // Serializable array format for storage/JSON import-export
}

export interface CreatePlaylistPayload {
  name: string;
  description?: string;
  songs?: Song[];
}
