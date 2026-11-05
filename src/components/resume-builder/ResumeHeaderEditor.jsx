"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/resume/store";
import { FONT_OPTIONS } from "@/lib/resume/templates";
import { Code, Eye, Sparkles } from "lucide-react";

const inputClass =
  "bg-[#1a1d28] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs w-full focus:outline-none focus:border-white/30 transition-colors";

const labelClass = "text-xs text-zinc-400 font-mono uppercase tracking-wider";

const sectionClass = "space-y-1.5 pb-3 border-b border-white/10";

const sectionTitleClass =
  "text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-1.5";

/**
 * Extracts plain text items from an HTML contact string or plain text
 */
function parseContactItems(contactHtml) {
  if (!contactHtml) return [];
  const parts = contactHtml.split(/\s*[·•|]\s*/);
  return parts.map((part) => {
    const raw = part.trim();
    const aMatch = raw.match(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/i);
    if (aMatch) {
      return {
        url: aMatch[2],
        label: aMatch[3].replace(/<[^>]+>/g, '').trim(),
      };
    }
    const clean = raw.replace(/<[^>]+>/g, '').trim();
    if (clean.includes('@')) {
      return {
        url: `mailto:${clean}`,
        label: clean,
      };
    }
    if (/^(https?:\/\/|www\.)/i.test(clean)) {
      return {
        url: clean.startsWith('http') ? clean : `https://${clean}`,
        label: clean.replace(/^https?:\/\//i, '').replace(/^www\./i, ''),
      };
    }
    return {
      url: '',
      label: clean,
    };
  }).filter((it) => it.label || it.url);
}

/**
 * Serializes parsed contact items back to contactLine HTML
 */
function serializeContactItems(items) {
  return items
    .filter((it) => it.label?.trim())
    .map((it) => {
      const label = it.label.trim();
      const url = it.url?.trim();
      if (!url) return label;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    })
    .join(' · ');
}

export default function ResumeHeaderEditor() {
  const header = useResumeStore((s) => s.header);
  const updateHeader = useResumeStore((s) => s.updateHeader);

  // 'fields' | 'raw'
  const [editMode, setEditMode] = useState('fields');

  const handleChange = (key, value) => {
    updateHeader({ [key]: value });
  };

  const handleDividerChange = (key, value) => {
    updateHeader({ divider: { ...header.divider, [key]: value } });
  };

  // Convert current contactLine into structured items for easy human editing
  const contactItems = parseContactItems(header.contactLine || '');

  const handleUpdateContactItem = (index, field, value) => {
    const next = [...contactItems];
    next[index] = { ...next[index], [field]: value };
    handleChange('contactLine', serializeContactItems(next));
  };

  const handleRemoveContactItem = (index) => {
    const next = contactItems.filter((_, i) => i !== index);
    handleChange('contactLine', serializeContactItems(next));
  };

  const handleAddContactItem = () => {
    const next = [...contactItems, { label: 'New Link', url: 'https://' }];
    handleChange('contactLine', serializeContactItems(next));
  };

  return (
    <div className="bg-[#0f1117] p-3.5 space-y-3 rounded-xl text-xs">
      {/* Name */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Name</h3>
        <div className="space-y-1">
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

      {/* Contact Line with Interactive Items + Raw HTML toggle */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className={sectionTitleClass}>Contact &amp; Profiles</h3>
          <div className="flex items-center gap-1 bg-[#1a1d28] p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setEditMode('fields')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                editMode === 'fields'
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Interactive Links
            </button>
            <button
              type="button"
              onClick={() => setEditMode('raw')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                editMode === 'raw'
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>HTML Source</span>
            </button>
          </div>
        </div>

        {editMode === 'fields' ? (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-400">
              Each contact entry can be plain text (like phone number) or a clickable profile link (LinkedIn, GitHub, email).
            </p>

            <div className="space-y-1.5">
              {contactItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-[#141620] border border-white/10 rounded-lg flex items-center gap-2"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleUpdateContactItem(idx, 'label', e.target.value)}
                        placeholder="Label (e.g. LinkedIn, email, +91...)"
                        className="w-1/3 bg-[#1a1d28] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) => handleUpdateContactItem(idx, 'url', e.target.value)}
                        placeholder="URL or mailto: (leave empty for plain text)"
                        className="flex-1 bg-[#1a1d28] border border-white/10 rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveContactItem(idx)}
                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors text-base leading-none cursor-pointer"
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddContactItem}
              className="mt-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              + Add Contact Item / Link
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className={labelClass}>Raw Contact HTML</label>
            <textarea
              rows={4}
              className="bg-[#1a1d28] border border-white/10 text-white font-mono text-[11px] rounded-lg p-2 w-full focus:outline-none focus:border-white/30 transition-colors"
              value={header.contactLine ?? ""}
              onChange={(e) => handleChange("contactLine", e.target.value)}
              placeholder="e.g. <a href='mailto:...'>...</a> · phone · <a href='...'>LinkedIn</a>"
            />
            <p className="text-[10px] text-zinc-500 font-mono">
              Directly edit anchor tags (&lt;a href=&quot;...&quot;&gt;) or separators (·).
            </p>
          </div>
        )}
      </div>

      {/* Alignment */}
      <div className={sectionClass}>
        <h3 className={sectionTitleClass}>Alignment</h3>
        <div className="flex gap-2">
          {["left", "center", "right"].map((align) => (
            <button
              key={align}
              onClick={() => handleChange("alignment", align)}
              className={`flex-1 py-1 rounded-lg text-xs font-mono uppercase border transition-colors cursor-pointer ${
                header.alignment === align
                  ? "bg-white text-zinc-950 font-bold border-white"
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
        <div className="grid grid-cols-2 gap-2">
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
        <div className="space-y-1 mt-1.5">
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
              className={`${inputClass} mt-1`}
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
        <div className="grid grid-cols-2 gap-2">
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
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                className="h-8 w-9 rounded-lg border border-white/10 bg-[#1a1d28] cursor-pointer p-0.5"
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
            className="w-4 h-4 rounded accent-white"
            checked={header.showDivider ?? false}
            onChange={(e) => handleChange("showDivider", e.target.checked)}
          />
          <span className="text-xs text-zinc-300">Show divider below header</span>
        </label>
      </div>

      {/* Divider Settings */}
      {header.showDivider && (
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>Divider Settings</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className={labelClass}>Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  className="h-8 w-9 rounded-lg border border-white/10 bg-[#1a1d28] cursor-pointer p-0.5"
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
          <div className="space-y-1 mt-1.5">
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
          <div className="grid grid-cols-2 gap-2 mt-1.5">
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
