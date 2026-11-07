import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  Calendar,
  Check,
  Clock,
  Film,
  HardDrive,
  Layers,
  Music,
  Play,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type { MediaItem, PlaylistRecord } from '../types/media';
import { computeHue, formatDuration, formatFileSize } from '../utils/media';

interface LibraryOverviewSpaceProps {
  items: MediaItem[];
  playlists: PlaylistRecord[];
  currentId: string | null;
  onPlayTrack: (id: string, queueIds: string[]) => void;
  onSelectPlaylist: (playlist: PlaylistRecord) => void;
  onRequestRemove: (id: string) => void;
  onTriggerAddFiles: () => void;
  onTriggerImportSpotify: () => void;
}

export const LibraryOverviewSpace: React.FC<LibraryOverviewSpaceProps> = ({
  items,
  playlists,
  currentId,
  onPlayTrack,
  onSelectPlaylist,
  onRequestRemove,
  onTriggerAddFiles,
  onTriggerImportSpotify,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'audio' | 'video' | 'playlists'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'size'>('newest');

  // Stats calculation
  const totalSizeBytes = useMemo(
    () => items.reduce((sum, item) => sum + (item.size || 0), 0),
    [items],
  );
  const audioCount = useMemo(() => items.filter((x) => x.type === 'audio').length, [items]);
  const videoCount = useMemo(() => items.filter((x) => x.type === 'video').length, [items]);

  // Filtered & sorted media
  const filteredMedia = useMemo(() => {
    let list = items.filter((item) => {
      if (activeFilter === 'audio' && item.type !== 'audio') return false;
      if (activeFilter === 'video' && item.type !== 'video') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.artist.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === 'newest') {
      list.sort((a, b) => b.added - a.added);
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'size') {
      list.sort((a, b) => (b.size || 0) - (a.size || 0));
    }

    return list;
  }, [items, activeFilter, searchQuery, sortBy]);

  return (
    <div
      data-testid="library-overview-space"
      className="flex-1 w-full overflow-y-auto bg-[#0b0b0a] text-[#f5f2ea] px-4 sm:px-8 py-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Stats Cards */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#f5f2ea]">
              Master Media Vault
            </h1>
            <p className="text-xs sm:text-sm text-[#a09b90] mt-1">
              All files imported into your device, categorized and indexed offline.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onTriggerImportSpotify}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1c1c1e] hover:bg-[#272729] text-xs font-medium text-[#f5f2ea] border border-white/5 transition-all cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Import Spotify JSON</span>
            </button>
            <button
              type="button"
              onClick={onTriggerAddFiles}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#e08567] text-xs font-semibold text-[#1a0f0a] transition-all cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Media</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#141413] border border-white/5">
            <div className="flex items-center gap-2 text-[#a09b90] text-xs mb-1">
              <HardDrive className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Total Storage</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#f5f2ea]">
              {formatFileSize(totalSizeBytes)}
            </div>
            <div className="text-[11px] text-[#a09b90] mt-0.5 font-mono">
              {items.length} files total
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141413] border border-white/5">
            <div className="flex items-center gap-2 text-[#a09b90] text-xs mb-1">
              <Music className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Audio Tracks</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#f5f2ea]">
              {audioCount}
            </div>
            <div className="text-[11px] text-[#a09b90] mt-0.5">MP3, FLAC, WAV, AAC</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141413] border border-white/5">
            <div className="flex items-center gap-2 text-[#a09b90] text-xs mb-1">
              <Film className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Video Clips</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#f5f2ea]">
              {videoCount}
            </div>
            <div className="text-[11px] text-[#a09b90] mt-0.5">MP4, WEBM, MOV</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#141413] border border-white/5">
            <div className="flex items-center gap-2 text-[#a09b90] text-xs mb-1">
              <Layers className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Playlists</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#f5f2ea]">
              {playlists.length}
            </div>
            <div className="text-[11px] text-[#a09b90] mt-0.5">Matched from Spotify</div>
          </div>
        </div>

        {/* Filter, Search, and Sort Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#141413] border border-white/5">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1c1c1e]">
            {(
              [
                { id: 'all' as const, label: 'All Files' },
                { id: 'audio' as const, label: 'Audio' },
                { id: 'video' as const, label: 'Video' },
                { id: 'playlists' as const, label: 'Playlists' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeFilter === filter.id
                    ? 'bg-[#272729] text-[#f5f2ea] shadow-sm'
                    : 'text-[#a09b90] hover:text-[#f5f2ea]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex-1 max-w-xs relative flex items-center">
            <Search className="w-4 h-4 text-[#a09b90] absolute left-3" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, artist, file..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1c1c1e] text-xs text-[#f5f2ea] border border-transparent focus:border-[#d97757] outline-none"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#a09b90] px-2">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'title' | 'size')}
              className="bg-[#1c1c1e] text-[#f5f2ea] rounded-lg px-2 py-1 text-xs border border-white/5 outline-none cursor-pointer"
            >
              <option value="newest">Recently Added</option>
              <option value="title">Alphabetical (A-Z)</option>
              <option value="size">File Size</option>
            </select>
          </div>
        </div>

        {/* Content Section: Playlists vs Media Table */}
        {activeFilter === 'playlists' ? (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#a09b90] uppercase tracking-wider">
              Imported Spotify Playlists
            </div>
            {playlists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {playlists.map((pl, idx) => {
                  const hue = computeHue(pl.name);
                  const matchedCount = pl.ids.filter((id) =>
                    items.some((x) => x.id === id),
                  ).length;

                  return (
                    <button
                      key={`${pl.name}-${idx}`}
                      type="button"
                      onClick={() => onSelectPlaylist(pl)}
                      className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#141413] hover:bg-[#1c1c1e] border border-white/5 text-left transition-all cursor-pointer group"
                    >
                      <div
                        className="w-12 h-12 rounded-xl grid place-items-center font-serif text-xl shrink-0"
                        style={{
                          backgroundColor: `hsl(${hue} 26% 23%)`,
                          color: `hsl(${hue} 65% 80%)`,
                        }}
                      >
                        {pl.name[0]?.toUpperCase() || '♪'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#f5f2ea] truncate group-hover:text-[#d97757] transition-colors">
                          {pl.name}
                        </div>
                        <div className="text-xs text-[#a09b90] mt-0.5 tabular-nums">
                          {matchedCount} of {pl.total} tracks on device
                        </div>
                      </div>
                      <Play className="w-4 h-4 text-[#a09b90] group-hover:text-[#d97757] shrink-0" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#141413] text-center text-[#a09b90]">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#d97757]" />
                <p className="text-sm font-medium text-[#f5f2ea]">No Playlists Yet</p>
                <p className="text-xs mt-1">Import your Spotify data JSON export to match files automatically.</p>
              </div>
            )}
          </div>
        ) : (
          /* Media Items Table / Grid */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#a09b90] uppercase tracking-wider px-2">
              <span>
                {filteredMedia.length} {filteredMedia.length === 1 ? 'Item' : 'Items'} Found
              </span>
              <span>Actions</span>
            </div>

            {filteredMedia.length > 0 ? (
              <div className="divide-y divide-white/5 rounded-2xl bg-[#141413] border border-white/5 overflow-hidden">
                {filteredMedia.map((item) => {
                  const hue = computeHue(item.title);
                  const isCur = item.id === currentId;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-3 p-3.5 hover:bg-[#1c1c1e] transition-colors ${
                        isCur ? 'bg-[#d97757]/10' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onPlayTrack(item.id, filteredMedia.map((x) => x.id))}
                        className="flex items-center gap-3.5 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div
                          className="w-10 h-10 rounded-xl grid place-items-center font-serif text-base shrink-0"
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
                          <div className="text-xs sm:text-sm font-medium text-[#f5f2ea] truncate flex items-center gap-2">
                            <span>{item.title}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/5 text-[#a09b90]">
                              {item.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#a09b90] truncate mt-0.5">
                            {item.artist || 'Local file'} · {formatFileSize(item.size)}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onPlayTrack(item.id, filteredMedia.map((x) => x.id))}
                          aria-label={`Play ${item.title}`}
                          className="w-9 h-9 rounded-xl bg-[#272729] hover:bg-[#d97757] hover:text-[#1a0f0a] text-[#f5f2ea] grid place-items-center transition-colors cursor-pointer"
                        >
                          <Play className="w-4 h-4 ml-0.5 fill-current stroke-none" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestRemove(item.id)}
                          aria-label={`Remove ${item.title}`}
                          className="w-9 h-9 rounded-xl text-[#a09b90] hover:text-red-400 hover:bg-white/5 grid place-items-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#141413] text-center text-[#a09b90]">
                <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-[#f5f2ea]">No files matching filter</p>
                <p className="text-xs mt-1">Tap “Add Media” to import more songs or videos.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
