export type MediaType = 'audio' | 'video';

export type LibraryTab = 'songs' | 'videos' | 'lists';

export type LibraryViewMode = 'list' | 'hero';

export type AppNavSpace = 'home' | 'music' | 'video' | 'library' | 'settings';

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  artist: string;
  name: string;
  size?: number;
  mime?: string;
  blob: Blob;
  added: number;
}

export interface PlaylistRecord {
  name: string;
  ids: string[];
  total: number;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface EqualizerPreset {
  name: string;
  values: [number, number, number, number, number];
}

export interface UserPreferences {
  themeMode: 'dark' | 'light' | 'oled';
  accentColor: 'terracotta' | 'amber' | 'emerald' | 'cyan' | 'violet';
  defaultPlaySpeed: number;
  autoPlayNext: boolean;
  normalizeAudio: boolean;
  showTimeRemaining: boolean;
}
