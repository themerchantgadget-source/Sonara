import React from 'react';
import {
  AlignLeft,
  Maximize2,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { MediaItem } from '../types/media';
import { computeHue, formatDuration } from '../utils/media';

interface PlayerStageProps {
  currentItem: MediaItem | null;
  hasItems: boolean;
  isDrawerOpen: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: boolean;
  speed: number;
  isMuted: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onGoHome: () => void;
  onCloseDrawer: () => void;
  onEmptyPrimaryAction: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSkipTime: (deltaSeconds: number) => void;
  onToggleMute: () => void;
  onSeekInput: (fraction: number) => void;
  onSeekCommit: (fraction: number) => void;
  onToggleShuffle: () => void;
  onCycleSpeed: () => void;
  onToggleFullscreen: () => void;
  onToggleRepeat: () => void;
  onRequestRemove: () => void;
  onOpenEqualizer: () => void;
  onOpenLyrics: () => void;
}

export const PlayerStage: React.FC<PlayerStageProps> = ({
  currentItem,
  hasItems,
  isDrawerOpen,
  isPlaying,
  currentTime,
  duration,
  shuffle,
  repeat,
  speed,
  isMuted,
  videoRef,
  onGoHome,
  onCloseDrawer,
  onEmptyPrimaryAction,
  onTogglePlay,
  onPrev,
  onNext,
  onSkipTime,
  onToggleMute,
  onSeekInput,
  onSeekCommit,
  onToggleShuffle,
  onCycleSpeed,
  onToggleFullscreen,
  onToggleRepeat,
  onRequestRemove,
  onOpenEqualizer,
  onOpenLyrics,
}) => {
  const hue = currentItem ? computeHue(currentItem.title) : 20;
  const seekValue = duration > 0 ? Math.round((currentTime / duration) * 1000) : 0;

  return (
    <main
      onClick={(e) => {
        if (isDrawerOpen) {
          e.preventDefault();
          e.stopPropagation();
          onCloseDrawer();
        }
      }}
      className={`
        flex-1 h-full bg-[#1d1c1a] flex flex-col overflow-hidden relative
        max-md:absolute max-md:inset-0 max-md:origin-left
        max-md:transition-[transform,border-radius,box-shadow] max-md:duration-[450ms] max-md:ease-[cubic-bezier(0.25,1,0.5,1)]
        ${
          isDrawerOpen
            ? 'max-md:translate-x-[75%] max-md:scale-[0.94] max-md:rounded-l-3xl max-md:shadow-[-14px_0_40px_rgba(0,0,0,0.55)] max-md:cursor-pointer'
            : ''
        }
      `}
    >
      {/* Top right quick Home button */}
      <div className="absolute top-[calc(14px+env(safe-area-inset-top))] right-4 z-20 hidden md:block">
        <button
          type="button"
          onClick={onGoHome}
          aria-label="Back to Home"
          className="px-3.5 py-1.5 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-semibold text-[#f5f2ea] border border-white/5 transition-all cursor-pointer"
        >
          ← Home
        </button>
      </div>
      {!currentItem ? (
        <section
          aria-label="Welcome"
          className="flex-1 flex flex-col justify-center px-6 sm:px-12 pt-[calc(72px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))] min-h-0"
        >
          <div className="max-w-md w-full mx-auto">
            <h1 className="font-serif text-[38px] sm:text-[46px] leading-[1.04] tracking-[-0.02em] text-[#f5f2ea] text-balance mb-3">
              {hasItems ? (
                <>
                  Pick something
                  <br />
                  to play.
                </>
              ) : (
                <>
                  Your music,
                  <br />
                  offline.
                </>
              )}
            </h1>
            <p className="text-[15px] leading-relaxed text-[#a09b90] max-w-[300px] mb-6">
              {hasItems
                ? 'Your library is one tap away.'
                : 'Add songs or videos from this device. They stay here and play without a connection.'}
            </p>
            <button
              type="button"
              onClick={onEmptyPrimaryAction}
              className="min-h-[52px] px-7 rounded-[14px] bg-[#d97757] text-[#1a0f0a] font-semibold text-[15px] hover:bg-[#e08567] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
            >
              {hasItems ? 'Open library' : 'Add files'}
            </button>
          </div>
        </section>
      ) : (
        <section
          aria-label="Now Playing"
          className="flex-1 flex flex-col justify-center gap-4 sm:gap-5 px-6 sm:px-10 pt-[calc(72px+env(safe-area-inset-top))] md:pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] min-h-0 overflow-y-auto"
        >
          <div className="max-w-md w-full mx-auto flex flex-col gap-4 sm:gap-5 my-auto">
            {currentItem.type === 'video' ? (
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-black group">
                <video
                  ref={videoRef}
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                />

                {/* Video Quick Action Overlay on hover/touch */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-xs opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSkipTime(-10)}
                      aria-label="Skip back 10 seconds"
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSkipTime(10)}
                      aria-label="Skip forward 10 seconds"
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onToggleMute}
                      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onToggleFullscreen}
                      aria-label="Fullscreen"
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div
                  aria-hidden="true"
                  className="w-full max-w-[320px] sm:max-w-[340px] max-h-[35vh] aspect-square rounded-[22px] grid place-items-center font-serif text-[104px] sm:text-[120px] mx-auto select-none shadow-xl"
                  style={{
                    backgroundColor: `hsl(${hue} 26% 23%)`,
                    color: `hsl(${hue} 65% 80%)`,
                  }}
                >
                  {currentItem.title[0]?.toUpperCase() || '♪'}
                </div>
                {/* Hidden video element reused for audio playback */}
                <video
                  ref={videoRef}
                  playsInline
                  preload="metadata"
                  className="hidden"
                />
              </>
            )}

            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <h1 className="font-serif text-[24px] sm:text-[28px] leading-[1.12] tracking-[-0.015em] text-[#f5f2ea] truncate">
                  {currentItem.title}
                </h1>
                <p className="text-[13px] text-[#a09b90] mt-1 truncate">
                  {currentItem.artist ||
                    (currentItem.type === 'video' ? 'Local video file' : 'Local audio file')}
                </p>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-[#292825] border border-white/5 text-[10px] font-mono tracking-wider uppercase text-[#a09b90] shrink-0">
                {currentItem.type === 'video' ? 'VIDEO' : 'AUDIO'}
              </div>
            </div>

            <div>
              <input
                type="range"
                min={0}
                max={1000}
                value={seekValue}
                aria-label="Seek"
                onChange={(e) => onSeekInput(Number(e.target.value) / 1000)}
                onMouseUp={(e) =>
                  onSeekCommit(
                    Number((e.target as HTMLInputElement).value) / 1000,
                  )
                }
                onTouchEnd={(e) =>
                  onSeekCommit(
                    Number((e.target as HTMLInputElement).value) / 1000,
                  )
                }
                onKeyUp={(e) =>
                  onSeekCommit(
                    Number((e.target as HTMLInputElement).value) / 1000,
                  )
                }
                className="sonara-seek w-full h-7 m-0"
              />
              <div className="flex justify-between text-[#a09b90] text-[11px] font-mono tabular-nums -mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Transport Controls */}
            <div className="flex justify-center items-center gap-6 sm:gap-7">
              <button
                type="button"
                onClick={onPrev}
                aria-label="Previous"
                className="w-12 h-12 rounded-full grid place-items-center text-[#f5f2ea] hover:bg-[#f5f2ea]/8 active:scale-95 transition-all cursor-pointer"
              >
                <SkipBack className="w-6 h-6" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-[66px] h-[66px] rounded-full bg-[#d97757] text-[#1a0f0a] grid place-items-center hover:bg-[#e08567] active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#d97757]/20"
              >
                {isPlaying ? (
                  <Pause
                    className="w-7 h-7 fill-current stroke-none"
                    aria-hidden="true"
                  />
                ) : (
                  <Play
                    className="w-7 h-7 fill-current stroke-none ml-0.5"
                    aria-hidden="true"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={onNext}
                aria-label="Next"
                className="w-12 h-12 rounded-full grid place-items-center text-[#f5f2ea] hover:bg-[#f5f2ea]/8 active:scale-95 transition-all cursor-pointer"
              >
                <SkipForward className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* Playback Aux Controls */}
            <div className="flex justify-between items-center text-[#a09b90] text-xs">
              <button
                type="button"
                onClick={onToggleShuffle}
                aria-label="Shuffle"
                aria-pressed={shuffle}
                className={`min-h-[44px] min-w-[44px] rounded-[10px] grid place-items-center transition-colors cursor-pointer ${
                  shuffle
                    ? 'text-[#d97757] bg-[#d97757]/12'
                    : 'hover:text-[#f5f2ea] hover:bg-[#f5f2ea]/5'
                }`}
              >
                <Shuffle className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onCycleSpeed}
                aria-label={`Playback speed ${speed}x`}
                className={`min-h-[44px] min-w-[44px] px-2 rounded-[10px] grid place-items-center font-mono tabular-nums transition-colors cursor-pointer ${
                  speed !== 1
                    ? 'text-[#d97757] bg-[#d97757]/12'
                    : 'hover:text-[#f5f2ea] hover:bg-[#f5f2ea]/5'
                }`}
              >
                {speed}×
              </button>

              {currentItem.type === 'video' && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  aria-label="Full screen"
                  className="min-h-[44px] min-w-[44px] rounded-[10px] grid place-items-center hover:text-[#f5f2ea] hover:bg-[#f5f2ea]/5 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5" aria-hidden="true" />
                </button>
              )}

              <button
                type="button"
                onClick={onToggleRepeat}
                aria-label="Repeat"
                aria-pressed={repeat}
                className={`min-h-[44px] min-w-[44px] rounded-[10px] grid place-items-center transition-colors cursor-pointer ${
                  repeat
                    ? 'text-[#d97757] bg-[#d97757]/12'
                    : 'hover:text-[#f5f2ea] hover:bg-[#f5f2ea]/5'
                }`}
              >
                <Repeat className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onRequestRemove}
                aria-label={`Remove ${currentItem.title} from this device`}
                className="min-h-[44px] min-w-[44px] rounded-[10px] grid place-items-center hover:text-[#f5f2ea] hover:bg-[#f5f2ea]/5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Audio Tools Row: Equalizer & Lyrics */}
            {currentItem.type === 'audio' && (
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={onOpenEqualizer}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] border border-white/5 transition-colors cursor-pointer"
                >
                  <span>Equalizer</span>
                  <Sliders className="w-4 h-4 text-[#d97757]" />
                </button>
                <button
                  type="button"
                  onClick={onOpenLyrics}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] border border-white/5 transition-colors cursor-pointer"
                >
                  <span>Lyrics</span>
                  <AlignLeft className="w-4 h-4 text-[#d97757]" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
};
