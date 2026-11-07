import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Info,
  Maximize2,
  Pause,
  Play,
  Plus,
  RotateCw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { MediaItem } from '../types/media';
import { formatFileSize } from '../utils/media';

interface PhotosWorkspaceProps {
  photoItems: MediaItem[];
  onAddFilesClick: () => void;
  onRemoveItem: (id: string) => void;
}

export const PhotosWorkspace: React.FC<PhotosWorkspaceProps> = ({
  photoItems,
  onAddFilesClick,
  onRemoveItem,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState<boolean>(false);
  const [showMetadataHud, setShowMetadataHud] = useState<boolean>(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageDimensions, setImageDimensions] = useState<Record<string, { w: number; h: number }>>(
    {},
  );

  // Generate object URLs for images
  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const item of photoItems) {
      if (item.type === 'photo' && item.blob) {
        urls[item.id] = URL.createObjectURL(item.blob);
      }
    }
    setImageUrls(urls);

    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photoItems]);

  // Handle slideshow auto-advance
  useEffect(() => {
    if (!isSlideshowPlaying || activePhotoIndex === null || photoItems.length === 0) return;

    const timer = window.setInterval(() => {
      setActivePhotoIndex((prev) => (prev !== null ? (prev + 1) % photoItems.length : 0));
    }, 3500);

    return () => clearInterval(timer);
  }, [isSlideshowPlaying, activePhotoIndex, photoItems.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev !== null ? (prev + 1) % photoItems.length : 0));
        setZoomScale(1);
        setRotationDegrees(0);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) =>
          prev !== null ? (prev - 1 + photoItems.length) % photoItems.length : 0,
        );
        setZoomScale(1);
        setRotationDegrees(0);
      } else if (e.key === 'Escape') {
        setActivePhotoIndex(null);
        setIsSlideshowPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, photoItems.length]);

  const activeItem = activePhotoIndex !== null ? photoItems[activePhotoIndex] : null;

  return (
    <div className="flex-1 h-full bg-[#141413] flex flex-col overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-5">
        {/* Workspace Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-semibold text-[#f5f2ea] leading-tight">
                Sonara Photos Workspace
              </h1>
              <p className="text-xs text-[#a09b90]">
                Private offline gallery · WEBP, PNG, JPG, GIF, AVIF · Lightbox & Zoom
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddFilesClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] border border-white/5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Photos</span>
          </button>
        </div>

        {/* Gallery Grid */}
        {photoItems.length === 0 ? (
          <div className="w-full aspect-[16/9] max-h-[420px] rounded-2xl border border-dashed border-white/10 bg-[#1d1c1a] flex flex-col items-center justify-center p-6 text-center my-auto">
            <ImageIcon className="w-12 h-12 text-[#a09b90] mb-3 stroke-[1.2]" />
            <h2 className="font-serif text-xl font-semibold text-[#f5f2ea] mb-1">
              No photos stored yet
            </h2>
            <p className="text-xs text-[#a09b90] max-w-sm mb-4">
              Import personal photos, wallpapers, album art or camera rolls. They remain 100%
              offline on this device.
            </p>
            <button
              type="button"
              onClick={onAddFilesClick}
              className="px-5 py-2.5 rounded-xl bg-[#d97757] text-[#1a0f0a] text-xs font-semibold hover:bg-[#e08567] active:scale-95 transition-all cursor-pointer"
            >
              Import Photos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {photoItems.map((item, index) => {
              const url = imageUrls[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActivePhotoIndex(index);
                    setZoomScale(1);
                    setRotationDegrees(0);
                  }}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-[#1d1c1a] border border-white/5 hover:border-[#d97757]/50 shadow-md transition-all cursor-pointer"
                >
                  {url ? (
                    <img
                      src={url}
                      alt={item.title}
                      loading="lazy"
                      onLoad={(e) => {
                        const target = e.currentTarget;
                        setImageDimensions((prev) => ({
                          ...prev,
                          [item.id]: { w: target.naturalWidth, h: target.naturalHeight },
                        }));
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[#a09b90]">
                      Loading...
                    </div>
                  )}

                  {/* Gradient Scrim & Quick Details on Hover */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white text-xs">
                    <span className="truncate text-[11px] font-medium max-w-[70%]">
                      {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      title="Delete photo"
                      className="p-1 rounded-md text-white/70 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal with Zoom, Pan, Rotation & Slideshow */}
      {activeItem && activePhotoIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
        >
          {/* Lightbox Top Control Bar */}
          <div className="flex items-center justify-between p-3 sm:p-4 text-white z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2 max-w-[50%] truncate">
              <span className="text-xs sm:text-sm font-medium truncate">{activeItem.title}</span>
              <span className="text-[11px] font-mono text-[#a09b90]">
                ({activePhotoIndex + 1}/{photoItems.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Slideshow Button */}
              <button
                type="button"
                onClick={() => setIsSlideshowPlaying((p) => !p)}
                aria-label={isSlideshowPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isSlideshowPlaying ? 'bg-[#d97757] text-[#1a0f0a]' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isSlideshowPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Zoom Controls */}
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(3, s + 0.25))}
                title="Zoom In"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.25))}
                title="Zoom Out"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Rotate 90deg */}
              <button
                type="button"
                onClick={() => setRotationDegrees((d) => (d + 90) % 360)}
                title="Rotate 90 degrees"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Info HUD Toggle */}
              <button
                type="button"
                onClick={() => setShowMetadataHud((h) => !h)}
                title="Photo Details"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  showMetadataHud ? 'bg-[#d97757] text-[#1a0f0a]' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Info className="w-4 h-4" />
              </button>

              {/* Close Lightbox */}
              <button
                type="button"
                onClick={() => {
                  setActivePhotoIndex(null);
                  setIsSlideshowPlaying(false);
                }}
                aria-label="Close photo"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Image Display with Zoom and Rotation */}
          <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
            {imageUrls[activeItem.id] && (
              <img
                src={imageUrls[activeItem.id]}
                alt={activeItem.title}
                style={{
                  transform: `scale(${zoomScale}) rotate(${rotationDegrees}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="max-w-full max-h-[82vh] object-contain select-none"
              />
            )}

            {/* Left / Right Nav Arrows */}
            <button
              type="button"
              onClick={() => {
                setActivePhotoIndex(
                  (prev) => (prev !== null ? (prev - 1 + photoItems.length) % photoItems.length : 0),
                );
                setZoomScale(1);
                setRotationDegrees(0);
              }}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePhotoIndex(
                  (prev) => (prev !== null ? (prev + 1) % photoItems.length : 0),
                );
                setZoomScale(1);
                setRotationDegrees(0);
              }}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Metadata Info HUD */}
            {showMetadataHud && (
              <div className="absolute bottom-6 left-6 p-4 rounded-2xl bg-black/85 backdrop-blur-md border border-white/10 text-white text-xs flex flex-col gap-2 shadow-2xl max-w-xs animate-in fade-in duration-150">
                <div className="font-semibold text-sm border-b border-white/10 pb-1.5 truncate">
                  {activeItem.title}
                </div>
                <div className="flex justify-between text-[#a09b90]">
                  <span>Format:</span>
                  <span className="font-mono text-white">{activeItem.mime || 'Image'}</span>
                </div>
                <div className="flex justify-between text-[#a09b90]">
                  <span>File size:</span>
                  <span className="font-mono text-white">{formatFileSize(activeItem.size)}</span>
                </div>
                {imageDimensions[activeItem.id] && (
                  <div className="flex justify-between text-[#a09b90]">
                    <span>Resolution:</span>
                    <span className="font-mono text-white">
                      {imageDimensions[activeItem.id].w} × {imageDimensions[activeItem.id].h} px
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#a09b90]">
                  <span>Added:</span>
                  <span className="font-mono text-white">
                    {new Date(activeItem.added).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          <div className="p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-2 overflow-x-auto">
            {photoItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActivePhotoIndex(idx);
                  setZoomScale(1);
                  setRotationDegrees(0);
                }}
                className={`w-11 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activePhotoIndex === idx
                    ? 'border-[#d97757] scale-105 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={imageUrls[item.id]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
