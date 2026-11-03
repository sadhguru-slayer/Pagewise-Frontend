'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Type,
  Bold,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Layers,
  FileText,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useResumeStore } from '@/lib/resume/store';
import ResumeRichEditor from './ResumeRichEditor';
import {
  SECTION_TYPES,
  getSectionType,
  isStructuredSection,
  createDefaultSectionItem,
  convertLegacySectionToStructured,
} from '@/lib/resume/sectionSchemas';

// ── Text-Editor Style Chips / Tag Input ──────────────────────────────────────
function TextEditorChips({
  tags = [],
  onChange,
  placeholder = 'Write tech stack you used, press Enter to add...',
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputValue.trim();
      if (!val) return;
      if (val.includes(',')) {
        const parts = val.split(',').map((s) => s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...tags, ...parts]));
        onChange(merged);
      } else if (!tags.some((t) => t.toLowerCase() === val.toLowerCase())) {
        onChange([...tags, val]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-100 placeholder:text-zinc-500 py-1.5"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {tags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/50 text-xs transition-colors"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm leading-none"
                title={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Text-Editor Style Bullet Points List ─────────────────────────────────────
function TextEditorBulletList({
  bullets = [],
  onChange,
  placeholder = 'List things you did, press Enter to add new list... *',
}) {
  const [newBulletText, setNewBulletText] = useState('');
  const newBulletInputRef = useRef(null);

  const handleNewBulletKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = newBulletText.trim();
      if (!val) return;
      onChange([...bullets, val]);
      setNewBulletText('');
    }
  };

  const handleBulletChange = (idx, text) => {
    const updated = [...bullets];
    updated[idx] = text;
    onChange(updated);
  };

  const handleExistingBulletKeyDown = (e, idx) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Insert a new blank bullet right after current one
      const updated = [...bullets];
      updated.splice(idx + 1, 0, '');
      onChange(updated);
      setTimeout(() => {
        const nextInput = document.getElementById(`bullet-input-${idx + 1}`);
        if (nextInput) nextInput.focus();
      }, 30);
    } else if (e.key === 'Backspace' && !bullets[idx] && bullets.length > 1) {
      e.preventDefault();
      const updated = bullets.filter((_, i) => i !== idx);
      onChange(updated);
      setTimeout(() => {
        const prevInput = document.getElementById(`bullet-input-${Math.max(0, idx - 1)}`);
        if (prevInput) prevInput.focus();
      }, 30);
    }
  };

  const removeBullet = (idx) => {
    const updated = bullets.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div className="w-full space-y-1.5 mt-2">
      {/* Existing Bullets rendered as semantic <ul> <li> */}
      {bullets.length > 0 && (
        <ul className="pl-5 space-y-1.5 list-disc text-zinc-400">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="group pl-1 text-xs">
              <div className="flex items-start gap-2">
                <textarea
                  id={`bullet-input-${idx}`}
                  rows={Math.max(1, Math.ceil((bullet?.length || 0) / 75))}
                  value={bullet}
                  onChange={(e) => handleBulletChange(idx, e.target.value)}
                  onKeyDown={(e) => handleExistingBulletKeyDown(e, idx)}
                  placeholder="Describe accomplishment or responsibility..."
                  className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-100 placeholder:text-zinc-600 resize-none leading-relaxed py-0.5"
                />
                <button
                  type="button"
                  onClick={() => removeBullet(idx)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition-opacity cursor-pointer text-base px-1 leading-none select-none"
                  title="Remove bullet"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Input to type and press Enter to add next bullet */}
      <input
        ref={newBulletInputRef}
        type="text"
        value={newBulletText}
        onChange={(e) => setNewBulletText(e.target.value)}
        onKeyDown={handleNewBulletKeyDown}
        placeholder={placeholder}
        className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-100 placeholder:text-zinc-500 py-1.5 transition-colors"
      />
    </div>
  );
}

// ── Text-Editor Style Links Manager ──────────────────────────────────────────
function TextEditorLinks({ links = [], onChange }) {
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const handleSaveLink = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    let validUrl = trimmedUrl;
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    onChange([...links, { label: label.trim() || trimmedUrl, url: validUrl }]);
    setLabel('');
    setUrl('');
    setIsAdding(false);
  };

  const handleRemoveLink = (idx) => {
    onChange(links.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300">Links</span>
      </div>

      {/* Rendered Links with Underlines */}
      {links.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {links.map((link, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 group"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-300 transition-colors"
              >
                {link.label || link.url}
              </a>
              <button
                type="button"
                onClick={() => handleRemoveLink(idx)}
                className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer text-sm leading-none"
                title="Remove link"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* + Add Link Button */}
      {!isAdding ? (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer block font-medium"
        >
          + Add link
        </button>
      ) : (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 mt-2.5 p-2 bg-zinc-900/60 rounded-lg border border-zinc-800">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="w-1/3 bg-transparent border-b border-zinc-700 focus:border-blue-500 outline-none px-1 py-1 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveLink();
              }
            }}
            placeholder="Paste link... (e.g. https://...)"
            className="flex-1 bg-transparent border-b border-zinc-700 focus:border-blue-500 outline-none px-1 py-1 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={handleSaveLink}
            disabled={!url.trim()}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer shrink-0"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setLabel('');
              setUrl('');
            }}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-base leading-none px-1"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Structured Section Editor Component ─────────────────────────────────
export default function StructuredSectionEditor({ onCollapse }) {
  const {
    activeSectionId,
    sections,
    settings,
    updateSectionItems,
    updateSectionItem,
    addSectionItem,
    removeSectionItem,
    reorderSectionItems,
    updateSectionSettings,
    renameSection,
    updateSectionDivider,
    activeJdAnalysis,
    appliedSuggestionKeys = [],
    markSuggestionApplied,
    dismissedSuggestionKeys = [],
    dismissSuggestion,
    highlightedSectionId,
    setHighlightedSectionId,
    addKeywordToResume,
  } = useResumeStore();

  const resolvedSectionId = activeSectionId || sections[0]?.id;
  const section = sections.find((s) => s.id === resolvedSectionId);
  const sectionType = getSectionType(section);
  const isStructured = isStructuredSection(section);

  const [showJdPanel, setShowJdPanel] = useState(false);

  // Clear highlight timer
  const isHighlighted = Boolean(highlightedSectionId && highlightedSectionId === resolvedSectionId);
  useEffect(() => {
    if (isHighlighted) {
      setShowJdPanel(true);
      const timer = setTimeout(() => {
        setHighlightedSectionId?.(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, setHighlightedSectionId]);

  // Ensure structured sections have initialized items
  useEffect(() => {
    if (!section || !isStructured) return;
    if (!Array.isArray(section.items) || section.items.length === 0) {
      const converted = convertLegacySectionToStructured(section);
      if (converted.items && converted.items.length > 0) {
        updateSectionItems(section.id, converted.items);
      } else {
        updateSectionItems(section.id, [createDefaultSectionItem(sectionType)]);
      }
    }
  }, [section?.id, isStructured]);

  if (!section) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b0c13] text-zinc-500">
        <Layers className="w-8 h-8 mb-2 text-zinc-600" />
        <p className="text-sm">No section selected.</p>
        <p className="text-xs mt-1 text-zinc-600">
          Click any section in the resume preview or choose from the left menu to start editing.
        </p>
      </div>
    );
  }

  // If this section is free-form (Summary, Objective, or Custom Section), ALWAYS render Rich Text Editor
  if (!isStructured) {
    return <ResumeRichEditor onCollapse={onCollapse} />;
  }

  // Structured Form Items
  const items = Array.isArray(section.items) && section.items.length > 0
    ? section.items
    : [createDefaultSectionItem(sectionType)];

  const handleUpdateItem = (itemId, patch) => {
    updateSectionItem(resolvedSectionId, itemId, patch);
  };

  const handleAddItem = () => {
    addSectionItem(resolvedSectionId, createDefaultSectionItem(sectionType));
  };

  const handleRemoveItem = (itemId) => {
    if (items.length <= 1) {
      updateSectionItem(resolvedSectionId, itemId, createDefaultSectionItem(sectionType));
      toast('Reset to blank item', { icon: 'ℹ️' });
    } else {
      removeSectionItem(resolvedSectionId, itemId);
    }
  };

  const handleReorderItems = (fromIdx, toIdx) => {
    reorderSectionItems(resolvedSectionId, fromIdx, toIdx);
  };

  // JD Suggestions
  const currentSectionEnhancements = activeJdAnalysis?.section_enhancements?.find(
    (s) =>
      s.section_id === resolvedSectionId ||
      s.section_title?.toLowerCase().trim() === section?.title?.toLowerCase().trim()
  );
  const suggestions = currentSectionEnhancements?.suggestions || [];
  const missingKeywords = activeJdAnalysis?.ats_check?.missing_keywords || [];
  const recommendedKeywords = activeJdAnalysis?.ats_check?.recommended_keywords || [];
  const unaddedKeywords = Array.from(new Set([...missingKeywords, ...recommendedKeywords]));

  const getSuggestionKey = (sug, idx) =>
    sug.id || `${resolvedSectionId}-${idx}-${sug.original_text || sug.enhanced_html}`;

  const isSuggestionDismissed = (sug, idx) => {
    const key = getSuggestionKey(sug, idx);
    return dismissedSuggestionKeys.includes(key);
  };

  const activeSuggestions = suggestions.filter((sug, idx) => !isSuggestionDismissed(sug, idx));

  const isSuggestionApplied = (sug, idx) => {
    const key = getSuggestionKey(sug, idx);
    return appliedSuggestionKeys.includes(key);
  };

  const handleApplySuggestion = (sug, idx) => {
    const key = getSuggestionKey(sug, idx);
    const cleanText = (sug.enhanced_html || sug.original_text || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const origText = (sug.original_text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    let replaced = false;

    const updatedItems = items.map((it) => {
      if (Array.isArray(it.points)) {
        const nextPoints = it.points.map((pt) => {
          if (!replaced && origText && pt.toLowerCase().includes(origText.slice(0, 30))) {
            replaced = true;
            return cleanText;
          }
          return pt;
        });
        return { ...it, points: nextPoints };
      }
      return it;
    });

    if (replaced) {
      updateSectionItems(resolvedSectionId, updatedItems);
      markSuggestionApplied?.(key);
      toast.success('Replaced original bullet in-place!');
      return;
    }

    const firstItem = { ...updatedItems[0] };
    firstItem.points = [...(firstItem.points || []).filter(Boolean), cleanText];
    updatedItems[0] = firstItem;

    updateSectionItems(resolvedSectionId, updatedItems);
    markSuggestionApplied?.(key);
    toast.success('Added recommendation to bullet list!');
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#0d0f18] overflow-hidden min-h-0 transition-all duration-300 ${
        isHighlighted
          ? 'ring-2 ring-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.25)] border-l-4 border-l-amber-500'
          : ''
      }`}
    >
      {/* ── Top Header with Title & Typography Quick Controls ────────────────── */}
      <div className="px-3 py-2 bg-[#10121b] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Section Title Input */}
        <div className="flex items-center gap-1.5 min-w-[140px] flex-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 shrink-0">
            Section:
          </span>
          <input
            type="text"
            value={section.title || ''}
            onChange={(e) => renameSection(resolvedSectionId, e.target.value)}
            className="bg-zinc-800/60 hover:bg-zinc-800 focus:bg-zinc-900 border border-zinc-700/60 focus:border-blue-500 rounded px-2 py-0.5 text-xs font-bold text-white focus:outline-none transition-colors w-full max-w-[180px]"
            placeholder="Section Title"
            title="Edit Section Heading Name"
          />
        </div>

        {/* Heading Style Quick Controls */}
        <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5 text-xs">
          {/* Heading Font Size */}
          <div className="flex items-center gap-0.5 px-1.5 py-0.5" title="Section Heading Font Size">
            <Type className="w-3 h-3 text-zinc-400 shrink-0" />
            <input
              type="number"
              min={7}
              max={28}
              step={0.5}
              value={section.headingFontSize ?? Number(((settings?.bodyFontSize ?? 8.5) * 1.18).toFixed(1))}
              onChange={(e) => updateSectionSettings(resolvedSectionId, { headingFontSize: Number(e.target.value) })}
              className="w-9 bg-transparent text-[11px] text-zinc-200 font-mono text-center focus:outline-none"
            />
            <span className="text-[9px] text-zinc-500 font-mono">pt</span>
          </div>

          <div className="w-px h-3.5 bg-zinc-800" />

          {/* Heading Bold */}
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingBold: section.headingBold === false })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              section.headingBold !== false ? 'bg-blue-600/30 text-blue-300 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
            title="Bold Section Heading"
          >
            <Bold className="w-3 h-3" />
          </button>

          {/* Heading Underline */}
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingUnderline: !section.headingUnderline })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              section.headingUnderline ? 'bg-blue-600/30 text-blue-300' : 'text-zinc-400 hover:text-white'
            }`}
            title="Underline Section Heading"
          >
            <UnderlineIcon className="w-3 h-3" />
          </button>

          <div className="w-px h-3.5 bg-zinc-800" />

          {/* Heading Alignment */}
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingAlign: 'left' })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              !section.headingAlign || section.headingAlign === 'left' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Align Heading Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingAlign: 'center' })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              section.headingAlign === 'center' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Align Heading Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingAlign: 'right' })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              section.headingAlign === 'right' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Align Heading Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>

          <div className="w-px h-3.5 bg-zinc-800" />

          {/* Line below heading toggle */}
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { showDividerAfterHeading: !section.showDividerAfterHeading })}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              section.showDividerAfterHeading
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Toggle Horizontal Line Below Heading"
          >
            <Minus className="w-2.5 h-2.5" />
            <span>Title Line</span>
          </button>

          {/* Line after section toggle */}
          <button
            type="button"
            onClick={() => {
              if (section.dividerAfter) {
                updateSectionDivider(resolvedSectionId, null);
              } else {
                updateSectionDivider(resolvedSectionId, {
                  color: '#d1d5db',
                  thickness: 1,
                  marginTop: 2,
                  marginBottom: 2,
                  style: 'solid',
                });
              }
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              section.dividerAfter
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Toggle Horizontal Line After Entire Section"
          >
            <Minus className="w-2.5 h-2.5" />
            <span>Bottom Line</span>
          </button>
        </div>

        {/* Collapse Button */}
        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Collapse Editor"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-xs flex items-center gap-1 shrink-0"
          >
            <span>Collapse</span>
            <span>›</span>
          </button>
        )}
      </div>

      {/* ── Optional JD Enhancements Accordion Bar ──────────────────────────── */}
      {suggestions.length > 0 && (
        <div className="bg-[#121422] border-b border-indigo-500/20 px-4 py-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowJdPanel((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-white transition-colors cursor-pointer w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Wiser AI Suggestions for this section ({activeSuggestions.length})</span>
            </div>
            <span className="text-[10px] text-zinc-500">
              {showJdPanel ? 'Hide ▲' : 'Show ▼'}
            </span>
          </button>

          {showJdPanel && (
            <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
              {activeSuggestions.map((sug, idx) => {
                const applied = isSuggestionApplied(sug, idx);
                const sugKey = getSuggestionKey(sug, idx);

                return (
                  <div
                    key={sugKey}
                    className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1.5"
                  >
                    {sug.original_text && (
                      <p className="text-[11px] text-zinc-400 line-through">
                        {sug.original_text}
                      </p>
                    )}
                    <p className="text-zinc-200 font-medium">
                      {sug.enhanced_text || sug.enhanced_html?.replace(/<[^>]+>/g, ' ')}
                    </p>
                    {sug.rationale && (
                      <p className="text-[10px] text-indigo-300/80">
                        💡 {sug.rationale}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-zinc-500">
                        {applied ? '✓ Applied' : 'Ready to apply'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => dismissSuggestion(sugKey)}
                          className="px-2 py-0.5 rounded text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplySuggestion(sug, idx)}
                          className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                        >
                          {applied ? 'Add Another' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Document-Style Form Body ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-[680px] mx-auto w-full">
        {/* WORK EXPERIENCE */}
        {sectionType === SECTION_TYPES.EXPERIENCE && (
          <div className="space-y-8">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-2 relative">
                {/* Item Separator & Actions Bar if multiple positions */}
                {items.length > 1 && (
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 mb-2">
                    <span className="text-[11px] font-mono text-zinc-400 font-medium">
                      Position #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleReorderItems(idx, idx - 1)}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => handleReorderItems(idx, idx + 1)}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-zinc-500 hover:text-rose-400 text-xs transition-colors cursor-pointer ml-1"
                        title="Remove position"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Company Name */}
                <div className="field">
                  <input
                    type="text"
                    value={item.company || ''}
                    onChange={(e) => handleUpdateItem(item.id, { company: e.target.value })}
                    placeholder="Company Name. Eg: Accenture, Google... *"
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold text-white placeholder:text-zinc-500 py-1"
                    required
                  />
                </div>

                {/* Job Title */}
                <div className="field">
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                    placeholder="Job Title / Role. Eg: Senior Software Engineer... *"
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs font-semibold text-zinc-200 placeholder:text-zinc-500 py-1"
                    required
                  />
                </div>

                {/* Dates & Location Row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 py-0.5">
                  <input
                    type="text"
                    value={item.start_date || ''}
                    onChange={(e) => handleUpdateItem(item.id, { start_date: e.target.value })}
                    placeholder="Start (Eg: Mar 2022)"
                    className="w-28 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-0.5"
                  />
                  <span className="text-zinc-500">–</span>
                  <input
                    type="text"
                    disabled={Boolean(item.current)}
                    value={item.current ? 'Present' : item.end_date || ''}
                    onChange={(e) => handleUpdateItem(item.id, { end_date: e.target.value })}
                    placeholder="End (Eg: Present)"
                    className="w-28 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-0.5 disabled:opacity-50"
                  />
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={Boolean(item.current)}
                      onChange={(e) => handleUpdateItem(item.id, { current: e.target.checked })}
                      className="rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0"
                    />
                    <span>Currently working here</span>
                  </label>
                  <span className="text-zinc-600">|</span>
                  <input
                    type="text"
                    value={item.location || ''}
                    onChange={(e) => handleUpdateItem(item.id, { location: e.target.value })}
                    placeholder="Location (Eg: San Francisco, CA)"
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-0.5"
                  />
                </div>

                {/* Removable Summary Section */}
                {item.summary !== undefined && item.summary !== null ? (
                  <div className="flex items-start gap-2 pt-1 group">
                    <input
                      type="text"
                      value={item.summary || ''}
                      onChange={(e) => handleUpdateItem(item.id, { summary: e.target.value })}
                      placeholder="Write a summary of what you did in 10–15 words"
                      className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { summary: null })}
                      className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer text-lg leading-none pt-0.5 px-1 select-none"
                      title="Remove summary"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpdateItem(item.id, { summary: '' })}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer block py-1"
                  >
                    + Add summary
                  </button>
                )}

                {/* Removable Tech Section */}
                {item.tech_stack !== undefined && item.tech_stack !== null ? (
                  <div className="flex items-start gap-2 pt-1 group">
                    <div className="flex-1">
                      <TextEditorChips
                        tags={Array.isArray(item.tech_stack) ? item.tech_stack : []}
                        onChange={(tech_stack) => handleUpdateItem(item.id, { tech_stack })}
                        placeholder="Write tech stack you used, press Enter to add..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { tech_stack: null })}
                      className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer text-lg leading-none pt-1 px-1 select-none"
                      title="Remove tech stack"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpdateItem(item.id, { tech_stack: [] })}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer block py-1"
                  >
                    + Add tech stack
                  </button>
                )}

                {/* Bullet Points List */}
                <div className="field pt-1">
                  <TextEditorBulletList
                    bullets={Array.isArray(item.points) ? item.points : []}
                    onChange={(points) => handleUpdateItem(item.id, { points })}
                    placeholder="List things you did, press Enter to add new list... *"
                  />
                </div>

                {/* Links Section */}
                <TextEditorLinks
                  links={Array.isArray(item.links) ? item.links : []}
                  onChange={(links) => handleUpdateItem(item.id, { links })}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-6 py-2 px-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add another position</span>
            </button>
          </div>
        )}

        {/* EDUCATION */}
        {sectionType === SECTION_TYPES.EDUCATION && (
          <div className="space-y-8">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-2 relative">
                {items.length > 1 && (
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 mb-2">
                    <span className="text-[11px] font-mono text-zinc-400 font-medium">
                      Education #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleReorderItems(idx, idx - 1)}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => handleReorderItems(idx, idx + 1)}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-zinc-500 hover:text-rose-400 text-xs transition-colors cursor-pointer ml-1"
                        title="Remove education"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* School */}
                <div className="field">
                  <input
                    type="text"
                    value={item.institution || ''}
                    onChange={(e) => handleUpdateItem(item.id, { institution: e.target.value })}
                    placeholder="School / University. Eg: Stanford University, IIT Bombay... *"
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold text-white placeholder:text-zinc-500 py-1"
                    required
                  />
                </div>

                {/* Degree & Major */}
                <div className="field">
                  <input
                    type="text"
                    value={item.degree || ''}
                    onChange={(e) => handleUpdateItem(item.id, { degree: e.target.value })}
                    placeholder="Degree & Major. Eg: B.S. in Computer Science... *"
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs font-semibold text-zinc-200 placeholder:text-zinc-500 py-1"
                    required
                  />
                </div>

                {/* Dates & Location */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 py-0.5">
                  <input
                    type="text"
                    value={item.end_date || ''}
                    onChange={(e) => handleUpdateItem(item.id, { end_date: e.target.value })}
                    placeholder="Graduation Year (Eg: 2022)"
                    className="w-40 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-0.5"
                  />
                  <span className="text-zinc-600">|</span>
                  <input
                    type="text"
                    value={item.location || ''}
                    onChange={(e) => handleUpdateItem(item.id, { location: e.target.value })}
                    placeholder="Location (Eg: Stanford, CA)"
                    className="w-36 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-0.5"
                  />
                  <span className="text-zinc-600">|</span>
                  <input
                    type="text"
                    value={item.gpa || ''}
                    onChange={(e) => handleUpdateItem(item.id, { gpa: e.target.value })}
                    placeholder="GPA / Honors (Eg: 3.9 / 4.0)"
                    className="flex-1 min-w-[100px] bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-0.5"
                  />
                </div>

                {/* Coursework & Honors Bullets */}
                <div className="field pt-1">
                  <TextEditorBulletList
                    bullets={Array.isArray(item.points) ? item.points : []}
                    onChange={(points) => handleUpdateItem(item.id, { points })}
                    placeholder="List coursework, leadership, or honors, press Enter to add..."
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-6 py-2 px-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add another degree</span>
            </button>
          </div>
        )}

        {/* PROJECTS */}
        {sectionType === SECTION_TYPES.PROJECTS && (
          <div className="space-y-8">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-2 relative">
                {items.length > 1 && (
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 mb-2">
                    <span className="text-[11px] font-mono text-zinc-400 font-medium">
                      Project #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleReorderItems(idx, idx - 1)}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => handleReorderItems(idx, idx + 1)}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-zinc-500 hover:text-rose-400 text-xs transition-colors cursor-pointer ml-1"
                        title="Remove project"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Project Name */}
                <div className="field">
                  <input
                    type="text"
                    value={item.project_title || ''}
                    onChange={(e) => handleUpdateItem(item.id, { project_title: e.target.value })}
                    placeholder="Project Name. Eg: Resumo AI, Distributed Queue... *"
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold text-white placeholder:text-zinc-500 py-1"
                    required
                  />
                </div>

                {/* Role / Contribution */}
                <div className="field">
                  <input
                    type="text"
                    value={item.role || ''}
                    onChange={(e) => handleUpdateItem(item.id, { role: e.target.value })}
                    placeholder="Role / Contribution. Eg: Creator & Lead Architect..."
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs font-semibold text-zinc-200 placeholder:text-zinc-500 py-1"
                  />
                </div>

                {/* Tech Stack Chips */}
                <div className="field pt-0.5">
                  <TextEditorChips
                    tags={Array.isArray(item.tech_stack) ? item.tech_stack : []}
                    onChange={(tech_stack) => handleUpdateItem(item.id, { tech_stack })}
                    placeholder="Write tech stack you used, press Enter to add..."
                  />
                </div>

                {/* Summary */}
                {item.summary !== undefined && item.summary !== null ? (
                  <div className="flex items-start gap-2 pt-1 group">
                    <input
                      type="text"
                      value={item.summary || ''}
                      onChange={(e) => handleUpdateItem(item.id, { summary: e.target.value })}
                      placeholder="Write a brief overview of the project in 10–15 words"
                      className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { summary: null })}
                      className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer text-lg leading-none pt-0.5 px-1 select-none"
                      title="Remove summary"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpdateItem(item.id, { summary: '' })}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer block py-1"
                  >
                    + Add summary
                  </button>
                )}

                {/* Impact Bullets */}
                <div className="field pt-1">
                  <TextEditorBulletList
                    bullets={Array.isArray(item.points) ? item.points : []}
                    onChange={(points) => handleUpdateItem(item.id, { points })}
                    placeholder="List key features and accomplishments, press Enter to add... *"
                  />
                </div>

                {/* Links */}
                <TextEditorLinks
                  links={Array.isArray(item.links) ? item.links : []}
                  onChange={(links) => handleUpdateItem(item.id, { links })}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-6 py-2 px-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add another project</span>
            </button>
          </div>
        )}

        {/* SKILLS */}
        {sectionType === SECTION_TYPES.SKILLS && (
          <div className="space-y-6">
            {/* Missing JD Keywords Quick-Add Bar */}
            {unaddedKeywords.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Missing Skills from Job Description</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Click any keyword to add it directly to your skills:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unaddedKeywords.slice(0, 15).map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => addKeywordToResume(kw)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      <span>{kw}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-2 relative">
                {items.length > 1 && (
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 mb-2">
                    <span className="text-[11px] font-mono text-zinc-400 font-medium">
                      Category #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-zinc-500 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Category Name */}
                <div className="field">
                  <input
                    type="text"
                    value={item.category || ''}
                    onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                    placeholder="Skill Category. Eg: Languages, Cloud & DevOps, Frameworks... *"
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold text-white placeholder:text-zinc-500 py-1"
                    required
                  />
                </div>

                {/* Skills Chips */}
                <div className="field">
                  <TextEditorChips
                    tags={Array.isArray(item.skills) ? item.skills : []}
                    onChange={(skills) => handleUpdateItem(item.id, { skills })}
                    placeholder="Type skill name, press Enter to add..."
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-6 py-2 px-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add another skill category</span>
            </button>
          </div>
        )}

        {/* CERTIFICATIONS */}
        {sectionType === SECTION_TYPES.CERTIFICATIONS && (
          <div className="space-y-8">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-2 relative">
                {items.length > 1 && (
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 mb-2">
                    <span className="text-[11px] font-mono text-zinc-400 font-medium">
                      Certification #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-zinc-500 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Certification Title */}
                <div className="field">
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                    placeholder="Certification Name. Eg: AWS Certified Solutions Architect... *"
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold text-white placeholder:text-zinc-500 py-1"
                    required
                  />
                </div>

                {/* Issuer */}
                <div className="field">
                  <input
                    type="text"
                    value={item.issuer || ''}
                    onChange={(e) => handleUpdateItem(item.id, { issuer: e.target.value })}
                    placeholder="Issuing Organization. Eg: Amazon Web Services, Google..."
                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs font-semibold text-zinc-200 placeholder:text-zinc-500 py-1"
                  />
                </div>

                {/* Date & URL */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 py-0.5">
                  <input
                    type="text"
                    value={item.date || ''}
                    onChange={(e) => handleUpdateItem(item.id, { date: e.target.value })}
                    placeholder="Date Issued (Eg: Feb 2024)"
                    className="w-36 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-0.5"
                  />
                  <span className="text-zinc-600">|</span>
                  <input
                    type="url"
                    value={item.url || ''}
                    onChange={(e) => handleUpdateItem(item.id, { url: e.target.value })}
                    placeholder="Credential URL (https://...)"
                    className="flex-1 min-w-[140px] bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-zinc-200 placeholder:text-zinc-500 py-0.5"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-6 py-2 px-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add another certification</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
