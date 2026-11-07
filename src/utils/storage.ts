import type { MediaItem, PlaylistRecord } from '../types/media';

const DB_NAME = 'sonara-v1';
const STORE_NAME = 'items';
const LISTS_KEY = 'sonara-lists';

export function openMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export function getAllMediaItems(db: IDBDatabase | null): Promise<MediaItem[]> {
  if (!db) return Promise.resolve([]);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result as MediaItem[]) || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export function putMediaItem(db: IDBDatabase | null, item: MediaItem): Promise<void> {
  if (!db) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function deleteMediaItem(db: IDBDatabase | null, id: string): Promise<void> {
  if (!db) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function loadPlaylists(): PlaylistRecord[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    return raw ? (JSON.parse(raw) as PlaylistRecord[]) : [];
  } catch {
    return [];
  }
}

export function savePlaylists(lists: PlaylistRecord[]): void {
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  } catch {
    // Ignore storage quota errors
  }
}
