import React from 'react';
import { ArrowDown, Film, Grid, List, Music, X } from 'lucide-react';
import type { LibraryTab, LibraryViewMode, MediaItem, PlaylistRecord } from '../types/media';
import { computeHue, filterAndSortMedia, formatFileSize } from '../utils/media';

interface LibrarySidebarProps {
  items: MediaItem[];
  lists: PlaylistRecord[];
  tab: LibraryTab;
  query: string;
  currentId: string | null;
  viewMode: LibraryViewMode;
  onGoHome: () => void;
  onTabChange: (tab: LibraryTab) => void;
  onQueryChange: (query: string) => void;
  onViewModeChange: (mode: LibraryViewMode) => void;
  onSelectTrack: (id: string, queueIds: string[]) => void;
  onSelectPlaylist: (playlist: PlaylistRecord) => void;
  onDeletePlaylist: (index: number) => void;
  onTriggerAddFiles: () => void;
  onTriggerImportSpotify: () => void;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  items,
  lists,
  tab,
  query,
  currentId,
  viewMode,
  onGoHome,
  onTabChange,
  onQueryChange,
  onViewModeChange,
  onSelectTrack,
  onSelectPlaylist,
  onDeletePlaylist,
  onTriggerAddFiles,
  onTriggerImportSpotify,
}) => {
  const filteredRows =
    tab === 'lists' ? [] : filterAndSortMedia(items, tab, query);

  const itemIdsSet = new Set(items.map((item) => item.id));

  return (
    <aside
      aria-label="Media Library"
      className="
        w-[75%] md:w-[360px] lg:w-[380px] md:shrink-0
        h-full flex flex-col
        bg-[#0b0b0a] md:border-r md:border-[#f5f2ea]/12
        pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(16px+env(safe-area-inset-bottom))]
        pl-4 pr-3.5 md:px-6
        max-md:absolute max-md:inset-y-0 max-md:left-0
      "
    >
      <div className="flex items-center justify-between pl-[58px] md:pl-0 pr-1">
        <button
          type="button"
          onClick={onGoHome}
          title="Return to Home screen"
          className="font-serif text-[28px] leading-[48px] tracking-[-0.02em] text-[#f5f2ea] hover:text-[#d97757] transition-colors select-none text-left cursor-pointer"
        >
          Sonara<span className="text-[#d97757]">.</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onGoHome}
            title="Home"
            aria-label="Home"
            className="p-1.5 rounded-lg text-[#a09b90] hover:text-[#f5f2ea] hover:bg-[#292825] transition-colors cursor-pointer"
          >
            <span className="text-xs font-semibold px-1">Home</span>
          </button>

          {tab !== 'lists' && (
            <div className="flex items-center bg-[#141413] border border-[#f5f2ea]/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                aria-label="List view"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#292825] text-[#f5f2ea]'
                    : 'text-[#a09b90] hover:text-[#f5f2ea]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('hero')}
                aria-label="Hero grid view"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'hero'
                    ? 'bg-[#292825] text-[#f5f2ea]'
                    : 'text-[#a09b90] hover:text-[#f5f2ea]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3.5 mb-2.5">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search your library"
          aria-label="Search your library"
          className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#f5f2ea]/12 bg-[#141413] text-[15px] text-[#f5f2ea] placeholder:text-[#a09b90] transition-colors focus:border-[#d97757]"
        />
      </div>

      <div
        role="tablist"
        aria-label="Library categories"
        className="flex p-1 rounded-[11px] bg-[#141413] gap-1"
      >
        {(
          [
            { id: 'songs', label: 'Songs' },
            { id: 'videos', label: 'Videos' },
            { id: 'lists', label: 'Playlists' },
          ] as const
        ).map((segment) => {
          const active = tab === segment.id;
          return (
            <button
              key={segment.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(segment.id)}
              className={`flex-1 min-h-[40px] rounded-lg text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#292825] text-[#f5f2ea]'
                  : 'text-[#a09b90] hover:text-[#f5f2ea]'
              }`}
            >
              {segment.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto my-2 -mx-2 px-1 min-h-0">
        {tab === 'lists' ? (
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={onTriggerImportSpotify}
              className="grid grid-cols-[44px_1fr] gap-3 items-center w-full min-h-[60px] p-2 rounded-xl text-left hover:bg-[#f5f2ea]/5 active:bg-[#d97757]/15 transition-colors cursor-pointer"
            >
              <span className="w-11 h-11 rounded-[9px] grid place-items-center bg-[#292825] text-[#d97757]">
                <ArrowDown className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-sm text-[#f5f2ea] truncate">
                  Import from Spotify
                </span>
                <span className="block text-xs text-[#a09b90] truncate mt-0.5">
                  Match a data export to your files
                </span>
              </span>
            </button>

            {lists.map((playlist, index) => {
              const matchedCount = playlist.ids.filter((id) =>
                itemIdsSet.has(id),
              ).length;
              const h = computeHue(playlist.name);
              return (
                <div
                  key={`${playlist.name}-${index}`}
                  className="grid grid-cols-[1fr_auto] gap-1 items-center w-full min-h-[60px] pl-2 pr-1 py-1.5 rounded-xl hover:bg-[#f5f2ea]/5 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectPlaylist(playlist)}
                    className="grid grid-cols-[44px_1fr] gap-3 items-center min-h-[48px] text-left cursor-pointer min-w-0"
                  >
                    <span
                      className="w-11 h-11 rounded-[9px] grid place-items-center font-serif font-medium text-[19px] shrink-0"
                      style={{
                        backgroundColor: `hsl(${h} 26% 23%)`,
                        color: `hsl(${h} 65% 80%)`,
                      }}
                    >
                      {playlist.name[0]?.toUpperCase() || '♪'}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-sm text-[#f5f2ea] truncate">
                        {playlist.name}
                      </span>
                      <span className="block text-xs text-[#a09b90] truncate mt-0.5 tabular-nums">
                        {matchedCount} of {playlist.total} on this device
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeletePlaylist(index)}
                    aria-label={`Delete playlist ${playlist.name}`}
                    className="w-11 h-11 rounded-lg text-[#a09b90] hover:text-[#f5f2ea] hover:bg-[#f5f2ea]/8 grid place-items-center cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}

            {lists.length === 0 && (
              <p className="px-2 py-5 text-[13px] leading-relaxed text-[#a09b90]">
                Request your data at spotify.com/account/privacy, then add the
                playlist file here. Sonara matches track names to files you
                already have; it never downloads from Spotify.
              </p>
            )}
          </div>
        ) : viewMode === 'hero' ? (
          /* Hero Grid View from attached media player */
          <div className="grid grid-cols-2 gap-2.5 p-1">
            {filteredRows.map((item) => {
              const isCurrent = item.id === currentId;
              const h = computeHue(item.title);
              const queueIds = filteredRows.map((r) => r.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTrack(item.id, queueIds)}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`flex flex-col text-left rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[#d97757] bg-[#d97757]/10'
                      : 'border-[#f5f2ea]/8 bg-[#141413] hover:border-[#f5f2ea]/20'
                  }`}
                >
                  <div
                    className="w-full aspect-[4/3] grid place-items-center"
                    style={{
                      backgroundColor: `hsl(${h} 26% 23%)`,
                      color: `hsl(${h} 65% 80%)`,
                    }}
                  >
                    {item.type === 'video' ? (
                      <Film className="w-8 h-8 opacity-80" />
                    ) : (
                      <span className="font-serif text-3xl font-medium">
                        {item.title[0]?.toUpperCase() || '♪'}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 min-w-0">
                    <strong className="block text-xs font-medium text-[#f5f2ea] truncate">
                      {item.title}
                    </strong>
                    <small className="block text-[11px] text-[#a09b90] truncate mt-0.5">
                      {item.artist || formatFileSize(item.size)}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Standard List View */
          <div className="space-y-0.5">
            {filteredRows.map((item) => {
              const isCurrent = item.id === currentId;
              const h = computeHue(item.title);
              const queueIds = filteredRows.map((r) => r.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTrack(item.id, queueIds)}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`grid grid-cols-[44px_1fr] gap-3 items-center w-full min-h-[60px] p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#d97757]/16'
                      : 'hover:bg-[#f5f2ea]/5 active:bg-[#d97757]/14'
                  }`}
                >
                  <span
                    className="w-11 h-11 rounded-[9px] grid place-items-center font-serif font-medium text-[19px] shrink-0"
                    style={{
                      backgroundColor: `hsl(${h} 26% 23%)`,
                      color: `hsl(${h} 65% 80%)`,
                    }}
                  >
                    {item.type === 'video' ? (
                      <Film className="w-5 h-5 opacity-85" />
                    ) : (
                      item.title[0]?.toUpperCase() || '♪'
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-sm text-[#f5f2ea] truncate">
                      {item.title}
                    </span>
                    <span className="block text-xs text-[#a09b90] truncate mt-0.5">
                      {item.artist ||
                        (item.type === 'video' ? 'Video' : formatFileSize(item.size))}
                    </span>
                  </span>
                </button>
              );
            })}

            {filteredRows.length === 0 && (
              <p className="px-2 py-5 text-[13px] leading-relaxed text-[#a09b90]">
                {query.trim()
                  ? 'No matches.'
                  : 'Nothing here yet. Tap Add files.'}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onTriggerAddFiles}
        className="w-full min-h-[52px] px-5 rounded-[14px] bg-[#d97757] text-[#1a0f0a] font-semibold text-[15px] hover:bg-[#e08567] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap shrink-0"
      >
        Add files
      </button>
    </aside>
  );
};
