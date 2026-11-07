import React, { useState } from 'react';
import {
  BookOpen,
  Eye,
  FileText,
  Film,
  FolderArchive,
  Grid,
  Image as ImageIcon,
  List as ListIcon,
  Music,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { AppNavSpace, LibraryTab, LibraryViewMode, MediaItem, PlaylistRecord } from '../types/media';
import { computeHue, filterAndSortMedia, formatFileSize } from '../utils/media';

interface UniversalLibraryProps {
  items: MediaItem[];
  playlists: PlaylistRecord[];
  activeTab: LibraryTab;
  viewMode: LibraryViewMode;
  onTabChange: (tab: LibraryTab) => void;
  onViewModeChange: (mode: LibraryViewMode) => void;
  onOpenInWorkspace: (item: MediaItem, targetSpace: AppNavSpace) => void;
  onAddFilesClick: () => void;
  onRemoveItem: (id: string) => void;
}

export const UniversalLibrary: React.FC<UniversalLibraryProps> = ({
  items,
  playlists,
  activeTab,
  viewMode,
  onTabChange,
  onViewModeChange,
  onOpenInWorkspace,
  onAddFilesClick,
  onRemoveItem,
}) => {
  const [query, setQuery] = useState('');

  // Counts by media type
  const audioCount = items.filter((i) => i.type === 'audio').length;
  const videoCount = items.filter((i) => i.type === 'video').length;
  const photoCount = items.filter((i) => i.type === 'photo').length;
  const docCount = items.filter((i) => i.type === 'document').length;
  const totalCount = items.length;

  const totalBytes = items.reduce((acc, i) => acc + (i.size || 0), 0);

  // Filtered items based on tab & query
  const displayItems =
    activeTab === 'lists'
      ? []
      : filterAndSortMedia(
          items,
          activeTab as 'all' | 'songs' | 'videos' | 'photos' | 'documents',
          query,
        );

  const tabs: Array<{ id: LibraryTab; label: string; count: number }> = [
    { id: 'all', label: 'All Files', count: totalCount },
    { id: 'songs', label: 'Music', count: audioCount },
    { id: 'videos', label: 'Videos', count: videoCount },
    { id: 'photos', label: 'Photos', count: photoCount },
    { id: 'documents', label: 'Documents', count: docCount },
    { id: 'lists', label: 'Playlists', count: playlists.length },
  ];

  const getWorkspaceForType = (type: MediaItem['type']): AppNavSpace => {
    switch (type) {
      case 'audio':
        return 'music';
      case 'video':
        return 'video';
      case 'photo':
        return 'photos';
      case 'document':
        return 'documents';
    }
  };

  const getIconForType = (type: MediaItem['type']) => {
    switch (type) {
      case 'audio':
        return <Music className="w-4 h-4 text-[#d97757]" />;
      case 'video':
        return <Film className="w-4 h-4 text-amber-400" />;
      case 'photo':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="flex-1 h-full bg-[#141413] flex flex-col overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-5">
        {/* Universal Library Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d97757]/15 flex items-center justify-center text-[#d97757]">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-semibold text-[#f5f2ea] leading-tight">
                Universal App Library
              </h1>
              <p className="text-xs text-[#a09b90]">
                Unified vault · {totalCount} items stored offline ({formatFileSize(totalBytes)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: List vs Grid */}
            <div className="flex items-center p-0.5 rounded-xl bg-[#292825] border border-white/5">
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                aria-label="List view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#333336] text-[#f5f2ea] shadow-sm'
                    : 'text-[#a09b90] hover:text-[#f5f2ea]'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('hero')}
                aria-label="Grid view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'hero'
                    ? 'bg-[#333336] text-[#f5f2ea] shadow-sm'
                    : 'text-[#a09b90] hover:text-[#f5f2ea]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onAddFilesClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d97757] hover:bg-[#e08567] text-xs font-semibold text-[#1a0f0a] transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Media</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a09b90]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all music, videos, photos, and documents..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[#1d1c1a] border border-white/5 text-xs text-[#f5f2ea] placeholder-[#a09b90]/60 focus:outline-none focus:ring-1 focus:ring-[#d97757]"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#1d1c1a] border border-white/5 overflow-x-auto [scrollbar-width:none]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0
                  ${
                    isActive
                      ? 'bg-[#292825] text-[#f5f2ea] shadow-sm'
                      : 'text-[#a09b90] hover:text-[#f5f2ea] hover:bg-white/5'
                  }
                `}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#d97757]/20 text-[#d97757]' : 'bg-black/20 text-[#a09b90]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content View: Playlists Tab */}
        {activeTab === 'lists' ? (
          <div className="flex flex-col gap-3">
            {playlists.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#1d1c1a] border border-white/5 text-center text-xs text-[#a09b90]">
                No playlists imported yet. Match your Spotify library in Settings to create offline
                playlists.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {playlists.map((pl, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[#1d1c1a] border border-white/5 flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      <h3 className="font-semibold text-sm text-[#f5f2ea] truncate">{pl.name}</h3>
                      <p className="text-xs text-[#a09b90] mt-0.5">
                        {pl.ids.length} of {pl.total} songs matched
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-[#d97757]">Offline Playlist</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : displayItems.length === 0 ? (
          /* Empty Items State */
          <div className="p-12 rounded-2xl bg-[#1d1c1a] border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-2">
            <FolderArchive className="w-10 h-10 text-[#a09b90] stroke-[1.2]" />
            <div className="text-sm font-semibold text-[#f5f2ea]">No files found</div>
            <p className="text-xs text-[#a09b90] max-w-xs">
              {query
                ? 'No media matches your search query.'
                : 'Import media files to populate your universal library.'}
            </p>
            {!query && (
              <button
                type="button"
                onClick={onAddFilesClick}
                className="mt-2 px-4 py-2 rounded-xl bg-[#d97757] text-[#1a0f0a] text-xs font-semibold cursor-pointer"
              >
                Import Files
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          /* Detailed List View */
          <div className="flex flex-col gap-1.5">
            {displayItems.map((item) => {
              const hue = computeHue(item.title);
              const targetSpace = getWorkspaceForType(item.type);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1d1c1a] hover:bg-[#252422] border border-white/5 transition-all group"
                >
                  <div
                    onClick={() => onOpenInWorkspace(item, targetSpace)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div
                      className="w-10 h-10 rounded-xl grid place-items-center font-serif text-base shrink-0 select-none shadow-sm"
                      style={{
                        backgroundColor: `hsl(${hue} 26% 23%)`,
                        color: `hsl(${hue} 65% 80%)`,
                      }}
                    >
                      {item.title[0]?.toUpperCase() || '♪'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#f5f2ea] truncate group-hover:text-[#d97757] transition-colors">
                          {item.title}
                        </span>
                        <span className="hidden sm:inline-flex">{getIconForType(item.type)}</span>
                      </div>
                      <div className="text-[11px] text-[#a09b90] truncate mt-0.5">
                        {item.artist || item.mime || item.type} · {formatFileSize(item.size)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenInWorkspace(item, targetSpace)}
                      className="px-2.5 py-1 rounded-lg bg-[#292825] hover:bg-[#333336] text-[11px] font-medium text-[#f5f2ea] transition-colors cursor-pointer"
                    >
                      Open in {targetSpace}
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      title="Remove file"
                      className="p-1.5 rounded-lg text-[#a09b90] hover:text-red-400 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Visual Hero Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {displayItems.map((item) => {
              const hue = computeHue(item.title);
              const targetSpace = getWorkspaceForType(item.type);

              return (
                <div
                  key={item.id}
                  onClick={() => onOpenInWorkspace(item, targetSpace)}
                  className="group relative rounded-2xl overflow-hidden bg-[#1d1c1a] border border-white/5 hover:border-[#d97757]/40 shadow-md transition-all cursor-pointer flex flex-col justify-between p-4 aspect-square"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-black/30 backdrop-blur-sm">
                      {getIconForType(item.type)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="p-1.5 rounded-lg text-[#a09b90] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div
                    className="w-14 h-14 rounded-2xl mx-auto grid place-items-center font-serif text-2xl select-none shadow-lg transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: `hsl(${hue} 26% 23%)`,
                      color: `hsl(${hue} 65% 80%)`,
                    }}
                  >
                    {item.title[0]?.toUpperCase() || '♪'}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#f5f2ea] truncate group-hover:text-[#d97757] transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-[#a09b90] truncate font-mono mt-0.5">
                      {item.type} · {formatFileSize(item.size)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
