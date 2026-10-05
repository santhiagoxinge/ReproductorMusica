export interface SongDTO {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  isCustomUpload?: boolean;
}

export interface PlaylistDTO {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  songs: SongDTO[];
}

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  songs?: SongDTO[];
}

export interface UpdatePlaylistInput {
  name?: string;
  description?: string;
  songs?: SongDTO[];
}
