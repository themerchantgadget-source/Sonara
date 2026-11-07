import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  extractAudioPeaksFromBuffer,
  formatDuration,
  generateDeterministicPeaks,
} from '../utils/media';

interface AudioWaveformProps {
  blob?: Blob;
  trackId: string;
  title: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  accentColor?: string;
  onSeekInput: (fraction: number) => void;
  onSeekCommit: (fraction: number) => void;
  className?: string;
}

// In-memory cache for extracted peaks to avoid re-decoding the same audio file repeatedly
const peaksCache = new Map<string, number[]>();

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  blob,
  trackId,
  title,
  currentTime,
  duration,
  isPlaying,
  accentColor = '#d97757',
  onSeekInput,
  onSeekCommit,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 64 });
  const [hoverFraction, setHoverFraction] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Peak data
  const [peaks, setPeaks] = useState<number[]>(() => {
    return peaksCache.get(trackId) || generateDeterministicPeaks(`${trackId}-${title}`, 80);
  });

  // Track container dimensions via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Compute number of bars based on width (approx 3.5px bar + 1.5px gap = 5px per unit)
  const barCount = Math.max(36, Math.min(128, Math.floor(dimensions.width / 4.8)));

  // Load peaks: check cache -> decode PCM or use deterministic harmonics
  useEffect(() => {
    const cached = peaksCache.get(trackId);
    if (cached && cached.length === barCount) {
      setPeaks(cached);
      return;
    }

    // Immediately supply deterministic organic peaks so waveform is never blank
    const fallback = generateDeterministicPeaks(`${trackId}-${title}`, barCount);
    setPeaks(fallback);

    if (!blob) return;

    let active = true;
    (async () => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        // Take up to first 25MB of audio blob to keep decode snappy and responsive
        const slice = blob.size > 25 * 1024 * 1024 ? blob.slice(0, 25 * 1024 * 1024) : blob;
        const arrayBuffer = await slice.arrayBuffer();
        if (!active) return;

        const tempCtx = new AudioCtx();
        let audioBuffer: AudioBuffer | null = null;
        try {
          audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
        } finally {
          tempCtx.close().catch(() => {});
        }

        if (!active || !audioBuffer) return;

        const channelDataList: Float32Array[] = [];
        for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
          channelDataList.push(audioBuffer.getChannelData(c));
        }

        const realPeaks = extractAudioPeaksFromBuffer(channelDataList, barCount);
        if (active) {
          peaksCache.set(trackId, realPeaks);
          setPeaks(realPeaks);
        }
      } catch {
        // Fallback peaks remain active cleanly
      }
    })();

    return () => {
      active = false;
    };
  }, [trackId, title, blob, barCount]);

  // Synchronized canvas render loop
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    // Handle retina high-DPI
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const progress = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0;
    const totalBars = peaks.length;
    if (totalBars === 0) {
      ctx.restore();
      return;
    }

    const availableWidth = width;
    const barWidth = Math.max(2, (availableWidth / totalBars) * 0.65);
    const step = availableWidth / totalBars;
    const centerY = height / 2;
    const maxBarHeight = height * 0.88;

    // Subtle center baseline guide
    ctx.strokeStyle = 'rgba(245, 242, 234, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    const currentBarIdx = Math.floor(progress * totalBars);

    for (let i = 0; i < totalBars; i++) {
      const x = i * step + (step - barWidth) / 2;
      const peakVal = peaks[i] || 0.2;
      const barH = Math.max(4, peakVal * maxBarHeight);
      const topY = centerY - barH / 2;
      const isPast = i <= currentBarIdx;

      // Draw rounded bar
      ctx.beginPath();
      const radius = Math.min(barWidth / 2, 2.5);

      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, topY, barWidth, barH, radius);
      } else {
        // Fallback for older canvas engines
        ctx.rect(x, topY, barWidth, barH);
      }

      if (isPast) {
        // Active played section with warm accent gradient
        const grad = ctx.createLinearGradient(x, topY, x, topY + barH);
        grad.addColorStop(0, '#f59e82');
        grad.addColorStop(0.5, accentColor);
        grad.addColorStop(1, '#c55e3e');
        ctx.fillStyle = grad;

        // Slight live pulse glow for active bar while playing
        if (i === currentBarIdx && isPlaying) {
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowBlur = 0;
        }
      } else {
        // Unplayed remainder
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(245, 242, 234, 0.16)';
      }

      ctx.fill();
    }

    // Playhead needle / luminous locator
    const playheadX = progress * width;
    ctx.shadowBlur = 8;
    ctx.shadowColor = accentColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 2);
    ctx.lineTo(playheadX, height - 2);
    ctx.stroke();

    // Playhead top handle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(playheadX, 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Hover ghost cursor
    if (hoverFraction !== null && (isHovering || isScrubbing)) {
      const hoverX = hoverFraction * width;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(245, 242, 234, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [
    dimensions,
    peaks,
    currentTime,
    duration,
    isPlaying,
    accentColor,
    hoverFraction,
    isHovering,
    isScrubbing,
  ]);

  // Keep canvas redraw in sync with playback and inputs
  useEffect(() => {
    let animId: number;
    drawWaveform();

    if (isPlaying) {
      const loop = () => {
        drawWaveform();
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animId);
    }
  }, [drawWaveform, isPlaying]);

  // Scrubbing & seeking handlers
  const calculateFraction = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    const frac = calculateFraction(e.clientX);
    setHoverFraction(frac);
    onSeekInput(frac);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const frac = calculateFraction(e.clientX);
    setHoverFraction(frac);
    if (isScrubbing) {
      onSeekInput(frac);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const frac = calculateFraction(e.clientX);
    setIsScrubbing(false);
    setHoverFraction(null);
    onSeekCommit(frac);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsScrubbing(false);
    setHoverFraction(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const stepSec = 5;
    const stepFrac = stepSec / duration;
    const curFrac = currentTime / duration;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const target = Math.min(1, curFrac + stepFrac);
      onSeekCommit(target);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const target = Math.max(0, curFrac - stepFrac);
      onSeekCommit(target);
    }
  };

  const hoverTimeSec = hoverFraction !== null && duration > 0 ? hoverFraction * duration : 0;

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="Audio waveform progress"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={formatDuration(currentTime)}
      onKeyDown={handleKeyDown}
      className={`relative w-full select-none cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97757] rounded-xl ${className}`}
    >
      <canvas
        ref={canvasRef}
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          if (!isScrubbing) setHoverFraction(null);
        }}
        className="w-full h-full block rounded-xl touch-none"
      />

      {/* Floating Hover Time Badge */}
      {hoverFraction !== null && (isHovering || isScrubbing) && (
        <div
          style={{
            left: `${Math.min(92, Math.max(8, hoverFraction * 100))}%`,
          }}
          className="absolute -top-7 -translate-x-1/2 pointer-events-none px-2 py-0.5 rounded-md bg-[#292825] border border-white/10 text-[10px] font-mono text-[#f5f2ea] shadow-md whitespace-nowrap transition-transform"
        >
          {formatDuration(hoverTimeSec)}
        </div>
      )}
    </div>
  );
};
