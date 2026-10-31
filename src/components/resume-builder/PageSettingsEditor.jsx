'use client';

import { useResumeStore } from "@/lib/resume/store";
import { FONT_OPTIONS } from "@/lib/resume/templates";
import { Minimize2, Zap } from "lucide-react";
import toast from "react-hot-toast";

const inputClass =
  "bg-[#1a1d28] border border-white/10 text-white rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:border-accent transition-colors";

const labelClass = "text-xs text-zinc-400 font-mono uppercase tracking-wider";

const sectionClass = "space-y-2 pb-4 border-b border-white/10";

const sectionTitleClass =
  "text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-3";

export default function PageSettingsEditor() {
  const settings = useResumeStore((s) => s.settings);
  const updateSettings = useResumeStore((s) => s.updateSettings);
  const applyUltraCompactPreset = useResumeStore((s) => s.applyUltraCompactPreset);

  const handleChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  const handleApplyCompactPreset = () => {
    applyUltraCompactPreset();
    toast.success("Applied Ultra-Compact 1-Page Layout Preset!");
  };

  return (
    <div className="bg-[#0f1117] p-4 space-y-4 rounded-xl">
      {/* ── Ultra-Compact 1-Page Preset Card ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-blue-950/30 border border-blue-500/30 rounded-xl p-3 shadow-md">
        <div className="flex items-center gap-2 mb-1.5">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white tracking-wide">1-Page Fitting Preset</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-snug mb-2.5">
          Compresses page margins to 10mm, font to 8.5pt, spacing to 1pt, and minimizes divider margins to fit all your content cleanly onto a single page.
        </p>
        <button
          type="button"
          onClick={handleApplyCompactPreset}
          className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Apply Ultra-Compact 1-Page Preset</span>
        </button>
      </div>

      {/* Page Margins */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Page Margins (mm)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Top</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={settings.marginTop ?? 16}
              onChange={(e) =>
                handleChange("marginTop", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Bottom</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={settings.marginBottom ?? 16}
              onChange={(e) =>
                handleChange("marginBottom", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Left</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={settings.marginLeft ?? 16}
              onChange={(e) =>
                handleChange("marginLeft", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Right</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={settings.marginRight ?? 16}
              onChange={(e) =>
                handleChange("marginRight", Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Typography</h3>
        <div className="space-y-1">
          <label className={labelClass}>Body Font</label>
          <select
            className={inputClass}
            value={
              FONT_OPTIONS.some((f) => f.value === (settings.bodyFont ?? "Georgia, serif"))
                ? settings.bodyFont ?? "Georgia, serif"
                : "custom"
            }
            onChange={(e) => {
              if (e.target.value !== "custom") {
                handleChange("bodyFont", e.target.value);
              } else {
                handleChange("bodyFont", "");
              }
            }}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value} className="bg-[#121520] text-white">
                {font.label}
              </option>
            ))}
            <option value="custom" className="bg-[#121520] text-white">
              Custom font...
            </option>
          </select>

          {/* Show manual input if custom font is selected */}
          {!FONT_OPTIONS.some((f) => f.value === settings.bodyFont) && (
            <input
              type="text"
              className={`${inputClass} mt-1.5`}
              value={settings.bodyFont ?? ""}
              onChange={(e) => handleChange("bodyFont", e.target.value)}
              placeholder="e.g. Fira Code, monospace"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="space-y-1">
            <label className={labelClass}>Font Size (pt)</label>
            <input
              type="number"
              min={7}
              max={16}
              step={0.5}
              className={inputClass}
              value={settings.bodyFontSize ?? 8.5}
              onChange={(e) =>
                handleChange("bodyFontSize", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Line Height</label>
            <input
              type="number"
              min={1}
              max={2}
              step={0.05}
              className={inputClass}
              value={settings.lineHeight ?? 1.2}
              onChange={(e) =>
                handleChange("lineHeight", Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Colors</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Heading Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-10 rounded-lg border border-white/10 bg-[#1a1d28] cursor-pointer p-0.5"
                value={settings.headingColor ?? "#111827"}
                onChange={(e) => handleChange("headingColor", e.target.value)}
              />
              <input
                type="text"
                className={`${inputClass} flex-1`}
                value={settings.headingColor ?? "#111827"}
                onChange={(e) => handleChange("headingColor", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-10 rounded-lg border border-white/10 bg-[#1a1d28] cursor-pointer p-0.5"
                value={settings.accentColor ?? "#2563eb"}
                onChange={(e) => handleChange("accentColor", e.target.value)}
              />
              <input
                type="text"
                className={`${inputClass} flex-1`}
                value={settings.accentColor ?? "#2563eb"}
                onChange={(e) => handleChange("accentColor", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Spacing */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Section Spacing</h3>
        <div className="space-y-1">
          <label className={labelClass}>Spacing between sections (pt)</label>
          <input
            type="number"
            min={0}
            max={40}
            className={inputClass}
            value={settings.sectionSpacing ?? 1}
            onChange={(e) =>
              handleChange("sectionSpacing", Number(e.target.value))
            }
          />
          <p className="text-[11px] text-zinc-500">
            Set to 0 for a fully compressed, tight resume layout.
          </p>
        </div>
      </div>
    </div>
  );
}
