import React, { useEffect, useRef, useState } from 'react';
import { AlignLeft, FileText, Upload, X } from 'lucide-react';
import type { LyricLine } from '../types/media';
import { findActiveLyricIndex, parseLrcLyrics } from '../utils/media';

interface LyricsModalProps {
  isOpen: boolean;
  songTitle: string;
  songId: string | null;
  currentTime: number;
  onClose: () => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  isOpen,
  songTitle,
  songId,
  currentTime,
  onClose,
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved lyrics whenever songId changes or modal opens
  useEffect(() => {
    if (!songId) {
      setRawText('');
      setParsedLyrics([]);
      return;
    }
    const saved = localStorage.getItem(`sonara-lyrics-${songId}`) || '';
    setRawText(saved);
    setParsedLyrics(parseLrcLyrics(saved));
    setIsEditing(!saved.trim());
  }, [songId, isOpen]);

  // Keep parsed lyrics updated when rawText changes
  const handleLyricsChange = (text: string) => {
    setRawText(text);
    setParsedLyrics(parseLrcLyrics(text));
  };

  const handleSave = () => {
    if (songId) {
      localStorage.setItem(`sonara-lyrics-${songId}`, rawText);
    }
    setIsEditing(false);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      handleLyricsChange(text);
      if (songId) {
        localStorage.setItem(`sonara-lyrics-${songId}`, text);
      }
      setIsEditing(false);
    } catch {
      // Ignore reading error
    }
  };

  const activeIndex = findActiveLyricIndex(parsedLyrics, currentTime);

  // Auto-scroll to currently active line
  useEffect(() => {
    if (activeLineRef.current && !isEditing) {
      activeLineRef.current.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  }, [activeIndex, isEditing]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lyrics-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs"
    >
      <div className="w-full sm:max-w-lg max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#1c1c1e] text-[#f5f5f5] border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#272729] grid place-items-center text-[#d97757]">
                <AlignLeft className="w-4 h-4" />
              </div>
              <h2 id="lyrics-title" className="font-serif text-xl font-medium tracking-tight truncate">
                Lyrics
              </h2>
            </div>
            <p className="text-xs text-[#99999f] truncate mt-1">
              {songTitle || 'Choose a song to sync lyrics'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lyrics"
            className="w-9 h-9 rounded-full bg-[#272729] text-[#99999f] hover:text-[#f5f5f5] grid place-items-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-5 min-h-[220px]">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <label htmlFor="lyrics-textarea" className="text-xs text-[#99999f]">
                Paste plain lyrics or synchronized LRC timestamps (e.g.{' '}
                <span className="font-mono text-[#d97757]">[01:23.45] lyric line</span>)
              </label>
              <textarea
                id="lyrics-textarea"
                rows={9}
                value={rawText}
                onChange={(e) => handleLyricsChange(e.target.value)}
                placeholder="[00:12.00] First lyric line&#10;[00:18.50] Second lyric line..."
                className="w-full p-3.5 rounded-xl bg-[#272729] border border-white/10 text-xs sm:text-sm text-[#f5f5f5] font-mono leading-relaxed outline-none focus:border-[#d97757] resize-y"
              />
            </div>
          ) : parsedLyrics.length > 0 ? (
            <div className="space-y-4 text-center py-4">
              {parsedLyrics.map((line, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <div
                    key={`${line.time}-${idx}`}
                    ref={isActive ? activeLineRef : null}
                    className={`transition-all duration-300 ${
                      isActive
                        ? 'text-[#f5f5f5] text-lg sm:text-xl font-semibold scale-105'
                        : 'text-[#99999f] text-sm sm:text-base opacity-65'
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          ) : rawText.trim() ? (
            <div className="whitespace-pre-wrap text-center text-sm leading-relaxed text-[#f5f5f5]/80 py-4">
              {rawText}
            </div>
          ) : (
            <div className="text-center py-12 text-[#99999f]">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-[#f5f5f5]">No lyrics available</p>
              <p className="text-xs mt-1">Import an .lrc file or paste lyrics to synchronize playback.</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2.5 shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#d97757] hover:bg-[#e08567] text-[#1a0f0a] font-semibold text-xs transition-colors cursor-pointer"
              >
                Save Lyrics
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 px-4 rounded-xl bg-[#272729] text-[#f5f5f5] text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#272729] hover:bg-[#333336] text-[#f5f5f5] text-xs font-medium transition-colors cursor-pointer"
              >
                Edit / Paste
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#d97757] hover:bg-[#e08567] text-[#1a0f0a] font-semibold text-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Import LRC
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".lrc,.txt,text/plain"
            hidden
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
};
