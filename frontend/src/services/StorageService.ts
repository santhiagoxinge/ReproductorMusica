/**
 * StorageService
 * Manages client-side persistence using IndexedDB for audio files and LocalStorage for metadata.
 */
export class StorageService {
  private dbName: string = 'MusicPlayerDoublyLinkedListDB';
  private dbVersion: number = 1;
  private db: IDBDatabase | null = null;

  public async init(): Promise<void> {
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported in this browser environment');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('audioFiles')) {
          db.createObjectStore('audioFiles', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  public async storeAudioBlob(id: string, blob: Blob): Promise<string> {
    if (!this.db) await this.init();
    if (!this.db) return URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('audioFiles', 'readwrite');
      const store = tx.objectStore('audioFiles');
      const record = { id, blob, updatedAt: Date.now() };

      const request = store.put(record);
      request.onsuccess = () => {
        resolve(URL.createObjectURL(blob));
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async getAudioUrl(id: string): Promise<string | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('audioFiles', 'readonly');
      const store = tx.objectStore('audioFiles');
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(URL.createObjectURL(request.result.blob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  public saveLocalData(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  public getLocalData<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return fallback;
    }
  }
}
