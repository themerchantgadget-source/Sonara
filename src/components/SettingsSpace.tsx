import React from 'react';
import {
  Bell,
  Check,
  CircleHelp,
  Gauge,
  Moon,
  Palette,
  RotateCcw,
  Sliders,
  Sun,
  Volume2,
} from 'lucide-react';
import type { UserPreferences } from '../types/media';

interface SettingsSpaceProps {
  preferences: UserPreferences;
  onUpdatePreferences: (partial: Partial<UserPreferences>) => void;
  onResetPreferences: () => void;
  onClearDatabase: () => void;
}

export const SettingsSpace: React.FC<SettingsSpaceProps> = ({
  preferences,
  onUpdatePreferences,
  onResetPreferences,
  onClearDatabase,
}) => {
  return (
    <div
      data-testid="settings-space"
      className="flex-1 w-full overflow-y-auto bg-[#0b0b0a] text-[#f5f2ea] px-4 sm:px-8 py-6"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#f5f2ea]">
            Preferences & Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#a09b90] mt-1">
            Customize your offline listening experience, theme palette, and audio behavior.
          </p>
        </div>

        {/* Section 1: Appearance & Theme */}
        <div className="p-5 rounded-2xl bg-[#141413] border border-white/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5 text-sm font-semibold text-[#f5f2ea]">
            <Palette className="w-4 h-4 text-[#d97757]" />
            <span>Appearance & Theme</span>
          </div>

          <div>
            <label className="text-xs text-[#a09b90] block mb-2">Display Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'dark' as const, label: 'Charcoal Dark', icon: Moon },
                  { id: 'oled' as const, label: 'Pure Black (OLED)', icon: Moon },
                  { id: 'light' as const, label: 'Alabaster Light', icon: Sun },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onUpdatePreferences({ themeMode: mode.id })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                    preferences.themeMode === mode.id
                      ? 'border-[#d97757] bg-[#d97757]/10 text-[#f5f2ea]'
                      : 'border-white/5 bg-[#1c1c1e] text-[#99999f] hover:text-[#f5f2ea]'
                  }`}
                >
                  <mode.icon className="w-4 h-4 text-[#d97757]" />
                  <span className="text-xs font-medium">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#a09b90] block mb-2">Accent Highlight Color</label>
            <div className="flex items-center gap-3">
              {(
                [
                  { id: 'terracotta' as const, label: 'Terracotta', bg: 'bg-[#d97757]' },
                  { id: 'amber' as const, label: 'Warm Amber', bg: 'bg-amber-500' },
                  { id: 'emerald' as const, label: 'Moss Emerald', bg: 'bg-emerald-500' },
                  { id: 'cyan' as const, label: 'Sonic Cyan', bg: 'bg-cyan-500' },
                  { id: 'violet' as const, label: 'Dusk Violet', bg: 'bg-violet-500' },
                ] as const
              ).map((accent) => (
                <button
                  key={accent.id}
                  type="button"
                  onClick={() => onUpdatePreferences({ accentColor: accent.id })}
                  aria-label={accent.label}
                  className={`w-8 h-8 rounded-full ${accent.bg} grid place-items-center cursor-pointer transition-transform ${
                    preferences.accentColor === accent.id ? 'scale-115 ring-2 ring-white' : 'opacity-80'
                  }`}
                >
                  {preferences.accentColor === accent.id && (
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Playback Defaults */}
        <div className="p-5 rounded-2xl bg-[#141413] border border-white/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5 text-sm font-semibold text-[#f5f2ea]">
            <Gauge className="w-4 h-4 text-[#d97757]" />
            <span>Playback & Audio Defaults</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-medium text-[#f5f2ea]">Default Playback Speed</div>
              <div className="text-[11px] text-[#a09b90]">Starting rate when playing new audio or video</div>
            </div>
            <select
              value={preferences.defaultPlaySpeed}
              onChange={(e) => onUpdatePreferences({ defaultPlaySpeed: Number(e.target.value) })}
              className="px-3 py-1.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-[#f5f2ea] outline-none cursor-pointer"
            >
              <option value={1}>1.0× (Standard)</option>
              <option value={1.25}>1.25× (Quick)</option>
              <option value={1.5}>1.5× (Fast)</option>
              <option value={2}>2.0× (Double)</option>
              <option value={0.75}>0.75× (Relaxed)</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-medium text-[#f5f2ea]">Auto-Play Next Track</div>
              <div className="text-[11px] text-[#a09b90]">Continuous queue playback when current media ends</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.autoPlayNext}
              onChange={(e) => onUpdatePreferences({ autoPlayNext: e.target.checked })}
              className="w-5 h-5 accent-[#d97757] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-medium text-[#f5f2ea]">High-Fidelity Audio Normalization</div>
              <div className="text-[11px] text-[#a09b90]">Balance peaks across varied bitrate local files</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.normalizeAudio}
              onChange={(e) => onUpdatePreferences({ normalizeAudio: e.target.checked })}
              className="w-5 h-5 accent-[#d97757] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Section 3: Offline Storage Governance */}
        <div className="p-5 rounded-2xl bg-[#141413] border border-white/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5 text-sm font-semibold text-[#f5f2ea]">
            <RotateCcw className="w-4 h-4 text-[#d97757]" />
            <span>Data & Vault Reset</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <div className="text-xs font-medium text-[#f5f2ea]">Reset All Preferences</div>
              <div className="text-[11px] text-[#a09b90]">Restore default equalizer, speeds, and theme</div>
            </div>
            <button
              type="button"
              onClick={onResetPreferences}
              className="px-4 py-2 rounded-xl bg-[#1c1c1e] hover:bg-[#272729] text-xs font-medium text-[#f5f2ea] border border-white/5 transition-colors cursor-pointer shrink-0"
            >
              Reset Settings
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
            <div>
              <div className="text-xs font-medium text-red-400">Purge Offline Media Cache</div>
              <div className="text-[11px] text-[#a09b90]">Deletes all stored audio and video files from this device's IndexedDB</div>
            </div>
            <button
              type="button"
              onClick={onClearDatabase}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 border border-red-500/20 transition-colors cursor-pointer shrink-0"
            >
              Purge Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
