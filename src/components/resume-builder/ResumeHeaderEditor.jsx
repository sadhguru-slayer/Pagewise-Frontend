"use client";

import { useResumeStore } from "@/lib/resume/store";
import { FONT_OPTIONS } from "@/lib/resume/templates";

const inputClass =
  "bg-[#1a1d28] border border-white/10 text-white rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:border-accent transition-colors";

const labelClass = "text-xs text-zinc-400 font-mono uppercase tracking-wider";

const sectionClass = "space-y-2 pb-4 border-b border-white/10";

const sectionTitleClass =
  "text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-3";

export default function ResumeHeaderEditor() {
  const header = useResumeStore((s) => s.header);
  const updateHeader = useResumeStore((s) => s.updateHeader);

  const handleChange = (key, value) => {
    updateHeader({ [key]: value });
  };

  const handleDividerChange = (key, value) => {
    updateHeader({ divider: { ...header.divider, [key]: value } });
  };

  return (
    <div className="bg-[#0f1117] p-4 space-y-4 rounded-xl">
      {/* Name */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Name</h3>
        <div className="space-y-2">
          <label className={labelClass}>Full Name</label>
          <input
            type="text"
            className={inputClass}
            value={header.name ?? ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Your Name"
          />
        </div>
      </div>

      {/* Contact Line */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Contact</h3>
        <div className="space-y-2">
          <label className={labelClass}>Contact Line</label>
          <input
            type="text"
            className={inputClass}
            value={header.contactLine ?? ""}
            onChange={(e) => handleChange("contactLine", e.target.value)}
            placeholder="email@example.com · linkedin.com/in/you"
          />
        </div>
      </div>

      {/* Alignment */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Alignment</h3>
        <div className="flex gap-2">
          {["left", "center", "right"].map((align) => (
            <button
              key={align}
              onClick={() => handleChange("alignment", align)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-mono uppercase border transition-colors ${
                header.alignment === align
                  ? "bg-accent/20 border-accent text-accent"
                  : "bg-[#1a1d28] border-white/10 text-zinc-400 hover:border-white/20"
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      {/* Name Styling */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Name Styling</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Font Size (pt)</label>
            <input
              type="number"
              min={16}
              max={48}
              className={inputClass}
              value={header.nameFontSize ?? 22}
              onChange={(e) =>
                handleChange("nameFontSize", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Font Weight</label>
            <select
              className={inputClass}
              value={header.nameFontWeight ?? "bold"}
              onChange={(e) => handleChange("nameFontWeight", e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </div>
        </div>
        <div className="space-y-1 mt-2">
          <label className={labelClass}>Font Family</label>
          <select
            className={inputClass}
            value={
              FONT_OPTIONS.some((f) => f.value === (header.nameFont ?? "Georgia, serif"))
                ? header.nameFont ?? "Georgia, serif"
                : "custom"
            }
            onChange={(e) => {
              if (e.target.value !== "custom") {
                handleChange("nameFont", e.target.value);
              } else {
                handleChange("nameFont", "");
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

          {!FONT_OPTIONS.some((f) => f.value === header.nameFont) && (
            <input
              type="text"
              className={`${inputClass} mt-1.5`}
              value={header.nameFont ?? ""}
              onChange={(e) => handleChange("nameFont", e.target.value)}
              placeholder="e.g. Georgia, serif"
            />
          )}
        </div>
      </div>

      {/* Contact Styling */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Contact Styling</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelClass}>Font Size (pt)</label>
            <input
              type="number"
              min={8}
              max={18}
              step={0.5}
              className={inputClass}
              value={header.contactFontSize ?? 10}
              onChange={(e) =>
                handleChange("contactFontSize", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-10 rounded-lg border border-white/10 bg-[#1a1d28] cursor-pointer p-0.5"
                value={header.contactColor ?? "#a1a1aa"}
                onChange={(e) => handleChange("contactColor", e.target.value)}
              />
              <input
                type="text"
                className={`${inputClass} flex-1`}
                value={header.contactColor ?? "#a1a1aa"}
                onChange={(e) => handleChange("contactColor", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Divider Toggle */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Divider</h3>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-accent w-4 h-4 rounded"
            checked={header.showDivider ?? false}
            onChange={(e) => handleChange("showDivider", e.target.checked)}
          />
          <span className="text-sm text-zinc-300">Show divider below header</span>
        </label>
      </div>

      {/* Divider Settings */}
      {header.showDivider && (
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>Divider Settings</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-9 w-10 rounded-lg border border-white/10 bg-[#1a1d28] cursor-pointer p-0.5"
                  value={header.divider?.color ?? "#d1d5db"}
                  onChange={(e) => handleDividerChange("color", e.target.value)}
                />
                <input
                  type="text"
                  className={`${inputClass} flex-1`}
                  value={header.divider?.color ?? "#d1d5db"}
                  onChange={(e) => handleDividerChange("color", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Thickness (px)</label>
              <input
                type="number"
                min={1}
                max={5}
                className={inputClass}
                value={header.divider?.thickness ?? 1}
                onChange={(e) =>
                  handleDividerChange("thickness", Number(e.target.value))
                }
              />
            </div>
          </div>
          <div className="space-y-1 mt-2">
            <label className={labelClass}>Style</label>
            <select
              className={inputClass}
              value={header.divider?.style ?? "solid"}
              onChange={(e) => handleDividerChange("style", e.target.value)}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="space-y-1">
              <label className={labelClass}>Margin Top (px)</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={header.divider?.marginTop ?? 5}
                onChange={(e) =>
                  handleDividerChange("marginTop", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Margin Bottom (px)</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={header.divider?.marginBottom ?? 5}
                onChange={(e) =>
                  handleDividerChange("marginBottom", Number(e.target.value))
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
