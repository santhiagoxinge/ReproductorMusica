import { Playlist, CreatePlaylistPayload } from '../models/Playlist';

export class ApiService {
  private baseUrl: string = '/api';

  public async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async fetchPlaylists(): Promise<Playlist[]> {
    try {
      const res = await fetch(`${this.baseUrl}/playlists`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn('Backend API unavailable, falling back to local client state');
      return [];
    }
  }

  public async createPlaylist(payload: CreatePlaylistPayload): Promise<Playlist | null> {
    try {
      const res = await fetch(`${this.baseUrl}/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('Backend API create failed, using local mode');
      return null;
    }
  }

  public async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | null> {
    try {
      const res = await fetch(`${this.baseUrl}/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('Backend API update failed, using local mode');
      return null;
    }
  }

  public async deletePlaylist(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/playlists/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
