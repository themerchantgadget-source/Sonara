import React, { useState } from 'react';
import {
  Check,
  Download,
  FileJson,
  FolderArchive,
  Gauge,
  Link2,
  Moon,
  Palette,
  Radio,
  RotateCcw,
  Sliders,
  Sun,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import type { UserPreferences } from '../types/media';
import { EQ_FREQUENCIES, EQ_PRESETS, formatFileSize } from '../utils/media';

interface SettingsSpaceProps {
  preferences: UserPreferences;
  onUpdatePreferences: (partial: Partial<UserPreferences>) => void;
  onResetPreferences: () => void;
  onClearDatabase: () => void;
  onImportSpotifyJson: (rawJson: string) => void;
  onExportCatalogJson: () => void;
  eqGains: [number, number, number, number, number];
  isEqEnabled: boolean;
  onEqGainChange: (index: number, value: number) => void;
  onApplyEqPreset: (presetName: string) => void;
  onToggleEq: (enabled: boolean) => void;
  itemsCount: {
    audio: number;
    video: number;
    photo: number;
    document: number;
    totalBytes: number;
  };
}

export const SettingsSpace: React.FC<SettingsSpaceProps> = ({
  preferences,
  onUpdatePreferences,
  onResetPreferences,
  onClearDatabase,
  onImportSpotifyJson,
  onExportCatalogJson,
  eqGains,
  isEqEnabled,
  onEqGainChange,
  onApplyEqPreset,
  onToggleEq,
  itemsCount,
}) => {
  const [spotifyJsonText, setSpotifyJsonText] = useState('');
  const [showSpotifyPaste, setShowSpotifyPaste] = useState(false);
  const [spotifyStatus, setSpotifyStatus] = useState<string | null>(null);

  const handleApplySpotifyText = () => {
    if (!spotifyJsonText.trim()) return;
    onImportSpotifyJson(spotifyJsonText);
    setSpotifyStatus('Processed Spotify JSON');
    setTimeout(() => setSpotifyStatus(null), 3000);
  };

  return (
    <div
      data-testid="settings-space"
      className="flex-1 w-full overflow-y-auto bg-[#0b0b0a] text-[#f5f2ea] px-4 sm:px-8 py-6"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#f5f2ea]">
            Settings & Integrations
          </h1>
          <p className="text-xs sm:text-sm text-[#a09b90] mt-1">
            Grok-style connectors, appearance themes, global audio equalizer, and storage vault.
          </p>
        </div>

        {/* Section 1: Connectors & Integrations */}
        <div className="p-5 rounded-2xl bg-[#141413] border border-white/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5 text-sm font-semibold text-[#f5f2ea]">
            <Link2 className="w-4 h-4 text-[#d97757]" />
            <span>Connectors & External Integrations</span>
          </div>

          {/* Spotify Connector */}
          <div className="p-4 rounded-xl bg-[#1c1c1e] border border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#f5f2ea]">Spotify Playlist Sync</div>
                  <div className="text-[11px] text-[#a09b90]">
                    Match your exported Spotify playlists with local offline tracks
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSpotifyPaste((s) => !s)}
                className="px-3 py-1.5 rounded-lg bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] transition-colors cursor-pointer"
              >
                {showSpotifyPaste ? 'Hide' : 'Link Spotify'}
              </button>
            </div>

            {showSpotifyPaste && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-white/5 animate-in fade-in duration-150">
                <p className="text-[11px] text-[#a09b90]">
                  Paste your Spotify JSON export data below or upload a JSON export file.
                </p>
                <textarea
                  rows={4}
                  value={spotifyJsonText}
                  onChange={(e) => setSpotifyJsonText(e.target.value)}
                  placeholder='{"playlists": [{"name": "Favorites", "items": [...]}]}'
                  className="w-full p-2.5 rounded-xl bg-[#141413] border border-white/10 text-xs font-mono text-[#f5f2ea] focus:outline-none focus:ring-1 focus:ring-[#d97757] resize-none"
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#292825] hover:bg-[#333336] text-xs font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#d97757]" />
                    <span>Upload .json</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          file.text().then((text) => {
                            setSpotifyJsonText(text);
                            onImportSpotifyJson(text);
                          });
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleApplySpotifyText}
                    className="px-4 py-1.5 rounded-lg bg-[#d97757] text-[#1a0f0a] text-xs font-semibold hover:bg-[#e08567] transition-colors cursor-pointer"
                  >
                    Sync Playlists
                  </button>
                </div>

                {spotifyStatus && (
                  <div className="text-[11px] font-mono text-emerald-400">{spotifyStatus}</div>
                )}
              </div>
            )}
          </div>

          {/* Backup Catalog Export */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1c1c1e] border border-white/5">
            <div>
              <div className="text-xs font-semibold text-[#f5f2ea]">Export Catalog Backup</div>
              <div className="text-[11px] text-[#a09b90]">
                Download a JSON backup of all metadata, playlists and track tags
              </div>
            </div>
            <button
              type="button"
              onClick={onExportCatalogJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#292825] hover:bg-[#333336] text-xs font-medium text-[#f5f2ea] border border-white/5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Section 2: Global Audio Equalizer Settings */}
        <div className="p-5 rounded-2xl bg-[#141413] border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#f5f2ea]">
              <Sliders className="w-4 h-4 text-[#d97757]" />
              <span>Global 5-Band Equalizer</span>
            </div>
            <button
              type="button"
              onClick={() => onToggleEq(!isEqEnabled)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isEqEnabled
                  ? 'bg-[#d97757] text-[#1a0f0a]'
                  : 'bg-[#292825] text-[#a09b90]'
              }`}
            >
              {isEqEnabled ? 'Equalizer Active' : 'Bypassed'}
            </button>
          </div>

          {/* Presets Row */}
          <div>
            <label className="text-xs text-[#a09b90] block mb-1.5">Acoustic Presets</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.keys(EQ_PRESETS).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onApplyEqPreset(name)}
                  className="px-2.5 py-1 rounded-lg bg-[#1c1c1e] hover:bg-[#272729] text-xs font-medium text-[#f5f2ea] border border-white/5 transition-colors cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 5 Sliders Grid */}
          <div className="grid grid-cols-5 gap-2 pt-2">
            {EQ_FREQUENCIES.map((freq, i) => (
              <div key={freq} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-mono text-[#a09b90]">
                  {eqGains[i] > 0 ? `+${eqGains[i]}` : eqGains[i]}dB
                </span>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={eqGains[i]}
                  onChange={(e) => onEqGainChange(i, Number(e.target.value))}
                  className="w-full accent-[#d97757] h-20 [writing-mode:vertical-lr] [direction:rtl] cursor-pointer"
                />
                <span className="text-[10px] font-mono text-[#f5f2ea]">
                  {freq >= 1000 ? `${freq / 1000}k` : `${freq}`}Hz
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Appearance & Theme */}
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
                    preferences.accentColor === accent.id
                      ? 'scale-115 ring-2 ring-white'
                      : 'opacity-80'
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

        {/* Section 4: Video Engine & iOS Inline Playback */}
        <div className="p-5 rounded-2xl bg-[#141413] border border-white/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5 text-sm font-semibold text-[#f5f2ea]">
            <Gauge className="w-4 h-4 text-[#d97757]" />
            <span>Video Engine & iOS Playback</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-medium text-[#f5f2ea]">Force iOS Inline Playback</div>
              <div className="text-[11px] text-[#a09b90]">
                Prevent iOS from opening native QuickTime full screen, keeping app subtitles and
                controls active
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.inlineVideoOnly ?? true}
              onChange={(e) => onUpdatePreferences({ inlineVideoOnly: e.target.checked })}
              className="w-5 h-5 accent-[#d97757] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-medium text-[#f5f2ea]">Default Audio Boost</div>
              <div className="text-[11px] text-[#a09b90]">VLC-style audio amplifier for quiet files</div>
            </div>
            <select
              value={preferences.audioBoostPercent ?? 100}
              onChange={(e) => onUpdatePreferences({ audioBoostPercent: Number(e.target.value) })}
              className="px-3 py-1.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-[#f5f2ea] outline-none cursor-pointer"
            >
              <option value={100}>100% (Normal)</option>
              <option value={125}>125% (+25%)</option>
              <option value={150}>150% (+50%)</option>
              <option value={200}>200% (VLC Max Boost)</option>
            </select>
          </div>
        </div>

        {/* Section 5: Offline Vault Storage Breakdown */}
        <div className="p-5 rounded-2xl bg-[#141413] border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#f5f2ea]">
              <FolderArchive className="w-4 h-4 text-[#d97757]" />
              <span>Offline Vault Breakdown</span>
            </div>
            <span className="text-xs font-mono text-[#d97757]">
              {formatFileSize(itemsCount.totalBytes)} total
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-[#1c1c1e] border border-white/5">
              <div className="text-base font-semibold text-[#f5f2ea]">{itemsCount.audio}</div>
              <div className="text-[10px] text-[#a09b90] uppercase tracking-wider mt-0.5">
                Music Tracks
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#1c1c1e] border border-white/5">
              <div className="text-base font-semibold text-[#f5f2ea]">{itemsCount.video}</div>
              <div className="text-[10px] text-[#a09b90] uppercase tracking-wider mt-0.5">
                Videos
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#1c1c1e] border border-white/5">
              <div className="text-base font-semibold text-[#f5f2ea]">{itemsCount.photo}</div>
              <div className="text-[10px] text-[#a09b90] uppercase tracking-wider mt-0.5">
                Photos
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#1c1c1e] border border-white/5">
              <div className="text-base font-semibold text-[#f5f2ea]">{itemsCount.document}</div>
              <div className="text-[10px] text-[#a09b90] uppercase tracking-wider mt-0.5">
                Documents
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onResetPreferences}
              className="text-xs text-[#a09b90] hover:text-[#f5f2ea] cursor-pointer"
            >
              Reset Preferences to Default
            </button>
            <button
              type="button"
              onClick={onClearDatabase}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-xs text-red-400 border border-red-500/20 cursor-pointer"
            >
              Clear Entire Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
