import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ConfirmRemoveModal } from './components/ConfirmRemoveModal';
import { EqualizerModal } from './components/EqualizerModal';
import { FloatingNowPlaying } from './components/FloatingNowPlaying';
import { HeaderTabNav } from './components/HeaderTabNav';
import { HomeScreen } from './components/HomeScreen';
import { LibraryOverviewSpace } from './components/LibraryOverviewSpace';
import { LibrarySidebar } from './components/LibrarySidebar';
import { LyricsModal } from './components/LyricsModal';
import { PlayerStage } from './components/PlayerStage';
import { QueueModal } from './components/QueueModal';
import { SettingsSpace } from './components/SettingsSpace';
import type {
  AppNavSpace,
  LibraryTab,
  LibraryViewMode,
  MediaItem,
  PlaylistRecord,
  UserPreferences,
} from './types/media';
import {
  EQ_FREQUENCIES,
  EQ_PRESETS,
  detectMediaType,
  nextPlaybackSpeed,
  parseFilename,
  parseSpotifyExport,
  stepQueueIndex,
} from './utils/media';
import {
  deleteMediaItem,
  getAllMediaItems,
  loadPlaylists,
  openMediaDatabase,
  putMediaItem,
  savePlaylists,
} from './utils/storage';

const DEFAULT_PREFERENCES: UserPreferences = {
  themeMode: 'dark',
  accentColor: 'terracotta',
  defaultPlaySpeed: 1,
  autoPlayNext: true,
  normalizeAudio: true,
  showTimeRemaining: false,
};

export default function App() {
  const [activeSpace, setActiveSpace] = useState<AppNavSpace>('home');
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const raw = localStorage.getItem('sonara_preferences');
      if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_PREFERENCES;
  });
  const [items, setItems] = useState<MediaItem[]>([]);
  const [lists, setLists] = useState<PlaylistRecord[]>(() => loadPlaylists());
  const [tab, setTab] = useState<LibraryTab>('songs');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<LibraryViewMode>('list');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [toastText, setToastText] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  // Equalizer & Lyrics & Queue Modal States
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [eqGains, setEqGains] = useState<[number, number, number, number, number]>([0, 0, 0, 0, 0]);
  const [isEqEnabled, setIsEqEnabled] = useState(false);

  const dbRef = useRef<IDBDatabase | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const isSeekingRef = useRef(false);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  // WebAudio nodes for Equalizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const showToast = useCallback((message: string) => {
    setToastText(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastText(null);
    }, 2400);
  }, []);

  // Initialize IndexedDB on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const db = await openMediaDatabase();
        if (!active) return;
        dbRef.current = db;
        const stored = await getAllMediaItems(db);
        if (!active) return;
        setItems(stored);
        navigator.storage?.persist?.().catch(() => {});
      } catch {
        if (!active) return;
        dbRef.current = null;
        showToast('Storage unavailable: files last this session');
      }
    })();

    return () => {
      active = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [showToast]);

  const currentItem = items.find((item) => item.id === currentId) || null;
  const pendingRemoveItem =
    items.find((item) => item.id === pendingRemoveId) || null;

  // Initialize WebAudio Equalizer on demand
  const initEqualizer = useCallback(async () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return;
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      showToast('Audio equalizer not supported in this browser');
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl) return;

    try {
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const filters = EQ_FREQUENCIES.map((freq) => {
        const f = ctx.createBiquadFilter();
        f.type =
          freq === 60 ? 'lowshelf' : freq === 14000 ? 'highshelf' : 'peaking';
        f.frequency.value = freq;
        f.Q.value = 1;
        f.gain.value = 0;
        return f;
      });
      eqFiltersRef.current = filters;

      const source = ctx.createMediaElementSource(videoEl);
      audioSourceRef.current = source;

      source.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(ctx.destination);

      setIsEqEnabled(true);
    } catch {
      // Audio element might already be connected or blocked
    }
  }, [showToast]);

  const handleGainChange = useCallback(
    async (index: number, value: number) => {
      await initEqualizer();
      setEqGains((prev) => {
        const next = [...prev] as [number, number, number, number, number];
        next[index] = value;
        return next;
      });
      if (eqFiltersRef.current[index]) {
        eqFiltersRef.current[index].gain.value = value;
      }
    },
    [initEqualizer],
  );

  const handleApplyPreset = useCallback(
    async (presetName: string) => {
      const values = EQ_PRESETS[presetName];
      if (!values) return;
      await initEqualizer();
      setEqGains([...values]);
      values.forEach((val, idx) => {
        if (eqFiltersRef.current[idx]) {
          eqFiltersRef.current[idx].gain.value = val;
        }
      });
    },
    [initEqualizer],
  );

  const handleResetEq = useCallback(() => {
    setEqGains([0, 0, 0, 0, 0]);
    eqFiltersRef.current.forEach((filter) => {
      filter.gain.value = 0;
    });
  }, []);

  const playTrack = useCallback(
    async (id: string, nextQueue?: string[], shouldSwitchSpace = true) => {
      const target = items.find((item) => item.id === id);
      if (!target) return;

      setCurrentId(id);
      if (shouldSwitchSpace) {
        setActiveSpace(target.type === 'video' ? 'video' : 'music');
        setTab(target.type === 'video' ? 'videos' : 'songs');
      }
      if (nextQueue) {
        setQueue(nextQueue);
      }
      setIsDrawerOpen(false);
      setCurrentTime(0);
      setDuration(0);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const nextUrl = URL.createObjectURL(target.blob);
      objectUrlRef.current = nextUrl;

      // Ensure AudioContext is resumed upon playback if already initialized
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }

      requestAnimationFrame(async () => {
        const el = videoRef.current;
        if (!el) return;
        el.src = nextUrl;
        el.loop = repeat;
        el.playbackRate = speed;
        el.muted = isMuted;
        try {
          await el.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
          showToast('Tap play to start');
        }
      });

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: target.title,
          artist: target.artist || 'Sonara',
        });
      }
    },
    [items, repeat, speed, isMuted, showToast],
  );

  const stepTrack = useCallback(
    (delta: 1 | -1, shouldSwitchSpace = false) => {
      const validIds = queue.filter((id) => items.some((x) => x.id === id));
      const nextId = stepQueueIndex(validIds, currentId, delta, shuffle);
      if (nextId) {
        playTrack(nextId, undefined, shouldSwitchSpace);
      }
    },
    [queue, items, currentId, shuffle, playTrack],
  );

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!currentId || !el) return;
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    if (el.paused) {
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => showToast('Playback blocked'));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [currentId, showToast]);

  const handlePrev = useCallback(() => {
    const el = videoRef.current;
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      setCurrentTime(0);
    } else {
      stepTrack(-1);
    }
  }, [stepTrack]);

  const handleSkipTime = useCallback((deltaSeconds: number) => {
    const el = videoRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(el.duration || 0, el.currentTime + deltaSeconds));
    el.currentTime = next;
    setCurrentTime(next);
  }, []);

  const handleToggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const next = !el.muted;
    el.muted = next;
    setIsMuted(next);
  }, []);

  // Attach media element listeners
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (!repeat) {
        if (!el.duration || el.duration <= 0.05 || !Number.isFinite(el.duration)) {
          setIsPlaying(false);
          return;
        }
        if (preferences.autoPlayNext) {
          stepTrack(1, false);
        } else {
          setIsPlaying(false);
        }
      }
    };
    const onTimeUpdate = () => {
      if (!isSeekingRef.current) {
        setCurrentTime(el.currentTime || 0);
      }
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    };
    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [currentId, repeat, stepTrack, preferences.autoPlayNext]);

  // Sync theme and accent to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.themeMode);
    document.documentElement.setAttribute('data-accent', preferences.accentColor);
  }, [preferences.themeMode, preferences.accentColor]);

  const handleUpdatePreferences = useCallback((partial: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem('sonara_preferences', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleResetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem('sonara_preferences');
    } catch {}
    showToast('Preferences reset to default');
  }, [showToast]);

  const handleClearDatabase = useCallback(async () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    }
    if (dbRef.current) {
      try {
        const tx = dbRef.current.transaction('items', 'readwrite');
        tx.objectStore('items').clear();
      } catch {}
    }
    setItems([]);
    setCurrentId(null);
    setQueue([]);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    showToast('Media vault purged');
  }, [showToast]);

  const handleSelectSpace = useCallback((space: AppNavSpace) => {
    setActiveSpace(space);
    if (space === 'music') {
      setTab('songs');
    } else if (space === 'video') {
      setTab('videos');
    }
  }, []);

  // MediaSession handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => videoRef.current?.play());
    ms.setActionHandler('pause', () => videoRef.current?.pause());
    ms.setActionHandler('previoustrack', () => stepTrack(-1));
    ms.setActionHandler('nexttrack', () => stepTrack(1));
    try {
      ms.setActionHandler('seekto', (details) => {
        if (videoRef.current && typeof details.seekTime === 'number') {
          videoRef.current.currentTime = details.seekTime;
        }
      });
    } catch {
      // Ignore unsupported seekto
    }
  }, [stepTrack]);

  const importFiles = useCallback(
    async (fileList: File[]) => {
      const added: MediaItem[] = [];
      for (const file of fileList) {
        const mediaType = detectMediaType(file.name, file.type);
        if (!mediaType) continue;

        const parsed = parseFilename(file.name);
        const record: MediaItem = {
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `i${Date.now()}${Math.random().toString(16).slice(2)}`,
          type: mediaType,
          title: parsed.title,
          artist: parsed.artist,
          name: file.name,
          size: file.size,
          mime: file.type,
          blob: file,
          added: Date.now() + added.length,
        };

        await putMediaItem(dbRef.current, record);
        added.push(record);
      }

      if (!added.length) {
        showToast('Those files aren’t audio or video');
        return;
      }

      setItems((prev) => [...prev, ...added]);
      const firstType = added[0].type;
      setTab(firstType === 'video' ? 'videos' : 'songs');
      showToast(
        `${added.length} ${added.length > 1 ? 'files' : 'file'} added${
          dbRef.current ? '' : ' (this session only)'
        }`,
      );

      if (!currentId) {
        const sameTypeIds = added
          .filter((x) => x.type === firstType)
          .map((x) => x.id);
        const first = added[0];
        setCurrentId(first.id);
        setActiveSpace(firstType === 'video' ? 'video' : 'music');
        setTab(firstType === 'video' ? 'videos' : 'songs');
        setQueue(sameTypeIds);
        setIsDrawerOpen(false);
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const nextUrl = URL.createObjectURL(first.blob);
        objectUrlRef.current = nextUrl;
        requestAnimationFrame(async () => {
          const el = videoRef.current;
          if (!el) return;
          el.src = nextUrl;
          el.loop = repeat;
          el.playbackRate = speed;
          el.muted = isMuted;
          try {
            await el.play();
            setIsPlaying(true);
          } catch {
            setIsPlaying(false);
            showToast('Tap play to start');
          }
        });
      }
    },
    [currentId, repeat, speed, isMuted, showToast],
  );

  const importSpotifyFiles = useCallback(
    async (fileList: File[]) => {
      let made = 0;
      let hit = 0;
      let all = 0;
      let nextLists = [...lists];

      for (const file of fileList) {
        const text = await file.text();
        const parsed = parseSpotifyExport(text, items);
        for (const pl of parsed) {
          nextLists = nextLists.filter((existing) => existing.name !== pl.name);
          nextLists.push(pl);
          made++;
          hit += pl.ids.length;
          all += pl.total;
        }
      }

      setLists(nextLists);
      savePlaylists(nextLists);
      setTab('lists');
      showToast(
        made
          ? `${made} playlist${made > 1 ? 's' : ''} · ${hit} of ${all} tracks found on this device`
          : 'No Spotify playlists found in that file',
      );
    },
    [items, lists, showToast],
  );

  // Keyboard shortcuts & drag-and-drop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Hardware and media keyboard keys
      if (e.key === 'MediaPlayPause' || e.code === 'MediaPlayPause') {
        e.preventDefault();
        togglePlay();
        return;
      }
      if (e.key === 'MediaTrackNext' || e.code === 'MediaTrackNext') {
        e.preventDefault();
        stepTrack(1);
        return;
      }
      if (e.key === 'MediaTrackPrevious' || e.code === 'MediaTrackPrevious') {
        e.preventDefault();
        stepTrack(-1);
        return;
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        (target as HTMLInputElement).type !== 'range'
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        stepTrack(1);
      } else if (e.key === 'ArrowLeft') {
        stepTrack(-1);
      } else if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setPendingRemoveId(null);
        setIsEqOpen(false);
        setIsLyricsOpen(false);
        setIsQueueOpen(false);
      }
    };

    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files?.length) {
        importFiles(Array.from(e.dataTransfer.files));
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [togglePlay, stepTrack, importFiles]);

  const handleClearQueue = useCallback(() => {
    setQueue([]);
    showToast('Queue cleared');
  }, [showToast]);

  const handleQueueAllAudio = useCallback(() => {
    const audioIds = items.filter((x) => x.type === 'audio').map((x) => x.id);
    if (!audioIds.length) {
      showToast('No audio tracks in library');
      return;
    }
    setQueue(audioIds);
    showToast(`${audioIds.length} tracks added to queue`);
  }, [items, showToast]);

  const handleQueueAllVideo = useCallback(() => {
    const videoIds = items.filter((x) => x.type === 'video').map((x) => x.id);
    if (!videoIds.length) {
      showToast('No video clips in library');
      return;
    }
    setQueue(videoIds);
    showToast(`${videoIds.length} videos added to queue`);
  }, [items, showToast]);

  const handleConfirmRemove = async () => {
    if (!pendingRemoveItem) return;
    const idToRemove = pendingRemoveItem.id;
    const el = videoRef.current;
    if (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    }
    await deleteMediaItem(dbRef.current, idToRemove);
    setItems((prev) => prev.filter((item) => item.id !== idToRemove));
    setQueue((prev) => prev.filter((id) => id !== idToRemove));
    if (currentId === idToRemove) {
      setCurrentId(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
    setPendingRemoveId(null);
    showToast('Removed');
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#0b0b0a] transition-colors">
      <HeaderTabNav
        activeSpace={activeSpace}
        onSelectSpace={handleSelectSpace}
        currentItem={currentItem}
        isPlaying={isPlaying}
        onQuickTogglePlay={togglePlay}
      />

      <div className="flex-1 w-full flex overflow-hidden relative">
        {/* Space 1: Home Dashboard */}
        {activeSpace === 'home' && (
          <HomeScreen
            items={items}
            playlists={lists}
            onOpenMusic={() => handleSelectSpace('music')}
            onOpenVideo={() => handleSelectSpace('video')}
            onOpenPlaylists={() => handleSelectSpace('library')}
            onTriggerAddFiles={() => fileInputRef.current?.click()}
            onPlayTrack={(id, q) => playTrack(id, q)}
          />
        )}

        {/* Space 4: Categorized Total Master Library */}
        {activeSpace === 'library' && (
          <LibraryOverviewSpace
            items={items}
            playlists={lists}
            currentId={currentId}
            onPlayTrack={(id, q) => playTrack(id, q)}
            onSelectPlaylist={(playlist) => {
              const availableIds = playlist.ids.filter((id) =>
                items.some((x) => x.id === id),
              );
              if (!availableIds.length) {
                showToast('None of these tracks are on this device yet');
                return;
              }
              playTrack(availableIds[0], availableIds);
            }}
            onRequestRemove={(id) => setPendingRemoveId(id)}
            onTriggerAddFiles={() => fileInputRef.current?.click()}
            onTriggerImportSpotify={() => jsonInputRef.current?.click()}
          />
        )}

        {/* Space 5: App Preferences & Settings */}
        {activeSpace === 'settings' && (
          <SettingsSpace
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onResetPreferences={handleResetPreferences}
            onClearDatabase={handleClearDatabase}
          />
        )}

        {/* Space 2 & 3: Music and Video Player Stage with Sidebar (kept mounted to preserve continuous playback) */}
        <div
          style={{ display: activeSpace === 'music' || activeSpace === 'video' ? 'flex' : 'none' }}
          className="flex-1 w-full overflow-hidden relative"
        >
          <LibrarySidebar
            items={items}
            lists={lists}
            tab={tab}
            query={query}
            currentId={currentId}
            viewMode={viewMode}
            onGoHome={() => handleSelectSpace('home')}
            onTabChange={setTab}
            onQueryChange={setQuery}
            onViewModeChange={setViewMode}
            onSelectTrack={(id, q) => playTrack(id, q)}
            onSelectPlaylist={(playlist) => {
              const availableIds = playlist.ids.filter((id) =>
                items.some((x) => x.id === id),
              );
              if (!availableIds.length) {
                showToast('None of these tracks are on this device yet');
                return;
              }
              playTrack(availableIds[0], availableIds);
            }}
            onDeletePlaylist={(index) => {
              const next = lists.filter((_, i) => i !== index);
              setLists(next);
              savePlaylists(next);
            }}
            onTriggerAddFiles={() => fileInputRef.current?.click()}
            onTriggerImportSpotify={() => jsonInputRef.current?.click()}
          />

          <PlayerStage
            currentItem={currentItem}
            hasItems={items.length > 0}
            isDrawerOpen={isDrawerOpen}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            shuffle={shuffle}
            repeat={repeat}
            speed={speed}
            isMuted={isMuted}
            videoRef={videoRef}
            onGoHome={() => handleSelectSpace('home')}
            onCloseDrawer={() => setIsDrawerOpen(false)}
            onEmptyPrimaryAction={() => {
              if (items.length > 0) {
                setIsDrawerOpen(true);
              } else {
                fileInputRef.current?.click();
              }
            }}
            onTogglePlay={togglePlay}
            onPrev={handlePrev}
            onNext={() => stepTrack(1)}
            onSkipTime={handleSkipTime}
            onToggleMute={handleToggleMute}
            onSeekInput={(fraction) => {
              isSeekingRef.current = true;
              if (duration > 0) {
                setCurrentTime(fraction * duration);
              }
            }}
            onSeekCommit={(fraction) => {
              if (videoRef.current && duration > 0) {
                videoRef.current.currentTime = fraction * duration;
              }
              isSeekingRef.current = false;
            }}
            onToggleShuffle={() => setShuffle((s) => !s)}
            onCycleSpeed={() => {
              const next = nextPlaybackSpeed(speed);
              setSpeed(next);
              if (videoRef.current) {
                videoRef.current.playbackRate = next;
              }
            }}
            onToggleFullscreen={() => {
              const el = videoRef.current as
                | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
                | null;
              if (!el) return;
              if (el.requestFullscreen) {
                el.requestFullscreen().catch(() => {});
              } else if (el.webkitEnterFullscreen) {
                el.webkitEnterFullscreen();
              }
            }}
            onToggleRepeat={() => {
              setRepeat((r) => {
                const next = !r;
                if (videoRef.current) {
                  videoRef.current.loop = next;
                }
                return next;
              });
            }}
            onRequestRemove={() => {
              if (currentItem) {
                setPendingRemoveId(currentItem.id);
              }
            }}
            onOpenEqualizer={() => setIsEqOpen(true)}
            onOpenLyrics={() => setIsLyricsOpen(true)}
          />

          {/* Mobile-only floating Library drawer toggle when in Player view */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen((o) => !o)}
            aria-label="Toggle Library Drawer"
            aria-expanded={isDrawerOpen}
            className={`
              md:hidden fixed z-20 top-[calc(68px+env(safe-area-inset-top))] left-3
              w-11 h-11 rounded-full grid place-items-center
              border transition-all active:scale-95 cursor-pointer
              ${
                isDrawerOpen
                  ? 'bg-[#d97757] text-[#1a0f0a] border-transparent'
                  : 'bg-[#292825] text-[#f5f2ea] border-[#f5f2ea]/12'
              }
            `}
          >
            {isDrawerOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Floating NowPlaying Strip on non-player spaces matching header tab navigation */}
      {currentItem && activeSpace !== 'music' && activeSpace !== 'video' && (
        <FloatingNowPlaying
          currentItem={currentItem}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          queueCount={queue.length}
          onTogglePlay={togglePlay}
          onPrev={handlePrev}
          onNext={() => stepTrack(1)}
          onOpenQueue={() => setIsQueueOpen(true)}
          onOpenPlayer={() => handleSelectSpace(currentItem.type === 'video' ? 'video' : 'music')}
        />
      )}

      {/* Status Toast */}
      <div
        role="status"
        aria-live="polite"
        style={{ backgroundColor: '#f5f2ea', color: '#111111' }}
        className={`
          fixed z-30 left-1/2 bottom-[calc(24px+env(safe-area-inset-bottom))]
          -translate-x-1/2 max-w-[90%] px-4 py-2.5 rounded-xl
          text-[13px] font-medium shadow-lg
          pointer-events-none transition-all duration-200
          ${toastText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5'}
        `}
      >
        {toastText}
      </div>

      <ConfirmRemoveModal
        title={pendingRemoveItem?.title || null}
        onCancel={() => setPendingRemoveId(null)}
        onConfirm={handleConfirmRemove}
      />

      <EqualizerModal
        isOpen={isEqOpen}
        isEnabled={isEqEnabled}
        gains={eqGains}
        onClose={() => setIsEqOpen(false)}
        onGainChange={handleGainChange}
        onApplyPreset={handleApplyPreset}
        onReset={handleResetEq}
      />

      <LyricsModal
        isOpen={isLyricsOpen}
        songTitle={currentItem?.title || ''}
        songId={currentItem?.id || null}
        currentTime={currentTime}
        onClose={() => setIsLyricsOpen(false)}
      />

      <QueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        items={items}
        queueIds={queue}
        currentId={currentId}
        onSelectTrack={(id) => playTrack(id)}
        shuffle={shuffle}
        repeat={repeat}
        speed={speed}
        autoPlayNext={preferences.autoPlayNext}
        onToggleShuffle={() => setShuffle((s) => !s)}
        onToggleRepeat={() => {
          setRepeat((r) => {
            const next = !r;
            if (videoRef.current) {
              videoRef.current.loop = next;
            }
            return next;
          });
        }}
        onCycleSpeed={() => {
          const next = nextPlaybackSpeed(speed);
          setSpeed(next);
          if (videoRef.current) {
            videoRef.current.playbackRate = next;
          }
        }}
        onToggleAutoPlayNext={(val) => handleUpdatePreferences({ autoPlayNext: val })}
        onClearQueue={handleClearQueue}
        onQueueAllAudio={handleQueueAllAudio}
        onQueueAllVideo={handleQueueAllVideo}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac,.mp4,.mov,.m4v,.webm,.mkv"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) {
            importFiles(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
      />

      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) {
            importSpotifyFiles(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}
