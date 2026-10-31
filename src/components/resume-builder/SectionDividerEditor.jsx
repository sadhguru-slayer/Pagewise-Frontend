'use client';

import { useResumeStore } from '@/lib/resume/store';
import { Layers, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const inputClass =
  'bg-[#1a1d28] border border-white/10 text-white rounded-lg px-2 py-1 text-xs w-full focus:outline-none focus:border-accent transition-colors';
const labelClass = 'text-[10px] text-zinc-400 font-mono uppercase tracking-wider';

const DEFAULT_DIVIDER = {
  color: '#d1d5db',
  thickness: 1,
  marginTop: 2,
  marginBottom: 2,
  style: 'solid',
};

export default function SectionDividerEditor({ sectionId: propSectionId }) {
  const sections = useResumeStore((s) => s.sections);
  const activeSectionId = useResumeStore((s) => s.activeSectionId);
  const updateSectionDivider = useResumeStore((s) => s.updateSectionDivider);
  const applyDividerAfterToAll = useResumeStore((s) => s.applyDividerAfterToAll);

  const targetId = propSectionId || activeSectionId || sections[0]?.id;
  const section = sections.find((s) => s.id === targetId);
  const divider = section?.dividerAfter ?? null;
  const isOn = divider !== null && divider !== undefined;

  const handleToggle = (checked) => {
    if (checked) {
      updateSectionDivider(targetId, { ...DEFAULT_DIVIDER });
    } else {
      updateSectionDivider(targetId, null);
    }
  };

  const handleChange = (key, value) => {
    updateSectionDivider(targetId, { ...divider, [key]: value });
  };

  const handleApplyToAll = () => {
    applyDividerAfterToAll(divider || DEFAULT_DIVIDER);
    toast.success('Applied bottom line divider to all sections!');
  };

  const handleRemoveFromAll = () => {
    applyDividerAfterToAll(null);
    toast.success('Removed bottom line divider from all sections!');
  };

  if (!section) return null;

  return (
    <div className="bg-[#121520] border border-white/10 rounded-xl p-3 space-y-3 shadow-sm">
      <div className="flex items-center justify-between pb-1 border-b border-white/5">
        <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold tracking-wider">
          Divider After Section:
        </span>
        <span className="text-xs text-white font-medium bg-white/5 px-2 py-0.5 rounded border border-white/10">
          {section.title || 'Untitled Section'}
        </span>
      </div>

      {/* Toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className="accent-indigo-600 w-3.5 h-3.5 rounded"
          checked={isOn}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        <span className="text-xs font-semibold text-zinc-300">Show line divider after this section</span>
      </label>

      {/* Divider Settings */}
      {isOn && (
        <div className="bg-[#181a26] border border-white/10 rounded-lg p-2.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            {/* Color */}
            <div className="space-y-1">
              <label className={labelClass}>Line Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  className="h-7 w-8 rounded border border-white/10 bg-[#1a1d28] cursor-pointer p-0.5"
                  value={divider.color ?? '#d1d5db'}
                  onChange={(e) => handleChange('color', e.target.value)}
                />
                <input
                  type="text"
                  className={`${inputClass} flex-1`}
                  value={divider.color ?? '#d1d5db'}
                  onChange={(e) => handleChange('color', e.target.value)}
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
                value={divider.thickness ?? 1}
                onChange={(e) => handleChange('thickness', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Style */}
            <div className="space-y-1">
              <label className={labelClass}>Style</label>
              <select
                className={inputClass}
                value={divider.style ?? 'solid'}
                onChange={(e) => handleChange('style', e.target.value)}
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
                max={30}
                className={inputClass}
                value={divider.marginTop ?? 2}
                onChange={(e) => handleChange('marginTop', Number(e.target.value))}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Bottom Margin</label>
              <input
                type="number"
                min={0}
                max={30}
                className={inputClass}
                value={divider.marginBottom ?? 2}
                onChange={(e) => handleChange('marginBottom', Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Global Actions */}
      <div className="pt-2 border-t border-white/10 flex items-center gap-2">
        <button
          type="button"
          onClick={handleApplyToAll}
          className="flex-1 py-1 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
          title="Enable this bottom line across all sections"
        >
          <Layers className="w-3 h-3" />
          <span>Apply to All</span>
        </button>
        <button
          type="button"
          onClick={handleRemoveFromAll}
          className="py-1 px-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
          title="Remove bottom divider from all sections"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
}
