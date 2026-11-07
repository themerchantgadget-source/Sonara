import React from 'react';
import {
  Check,
  Disc,
  Film,
  ListMusic,
  ListOrdered,
  Music,
  Play,
  Repeat,
  Shuffle,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import type { MediaItem } from '../types/media';
import { computeHue, formatDuration, formatFileSize } from '../utils/media';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  queueIds: string[];
  currentId: string | null;
  onSelectTrack: (id: string) => void;
  shuffle: boolean;
  repeat: boolean;
  speed: number;
  autoPlayNext: boolean;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onCycleSpeed: () => void;
  onToggleAutoPlayNext: (val: boolean) => void;
  onClearQueue: () => void;
  onQueueAllAudio: () => void;
  onQueueAllVideo: () => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  onClose,
  items,
  queueIds,
  currentId,
  onSelectTrack,
  shuffle,
  repeat,
  speed,
  autoPlayNext,
  onToggleShuffle,
  onToggleRepeat,
  onCycleSpeed,
  onToggleAutoPlayNext,
  onClearQueue,
  onQueueAllAudio,
  onQueueAllVideo,
}) => {
  if (!isOpen) return null;

  const itemMap = new Map(items.map((i) => [i.id, i]));
  const queueItems = queueIds
    .map((id) => itemMap.get(id))
    .filter((x): x is MediaItem => Boolean(x));

  const currentItem = currentId ? itemMap.get(currentId) || null : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="queue-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[85vh] sm:max-h-[80vh] flex flex-col bg-[#141413] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#292825] text-[#d97757] grid place-items-center">
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="queue-modal-title"
                className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#f5f2ea]"
              >
                Playback Queue & Order
              </h2>
              <p className="text-xs text-[#a09b90]">
                {queueItems.length} {queueItems.length === 1 ? 'item' : 'items'} in queue
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close queue settings"
            className="w-8 h-8 rounded-full bg-[#1c1c1e] text-[#a09b90] hover:text-[#f5f2ea] grid place-items-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playback Mode Toggles (User setting how media files play) */}
        <div className="px-6 py-4 bg-[#1a1917] border-b border-white/5 space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#a09b90]">
            Playback Configuration
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Shuffle Toggle */}
            <button
              type="button"
              onClick={onToggleShuffle}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                shuffle
                  ? 'bg-[#d97757]/15 border-[#d97757] text-[#f5f2ea]'
                  : 'bg-[#141413] border-white/5 text-[#a09b90] hover:text-[#f5f2ea]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-[#d97757]" />
                <span className="text-xs font-medium">Shuffle</span>
              </div>
              <span className="text-[10px] font-mono uppercase">
                {shuffle ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Repeat Toggle */}
            <button
              type="button"
              onClick={onToggleRepeat}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                repeat
                  ? 'bg-[#d97757]/15 border-[#d97757] text-[#f5f2ea]'
                  : 'bg-[#141413] border-white/5 text-[#a09b90] hover:text-[#f5f2ea]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#d97757]" />
                <span className="text-xs font-medium">Repeat</span>
              </div>
              <span className="text-[10px] font-mono uppercase">
                {repeat ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Playback Speed Cycle */}
            <button
              type="button"
              onClick={onCycleSpeed}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#141413] border border-white/5 hover:border-white/10 text-[#a09b90] hover:text-[#f5f2ea] transition-all cursor-pointer"
            >
              <span className="text-xs font-medium">Speed</span>
              <span className="text-xs font-mono font-semibold text-[#d97757] tabular-nums">
                {speed}×
              </span>
            </button>

            {/* Auto-Play Next Toggle */}
            <button
              type="button"
              onClick={() => onToggleAutoPlayNext(!autoPlayNext)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                autoPlayNext
                  ? 'bg-[#d97757]/15 border-[#d97757] text-[#f5f2ea]'
                  : 'bg-[#141413] border-white/5 text-[#a09b90] hover:text-[#f5f2ea]'
              }`}
            >
              <span className="text-xs font-medium">Auto-Play</span>
              <span className="text-[10px] font-mono uppercase">
                {autoPlayNext ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-[220px]">
          {/* Now Playing Banner in Queue */}
          {currentItem && (
            <div className="p-3.5 rounded-2xl bg-[#d97757]/10 border border-[#d97757]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl grid place-items-center font-serif font-medium text-base shrink-0"
                  style={{
                    backgroundColor: `hsl(${computeHue(currentItem.title)} 26% 23%)`,
                    color: `hsl(${computeHue(currentItem.title)} 65% 80%)`,
                  }}
                >
                  {currentItem.type === 'video' ? (
                    <Film className="w-4 h-4 opacity-90" />
                  ) : (
                    currentItem.title[0]?.toUpperCase() || '♪'
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#d97757] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97757] animate-pulse" />
                    <span>Now Playing</span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-[#f5f2ea] truncate">
                    {currentItem.title}
                  </div>
                  <div className="text-[11px] text-[#a09b90] truncate">
                    {currentItem.artist || formatFileSize(currentItem.size)}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#a09b90] shrink-0">
                ACTIVE
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-[#a09b90] uppercase tracking-wider">
              Up Next
            </span>
            {queueItems.length > 0 && (
              <button
                type="button"
                onClick={onClearQueue}
                className="text-xs text-[#a09b90] hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Queue</span>
              </button>
            )}
          </div>

          {queueItems.length > 0 ? (
            <div className="divide-y divide-white/5 rounded-2xl bg-[#1a1917] border border-white/5 overflow-hidden">
              {queueItems.map((item, idx) => {
                const isCurrent = item.id === currentId;
                const hue = computeHue(item.title);

                return (
                  <button
                    key={`${item.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      onSelectTrack(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between gap-3 p-3 text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#d97757]/15'
                        : 'hover:bg-white/5 active:bg-[#d97757]/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-5 text-center text-xs font-mono text-[#a09b90]">
                        {idx + 1}
                      </span>
                      <div
                        className="w-9 h-9 rounded-lg grid place-items-center font-serif text-sm shrink-0"
                        style={{
                          backgroundColor: `hsl(${hue} 26% 23%)`,
                          color: `hsl(${hue} 65% 80%)`,
                        }}
                      >
                        {item.type === 'video' ? (
                          <Film className="w-4 h-4 opacity-85" />
                        ) : (
                          item.title[0]?.toUpperCase() || '♪'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs font-medium truncate ${
                            isCurrent ? 'text-[#d97757]' : 'text-[#f5f2ea]'
                          }`}
                        >
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#a09b90] truncate">
                          {item.artist || formatFileSize(item.size)}
                        </div>
                      </div>
                    </div>

                    <Play
                      className={`w-4 h-4 shrink-0 transition-opacity ${
                        isCurrent
                          ? 'text-[#d97757] fill-current opacity-100'
                          : 'text-[#a09b90] opacity-40 hover:opacity-100'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#1a1917] text-center text-[#a09b90]">
              <ListMusic className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#d97757]" />
              <p className="text-sm font-medium text-[#f5f2ea]">Queue is currently empty</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">
                Select tracks from your library or quick load from your offline files below.
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={onQueueAllAudio}
                  className="px-3 py-1.5 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] transition-colors cursor-pointer"
                >
                  Queue All Audio
                </button>
                <button
                  type="button"
                  onClick={onQueueAllVideo}
                  className="px-3 py-1.5 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] transition-colors cursor-pointer"
                >
                  Queue All Video
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#111111] border-t border-white/5 flex items-center justify-between text-xs text-[#a09b90]">
          <span>Tap any track to play next</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#d97757] text-[#1a0f0a] font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
