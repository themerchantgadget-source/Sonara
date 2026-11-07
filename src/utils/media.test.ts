import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeHue,
  detectMediaType,
  extractAudioPeaksFromBuffer,
  filterAndSortMedia,
  findActiveLyricIndex,
  findActiveSubtitleCue,
  formatDuration,
  formatFileSize,
  generateDeterministicPeaks,
  matchSpotifyTrack,
  nextPlaybackSpeed,
  normalizeText,
  parseFilename,
  parseLrcLyrics,
  parseSpotifyExport,
  parseSubtitles,
  stepQueueIndex,
} from './media';

test('parseFilename extracts artist and title when separated by " - "', () => {
  assert.deepEqual(parseFilename('Boards of Canada - Roygbiv.mp3'), {
    artist: 'Boards of Canada',
    title: 'Roygbiv',
  });
  assert.deepEqual(parseFilename('midnight_rain_demo.wav'), {
    artist: '',
    title: 'midnight rain demo',
  });
});

test('formatDuration formats seconds into m:ss and handles invalid values', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(605), '10:05');
  assert.equal(formatDuration(Number.NaN), '0:00');
  assert.equal(formatDuration(-4), '0:00');
});

test('formatFileSize formats bytes into MB and GB cleanly', () => {
  assert.equal(formatFileSize(undefined), 'Local file');
  assert.equal(formatFileSize(5 * 1024 * 1024), '5.0 MB');
  assert.equal(formatFileSize(1.5 * 1024 * 1024 * 1024), '1.50 GB');
});

test('computeHue returns deterministic 0..359 hue', () => {
  const h1 = computeHue('Sonara');
  const h2 = computeHue('Sonara');
  assert.equal(h1, h2);
  assert.ok(h1 >= 0 && h1 < 360);
});

test('detectMediaType identifies audio, video, photo, and document files', () => {
  assert.equal(detectMediaType('track.flac', ''), 'audio');
  assert.equal(detectMediaType('song.mp3', 'audio/mpeg'), 'audio');
  assert.equal(detectMediaType('clip.mkv', ''), 'video');
  assert.equal(detectMediaType('film.mp4', 'video/mp4'), 'video');
  assert.equal(detectMediaType('poster.webp', 'image/webp'), 'photo');
  assert.equal(detectMediaType('photo.jpg', ''), 'photo');
  assert.equal(detectMediaType('notes.txt', 'text/plain'), 'document');
  assert.equal(detectMediaType('manual.pdf', 'application/pdf'), 'document');
  assert.equal(detectMediaType('subs.srt', ''), 'document');
  assert.equal(detectMediaType('binary.xyz', 'application/octet-stream'), null);
});


test('normalizeText strips parentheticals and punctuation', () => {
  assert.equal(normalizeText('Daydreaming (Remastered 2016) [Live]'), 'daydreaming');
});

test('matchSpotifyTrack and parseSpotifyExport match local tracks', () => {
  const library = [
    {
      id: '1',
      title: 'Nude',
      artist: 'Radiohead',
      name: 'Radiohead - Nude.flac',
    },
    {
      id: '2',
      title: 'Teardrop',
      artist: 'Massive Attack',
      name: 'Massive Attack - Teardrop.mp3',
    },
  ];

  const matched = matchSpotifyTrack(library, 'Nude (2007)', 'Radiohead');
  assert.equal(matched?.id, '1');

  const json = JSON.stringify({
    playlists: [
      {
        name: 'Late Night',
        items: [
          { track: { trackName: 'Nude', artistName: 'Radiohead' } },
          { track: { trackName: 'Unfinished Sympathy', artistName: 'Massive Attack' } },
        ],
      },
    ],
  });

  const playlists = parseSpotifyExport(json, library);
  assert.equal(playlists.length, 1);
  assert.deepEqual(playlists[0], {
    name: 'Late Night',
    ids: ['1'],
    total: 2,
  });
});

test('stepQueueIndex advances sequentially and shuffles without repeating', () => {
  const queue = ['a', 'b', 'c'];
  assert.equal(stepQueueIndex(queue, 'a', 1, false), 'b');
  assert.equal(stepQueueIndex(queue, 'a', -1, false), 'c');
  assert.equal(stepQueueIndex(queue, 'b', 1, true, () => 0.9), 'c');
});

test('nextPlaybackSpeed cycles through supported speeds', () => {
  assert.equal(nextPlaybackSpeed(1), 1.25);
  assert.equal(nextPlaybackSpeed(2), 0.75);
  assert.equal(nextPlaybackSpeed(0.75), 1);
});

test('filterAndSortMedia filters by type and query and sorts newest first', () => {
  const items = [
    { id: '1', type: 'audio' as const, title: 'Alpha', artist: 'One', added: 100 },
    { id: '2', type: 'audio' as const, title: 'Beta', artist: 'Two', added: 200 },
    { id: '3', type: 'video' as const, title: 'Gamma', artist: 'Three', added: 300 },
  ];

  const songs = filterAndSortMedia(items, 'songs', '');
  assert.deepEqual(
    songs.map((s) => s.id),
    ['2', '1'],
  );

  const filtered = filterAndSortMedia(items, 'songs', 'alpha');
  assert.deepEqual(
    filtered.map((s) => s.id),
    ['1'],
  );
});

test('parseLrcLyrics parses standard and high-resolution timestamps and sorts chronologically', () => {
  const lrc = `
[ti:Midnight Drive]
[00:15.50] Into the neon night
[00:05.00] Engine hums softly
[00:30.00] City lights fading
  `;

  const parsed = parseLrcLyrics(lrc);
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], { time: 5, text: 'Engine hums softly' });
  assert.deepEqual(parsed[1], { time: 15.5, text: 'Into the neon night' });
  assert.deepEqual(parsed[2], { time: 30, text: 'City lights fading' });
});

test('findActiveLyricIndex identifies correct active line for current playback time', () => {
  const lyrics = [
    { time: 5, text: 'Intro' },
    { time: 15, text: 'Verse 1' },
    { time: 30, text: 'Chorus' },
  ];

  assert.equal(findActiveLyricIndex(lyrics, 2), -1);
  assert.equal(findActiveLyricIndex(lyrics, 5), 0);
  assert.equal(findActiveLyricIndex(lyrics, 14.9), 0);
  assert.equal(findActiveLyricIndex(lyrics, 15), 1);
  assert.equal(findActiveLyricIndex(lyrics, 40), 2);
});

test('media categorization separates audio and video cleanly', () => {
  const items = [
    { id: '1', type: 'audio' as const, title: 'Track 1', artist: 'A', name: '1.mp3', size: 1000, added: 10 },
    { id: '2', type: 'video' as const, title: 'Video 1', artist: 'B', name: '2.mp4', size: 5000, added: 20 },
    { id: '3', type: 'audio' as const, title: 'Track 2', artist: 'C', name: '3.flac', size: 2000, added: 30 },
  ];

  const audioFiles = items.filter((x) => x.type === 'audio');
  const videoFiles = items.filter((x) => x.type === 'video');
  assert.equal(audioFiles.length, 2);
  assert.equal(videoFiles.length, 1);
  assert.equal(audioFiles.reduce((sum, item) => sum + item.size, 0), 3000);
});

test('filterAndSortMedia sorts alphabetically and by recent', () => {
  const items = [
    { id: '1', type: 'audio' as const, title: 'Zebra', artist: 'Artist A', added: 100 },
    { id: '2', type: 'audio' as const, title: 'Apple', artist: 'Artist B', added: 200 },
  ];
  const sortedNewest = filterAndSortMedia(items, 'songs', '');
  assert.equal(sortedNewest[0].id, '2'); // added 200 is newest
});

test('generateDeterministicPeaks generates consistent, non-empty, clamped peaks', () => {
  const peaks1 = generateDeterministicPeaks('song-id-123', 60);
  const peaks2 = generateDeterministicPeaks('song-id-123', 60);
  assert.equal(peaks1.length, 60);
  assert.deepEqual(peaks1, peaks2); // deterministic

  // Values should be between 0.15 and 1.0
  for (const val of peaks1) {
    assert.ok(val >= 0.15 && val <= 1.0, `Peak value ${val} out of expected range`);
  }

  // Different seeds produce different peak profiles
  const peaksDifferent = generateDeterministicPeaks('another-song-456', 60);
  assert.notDeepEqual(peaks1, peaksDifferent);
});

test('extractAudioPeaksFromBuffer extracts normalized peaks from channel PCM data', () => {
  // Synthesize a sine burst PCM channel
  const samples = 44100;
  const channelData = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    // Louder in the middle, quiet at ends
    const env = Math.sin((i / samples) * Math.PI);
    channelData[i] = Math.sin(2 * Math.PI * 440 * (i / 44100)) * env;
  }

  const peaks = extractAudioPeaksFromBuffer([channelData], 32);
  assert.equal(peaks.length, 32);

  // Peak in middle should be higher than beginning/end
  const middle = peaks[16];
  const start = peaks[0];
  const end = peaks[31];
  assert.ok(middle > start, `Middle peak (${middle}) should exceed start peak (${start})`);
  assert.ok(middle > end, `Middle peak (${middle}) should exceed end peak (${end})`);
});

test('parseSubtitles parses SRT and WebVTT blocks with accurate millisecond timing', () => {
  const srt = `
1
00:01:15,500 --> 00:01:19,250
Welcome to Sonara VLC player!

2
00:01:20,000 --> 00:01:25,000
Enjoy inline playback without iOS QuickTime takeover.
  `;

  const cues = parseSubtitles(srt);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 75.5);
  assert.equal(cues[0].end, 79.25);
  assert.equal(cues[0].text, 'Welcome to Sonara VLC player!');
  assert.equal(cues[1].start, 80);
  assert.equal(cues[1].end, 85);
});

test('findActiveSubtitleCue correctly matches cue with optional timing offset', () => {
  const cues = [
    { id: '1', start: 10, end: 15, text: 'First line' },
    { id: '2', start: 20, end: 25, text: 'Second line' },
  ];

  assert.equal(findActiveSubtitleCue(cues, 5), null);
  assert.equal(findActiveSubtitleCue(cues, 12)?.text, 'First line');
  assert.equal(findActiveSubtitleCue(cues, 16), null);
  assert.equal(findActiveSubtitleCue(cues, 22)?.text, 'Second line');

  // With a +1.0 second offset (e.g. subtitle is ahead by 1s)
  assert.equal(findActiveSubtitleCue(cues, 9.5, 1.0)?.text, 'First line');
});


