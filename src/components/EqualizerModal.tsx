import React from 'react';
import { Sliders, X } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../utils/media';

interface EqualizerModalProps {
  isOpen: boolean;
  isEnabled: boolean;
  gains: [number, number, number, number, number];
  onClose: () => void;
  onGainChange: (index: number, value: number) => void;
  onApplyPreset: (presetName: string) => void;
  onReset: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  isEnabled,
  gains,
  onClose,
  onGainChange,
  onApplyPreset,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="eq-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs"
    >
      <div className="w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1c1c1e] dark:bg-[#1c1c1e] text-[#f5f5f5] border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#272729] grid place-items-center text-[#d97757]">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 id="eq-title" className="font-serif text-xl font-medium tracking-tight">
              Audio Equalizer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close equalizer"
            className="w-9 h-9 rounded-full bg-[#272729] text-[#99999f] hover:text-[#f5f5f5] grid place-items-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between items-center text-xs text-[#99999f] mt-4">
          <span>5-Band Parametric Filter</span>
          <span
            className={`font-medium px-2 py-0.5 rounded-full text-[11px] ${
              isEnabled
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-white/5 text-[#99999f]'
            }`}
          >
            {isEnabled ? 'Active (WebAudio)' : 'Ready'}
          </span>
        </div>

        {/* 5-Band Sliders */}
        <div className="flex justify-between gap-3 py-6 px-1">
          {EQ_FREQUENCIES.map((freq, idx) => {
            const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}Hz`;
            const gain = gains[idx] ?? 0;
            return (
              <div key={freq} className="flex flex-col items-center gap-3 flex-1">
                <span className="text-[11px] font-mono tabular-nums text-[#d97757]">
                  {gain > 0 ? `+${gain}` : gain}dB
                </span>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={gain}
                  onChange={(e) => onGainChange(idx, Number(e.target.value))}
                  aria-label={`${label} frequency band gain`}
                  className="w-6 h-36 accent-[#d97757] cursor-pointer"
                  style={{
                    writingMode: 'vertical-lr',
                    direction: 'rtl',
                  }}
                />
                <span className="text-[10px] text-[#99999f] font-mono">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Presets */}
        <div className="space-y-2 mt-1">
          <div className="text-[11px] font-semibold text-[#99999f] uppercase tracking-wider">
            Presets
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(EQ_PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onApplyPreset(name)}
                className="px-3.5 py-1.5 rounded-full bg-[#272729] hover:bg-[#333336] text-xs font-medium text-[#f5f5f5] cursor-pointer transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full mt-6 py-3 rounded-xl bg-[#272729] hover:bg-[#333336] text-xs font-semibold text-[#f5f5f5] cursor-pointer transition-colors"
        >
          Reset to Flat
        </button>
      </div>
    </div>
  );
};
