'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Target,
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
  Eye,
  Check,
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

// ── Auto-Resizing Bullet Textarea ────────────────────────────────────────────
function AutoResizeBulletTextarea({
  id,
  value,
  onChange,
  onKeyDown,
  placeholder,
  isHighlighted,
  isAppliedFlash,
}) {
  const textareaRef = useRef(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(26, el.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={textareaRef}
      id={id}
      value={value}
      onChange={(e) => {
        onChange(e);
        resize();
      }}
      onInput={resize}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      className={`flex-1 outline-none text-xs text-zinc-100 placeholder:text-zinc-600 resize-none leading-relaxed py-1 px-1.5 rounded-md transition-all duration-300 overflow-hidden ${
        isAppliedFlash
          ? 'ring-2 ring-emerald-500 bg-emerald-500/20 border border-emerald-500/60 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
          : isHighlighted
          ? 'ring-2 ring-[#D49A6A] bg-[#D49A6A]/20 border border-[#D49A6A]/50 shadow-[0_0_16px_rgba(212,154,106,0.45)]'
          : 'bg-transparent border-none focus:outline-none focus:ring-0'
      }`}
    />
  );
}

// ── Deterministic & Greedy 1-to-1 Mapping of Wiser Suggestions to Exact Bullet Points ────────
function mapSuggestionsToBullets(bullets = [], suggestions = [], currentItemId = null) {
  if (!bullets.length || !suggestions.length) return {};

  const clean = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/<[^>]+>/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const getTokens = (str) => new Set(clean(str).split(' ').filter((w) => w.length >= 3));

  const matchedBullets = new Set();
  const matchedSugKeys = new Set();
  const bulletMap = {};

  // Step 1: Explicit matching by item_id and point_index if provided by LLM
  suggestions.forEach((sug) => {
    if (!sug) return;
    const sugKey = sug.id || sug.original_text;
    if (
      currentItemId &&
      sug.item_id === currentItemId &&
      typeof sug.point_index === 'number' &&
      sug.point_index >= 0 &&
      sug.point_index < bullets.length
    ) {
      if (!matchedBullets.has(sug.point_index) && !matchedSugKeys.has(sugKey)) {
        matchedBullets.add(sug.point_index);
        matchedSugKeys.add(sugKey);
        bulletMap[sug.point_index] = sug;
      }
    }
  });

  // Step 2: Content-based fuzzy matching for remaining suggestions
  const candidates = [];
  suggestions.forEach((sug) => {
    if (!sug) return;
    const sugKey = sug.id || sug.original_text;
    if (matchedSugKeys.has(sugKey)) return;

    // If suggestion is explicitly tagged for a different item_id, skip it
    if (sug.item_id && currentItemId && sug.item_id !== currentItemId) return;

    const origText = sug.original_text || '';
    const origClean = clean(origText);
    if (!origClean || origClean.length < 8) return;
    const origTokens = getTokens(origText);

    bullets.forEach((bullet, bIdx) => {
      if (matchedBullets.has(bIdx)) return;
      const bulletClean = clean(bullet);
      if (!bulletClean || bulletClean.length < 8) return;

      let score = 0;
      if (bulletClean === origClean) {
        score = 1.0;
      } else if (bulletClean.includes(origClean) || origClean.includes(bulletClean)) {
        score = 0.90;
      } else if (origTokens.size > 0) {
        const bulletTokens = getTokens(bullet);
        let common = 0;
        origTokens.forEach((t) => {
          if (bulletTokens.has(t)) common++;
        });
        const overlap = common / Math.min(origTokens.size, bulletTokens.size);
        if (overlap >= 0.35) {
          score = 0.70 + 0.30 * overlap;
        }
      }

      if (score >= 0.40) {
        candidates.push({ sug, bIdx, score });
      }
    });
  });

  candidates.sort((a, b) => b.score - a.score);

  candidates.forEach(({ sug, bIdx }) => {
    const sugKey = sug.id || sug.original_text;
    if (!matchedBullets.has(bIdx) && !matchedSugKeys.has(sugKey)) {
      matchedBullets.add(bIdx);
      matchedSugKeys.add(sugKey);
      bulletMap[bIdx] = sug;
    }
  });

  return bulletMap;
}

// ── Text-Editor Style Bullet Points List with Inline AI Upgrades ─────────────
function TextEditorBulletList({
  itemId,
  highlightedBulletIdx = null,
  appliedFlashIdx = null,
  bullets = [],
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
  onChange,
  placeholder = 'List things you did, press Enter to add new list... *',
}) {
  const [newBulletText, setNewBulletText] = useState('');
  const newBulletInputRef = useRef(null);

  // Map suggestions to bullets strictly 1-to-1 so a suggestion is never replicated across points
  const bulletSuggestionMap = useMemo(
    () => mapSuggestionsToBullets(bullets, suggestions, itemId),
    [bullets, suggestions, itemId]
  );

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
        const nextInput = document.getElementById(`bullet-input-${itemId || 'default'}-${idx + 1}`);
        if (nextInput) nextInput.focus();
      }, 30);
    } else if (e.key === 'Backspace' && !bullets[idx] && bullets.length > 1) {
      e.preventDefault();
      const updated = bullets.filter((_, i) => i !== idx);
      onChange(updated);
      setTimeout(() => {
        const prevInput = document.getElementById(`bullet-input-${itemId || 'default'}-${Math.max(0, idx - 1)}`);
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
          {bullets.map((bullet, idx) => {
            const matchingSug = bulletSuggestionMap[idx];

            return (
              <li key={idx} className="group pl-1 text-xs">
                <div className="flex items-start gap-2">
                  <AutoResizeBulletTextarea
                    id={`bullet-input-${itemId || 'default'}-${idx}`}
                    value={bullet}
                    onChange={(e) => handleBulletChange(idx, e.target.value)}
                    onKeyDown={(e) => handleExistingBulletKeyDown(e, idx)}
                    placeholder="Describe accomplishment or responsibility..."
                    isHighlighted={highlightedBulletIdx === idx}
                    isAppliedFlash={appliedFlashIdx === idx}
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

                {/* Inline Wiser AI Suggestion Chip (Appears ONLY on the matched point) */}
                {matchingSug && (
                  <div className="mt-1.5 mb-2 ml-1 p-2.5 rounded-xl bg-[#111420] border border-amber-500/35 text-xs text-zinc-200 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                          💡 Wiser AI Upgrade
                        </span>
                        {matchingSug.change_type && (
                          <span className="text-[9px] font-mono text-zinc-400 uppercase">
                            {matchingSug.change_type.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onApplySuggestion?.(itemId, idx, matchingSug)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/60 transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                          title="Apply this enhancement to this point & dismiss"
                        >
                          <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                          <span>Apply</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismissSuggestion?.(matchingSug)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                          title="Dismiss / Reject this suggestion"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div
                      className="text-zinc-200 text-xs leading-relaxed pl-2 border-l-2 border-amber-500/40 font-sans"
                      dangerouslySetInnerHTML={{
                        __html: matchingSug.enhanced_html || matchingSug.enhanced_text || matchingSug.original_text,
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
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

  const section = activeSectionId ? sections.find((s) => s.id === activeSectionId) : null;
  const sectionType = section ? getSectionType(section) : null;
  const isStructured = section ? isStructuredSection(section) : false;

  const [showJdPanel, setShowJdPanel] = useState(false);
  const [highlightedTarget, setHighlightedTarget] = useState(null); // { itemId, bulletIdx, ts }
  const [appliedFlashTarget, setAppliedFlashTarget] = useState(null); // { itemId, bulletIdx, ts }

  useEffect(() => {
    if (highlightedTarget) {
      const timer = setTimeout(() => {
        setHighlightedTarget(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedTarget]);

  useEffect(() => {
    if (appliedFlashTarget) {
      const timer = setTimeout(() => {
        setAppliedFlashTarget(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [appliedFlashTarget]);

  // Clear highlight timer
  const isHighlighted = Boolean(highlightedSectionId && highlightedSectionId === activeSectionId);
  useEffect(() => {
    if (isHighlighted) {
      setShowJdPanel(true);
      const timer = setTimeout(() => {
        setHighlightedSectionId?.(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, setHighlightedSectionId]);

  // Ensure structured sections have initialized items without marking dirty
  useEffect(() => {
    if (!section || !isStructured) return;
    if (!Array.isArray(section.items) || section.items.length === 0) {
      const converted = convertLegacySectionToStructured(section);
      const itemsToSet = converted.items && converted.items.length > 0
        ? converted.items
        : [createDefaultSectionItem(sectionType)];
      useResumeStore.setState((s) => ({
        sections: s.sections.map((sec) => sec.id === section.id ? { ...sec, items: itemsToSet } : sec)
      }));
    }
  }, [section?.id, isStructured, sectionType]);

  if (!activeSectionId || !section) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b0c13] text-zinc-500">
        <Layers className="w-8 h-8 mb-2 text-zinc-600" />
        <p className="text-sm font-semibold text-zinc-300">No Section Selected</p>
        <p className="text-xs mt-1 text-zinc-500 max-w-xs">
          Click any section directly on the resume canvas to edit, or select a section from the left navigation panel.
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
    updateSectionItem(activeSectionId, itemId, patch);
  };

  const handleAddItem = () => {
    addSectionItem(activeSectionId, createDefaultSectionItem(sectionType));
  };

  const handleRemoveItem = (itemId) => {
    if (items.length <= 1) {
      updateSectionItem(activeSectionId, itemId, createDefaultSectionItem(sectionType));
      toast('Reset to blank item', { icon: 'ℹ️' });
    } else {
      removeSectionItem(activeSectionId, itemId);
    }
  };

  const handleReorderItems = (fromIdx, toIdx) => {
    reorderSectionItems(activeSectionId, fromIdx, toIdx);
  };

  // JD Suggestions
  const currentSectionEnhancements = activeJdAnalysis?.section_enhancements?.find(
    (s) =>
      s.section_id === activeSectionId ||
      s.section_title?.toLowerCase().trim() === section?.title?.toLowerCase().trim()
  );
  const suggestions = currentSectionEnhancements?.suggestions || [];
  const missingKeywords = activeJdAnalysis?.ats_check?.missing_keywords || [];
  const recommendedKeywords = activeJdAnalysis?.ats_check?.recommended_keywords || [];
  const unaddedKeywords = Array.from(new Set([...missingKeywords, ...recommendedKeywords]));

  const getSuggestionKey = (sug) => {
    if (!sug) return '';
    if (sug.id) return String(sug.id);
    const textSig = (sug.original_text || sug.enhanced_html || sug.enhanced_text || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
    return `${activeSectionId}-${textSig}`;
  };

  const isSuggestionDismissed = (sug) => {
    const key = getSuggestionKey(sug);
    return dismissedSuggestionKeys.includes(key) || appliedSuggestionKeys.includes(key);
  };

  const activeSuggestions = suggestions.filter((sug) => !isSuggestionDismissed(sug));

  const isSuggestionApplied = (sug) => {
    const key = getSuggestionKey(sug);
    return appliedSuggestionKeys.includes(key);
  };

  const handleLocateSuggestion = (sug) => {
    const origText = (sug?.original_text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    let foundItemId = null;
    let foundBulletIdx = -1;

    if (origText) {
      items.forEach((it) => {
        if (Array.isArray(it.points)) {
          it.points.forEach((pt, bIdx) => {
            if (foundBulletIdx === -1 && pt.toLowerCase().includes(origText.slice(0, 25))) {
              foundItemId = it.id;
              foundBulletIdx = bIdx;
            }
          });
        }
      });
    }

    if (foundItemId === null && items.length > 0) {
      foundItemId = items[0].id;
      foundBulletIdx = 0;
    }

    if (foundItemId !== null && foundBulletIdx !== -1) {
      setHighlightedTarget({ itemId: foundItemId, bulletIdx: foundBulletIdx, ts: Date.now() });
      setTimeout(() => {
        const el = document.getElementById(`bullet-input-${foundItemId}-${foundBulletIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }, 60);
      toast('Target bullet located & highlighted', { icon: '🎯' });
    } else {
      toast.error('Could not locate original bullet in this section.');
    }
  };

  const handleApplySuggestion = (sug) => {
    const key = getSuggestionKey(sug);
    const cleanText = (sug.enhanced_html || sug.enhanced_text || sug.original_text || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const origWords = (sug.original_text || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    let replaced = false;
    let targetItemId = null;
    let targetBulletIdx = -1;
    let bestScore = 0;

    // Find best matching item and bullet index across all items
    items.forEach((it) => {
      if (Array.isArray(it.points)) {
        it.points.forEach((pt, bIdx) => {
          const ptClean = pt.toLowerCase();
          const origClean = (sug.original_text || '').toLowerCase().trim();
          if (origClean && (ptClean.includes(origClean) || origClean.includes(ptClean))) {
            targetItemId = it.id;
            targetBulletIdx = bIdx;
            bestScore = 1.0;
            return;
          }
          if (origWords.length > 0) {
            const matchedCount = origWords.filter((w) => ptClean.includes(w)).length;
            const score = matchedCount / origWords.length;
            if (score > 0.35 && score > bestScore) {
              bestScore = score;
              targetItemId = it.id;
              targetBulletIdx = bIdx;
            }
          }
        });
      }
    });

    if (targetItemId && targetBulletIdx !== -1) {
      const enhancedRaw = sug.enhanced_html || sug.enhanced_text || cleanText;
      const liMatches = enhancedRaw.match(/<li[^>]*>(.*?)<\/li>/gi);
      let replacementPoints = [];
      if (liMatches && liMatches.length > 0) {
        replacementPoints = liMatches.map((m) =>
          m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        ).filter(Boolean);
      } else {
        replacementPoints = [cleanText];
      }

      const updatedItems = items.map((it) => {
        if (it.id === targetItemId && Array.isArray(it.points)) {
          const nextPoints = [...it.points];
          nextPoints.splice(targetBulletIdx, 1, ...replacementPoints);
          return { ...it, points: nextPoints };
        }
        return it;
      });
      updateSectionItems(activeSectionId, updatedItems);
      markSuggestionApplied?.(key);
      dismissSuggestion?.(key);
      setAppliedFlashTarget({ itemId: targetItemId, bulletIdx: targetBulletIdx, ts: Date.now() });
      setTimeout(() => {
        const el = document.getElementById(`bullet-input-${targetItemId}-${targetBulletIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }, 60);
      toast.success('Applied upgrade to bullet!', { icon: '✅' });
      return;
    }

    const firstItem = { ...updatedItems[0] };
    const newIdx = (firstItem.points || []).length;
    firstItem.points = [...(firstItem.points || []).filter(Boolean), cleanText];
    updatedItems[0] = firstItem;

    updateSectionItems(activeSectionId, updatedItems);
    markSuggestionApplied?.(key);
    dismissSuggestion?.(key);
    setAppliedFlashTarget({ itemId: firstItem.id, bulletIdx: newIdx, ts: Date.now() });
    setTimeout(() => {
      const el = document.getElementById(`bullet-input-${firstItem.id}-${newIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 60);
    toast.success('Added recommendation to bullet list!', { icon: '✅' });
  };

  const handleApplyInlineSuggestion = (itemId, bulletIdx, sug) => {
    const key = getSuggestionKey(sug);
    const enhancedRaw = sug.enhanced_html || sug.enhanced_text || sug.original_text || '';
    
    // Parse discrete points if multiple <li> or <p> tags are present
    const liMatches = enhancedRaw.match(/<li[^>]*>(.*?)<\/li>/gi);
    let replacementPoints = [];
    if (liMatches && liMatches.length > 0) {
      replacementPoints = liMatches.map((m) =>
        m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      ).filter(Boolean);
    } else {
      const cleanSingle = enhancedRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanSingle) replacementPoints = [cleanSingle];
    }

    if (!replacementPoints.length) return;

    const updatedItems = items.map((it) => {
      if (it.id === itemId && Array.isArray(it.points)) {
        const nextPoints = [...it.points];
        // Splice in discrete individual points so 1 bullet never becomes a merged multi-bullet paragraph!
        nextPoints.splice(bulletIdx, 1, ...replacementPoints);
        return { ...it, points: nextPoints };
      }
      return it;
    });

    updateSectionItems(activeSectionId, updatedItems);
    markSuggestionApplied?.(key);
    dismissSuggestion?.(key);
    setAppliedFlashTarget({ itemId, bulletIdx, ts: Date.now() });
    toast.success(
      replacementPoints.length > 1
        ? `Expanded into ${replacementPoints.length} individual bullet points!`
        : 'Applied upgrade to point!',
      { icon: '✅' }
    );
  };

  const handleDismissInlineSuggestion = (sug) => {
    const key = getSuggestionKey(sug);
    dismissSuggestion?.(key);
    toast('Suggestion dismissed', { icon: '🗑️' });
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
            onChange={(e) => renameSection(activeSectionId, e.target.value)}
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
              onChange={(e) => updateSectionSettings(activeSectionId, { headingFontSize: Number(e.target.value) })}
              className="w-9 bg-transparent text-[11px] text-zinc-200 font-mono text-center focus:outline-none"
            />
            <span className="text-[9px] text-zinc-500 font-mono">pt</span>
          </div>

          <div className="w-px h-3.5 bg-zinc-800" />

          {/* Heading Bold */}
          <button
            type="button"
            onClick={() => updateSectionSettings(activeSectionId, { headingBold: section.headingBold === false })}
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
            onClick={() => updateSectionSettings(activeSectionId, { headingUnderline: !section.headingUnderline })}
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
            onClick={() => updateSectionSettings(activeSectionId, { headingAlign: 'left' })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              !section.headingAlign || section.headingAlign === 'left' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Align Heading Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => updateSectionSettings(activeSectionId, { headingAlign: 'center' })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              section.headingAlign === 'center' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Align Heading Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => updateSectionSettings(activeSectionId, { headingAlign: 'right' })}
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
            onClick={() => updateSectionSettings(activeSectionId, { showDividerAfterHeading: !section.showDividerAfterHeading })}
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
                updateSectionDivider(activeSectionId, null);
              } else {
                updateSectionDivider(activeSectionId, {
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

      {/* ── Active Wiser AI Recommendations Banner (Discreet counter; cards sit directly on each bullet) ─ */}
      {activeSuggestions.length > 0 && (
        <div className="bg-[#12141D] border-b border-[#D49A6A]/20 px-4 py-2 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-[#D49A6A]" />
            <span className="text-xs font-semibold text-[#D49A6A]">
              {activeSuggestions.length} Wiser AI {activeSuggestions.length === 1 ? 'Upgrade' : 'Upgrades'} Available
            </span>
            <span className="text-[10px] text-zinc-400 font-normal">
              — Review inline on each bullet point below
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              activeSuggestions.forEach((s) => handleApplySuggestion(s));
            }}
            className="px-2.5 py-1 rounded bg-[#D49A6A]/15 hover:bg-[#D49A6A]/25 border border-[#D49A6A]/30 text-[#D49A6A] text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            <span>Apply All ({activeSuggestions.length})</span>
          </button>
        </div>
      )}

      {/* ── Document-Style Form Body ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-w-[680px] mx-auto w-full">
        {/* WORK EXPERIENCE */}
        {sectionType === SECTION_TYPES.EXPERIENCE && (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-1 relative">
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
                    itemId={item.id}
                    highlightedBulletIdx={highlightedTarget?.itemId === item.id ? highlightedTarget.bulletIdx : null}
                    appliedFlashIdx={appliedFlashTarget?.itemId === item.id ? appliedFlashTarget.bulletIdx : null}
                    bullets={Array.isArray(item.points) ? item.points : []}
                    suggestions={activeSuggestions}
                    onApplySuggestion={handleApplyInlineSuggestion}
                    onDismissSuggestion={handleDismissInlineSuggestion}
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
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-1 relative">
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
                    itemId={item.id}
                    highlightedBulletIdx={highlightedTarget?.itemId === item.id ? highlightedTarget.bulletIdx : null}
                    appliedFlashIdx={appliedFlashTarget?.itemId === item.id ? appliedFlashTarget.bulletIdx : null}
                    bullets={Array.isArray(item.points) ? item.points : []}
                    suggestions={activeSuggestions}
                    onApplySuggestion={handleApplyInlineSuggestion}
                    onDismissSuggestion={handleDismissInlineSuggestion}
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
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-1 relative">
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
                    itemId={item.id}
                    highlightedBulletIdx={highlightedTarget?.itemId === item.id ? highlightedTarget.bulletIdx : null}
                    appliedFlashIdx={appliedFlashTarget?.itemId === item.id ? appliedFlashTarget.bulletIdx : null}
                    bullets={Array.isArray(item.points) ? item.points : []}
                    suggestions={activeSuggestions}
                    onApplySuggestion={handleApplyInlineSuggestion}
                    onDismissSuggestion={handleDismissInlineSuggestion}
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
                  <Target className="w-3.5 h-3.5 text-amber-400" />
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
              <div key={item.id || idx} className="space-y-1 relative">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 mb-2">
                  <span className="text-[11px] font-mono text-zinc-400 font-medium">
                    Category #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-zinc-500 hover:text-rose-400 text-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Remove this skill category"
                  >
                    <span>Remove</span>
                  </button>
                </div>

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
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-1 relative">
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
