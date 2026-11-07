import type { LyricLine, MediaType, PlaylistRecord } from '../types/media';

export const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2, 0.75] as const;

export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000] as const;

export const EQ_PRESETS: Record<string, [number, number, number, number, number]> = {
  Flat: [0, 0, 0, 0, 0],
  Bass: [8, 5, 0, -1, -2],
  Treble: [-2, -1, 0, 5, 8],
  Vocal: [-2, 2, 5, 3, -1],
  Rock: [5, 3, -1, 3, 6],
};

const AUDIO_EXT_RE = /\.(mp3|m4a|aac|wav|ogg|opus|flac)$/i;
const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm|mkv)$/i;

export function nextPlaybackSpeed(current: number): number {
  const idx = PLAYBACK_SPEEDS.indexOf(current as (typeof PLAYBACK_SPEEDS)[number]);
  return PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
}

export function computeHue(text: string): number {
  let n = 0;
  for (const ch of String(text)) {
    n = (n * 31 + ch.charCodeAt(0)) % 360;
  }
  return n;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = String(total % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || !Number.isFinite(bytes)) return 'Local file';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

export function normalizeText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function parseFilename(filename: string): { artist: string; title: string } {
  const base = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
  const sepIndex = base.indexOf(' - ');
  if (sepIndex > 0) {
    return {
      artist: base.slice(0, sepIndex).trim(),
      title: base.slice(sepIndex + 3).trim(),
    };
  }
  return { artist: '', title: base };
}

export function detectMediaType(filename: string, mimeType: string): MediaType | null {
  if (mimeType.startsWith('video/') || VIDEO_EXT_RE.test(filename)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || AUDIO_EXT_RE.test(filename)) {
    return 'audio';
  }
  return null;
}

export function matchSpotifyTrack<
  T extends { id: string; title: string; artist: string; name: string },
>(items: T[], trackName: string, artistName: string): T | null {
  const nt = normalizeText(trackName);
  if (nt.length < 2) return null;

  const candidates = items.filter((item) => {
    const t = normalizeText(item.title);
    return (
      t === nt ||
      (nt.length > 3 && (t.includes(nt) || (t.length > 3 && nt.includes(t))))
    );
  });

  if (!candidates.length) return null;

  const na = normalizeText(artistName);
  if (na) {
    const artistMatch = candidates.find((item) =>
      normalizeText(`${item.artist} ${item.name}`).includes(na),
    );
    if (artistMatch) return artistMatch;
  }

  return candidates[0];
}

export function parseSpotifyExport<
  T extends { id: string; title: string; artist: string; name: string },
>(rawJson: string, libraryItems: T[]): PlaylistRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== 'object') return [];
  const data = parsed as {
    playlists?: Array<{
      name?: string;
      items?: Array<{ track?: { trackName?: string; artistName?: string } | null }>;
    }>;
    tracks?: Array<{ track?: string; artist?: string }>;
  };

  const rawPlaylists = Array.isArray(data.playlists)
    ? data.playlists
    : Array.isArray(data.tracks)
      ? [
          {
            name: 'Liked Songs',
            items: data.tracks.map((t) => ({
              track: { trackName: t.track, artistName: t.artist },
            })),
          },
        ]
      : [];

  const results: PlaylistRecord[] = [];
  for (const pl of rawPlaylists) {
    const tracks = (pl.items || [])
      .map((entry) => entry.track)
      .filter((t): t is { trackName?: string; artistName?: string } => Boolean(t));

    const matchedIds: string[] = [];
    for (const track of tracks) {
      const matched = matchSpotifyTrack(
        libraryItems,
        track.trackName || '',
        track.artistName || '',
      );
      if (matched && !matchedIds.includes(matched.id)) {
        matchedIds.push(matched.id);
      }
    }

    results.push({
      name: pl.name || 'Playlist',
      ids: matchedIds,
      total: tracks.length,
    });
  }

  return results;
}

export function stepQueueIndex(
  queueIds: string[],
  currentId: string | null,
  delta: 1 | -1,
  shuffle: boolean,
  rng: () => number = Math.random,
): string | null {
  if (!queueIds.length) return null;
  let idx = currentId ? queueIds.indexOf(currentId) : -1;

  if (shuffle && queueIds.length > 1) {
    let nextIdx = idx;
    let guard = 0;
    while (nextIdx === idx && guard < 16) {
      nextIdx = Math.floor(rng() * queueIds.length);
      guard++;
    }
    return queueIds[nextIdx];
  }

  if (idx === -1) {
    return delta === 1 ? queueIds[0] : queueIds[queueIds.length - 1];
  }

  const nextIdx = (idx + delta + queueIds.length) % queueIds.length;
  return queueIds[nextIdx];
}

export function filterAndSortMedia<
  T extends { id: string; type: MediaType; title: string; artist: string; added: number },
>(items: T[], tab: 'songs' | 'videos', query: string): T[] {
  const targetType: MediaType = tab === 'videos' ? 'video' : 'audio';
  const q = query.trim().toLowerCase();

  return items
    .filter(
      (item) =>
        item.type === targetType &&
        (!q || `${item.title} ${item.artist}`.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.added - a.added);
}

/**
 * Parses LRC synchronized lyrics text into sorted time-tagged lines.
 * Supported format: [mm:ss.xx] Lyric text or [mm:ss] Lyric text.
 */
export function parseLrcLyrics(raw: string): LyricLine[] {
  if (!raw || !raw.trim()) return [];
  const lines = raw.split(/\r?\n/);
  const result: LyricLine[] = [];

  for (const line of lines) {
    const timestampMatches = Array.from(
      line.matchAll(/\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g),
    );
    if (!timestampMatches.length) continue;

    const cleanedText = line.replace(/\[\d{2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim();
    if (!cleanedText) continue;

    for (const match of timestampMatches) {
      const minutes = Number(match[1]) || 0;
      const seconds = Number(match[2]) || 0;
      const fracPart = match[3] ? Number(`0.${match[3]}`) : 0;
      const totalTime = minutes * 60 + seconds + fracPart;
      result.push({
        time: totalTime,
        text: cleanedText,
      });
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}

/**
 * Finds the currently active lyric line index for a given playback time.
 */
export function findActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (!lyrics.length) return -1;
  let active = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}
