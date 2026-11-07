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

/**
 * Generates an array of normalized audio waveform peaks (between 0.15 and 1.0)
 * deterministically based on seed string and song structure harmonics.
 * Used for instant, stutter-free visualization before or alongside PCM decoding.
 */
export function generateDeterministicPeaks(seed: string, count: number = 72): number[] {
  const safeCount = Math.max(16, Math.min(256, count));
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 37 + seed.charCodeAt(i)) & 0xffffffff;
  }

  const peaks: number[] = new Array(safeCount);
  for (let i = 0; i < safeCount; i++) {
    const t = i / (safeCount - 1); // 0 to 1

    // Overall dynamic envelope of typical music (intro -> verse -> chorus -> bridge -> outro)
    const envelope =
      0.35 +
      0.65 * Math.sin(t * Math.PI) * Math.cos((t - 0.5) * 1.2);

    // Multi-frequency harmonic variation
    const freq1 = Math.sin(t * 14 + (hash % 17));
    const freq2 = Math.sin(t * 29 + ((hash >> 4) % 19));
    const freq3 = Math.cos(t * 53 + ((hash >> 8) % 23));

    // Pseudo-random micro-detail
    const pseudoNoise = Math.sin(i * 1337 + hash) * 0.18;

    const raw = envelope * (0.55 + 0.25 * freq1 + 0.15 * freq2 + 0.08 * freq3 + pseudoNoise);
    const clamped = Math.max(0.16, Math.min(1.0, Math.abs(raw)));
    peaks[i] = Number(clamped.toFixed(3));
  }

  return peaks;
}

/**
 * Extracts normalized peak amplitudes from a decoded AudioBuffer across channels.
 */
export function extractAudioPeaksFromBuffer(
  channelDataList: Float32Array[],
  barCount: number = 72,
): number[] {
  if (!channelDataList.length || !channelDataList[0].length) {
    return generateDeterministicPeaks('fallback', barCount);
  }

  const totalSamples = channelDataList[0].length;
  const channelCount = channelDataList.length;
  const bucketSize = Math.floor(totalSamples / barCount);
  if (bucketSize < 1) {
    return generateDeterministicPeaks('short', barCount);
  }

  const rawPeaks = new Float32Array(barCount);
  let maxPeak = 0.001;

  for (let bar = 0; bar < barCount; bar++) {
    const start = bar * bucketSize;
    const end = Math.min(start + bucketSize, totalSamples);
    let sumSquares = 0;
    let count = 0;

    // Calculate RMS across all channels
    for (let c = 0; c < channelCount; c++) {
      const channel = channelDataList[c];
      // Step through with a stride to balance speed and accuracy
      const stride = Math.max(1, Math.floor((end - start) / 100));
      for (let s = start; s < end; s += stride) {
        const val = channel[s];
        sumSquares += val * val;
        count++;
      }
    }

    const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
    rawPeaks[bar] = rms;
    if (rms > maxPeak) {
      maxPeak = rms;
    }
  }

  // Normalize to 0.15 - 1.0 range
  const normalized: number[] = new Array(barCount);
  for (let bar = 0; bar < barCount; bar++) {
    const norm = rawPeaks[bar] / maxPeak;
    const scaled = 0.16 + norm * 0.84;
    normalized[bar] = Number(Math.max(0.16, Math.min(1.0, scaled)).toFixed(3));
  }

  return normalized;
}

