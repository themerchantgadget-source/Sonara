import React from 'react';
import {
  FileText,
  Film,
  FolderArchive,
  Home,
  Image as ImageIcon,
  Music,
  Settings,
} from 'lucide-react';
import type { AppNavSpace, MediaItem } from '../types/media';

interface HeaderTabNavProps {
  activeSpace: AppNavSpace;
  onSelectSpace: (space: AppNavSpace) => void;
  currentItem: MediaItem | null;
  isPlaying: boolean;
  onQuickTogglePlay: () => void;
}

export const HeaderTabNav: React.FC<HeaderTabNavProps> = ({
  activeSpace,
  onSelectSpace,
  currentItem,
  isPlaying,
}) => {
  const tabs = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
      description: 'Home dashboard',
    },
    {
      id: 'music' as const,
      label: 'Music',
      icon: Music,
      description: 'Music space (Sonara Spotify)',
    },
    {
      id: 'video' as const,
      label: 'Video',
      icon: Film,
      description: 'Video player space (Sonara VLC)',
    },
    {
      id: 'photos' as const,
      label: 'Photos',
      icon: ImageIcon,
      description: 'Photos gallery space',
    },
    {
      id: 'documents' as const,
      label: 'Documents',
      icon: FileText,
      description: 'Documents reader space',
    },
    {
      id: 'library' as const,
      label: 'Library',
      icon: FolderArchive,
      description: 'Universal media library',
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      description: 'Preferences, connectors & equalizer',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#111111]/95 backdrop-blur-md border-b border-[#f5f2ea]/10 pt-[calc(8px+env(safe-area-inset-top))] pb-2 px-3 sm:px-6 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Lockup: solo/minimal typographic header styled cleanly */}
        <button
          type="button"
          onClick={() => onSelectSpace('home')}
          className="flex flex-col text-left group cursor-pointer focus:outline-none"
        >
          <span className="font-serif text-lg sm:text-xl font-semibold tracking-[-0.03em] text-[#f5f2ea] group-hover:text-[#d97757] transition-colors leading-tight">
            SONARA
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#a09b90]">
            offline media
          </span>
        </button>

        {/* Header Tab Navigation Bar matching the SoloWrite concept */}
        <nav
          role="tablist"
          aria-label="Application spaces"
          className="flex items-center gap-0.5 sm:gap-1.5 p-1 rounded-2xl bg-[#1c1c1e] border border-white/5 shadow-inner overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSpace === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                title={tab.description}
                onClick={() => onSelectSpace(tab.id)}
                className={`
                  relative flex items-center justify-center
                  min-w-[40px] sm:min-w-[46px] h-10 sm:h-11 px-2 sm:px-2.5 rounded-xl
                  transition-all duration-200 cursor-pointer shrink-0
                  ${
                    isActive
                      ? 'bg-[#272729] text-[#f5f2ea] shadow-sm'
                      : 'text-[#99999f] hover:text-[#f5f2ea] hover:bg-white/5'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.7]'
                  }`}
                />

                {/* Subtle active accent indicator dot underneath */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-[#d97757]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right quick status: now playing ticker pill or quick play toggle */}
        <div className="flex items-center gap-2">
          {currentItem ? (
            <button
              type="button"
              onClick={() => onSelectSpace(currentItem.type === 'video' ? 'video' : 'music')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1c1c1e] hover:bg-[#272729] border border-white/5 text-left transition-all cursor-pointer group max-w-[150px] sm:max-w-[200px]"
              title={`Now playing: ${currentItem.title}`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isPlaying ? 'bg-[#d97757] animate-pulse' : 'bg-[#99999f]'
                }`}
              />
              <span className="text-[11px] font-medium text-[#f5f2ea] truncate group-hover:text-[#d97757] transition-colors">
                {currentItem.title}
              </span>
            </button>
          ) : (
            <div className="hidden sm:block text-[11px] font-mono text-[#a09b90]">
              READY
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
