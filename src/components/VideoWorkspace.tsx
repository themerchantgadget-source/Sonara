import React, { useEffect, useRef, useState } from 'react';
import {
  Captions,
  Check,
  ChevronDown,
  Clock,
  Film,
  Maximize,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Sliders,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { MediaItem, SubtitleCue } from '../types/media';
import {
  findActiveSubtitleCue,
  formatDuration,
  formatFileSize,
  parseSubtitles,
} from '../utils/media';

interface VideoWorkspaceProps {
  currentItem: MediaItem | null;
  videoItems: MediaItem[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  isMuted: boolean;
  audioBoostPercent: number; // 100 to 200
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onSelectVideo: (item: MediaItem) => void;
  onTogglePlay: () => void;
  onSeekInput: (fraction: number) => void;
  onSeekCommit: (fraction: number) => void;
  onSkipTime: (deltaSeconds: number) => void;
  onCycleSpeed: () => void;
  onToggleMute: () => void;
  onSetAudioBoost: (percent: number) => void;
  onAddFilesClick: () => void;
  onRemoveItem: (id: string) => void;
}

export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  currentItem,
  videoItems,
  isPlaying,
  currentTime,
  duration,
  speed,
  isMuted,
  audioBoostPercent,
  videoRef,
  onSelectVideo,
  onTogglePlay,
  onSeekInput,
  onSeekCommit,
  onSkipTime,
  onCycleSpeed,
  onToggleMute,
  onSetAudioBoost,
  onAddFilesClick,
  onRemoveItem,
}) => {
  // In-app custom fullscreen mode (bypasses iOS QuickTime native takeover)
  const [isTheaterFullscreen, setIsTheaterFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'fit' | '16/9' | '4/3' | 'fill'>('fit');
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);

  // Subtitles state
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [isSubtitleModalOpen, setIsSubtitleModalOpen] = useState(false);
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [rawPastedSubtitles, setRawPastedSubtitles] = useState('');
  const [subtitleStatus, setSubtitleStatus] = useState<string | null>(null);

  // Auto-hide controls in theater mode during playback
  const resetControlsTimer = () => {
    setShowControls(true);
    window.clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && isTheaterFullscreen) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      window.clearTimeout(controlsTimeoutRef.current);
    } else if (isTheaterFullscreen) {
      resetControlsTimer();
    }
    return () => window.clearTimeout(controlsTimeoutRef.current);
  }, [isPlaying, isTheaterFullscreen]);

  // Handle escape key to exit theater fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTheaterFullscreen) {
        setIsTheaterFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterFullscreen]);

  // Compute active subtitle cue
  const activeCue =
    subtitlesEnabled && subtitles.length > 0
      ? findActiveSubtitleCue(subtitles, currentTime, subtitleOffset)
      : null;

  // Handle pasting subtitles
  const handleApplyPastedSubtitles = () => {
    if (!rawPastedSubtitles.trim()) {
      setSubtitles([]);
      setSubtitleStatus('Cleared subtitles');
      return;
    }
    const parsed = parseSubtitles(rawPastedSubtitles);
    setSubtitles(parsed);
    setSubtitlesEnabled(true);
    setSubtitleStatus(`Loaded ${parsed.length} subtitle cues`);
  };

  // Handle subtitle file upload
  const handleSubtitleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const parsed = parseSubtitles(text);
      setSubtitles(parsed);
      setRawPastedSubtitles(text);
      setSubtitlesEnabled(true);
      setSubtitleStatus(`Imported ${file.name} (${parsed.length} cues)`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const seekValue = duration > 0 ? Math.round((currentTime / duration) * 1000) : 0;

  // Aspect ratio class helper
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16/9':
        return 'aspect-[16/9] object-contain';
      case '4/3':
        return 'aspect-[4/3] object-contain';
      case 'fill':
        return 'w-full h-full object-cover';
      case 'fit':
      default:
        return 'w-full h-full object-contain';
    }
  };

  const isCurrentVideo = Boolean(currentItem && currentItem.type === 'video');

  return (
    <div className="flex-1 h-full bg-[#141413] flex flex-col overflow-y-auto">
      {/* Video Stage Section */}
      <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-4">
        {/* Workspace Title & Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d97757]/15 flex items-center justify-center text-[#d97757]">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-semibold text-[#f5f2ea] leading-tight">
                Sonara VLC Workspace
              </h1>
              <p className="text-xs text-[#a09b90]">
                Inline iOS playback · Audio Boost · Live Subtitles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddFilesClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] border border-white/5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Video</span>
            </button>
          </div>
        </div>

        {/* Video Player Container (Persistent DOM for seamless audio/video playback) */}
        <div
          onMouseMove={resetControlsTimer}
          onTouchStart={resetControlsTimer}
          style={
            !isCurrentVideo
              ? {
                  position: 'fixed',
                  left: -9999,
                  top: 0,
                  width: 1,
                  height: 1,
                  opacity: 0,
                  pointerEvents: 'none',
                }
              : undefined
          }
          className={`
            relative rounded-2xl overflow-hidden bg-black select-none shadow-2xl transition-all
            ${
              isTheaterFullscreen
                ? 'fixed inset-0 z-50 rounded-none w-screen h-screen flex flex-col justify-between'
                : 'w-full aspect-[16/10] sm:aspect-[16/9]'
            }
          `}
        >
            {/* The Actual Video Element configured strictly for iOS Inline Playback */}
            <video
              ref={videoRef}
              playsInline
              webkit-playsinline="true"
              x5-playsinline="true"
              preload="metadata"
              onClick={onTogglePlay}
              className={`w-full h-full bg-black cursor-pointer ${getAspectRatioClass()}`}
            />

            {/* Live Synchronized Subtitle Overlay */}
            {activeCue && (
              <div className="absolute inset-x-0 bottom-16 sm:bottom-20 z-20 pointer-events-none flex justify-center px-4">
                <div className="max-w-[85%] sm:max-w-[75%] px-4 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white font-medium text-sm sm:text-base text-center shadow-2xl transition-all animate-in fade-in duration-150">
                  {activeCue.text}
                </div>
              </div>
            )}

            {/* Floating Top Bar Overlay in Theater Mode */}
            <div
              className={`
                absolute top-0 inset-x-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent
                flex items-center justify-between text-white transition-opacity duration-200
                ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}
              `}
            >
              <div className="flex items-center gap-2 truncate max-w-[60%]">
                {isTheaterFullscreen && (
                  <button
                    type="button"
                    onClick={() => setIsTheaterFullscreen(false)}
                    aria-label="Exit Theater View"
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                )}
                <span className="text-xs sm:text-sm font-medium truncate">
                  {currentItem?.title || 'Video'}
                </span>
              </div>

              {/* Top Quick Settings: Aspect Ratio & Audio Boost */}
              <div className="flex items-center gap-1.5">
                {/* Aspect Ratio Switcher */}
                <button
                  type="button"
                  onClick={() => {
                    const ratios: Array<'fit' | '16/9' | '4/3' | 'fill'> = [
                      'fit',
                      '16/9',
                      '4/3',
                      'fill',
                    ];
                    const next = ratios[(ratios.indexOf(aspectRatio) + 1) % ratios.length];
                    setAspectRatio(next);
                  }}
                  title="Cycle Aspect Ratio"
                  className="px-2 py-1 rounded-lg bg-black/50 hover:bg-black/70 border border-white/10 text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer"
                >
                  {aspectRatio}
                </button>

                {/* Subtitle Manager Trigger */}
                <button
                  type="button"
                  onClick={() => setIsSubtitleModalOpen(true)}
                  aria-label="Subtitles options"
                  title="Subtitles & timing"
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    subtitles.length > 0 && subtitlesEnabled
                      ? 'bg-[#d97757] text-[#1a0f0a] border-transparent'
                      : 'bg-black/50 hover:bg-black/70 border-white/10 text-white'
                  }`}
                >
                  <Captions className="w-4 h-4" />
                </button>

                {/* VLC Audio Boost (100% -> 125% -> 150% -> 200%) */}
                <button
                  type="button"
                  onClick={() => {
                    const next =
                      audioBoostPercent === 100
                        ? 125
                        : audioBoostPercent === 125
                          ? 150
                          : audioBoostPercent === 150
                            ? 200
                            : 100;
                    onSetAudioBoost(next);
                  }}
                  title="VLC Audio Boost"
                  className={`px-2 py-1 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer ${
                    audioBoostPercent > 100
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-black/50 hover:bg-black/70 border-white/10 text-[#a09b90]'
                  }`}
                >
                  {audioBoostPercent}% Boost
                </button>

                {/* In-App Fullscreen Toggle (Never triggers iOS QuickTime takeover!) */}
                <button
                  type="button"
                  onClick={() => setIsTheaterFullscreen((f) => !f)}
                  aria-label={isTheaterFullscreen ? 'Exit Fullscreen' : 'Enter In-App Theater'}
                  className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 border border-white/10 text-white transition-colors cursor-pointer"
                >
                  {isTheaterFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Custom Bottom Controls Bar */}
            <div
              className={`
                absolute bottom-0 inset-x-0 z-30 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent
                flex flex-col gap-2 transition-opacity duration-200
                ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}
              `}
            >
              {/* Scrubbing Bar */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono tabular-nums text-white/80 w-10 text-right">
                  {formatDuration(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={seekValue}
                  aria-label="Seek video"
                  onChange={(e) => onSeekInput(Number(e.target.value) / 1000)}
                  onMouseUp={(e) =>
                    onSeekCommit(Number((e.target as HTMLInputElement).value) / 1000)
                  }
                  onTouchEnd={(e) =>
                    onSeekCommit(Number((e.target as HTMLInputElement).value) / 1000)
                  }
                  className="sonara-seek flex-1 h-6 cursor-pointer"
                />
                <span className="text-[11px] font-mono tabular-nums text-white/80 w-10">
                  {formatDuration(duration)}
                </span>
              </div>

              {/* Control Buttons Row */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSkipTime(-10)}
                    aria-label="Skip back 10 seconds"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="w-10 h-10 rounded-xl bg-[#d97757] text-[#1a0f0a] flex items-center justify-center hover:bg-[#e08567] active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current stroke-none" />
                    ) : (
                      <Play className="w-5 h-5 fill-current stroke-none ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSkipTime(10)}
                    aria-label="Skip forward 10 seconds"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {/* Speed Selector */}
                  <button
                    type="button"
                    onClick={onCycleSpeed}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 font-mono transition-colors cursor-pointer"
                  >
                    {speed}×
                  </button>

                  {/* Subtitles Status Badge */}
                  {subtitles.length > 0 && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-white/80">
                      {subtitles.length} cues
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Empty Video Stage when no video is currently selected */}
        {!isCurrentVideo && (
          <div className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl border border-dashed border-white/10 bg-[#1d1c1a] flex flex-col items-center justify-center p-6 text-center">
            <Film className="w-12 h-12 text-[#a09b90] mb-3 stroke-[1.2]" />
            <h2 className="font-serif text-xl font-semibold text-[#f5f2ea] mb-1">
              Select a video to play
            </h2>
            <p className="text-xs text-[#a09b90] max-w-sm mb-4">
              Videos play inline without iOS fullscreen takeover, with audio boost and live
              synchronized subtitles.
            </p>
            <button
              type="button"
              onClick={onAddFilesClick}
              className="px-5 py-2.5 rounded-xl bg-[#d97757] text-[#1a0f0a] text-xs font-semibold hover:bg-[#e08567] active:scale-95 transition-all cursor-pointer"
            >
              Add Video Files
            </button>
          </div>
        )}

        {/* Video Workspace Library Playlist */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#f5f2ea] tracking-tight">
              Video Vault ({videoItems.length})
            </h2>
            <span className="text-xs text-[#a09b90]">VLC Sandboxed Space</span>
          </div>

          {videoItems.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#1d1c1a] text-center border border-white/5 text-xs text-[#a09b90]">
              No video files imported yet. Import MP4, MKV, MOV, or WEBM files to watch offline.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {videoItems.map((item) => {
                const isSelected = currentItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectVideo(item)}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left group
                      ${
                        isSelected
                          ? 'bg-[#d97757]/15 border-[#d97757]/40 shadow-sm'
                          : 'bg-[#1d1c1a] hover:bg-[#252422] border-white/5'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#d97757] text-[#1a0f0a]'
                            : 'bg-[#292825] text-[#f5f2ea]'
                        }`}
                      >
                        <Film className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#f5f2ea] truncate group-hover:text-[#d97757] transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#a09b90] mt-0.5 truncate">
                          {formatFileSize(item.size)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      title="Remove video"
                      className="p-1.5 rounded-lg text-[#a09b90] hover:text-red-400 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Subtitle Manager Modal (Option to Paste Subtitles & Live Sync Offset) */}
      {isSubtitleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="subtitles-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#1d1c1a] border border-white/10 p-5 shadow-2xl flex flex-col gap-4 text-[#f5f2ea]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Captions className="w-5 h-5 text-[#d97757]" />
                <h3 id="subtitles-title" className="text-base font-semibold">
                  Live Subtitles & Synchronization
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSubtitleModalOpen(false)}
                className="text-xs text-[#a09b90] hover:text-[#f5f2ea] p-1 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Subtitle Toggle & Timing Offset Controls */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#141413] border border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-[#a09b90] uppercase tracking-wider">
                  Display Subtitles
                </span>
                <button
                  type="button"
                  onClick={() => setSubtitlesEnabled((e) => !e)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    subtitlesEnabled
                      ? 'bg-[#d97757] text-[#1a0f0a]'
                      : 'bg-[#292825] text-[#a09b90]'
                  }`}
                >
                  {subtitlesEnabled ? 'Subtitles ON' : 'Subtitles OFF'}
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-[#a09b90] uppercase tracking-wider">
                  Sync Offset: {subtitleOffset > 0 ? `+${subtitleOffset}` : subtitleOffset}s
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSubtitleOffset((o) => Number((o - 0.25).toFixed(2)))}
                    className="flex-1 py-1 rounded bg-[#292825] hover:bg-[#333336] text-xs font-mono transition-colors cursor-pointer"
                  >
                    -0.25s
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubtitleOffset(0)}
                    className="px-2 py-1 rounded bg-[#292825] hover:bg-[#333336] text-[10px] font-mono transition-colors cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubtitleOffset((o) => Number((o + 0.25).toFixed(2)))}
                    className="flex-1 py-1 rounded bg-[#292825] hover:bg-[#333336] text-xs font-mono transition-colors cursor-pointer"
                  >
                    +0.25s
                  </button>
                </div>
              </div>
            </div>

            {/* Paste Subtitles Option */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="paste-subtitles"
                className="text-xs font-medium text-[#a09b90] flex items-center justify-between"
              >
                <span>Paste SRT, WebVTT, or LRC Subtitles</span>
                <span className="text-[10px] font-mono text-[#d97757]">
                  {subtitles.length} cues loaded
                </span>
              </label>
              <textarea
                id="paste-subtitles"
                rows={6}
                value={rawPastedSubtitles}
                onChange={(e) => setRawPastedSubtitles(e.target.value)}
                placeholder="Paste subtitle text here (e.g. 00:01:20,000 --> 00:01:24,000 Hello world)..."
                className="w-full p-3 rounded-xl bg-[#141413] border border-white/10 text-xs font-mono text-[#f5f2ea] focus:outline-none focus:ring-1 focus:ring-[#d97757] resize-none"
              />
            </div>

            {/* Subtitle File Upload & Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] border border-white/5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#d97757]" />
                <span>Upload .srt/.vtt file</span>
                <input
                  type="file"
                  accept=".srt,.vtt,.lrc,text/plain"
                  hidden
                  onChange={handleSubtitleFileUpload}
                />
              </label>

              <button
                type="button"
                onClick={handleApplyPastedSubtitles}
                className="px-5 py-2 rounded-xl bg-[#d97757] hover:bg-[#e08567] text-xs font-semibold text-[#1a0f0a] transition-all cursor-pointer shadow-md"
              >
                Apply Subtitles
              </button>
            </div>

            {subtitleStatus && (
              <div className="text-[11px] font-mono text-[#d97757] text-center">
                {subtitleStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
