import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
  Maximize2,
  Minimize2,
  Plus,
  Search,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import type { MediaItem } from '../types/media';
import { formatFileSize } from '../utils/media';

interface DocumentsWorkspaceProps {
  documentItems: MediaItem[];
  onAddFilesClick: () => void;
  onRemoveItem: (id: string) => void;
}

export const DocumentsWorkspace: React.FC<DocumentsWorkspaceProps> = ({
  documentItems,
  onAddFilesClick,
  onRemoveItem,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [readingTheme, setReadingTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [fontSize, setFontSize] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isReadingFullscreen, setIsReadingFullscreen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Auto-select first document if none selected
  useEffect(() => {
    if (!selectedDocId && documentItems.length > 0) {
      setSelectedDocId(documentItems[0].id);
    }
  }, [documentItems, selectedDocId]);

  const activeDoc = documentItems.find((d) => d.id === selectedDocId) || null;

  // Load document content or generate object URL
  useEffect(() => {
    if (!activeDoc) {
      setDocContent('');
      setDocUrl(null);
      return;
    }

    if (activeDoc.mime === 'application/pdf' || activeDoc.name.endsWith('.pdf')) {
      const url = URL.createObjectURL(activeDoc.blob);
      setDocUrl(url);
      setDocContent('');
      return () => URL.revokeObjectURL(url);
    } else {
      setDocUrl(null);
      let active = true;
      activeDoc.blob.text().then((text) => {
        if (active) setDocContent(text);
      });
      return () => {
        active = false;
      };
    }
  }, [activeDoc]);

  // Handle Copy text
  const handleCopyText = async () => {
    if (!docContent) return;
    try {
      await navigator.clipboard.writeText(docContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  // Text metrics
  const wordCount = docContent ? docContent.trim().split(/\s+/).filter(Boolean).length : 0;
  const lineCount = docContent ? docContent.split('\n').length : 0;
  const charCount = docContent ? docContent.length : 0;

  // Highlight search results in text content
  const renderHighlightedContent = () => {
    if (!searchQuery.trim()) {
      return docContent;
    }

    const q = searchQuery.toLowerCase();
    const parts = docContent.split(new RegExp(`(${searchQuery})`, 'gi'));

    return parts.map((part, i) =>
      part.toLowerCase() === q ? (
        <mark key={i} className="bg-[#d97757]/40 text-white rounded px-0.5 font-semibold">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  // Search match count
  const matchCount = searchQuery.trim()
    ? (docContent.match(new RegExp(searchQuery, 'gi')) || []).length
    : 0;

  // Reader theme colors
  const getReaderThemeClasses = () => {
    switch (readingTheme) {
      case 'sepia':
        return 'bg-[#f4ecd8] text-[#3d3425] border-[#e8ddc4]';
      case 'light':
        return 'bg-[#ffffff] text-[#1c1c1c] border-slate-200';
      case 'dark':
      default:
        return 'bg-[#181816] text-[#f5f2ea] border-white/5';
    }
  };

  return (
    <div className="flex-1 h-full bg-[#141413] flex flex-col overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-4">
        {/* Workspace Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-semibold text-[#f5f2ea] leading-tight">
                Sonara Documents Workspace
              </h1>
              <p className="text-xs text-[#a09b90]">
                Readdle-style reader · PDF, Markdown, Text, Subtitles · Clean Typography
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddFilesClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] border border-white/5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Document</span>
          </button>
        </div>

        {documentItems.length === 0 ? (
          <div className="w-full aspect-[16/9] max-h-[420px] rounded-2xl border border-dashed border-white/10 bg-[#1d1c1a] flex flex-col items-center justify-center p-6 text-center my-auto">
            <FileText className="w-12 h-12 text-[#a09b90] mb-3 stroke-[1.2]" />
            <h2 className="font-serif text-xl font-semibold text-[#f5f2ea] mb-1">
              No documents stored yet
            </h2>
            <p className="text-xs text-[#a09b90] max-w-sm mb-4">
              Import PDF manuals, notes (.md / .txt), books, subtitles (.srt / .vtt), or lyrics
              (.lrc) for distraction-free reading.
            </p>
            <button
              type="button"
              onClick={onAddFilesClick}
              className="px-5 py-2.5 rounded-xl bg-[#d97757] text-[#1a0f0a] text-xs font-semibold hover:bg-[#e08567] active:scale-95 transition-all cursor-pointer"
            >
              Import Documents
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Left Column: Documents Selector List */}
            <div className="md:col-span-4 flex flex-col gap-2">
              <div className="text-xs font-medium text-[#a09b90] uppercase tracking-wider px-1">
                Vault Documents ({documentItems.length})
              </div>

              <div className="flex flex-col gap-1.5 max-h-[70vh] overflow-y-auto pr-1">
                {documentItems.map((doc) => {
                  const isSelected = doc.id === selectedDocId;
                  const isPdf = doc.mime === 'application/pdf' || doc.name.endsWith('.pdf');
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`
                        flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left group
                        ${
                          isSelected
                            ? 'bg-[#d97757]/15 border-[#d97757]/40 shadow-sm'
                            : 'bg-[#1d1c1a] hover:bg-[#252422] border-white/5'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPdf
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-blue-500/15 text-blue-400'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#f5f2ea] truncate group-hover:text-[#d97757] transition-colors">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-[#a09b90] mt-0.5 truncate font-mono">
                            {isPdf ? 'PDF' : 'Text'} · {formatFileSize(doc.size)}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveItem(doc.id);
                        }}
                        title="Remove document"
                        className="p-1 rounded text-[#a09b90] hover:text-red-400 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Document Reader */}
            <div className="md:col-span-8 flex flex-col gap-3">
              {activeDoc ? (
                <div
                  className={`
                    rounded-2xl border transition-all flex flex-col overflow-hidden shadow-xl
                    ${
                      isReadingFullscreen
                        ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
                        : 'w-full min-h-[70vh]'
                    }
                    ${getReaderThemeClasses()}
                  `}
                >
                  {/* Reader Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-inherit bg-black/5 dark:bg-black/20">
                    <div className="flex items-center gap-2 max-w-[45%] truncate">
                      <span className="font-semibold text-xs sm:text-sm truncate">
                        {activeDoc.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Theme Toggle: Dark, Sepia, Light */}
                      <div className="flex items-center p-0.5 rounded-lg bg-black/10 dark:bg-white/10 text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setReadingTheme('dark')}
                          title="Dark reading mode"
                          className={`px-2 py-1 rounded cursor-pointer ${
                            readingTheme === 'dark' ? 'bg-[#292825] text-white shadow-sm' : ''
                          }`}
                        >
                          Dark
                        </button>
                        <button
                          type="button"
                          onClick={() => setReadingTheme('sepia')}
                          title="Sepia book mode"
                          className={`px-2 py-1 rounded cursor-pointer ${
                            readingTheme === 'sepia' ? 'bg-[#e8ddc4] text-[#3d3425] shadow-sm' : ''
                          }`}
                        >
                          Sepia
                        </button>
                        <button
                          type="button"
                          onClick={() => setReadingTheme('light')}
                          title="Light paper mode"
                          className={`px-2 py-1 rounded cursor-pointer ${
                            readingTheme === 'light' ? 'bg-white text-black shadow-sm' : ''
                          }`}
                        >
                          Light
                        </button>
                      </div>

                      {/* Font Size A- / A+ */}
                      {!docUrl && (
                        <div className="flex items-center gap-1 px-1 py-0.5 rounded-lg bg-black/10 dark:bg-white/10">
                          <button
                            type="button"
                            onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                            className="px-1.5 py-0.5 text-xs font-mono hover:opacity-80 cursor-pointer"
                            title="Decrease text size"
                          >
                            A-
                          </button>
                          <span className="text-[10px] font-mono opacity-60">{fontSize}px</span>
                          <button
                            type="button"
                            onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                            className="px-1.5 py-0.5 text-xs font-mono hover:opacity-80 cursor-pointer"
                            title="Increase text size"
                          >
                            A+
                          </button>
                        </div>
                      )}

                      {/* Copy Action */}
                      {!docUrl && (
                        <button
                          type="button"
                          onClick={handleCopyText}
                          title="Copy all text"
                          className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:opacity-80 cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Fullscreen Reader Mode */}
                      <button
                        type="button"
                        onClick={() => setIsReadingFullscreen((f) => !f)}
                        title={isReadingFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader'}
                        className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:opacity-80 cursor-pointer"
                      >
                        {isReadingFullscreen ? (
                          <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Search in Document bar for text files */}
                  {!docUrl && (
                    <div className="px-4 py-2 border-b border-inherit flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 opacity-50" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search in document..."
                          className="w-full bg-transparent border-0 focus:outline-none text-xs"
                        />
                      </div>
                      {searchQuery && (
                        <span className="text-[11px] font-mono opacity-70">
                          {matchCount} match{matchCount !== 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Document Body Viewport */}
                  <div className="flex-1 p-5 sm:p-8 overflow-y-auto">
                    {docUrl ? (
                      <embed
                        src={docUrl}
                        type="application/pdf"
                        className="w-full h-full min-h-[65vh] rounded-lg"
                      />
                    ) : (
                      <div
                        style={{ fontSize: `${fontSize}px` }}
                        className="max-w-2xl mx-auto leading-relaxed whitespace-pre-wrap font-sans selection:bg-[#d97757]/30"
                      >
                        {renderHighlightedContent()}
                      </div>
                    )}
                  </div>

                  {/* Document Footer Metrics */}
                  {!docUrl && (
                    <div className="px-4 py-2 border-t border-inherit flex items-center justify-between text-[11px] font-mono opacity-60">
                      <span>
                        {wordCount} words · {lineCount} lines · {charCount} chars
                      </span>
                      <span>{formatFileSize(activeDoc.size)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#1d1c1a] border border-white/5 text-center text-xs text-[#a09b90]">
                  Select a document from the vault list to read.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
