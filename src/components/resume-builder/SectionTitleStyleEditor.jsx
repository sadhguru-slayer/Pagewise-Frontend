'use client';

import { useResumeStore } from '@/lib/resume/store';
import { Bold, Underline, AlignLeft, AlignCenter, AlignRight, Minus, Palette, Layers, Type } from 'lucide-react';
import toast from 'react-hot-toast';

const inputClass =
  'bg-[#1a1d28] border border-white/10 text-white rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:border-accent transition-colors';
const labelClass = 'text-[10px] text-zinc-400 font-mono uppercase tracking-wider';

export default function SectionTitleStyleEditor({ sectionId: propSectionId }) {
  const sections = useResumeStore((s) => s.sections);
  const settings = useResumeStore((s) => s.settings);
  const activeSectionId = useResumeStore((s) => s.activeSectionId);
  const updateSectionSettings = useResumeStore((s) => s.updateSectionSettings);
  const renameSection = useResumeStore((s) => s.renameSection);
  const applyHeadingStyleToAll = useResumeStore((s) => s.applyHeadingStyleToAll);

  const targetId = propSectionId || activeSectionId || sections[0]?.id;
  const section = sections.find((s) => s.id === targetId);

  if (!section) return null;

  const currentColor = section.headingColor || settings?.headingColor || '#111827';
  const isBold = section.headingBold !== false;
  const isUnderline = Boolean(section.headingUnderline);
  const isUppercase = section.headingUppercase !== false;
  const currentAlign = section.headingAlign || 'left';
  const showDivider = Boolean(section.showDividerAfterHeading);

  const headingFontSize =
    section.headingFontSize ?? Number(((settings?.bodyFontSize ?? 8.5) * 1.18).toFixed(1));

  const dividerThickness = section.headingDividerThickness ?? 1;
  const dividerStyle = section.headingDividerStyle ?? 'solid';
  const dividerColor = section.headingDividerColor || `${currentColor}44`;
  const dividerMarginTop = section.headingDividerMarginTop ?? 1;
  const dividerMarginBottom = section.headingDividerMarginBottom ?? 2;

  const handleApplyToAll = () => {
    applyHeadingStyleToAll(targetId);
    toast.success('Applied this heading style to all sections!');
  };

  return (
    <div className="bg-[#121520] border border-white/10 rounded-xl p-3 space-y-3 shadow-sm">
      {/* Target Section Title Header */}
      <div className="flex items-center justify-between pb-1 border-b border-white/5">
        <span className="text-[10px] font-mono uppercase text-blue-400 font-semibold tracking-wider">
          Title & Heading Line:
        </span>
        <span className="text-xs text-white font-medium bg-white/5 px-2 py-0.5 rounded border border-white/10">
          {section.title || 'Untitled Section'}
        </span>
      </div>

      {/* Title name edit */}
      <div className="space-y-1">
        <label className={labelClass}>Section Title Text</label>
        <input
          type="text"
          value={section.title || ''}
          onChange={(e) => renameSection(targetId, e.target.value)}
          placeholder="Section Title"
          className="w-full bg-[#1a1d28] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
        />
      </div>

      {/* Styling controls toolbar */}
      <div>
        <label className={`${labelClass} block mb-1.5`}>Heading Typography</label>
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Color picker */}
          <div className="flex items-center gap-1 bg-[#1a1d28] border border-white/10 rounded-lg px-2 py-1" title="Heading color">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => updateSectionSettings(targetId, { headingColor: e.target.value })}
              className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-[11px] font-mono text-zinc-300 uppercase">{currentColor}</span>
          </div>

          <div className="w-px h-5 bg-white/10 mx-0.5" />

          {/* Heading Font Size */}
          <div className="flex items-center gap-1 bg-[#1a1d28] border border-white/10 rounded-lg px-2 py-1" title="Heading font size">
            <Type className="w-3 h-3 text-zinc-400" />
            <input
              type="number"
              min={7}
              max={28}
              step={0.5}
              value={headingFontSize}
              onChange={(e) => updateSectionSettings(targetId, { headingFontSize: Number(e.target.value) })}
              className="w-11 bg-transparent text-xs text-white font-mono focus:outline-none"
            />
            <span className="text-[10px] text-zinc-400 font-mono">pt</span>
          </div>

          <div className="w-px h-5 bg-white/10 mx-0.5" />

          {/* Bold toggle */}
          <button
            type="button"
            onClick={() => updateSectionSettings(targetId, { headingBold: !isBold })}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center justify-center cursor-pointer ${
              isBold
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Bold section title"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Underline toggle */}
          <button
            type="button"
            onClick={() => updateSectionSettings(targetId, { headingUnderline: !isUnderline })}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center justify-center cursor-pointer ${
              isUnderline
                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Underline section title"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* Uppercase toggle */}
          <button
            type="button"
            onClick={() => updateSectionSettings(targetId, { headingUppercase: !isUppercase })}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              isUppercase
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Toggle Uppercase"
          >
            AA
          </button>

          <div className="w-px h-5 bg-white/10 mx-0.5" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => updateSectionSettings(targetId, { headingAlign: 'left' })}
              className={`p-1 rounded text-xs cursor-pointer ${
                currentAlign === 'left' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => updateSectionSettings(targetId, { headingAlign: 'center' })}
              className={`p-1 rounded text-xs cursor-pointer ${
                currentAlign === 'center' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => updateSectionSettings(targetId, { headingAlign: 'right' })}
              className={`p-1 rounded text-xs cursor-pointer ${
                currentAlign === 'right' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Line After Section Heading (Divider) ─────────────────────────── */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-blue-600 w-3.5 h-3.5 rounded"
              checked={showDivider}
              onChange={(e) => updateSectionSettings(targetId, { showDividerAfterHeading: e.target.checked })}
            />
            <span className="text-xs font-semibold text-zinc-300">Line after Section Heading</span>
          </label>
        </div>

        {showDivider && (
          <div className="bg-[#181a26] border border-white/10 rounded-lg p-2.5 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              {/* Color */}
              <div className="space-y-1">
                <label className={labelClass}>Line Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    className="h-7 w-8 rounded border border-white/10 bg-[#1a1d28] cursor-pointer p-0.5"
                    value={dividerColor.length === 7 ? dividerColor : '#d1d5db'}
                    onChange={(e) => updateSectionSettings(targetId, { headingDividerColor: e.target.value })}
                  />
                  <input
                    type="text"
                    className={`${inputClass} flex-1`}
                    value={dividerColor}
                    onChange={(e) => updateSectionSettings(targetId, { headingDividerColor: e.target.value })}
                  />
                </div>
              </div>

              {/* Thickness */}
              <div className="space-y-1">
                <label className={labelClass}>Thickness (px)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  className={inputClass}
                  value={dividerThickness}
                  onChange={(e) => updateSectionSettings(targetId, { headingDividerThickness: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Style */}
              <div className="space-y-1">
                <label className={labelClass}>Style</label>
                <select
                  className={inputClass}
                  value={dividerStyle}
                  onChange={(e) => updateSectionSettings(targetId, { headingDividerStyle: e.target.value })}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>

              {/* Margins */}
              <div className="space-y-1">
                <label className={labelClass}>Top Margin</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  className={inputClass}
                  value={dividerMarginTop}
                  onChange={(e) => updateSectionSettings(targetId, { headingDividerMarginTop: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Bottom Margin</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  className={inputClass}
                  value={dividerMarginBottom}
                  onChange={(e) => updateSectionSettings(targetId, { headingDividerMarginBottom: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Action: Apply this heading style across all sections ─────────── */}
      <button
        type="button"
        onClick={handleApplyToAll}
        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        title="Sync font size, bold, underline, uppercase, alignment, and line divider to all other sections"
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Apply Heading Style to All Sections</span>
      </button>
    </div>
  );
}
