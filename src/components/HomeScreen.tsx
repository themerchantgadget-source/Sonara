import React from 'react';
import {
  BookOpen,
  Film,
  FolderArchive,
  Image as ImageIcon,
  ListMusic,
  Music,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { AppNavSpace, MediaItem, PlaylistRecord } from '../types/media';
import { formatFileSize } from '../utils/media';

interface HomeScreenProps {
  items: MediaItem[];
  playlists: PlaylistRecord[];
  onOpenSpace: (space: AppNavSpace) => void;
  onTriggerAddFiles: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  items,
  playlists,
  onOpenSpace,
  onTriggerAddFiles,
}) => {
  const musicItems = items.filter((x) => x.type === 'audio');
  const videoItems = items.filter((x) => x.type === 'video');
  const photoItems = items.filter((x) => x.type === 'photo');
  const docItems = items.filter((x) => x.type === 'document');

  const totalBytes = items.reduce((acc, i) => acc + (i.size || 0), 0);

  return (
    <div
      data-testid="home-screen"
      className="w-full h-full flex flex-col overflow-y-auto bg-[#0b0b0a] text-[#f5f2ea] px-4 sm:px-10 lg:px-14 pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(32px+env(safe-area-inset-bottom))]"
    >
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#f5f2ea] select-none">
              Sonara<span className="text-[#d97757]">.</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTriggerAddFiles}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-semibold text-[#f5f2ea] border border-white/5 transition-all cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Import Files</span>
            </button>
          </div>
        </header>

        {/* Home Intro */}
        <div className="mb-6 sm:mb-8">
          <div className="text-[11px] font-semibold text-[#a09b90] uppercase tracking-[0.16em] mb-2">
            Unified Media Architecture
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal leading-[1.12] tracking-[-0.02em] text-[#f5f2ea] text-balance">
            Four sandboxed workspaces.
            <br />
            One universal library.
          </h1>
          <p className="text-xs sm:text-sm text-[#a09b90] mt-2.5 max-w-xl leading-relaxed">
            Just like specialized tools in a cohesive suite: dedicated music player, VLC video
            theater with inline iOS playback, private photo gallery, and document reader.
          </p>
        </div>

        {/* 4 Dedicated Workspace Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-6">
          {/* 1. Music Workspace Card (Sonara Spotify) */}
          <button
            type="button"
            onClick={() => onOpenSpace('music')}
            data-testid="home-music-card"
            className="group relative h-40 sm:h-44 rounded-[22px] bg-[#1d1c1a] hover:bg-[#242320] border border-[#f5f2ea]/10 p-5 flex flex-col justify-end text-left transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99] shadow-lg"
          >
            <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-[#292825] group-hover:bg-[#d97757] group-hover:text-[#1a0f0a] text-[#d97757] grid place-items-center transition-colors">
              <Music className="w-6 h-6 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#d97757] mb-1">
              {musicItems.length} {musicItems.length === 1 ? 'Track' : 'Tracks'} Stored
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-[#f5f2ea]">
              Music Workspace
            </h2>
            <p className="text-xs text-[#a09b90] mt-1 line-clamp-1">
              Sonara Spotify · Canvas waveform, equalizer, lyrics
            </p>
          </button>

          {/* 2. Video Workspace Card (Sonara VLC) */}
          <button
            type="button"
            onClick={() => onOpenSpace('video')}
            data-testid="home-video-card"
            className="group relative h-40 sm:h-44 rounded-[22px] bg-[#1d1c1a] hover:bg-[#242320] border border-[#f5f2ea]/10 p-5 flex flex-col justify-end text-left transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99] shadow-lg"
          >
            <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-[#292825] group-hover:bg-amber-400 group-hover:text-[#1a0f0a] text-amber-400 grid place-items-center transition-colors">
              <Film className="w-6 h-6 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1">
              {videoItems.length} {videoItems.length === 1 ? 'Video' : 'Videos'} Stored
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-[#f5f2ea]">
              Video Workspace
            </h2>
            <p className="text-xs text-[#a09b90] mt-1 line-clamp-1">
              Sonara VLC · Inline iOS playback, 200% boost, subtitles
            </p>
          </button>

          {/* 3. Photos Workspace Card (Sonara Photos) */}
          <button
            type="button"
            onClick={() => onOpenSpace('photos')}
            data-testid="home-photos-card"
            className="group relative h-40 sm:h-44 rounded-[22px] bg-[#1d1c1a] hover:bg-[#242320] border border-[#f5f2ea]/10 p-5 flex flex-col justify-end text-left transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99] shadow-lg"
          >
            <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-[#292825] group-hover:bg-emerald-400 group-hover:text-[#1a0f0a] text-emerald-400 grid place-items-center transition-colors">
              <ImageIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-1">
              {photoItems.length} {photoItems.length === 1 ? 'Photo' : 'Photos'} Stored
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-[#f5f2ea]">
              Photos Workspace
            </h2>
            <p className="text-xs text-[#a09b90] mt-1 line-clamp-1">
              Sonara Photos · WEBP, PNG, JPG, GIF gallery & zoom
            </p>
          </button>

          {/* 4. Documents Workspace Card (Sonara Docs / Readdle) */}
          <button
            type="button"
            onClick={() => onOpenSpace('documents')}
            data-testid="home-documents-card"
            className="group relative h-40 sm:h-44 rounded-[22px] bg-[#1d1c1a] hover:bg-[#242320] border border-[#f5f2ea]/10 p-5 flex flex-col justify-end text-left transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.99] shadow-lg"
          >
            <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-[#292825] group-hover:bg-blue-400 group-hover:text-[#1a0f0a] text-blue-400 grid place-items-center transition-colors">
              <BookOpen className="w-6 h-6 transition-transform group-hover:scale-110" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-1">
              {docItems.length} {docItems.length === 1 ? 'Document' : 'Documents'} Stored
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-[#f5f2ea]">
              Documents Workspace
            </h2>
            <p className="text-xs text-[#a09b90] mt-1 line-clamp-1">
              Sonara Documents · PDF viewer, dark/sepia text reader
            </p>
          </button>
        </div>

        {/* Universal Library Hub Link */}
        <button
          type="button"
          onClick={() => onOpenSpace('library')}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1c1c1e] hover:bg-[#252528] border border-white/5 transition-colors cursor-pointer mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#292825] text-[#d97757] flex items-center justify-center shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-semibold text-[#f5f2ea] truncate">
                Universal App Library
              </div>
              <div className="text-xs text-[#a09b90]">
                {items.length} total files ({formatFileSize(totalBytes)}) · Central un-sandboxed catalog
              </div>
            </div>
          </div>
          <span className="text-xs text-[#d97757] font-semibold shrink-0">Open Library →</span>
        </button>

        {/* Playlists Quick Link if playlists exist */}
        {playlists.length > 0 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => onOpenSpace('library')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1d1c1a] hover:bg-[#242320] border border-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#292825] text-[#d97757] flex items-center justify-center shrink-0">
                  <ListMusic className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-[#f5f2ea]">
                    Spotify Matched Playlists
                  </div>
                  <div className="text-xs text-[#a09b90]">
                    {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'} available
                  </div>
                </div>
              </div>
              <span className="text-xs text-[#d97757] font-semibold">View Playlists →</span>
            </button>
          </div>
        )}

        {/* Quick starter action when library is empty */}
        {items.length === 0 && (
          <div className="p-5 rounded-2xl bg-[#141413] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-11 h-11 rounded-xl bg-[#292825] text-[#d97757] flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-[#f5f2ea]">
                  Empty vault — Import files to get started
                </h4>
                <p className="text-[11px] text-[#a09b90] mt-0.5">
                  Drop audio (.mp3, .wav), videos (.mp4, .mkv), photos (.webp, .png), or docs
                  (.pdf, .txt).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onTriggerAddFiles}
              className="px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#e08567] text-[#1a0f0a] font-semibold text-xs transition-colors cursor-pointer shrink-0"
            >
              Import Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
