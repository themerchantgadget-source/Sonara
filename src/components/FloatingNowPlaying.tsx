import React from 'react';
import {
  Film,
  ListOrdered,
  Maximize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import type { MediaItem } from '../types/media';
import { computeHue, formatDuration } from '../utils/media';

interface FloatingNowPlayingProps {
  currentItem: MediaItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queueCount: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenQueue: () => void;
  onOpenPlayer: () => void;
}

export const FloatingNowPlaying: React.FC<FloatingNowPlayingProps> = ({
  currentItem,
  isPlaying,
  currentTime,
  duration,
  queueCount,
  onTogglePlay,
  onPrev,
  onNext,
  onOpenQueue,
  onOpenPlayer,
}) => {
  if (!currentItem) return null;

  const hue = computeHue(currentItem.title);
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      data-testid="floating-now-playing"
      className="fixed z-35 bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="relative rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-md border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Continuous Progress Indicator Bar */}
        <div className="w-full h-[2.5px] bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#d97757] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3">
          {/* Left: Artwork & Track info (tap to open full player) */}
          <button
            type="button"
            onClick={onOpenPlayer}
            title="Open full player"
            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group focus:outline-none"
          >
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl grid place-items-center font-serif text-base shrink-0 shadow-sm transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `hsl(${hue} 26% 23%)`,
                color: `hsl(${hue} 65% 80%)`,
              }}
            >
              {currentItem.type === 'video' ? (
                <Film className="w-5 h-5 opacity-90" />
              ) : (
                currentItem.title[0]?.toUpperCase() || '♪'
              )}
            </div>

            <div className="min-w-0 flex-1 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-[#f5f2ea] truncate group-hover:text-[#d97757] transition-colors">
                  {currentItem.title}
                </span>
                <span className="text-[9px] uppercase font-mono px-1 rounded bg-white/10 text-[#a09b90] shrink-0">
                  {currentItem.type}
                </span>
              </div>
              <div className="text-[11px] text-[#a09b90] truncate flex items-center gap-2 mt-0.5">
                <span>{currentItem.artist || 'Sonara'}</span>
                <span>•</span>
                <span className="font-mono tabular-nums text-[10px]">
                  {formatDuration(currentTime)} / {formatDuration(duration)}
                </span>
              </div>
            </div>
          </button>

          {/* Right: Transport Controls matching header tab navigation aesthetic */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Previous */}
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous track"
              className="w-8 h-8 rounded-xl text-[#a09b90] hover:text-[#f5f2ea] hover:bg-white/5 grid place-items-center cursor-pointer transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#d97757] hover:bg-[#e08567] text-[#1a0f0a] grid place-items-center cursor-pointer transition-all active:scale-95 shadow-md shadow-[#d97757]/20"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current stroke-none" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current stroke-none ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={onNext}
              aria-label="Next track"
              className="w-8 h-8 rounded-xl text-[#a09b90] hover:text-[#f5f2ea] hover:bg-white/5 grid place-items-center cursor-pointer transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Queue Icon & Count Badge */}
            <button
              type="button"
              onClick={onOpenQueue}
              aria-label="Queue settings and play order"
              title="Queue & playback order"
              className="relative w-8 h-8 rounded-xl text-[#a09b90] hover:text-[#f5f2ea] hover:bg-white/5 grid place-items-center cursor-pointer transition-colors ml-0.5"
            >
              <ListOrdered className="w-4 h-4" />
              {queueCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#d97757] text-[#1a0f0a] font-mono font-bold text-[9px] grid place-items-center leading-none">
                  {queueCount > 99 ? '99+' : queueCount}
                </span>
              )}
            </button>

            {/* Maximize to full player space */}
            <button
              type="button"
              onClick={onOpenPlayer}
              aria-label="Expand player"
              title="Expand player"
              className="w-8 h-8 rounded-xl text-[#a09b90] hover:text-[#f5f2ea] hover:bg-white/5 hidden sm:grid place-items-center cursor-pointer transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
