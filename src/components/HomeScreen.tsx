import React from 'react';
import { Film, ListMusic, Music, Sparkles, Upload } from 'lucide-react';
import type { MediaItem, PlaylistRecord } from '../types/media';

interface HomeScreenProps {
  items: MediaItem[];
  playlists: PlaylistRecord[];
  onOpenMusic: () => void;
  onOpenVideo: () => void;
  onOpenPlaylists: () => void;
  onTriggerAddFiles: () => void;
  onPlayTrack: (id: string, queueIds: string[]) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  items,
  playlists,
  onOpenMusic,
  onOpenVideo,
  onOpenPlaylists,
  onTriggerAddFiles,
  onPlayTrack,
}) => {
  const musicItems = items.filter((x) => x.type === 'audio');
  const videoItems = items.filter((x) => x.type === 'video');

  return (
    <div
      data-testid="home-screen"
      className="w-full h-full flex flex-col overflow-y-auto bg-[#0b0b0a] text-[#f5f2ea] px-6 sm:px-12 lg:px-16 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(32px+env(safe-area-inset-bottom))]"
    >
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#f5f2ea] select-none">
              Sonara<span className="text-[#d97757]">.</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onTriggerAddFiles}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-semibold text-[#f5f2ea] border border-white/5 transition-all cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Import Media</span>
            </button>
          </div>
        </header>

        {/* Home Intro */}
        <div className="mb-8 sm:mb-10">
          <div className="text-[11px] font-semibold text-[#a09b90] uppercase tracking-[0.16em] mb-3">
            Your Personal Offline Vault
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal leading-[1.1] tracking-[-0.02em] text-[#f5f2ea] text-balance">
            Everything in its place.
          </h1>
          <p className="text-sm sm:text-base text-[#a09b90] mt-3 max-w-xl leading-relaxed">
            Choose what you want to listen to or watch. Local files stay on this device and play anywhere without an internet connection.
          </p>
        </div>

        {/* Primary Media Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Music Card */}
          <button
            type="button"
            onClick={onOpenMusic}
            data-testid="home-music-card"
            className="group relative h-48 sm:h-52 rounded-[24px] bg-[#1d1c1a] hover:bg-[#242320] border border-[#f5f2ea]/10 p-6 flex flex-col justify-end text-left transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99] shadow-lg"
          >
            <div className="absolute top-5 right-5 w-14 h-14 rounded-2xl bg-[#292825] group-hover:bg-[#d97757] group-hover:text-[#1a0f0a] text-[#d97757] grid place-items-center transition-colors">
              <Music className="w-7 h-7 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#d97757] mb-1">
              {musicItems.length} {musicItems.length === 1 ? 'Track' : 'Tracks'} Stored
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#f5f2ea]">
              Music
            </h2>
            <p className="text-xs sm:text-sm text-[#a09b90] mt-1.5">
              Your songs, albums, and matched playlists
            </p>
          </button>

          {/* Video Card */}
          <button
            type="button"
            onClick={onOpenVideo}
            data-testid="home-video-card"
            className="group relative h-48 sm:h-52 rounded-[24px] bg-[#1d1c1a] hover:bg-[#242320] border border-[#f5f2ea]/10 p-6 flex flex-col justify-end text-left transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99] shadow-lg"
          >
            <div className="absolute top-5 right-5 w-14 h-14 rounded-2xl bg-[#292825] group-hover:bg-[#d97757] group-hover:text-[#1a0f0a] text-[#d97757] grid place-items-center transition-colors">
              <Film className="w-7 h-7 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#d97757] mb-1">
              {videoItems.length} {videoItems.length === 1 ? 'Video' : 'Videos'} Stored
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#f5f2ea]">
              Video
            </h2>
            <p className="text-xs sm:text-sm text-[#a09b90] mt-1.5">
              Your films, clips, and recordings with audio boost
            </p>
          </button>
        </div>

        {/* Quick starter action when library is empty */}
        {items.length === 0 && (
          <div className="p-6 rounded-2xl bg-[#141413] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#292825] text-[#d97757] grid place-items-center shrink-0 mx-auto sm:mx-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#f5f2ea]">
                  Start building your offline library
                </h4>
                <p className="text-xs text-[#a09b90] mt-0.5">
                  Import audio/video files or match your Spotify export JSON in seconds.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onTriggerAddFiles}
              className="px-5 py-2.5 rounded-xl bg-[#d97757] hover:bg-[#e08567] text-[#1a0f0a] font-semibold text-xs transition-colors cursor-pointer shrink-0"
            >
              Add Files Now
            </button>
          </div>
        )}

        {/* Playlists Quick Link if playlists exist */}
        {playlists.length > 0 && (
          <div className="mb-8">
            <button
              type="button"
              onClick={onOpenPlaylists}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1d1c1a] hover:bg-[#242320] border border-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#292825] text-[#d97757] grid place-items-center">
                  <ListMusic className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-[#f5f2ea]">
                    Spotify & Custom Playlists
                  </div>
                  <div className="text-xs text-[#a09b90]">
                    {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'} available on device
                  </div>
                </div>
              </div>
              <span className="text-xs text-[#d97757] font-semibold">Open Playlists →</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#a09b90]">
          <div>A quieter, private place for your offline media.</div>
          <div className="font-mono text-[11px]">IndexedDB Offline Storage</div>
        </footer>
      </div>
    </div>
  );
};
