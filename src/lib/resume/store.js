'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { defaultHeader, defaultSections, defaultSettings } from './defaults.js';
import { generateId, reorder } from './utils.js';
import { getContactLineHtml } from './renderDocument.js';
import { renderTiptapJson } from './renderTiptap.js';
import { renderStructuredSectionHtml, createDefaultSectionItem, isStructuredSection, getSectionType, convertLegacySectionToStructured } from './sectionSchemas.js';

let _lastSnapshotTime = 0;
const SNAPSHOT_DEBOUNCE_MS = 400;

function createSnapshot(state) {
  try {
    return {
      header: JSON.parse(JSON.stringify(state.header || {})),
      sections: JSON.parse(JSON.stringify(state.sections || [])),
      settings: JSON.parse(JSON.stringify(state.settings || {})),
      resumeName: state.resumeName || 'Untitled Resume',
    };
  } catch (err) {
    return null;
  }
}

function recordHistory(state, force = false) {
  const now = Date.now();
  if (!force && now - _lastSnapshotTime < SNAPSHOT_DEBOUNCE_MS) {
    return {};
  }
  _lastSnapshotTime = now;
  const snap = createSnapshot(state);
  if (!snap) return {};
  const past = [...(state.historyPast || []), snap].slice(-50);
  return {
    historyPast: past,
    historyFuture: [],
    canUndo: true,
    canRedo: false,
  };
}

export const useResumeStore = create(
  subscribeWithSelector((set, get) => ({
    // ─── State ───────────────────────────────────────────────────────────────
    resumeId: null,
    resumeName: 'Untitled Resume',
    header: defaultHeader(),
    sections: defaultSections(),
    settings: defaultSettings(),
    activeSectionId: null,
    targetJobTitle: null,
    targetCompany: null,
    targetJobDescription: null,
    targetAtsScore: null,
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    saveError: null,

    // ─── Undo / Redo History ───────────────────────────────────────────────
    historyPast: [],
    historyFuture: [],
    canUndo: false,
    canRedo: false,

    savedResumes: [],
    setSavedResumes: (list) => set({ savedResumes: list }),

    // ─── Resume meta ─────────────────────────────────────────────────────────
    setResumeId: (id) => set({ resumeId: id }),
    setResumeName: (name) => set({ resumeName: name, isDirty: true }),

    // Load a saved resume into the store
    loadResume: (resume) => {
      const rawSections = resume.sectionsJson || resume.sections_json || defaultSections();
      const normalizedSections = (Array.isArray(rawSections) ? rawSections : [])
        .map((sec, idx) => {
          const type = getSectionType(sec);
          const structured = isStructuredSection(sec);
          let items = sec.items;
          if (structured && (!Array.isArray(items) || items.length === 0)) {
            const converted = convertLegacySectionToStructured(sec);
            items = converted.items && converted.items.length > 0 ? converted.items : [createDefaultSectionItem(type)];
          }
          return {
            ...sec,
            type,
            items: items || [],
            order: sec.order ?? idx,
            visible: sec.visible !== false,
            content: sec.content ?? sec.contentHtml ?? '',
            headingAlign: sec.headingAlign ?? 'left',
            headingBold: sec.headingBold ?? true,
            headingUppercase: sec.headingUppercase ?? true,
            showDividerAfterHeading: sec.showDividerAfterHeading ?? true,
            links: sec.links || [],
          };
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const rawHeader = { ...defaultHeader(), ...(resume.headerJson || resume.header_json || {}) };
      rawHeader.contactLine = getContactLineHtml(rawHeader, normalizedSections);

      set({
        resumeId: resume.id,
        resumeName: resume.name,
        header: rawHeader,
        sections: normalizedSections.length > 0 ? normalizedSections : defaultSections(),
        settings: { ...defaultSettings(), ...(resume.settingsJson || resume.settings_json || {}) },
        activeSectionId: null,
        targetJobTitle: resume.target_job_title || resume.targetJobTitle || null,
        targetCompany: resume.target_company || resume.targetCompany || null,
        targetJobDescription: resume.target_job_description || resume.targetJobDescription || null,
        targetAtsScore: resume.target_ats_score ?? resume.targetAtsScore ?? null,
        activeJdAnalysis: resume.jd_analysis_json && typeof resume.jd_analysis_json === 'object' && Object.keys(resume.jd_analysis_json).length > 0
          ? resume.jd_analysis_json
          : (resume.jd_analysis_json && typeof resume.jd_analysis_json === 'string'
              ? JSON.parse(resume.jd_analysis_json || '{}')
              : null),
        appliedSuggestionKeys: [],
        isDirty: false,
        lastSaved: resume.updatedAt || resume.updated_at,
      });
    },

    // Duplicate current resume into a new unsaved copy
    duplicateCurrentResume: () =>
      set((s) => ({
        resumeId: null,
        resumeName: `${s.resumeName} (Copy)`,
        isDirty: true,
        lastSaved: null,
      })),

    // Apply format/styling from another resume without wiping content
    applyFormatFromResume: (sourceResume) => {
      const srcHeader = sourceResume.headerJson || {};
      const srcSettings = sourceResume.settingsJson || {};
      set((s) => ({
        header: {
          ...s.header,
          alignment: srcHeader.alignment ?? s.header.alignment,
          nameFont: srcHeader.nameFont ?? s.header.nameFont,
          nameFontSize: srcHeader.nameFontSize ?? s.header.nameFontSize,
          nameFontWeight: srcHeader.nameFontWeight ?? s.header.nameFontWeight,
          contactFontSize: srcHeader.contactFontSize ?? s.header.contactFontSize,
          contactColor: srcHeader.contactColor ?? s.header.contactColor,
          showDivider: srcHeader.showDivider ?? s.header.showDivider,
          divider: srcHeader.divider ? { ...srcHeader.divider } : s.header.divider,
        },
        settings: {
          ...s.settings,
          ...srcSettings,
        },
        isDirty: true,
      }));
    },

    // Create a new blank resume
    createNewResume: () =>
      set({
        resumeId: null,
        resumeName: 'Untitled Resume',
        header: defaultHeader(),
        sections: defaultSections(),
        settings: defaultSettings(),
        activeSectionId: null,
        isDirty: true,
        lastSaved: null,
      }),

    // Mark clean after save
    markSaved: (updatedAt) =>
      set({ isDirty: false, isSaving: false, lastSaved: updatedAt, saveError: null }),

    setSaving: (v) => set({ isSaving: v }),
    setSaveError: (err) => set({ saveError: err, isSaving: false }),

        takeSnapshot: (force = true) => {
      set((s) => recordHistory(s, force));
    },

    undo: () => {
      const { historyPast, historyFuture, header, sections, settings, resumeName } = get();
      if (!historyPast || historyPast.length === 0) return;
      const previous = historyPast[historyPast.length - 1];
      const newPast = historyPast.slice(0, -1);
      const current = createSnapshot({ header, sections, settings, resumeName });

      set({
        header: previous.header,
        sections: previous.sections,
        settings: previous.settings,
        resumeName: previous.resumeName,
        historyPast: newPast,
        historyFuture: [current, ...(historyFuture || [])].slice(0, 50),
        canUndo: newPast.length > 0,
        canRedo: true,
        isDirty: true,
      });
    },

    redo: () => {
      const { historyPast, historyFuture, header, sections, settings, resumeName } = get();
      if (!historyFuture || historyFuture.length === 0) return;
      const next = historyFuture[0];
      const newFuture = historyFuture.slice(1);
      const current = createSnapshot({ header, sections, settings, resumeName });

      set({
        header: next.header,
        sections: next.sections,
        settings: next.settings,
        resumeName: next.resumeName,
        historyPast: [...(historyPast || []), current].slice(-50),
        historyFuture: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
        isDirty: true,
      });
    },

    // ─── Header ──────────────────────────────────────────────────────────────
    updateHeader: (patch) =>
      set((s) => ({ ...recordHistory(s, false), header: { ...s.header, ...patch }, isDirty: true })),

    updateHeaderDivider: (patch) =>
      set((s) => ({
        ...recordHistory(s, false),
        header: { ...s.header, divider: { ...s.header.divider, ...patch } },
        isDirty: true,
      })),

    // ─── Settings ────────────────────────────────────────────────────────────
    updateSettings: (patch) =>
      set((s) => ({ ...recordHistory(s, false), settings: { ...s.settings, ...patch }, isDirty: true })),

    // ─── Sections ────────────────────────────────────────────────────────────
    setActiveSectionId: (id) => set({ activeSectionId: id }),

    addSection: (title, type = 'custom', initialItems = null) => {
      const sections = get().sections;
      const structured = isStructuredSection({ type });
      const items = initialItems || (structured ? [createDefaultSectionItem(type)] : []);
      const newSection = {
        id: generateId(),
        title: title || (structured ? (type.charAt(0).toUpperCase() + type.slice(1)) : 'New Section'),
        type: type,
        visible: true,
        order: sections.length,
        items: items,
        content: structured ? '' : { type: 'doc', content: [{ type: 'paragraph' }] },
        contentHtml: structured && items.length > 0 ? renderStructuredSectionHtml({ type, items }, get().settings) : '',
        spacing: 'default',
        dividerAfter: null,
        links: [],
        headingAlign: 'left',
        showDividerAfterHeading: true,
        headingBold: true,
        headingUppercase: true,
        headingUnderline: false,
      };
      set((s) => ({
        ...recordHistory(s, true),
        sections: [...s.sections, newSection],
        activeSectionId: newSection.id,
        isDirty: true,
      }));
      return newSection.id;
    },

    deleteSection: (id) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections
          .filter((sec) => sec.id !== id)
          .map((sec, i) => ({ ...sec, order: i })),
        activeSectionId: s.activeSectionId === id ? null : s.activeSectionId,
        isDirty: true,
      })),

    renameSection: (id, title) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) => (sec.id === id ? { ...sec, title } : sec)),
        isDirty: true,
      })),

    toggleSectionVisibility: (id) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) =>
          sec.id === id ? { ...sec, visible: !sec.visible } : sec
        ),
        isDirty: true,
      })),

    reorderSections: (from, to) =>
      set((s) => ({ ...recordHistory(s, true), sections: reorder(s.sections, from, to), isDirty: true })),

    updateSectionContent: (id, content, contentHtml) =>
      set((s) => ({
        ...recordHistory(s, false),
        sections: s.sections.map((sec) =>
          sec.id === id
            ? {
                ...sec,
                content,
                contentHtml:
                  contentHtml ||
                  (typeof content === 'string' ? content : renderTiptapJson(content)),
              }
            : sec
        ),
        isDirty: true,
      })),

    replaceSections: (nextSections) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: Array.isArray(nextSections) ? nextSections : [],
        isDirty: true,
      })),

    updateSectionItems: (id, items) =>
      set((s) => ({
        ...recordHistory(s, false),
        sections: s.sections.map((sec) =>
          sec.id === id
            ? {
                ...sec,
                items,
                contentHtml: renderStructuredSectionHtml({ ...sec, items }, s.settings),
              }
            : sec
        ),
        isDirty: true,
      })),

    updateSectionItem: (sectionId, itemId, patch) =>
      set((s) => ({
        sections: s.sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const currentItems = sec.items || [];
          const updatedItems = currentItems.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item
          );
          return {
            ...sec,
            items: updatedItems,
            contentHtml: renderStructuredSectionHtml({ ...sec, items: updatedItems }, s.settings),
          };
        }),
        isDirty: true,
      })),

    addSectionItem: (sectionId, newItem) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const currentItems = sec.items || [];
          const updatedItems = [...currentItems, newItem];
          return {
            ...sec,
            items: updatedItems,
            contentHtml: renderStructuredSectionHtml({ ...sec, items: updatedItems }, s.settings),
          };
        }),
        isDirty: true,
      })),

    removeSectionItem: (sectionId, itemId) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const currentItems = sec.items || [];
          const updatedItems = currentItems.filter((item) => item.id !== itemId);
          return {
            ...sec,
            items: updatedItems,
            contentHtml: renderStructuredSectionHtml({ ...sec, items: updatedItems }, s.settings),
          };
        }),
        isDirty: true,
      })),

    reorderSectionItems: (sectionId, fromIndex, toIndex) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const currentItems = [...(sec.items || [])];
          const [moved] = currentItems.splice(fromIndex, 1);
          currentItems.splice(toIndex, 0, moved);
          return {
            ...sec,
            items: currentItems,
            contentHtml: renderStructuredSectionHtml({ ...sec, items: currentItems }, s.settings),
          };
        }),
        isDirty: true,
      })),

    setSectionEditorMode: (sectionId, mode) =>
      set((s) => ({
        sections: s.sections.map((sec) =>
          sec.id === sectionId ? { ...sec, editorMode: mode } : sec
        ),
      })),

    updateSectionSettings: (id, patch) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec)),
        isDirty: true,
      })),

    updateSectionDivider: (id, patch) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) =>
          sec.id === id
            ? {
                ...sec,
                dividerAfter:
                  patch === null
                    ? null
                    : {
                        ...(sec.dividerAfter || {
                          color: '#d1d5db',
                          thickness: 1,
                          marginTop: 2,
                          marginBottom: 2,
                          style: 'solid',
                        }),
                        ...patch,
                      },
              }
            : sec
        ),
        isDirty: true,
      })),

    applyHeadingStyleToAll: (sourceSectionId) =>
      set((s) => {
        const source = s.sections.find((sec) => sec.id === sourceSectionId) || s.sections[0];
        if (!source) return {};
        const headingProps = {
          headingFontSize: source.headingFontSize,
          headingColor: source.headingColor,
          headingBold: source.headingBold,
          headingUnderline: source.headingUnderline,
          headingUppercase: source.headingUppercase,
          headingAlign: source.headingAlign,
          showDividerAfterHeading: source.showDividerAfterHeading,
          headingDividerThickness: source.headingDividerThickness,
          headingDividerStyle: source.headingDividerStyle,
          headingDividerColor: source.headingDividerColor,
          headingDividerMarginTop: source.headingDividerMarginTop,
          headingDividerMarginBottom: source.headingDividerMarginBottom,
        };
        return {
          ...recordHistory(s, true),
          sections: s.sections.map((sec) => ({ ...sec, ...headingProps })),
          isDirty: true,
        };
      }),

    applyDividerAfterToAll: (dividerConfig) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) => ({
          ...sec,
          dividerAfter: dividerConfig ? { ...dividerConfig } : null,
        })),
        isDirty: true,
      })),

    applyUltraCompactPreset: () =>
      set((s) => ({
        ...recordHistory(s, true),
        settings: {
          ...s.settings,
          bodyFontSize: 8.5,
          lineHeight: 1.15,
          sectionSpacing: 1,
          marginTop: 10,
          marginBottom: 10,
          marginLeft: 10,
          marginRight: 10,
        },
        header: {
          ...s.header,
          nameFontSize: 20,
          contactFontSize: 9,
          divider: s.header.divider
            ? { ...s.header.divider, marginTop: 3, marginBottom: 3 }
            : s.header.divider,
        },
        sections: s.sections.map((sec) => ({
          ...sec,
          headingFontSize: sec.headingFontSize || 10,
          headingDividerMarginTop: 1,
          headingDividerMarginBottom: 2,
          dividerAfter: sec.dividerAfter
            ? { ...sec.dividerAfter, marginTop: 2, marginBottom: 2 }
            : sec.dividerAfter,
        })),
        isDirty: true,
      })),

    // ─── Links ───────────────────────────────────────────────────────────────
    addLink: (sectionId, link) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) =>
          sec.id === sectionId
            ? { ...sec, links: [...(sec.links || []), { id: generateId(), ...link }] }
            : sec
        ),
        isDirty: true,
      })),

    updateLink: (sectionId, linkId, patch) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                links: (sec.links || []).map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
              }
            : sec
        ),
        isDirty: true,
      })),

    removeLink: (sectionId, linkId) =>
      set((s) => ({
        ...recordHistory(s, true),
        sections: s.sections.map((sec) =>
          sec.id === sectionId
            ? { ...sec, links: (sec.links || []).filter((l) => l.id !== linkId) }
            : sec
        ),
        isDirty: true,
      })),

    // ─── AI / JD Suggestions ──────────────────────────────────────────────────
    activeJdAnalysis: null,
    appliedSuggestionKeys: [],
    dismissedSuggestionKeys: [],
    highlightedSectionId: null,
    setHighlightedSectionId: (id) => set({ highlightedSectionId: id }),
    setActiveJdAnalysis: (analysis) =>
      set({ activeJdAnalysis: analysis, appliedSuggestionKeys: [], dismissedSuggestionKeys: [] }),
    markSuggestionApplied: (key) =>
      set((s) => ({
        appliedSuggestionKeys: s.appliedSuggestionKeys?.includes(key)
          ? s.appliedSuggestionKeys
          : [...(s.appliedSuggestionKeys || []), key],
      })),
    clearAppliedSuggestions: () => set({ appliedSuggestionKeys: [] }),
    dismissSuggestion: (key) =>
      set((s) => ({
        dismissedSuggestionKeys: s.dismissedSuggestionKeys?.includes(key)
          ? s.dismissedSuggestionKeys
          : [...(s.dismissedSuggestionKeys || []), key],
      })),
    undismissSuggestion: (key) =>
      set((s) => ({
        dismissedSuggestionKeys: (s.dismissedSuggestionKeys || []).filter((k) => k !== key),
      })),
    clearDismissedSuggestions: () => set({ dismissedSuggestionKeys: [] }),

    addKeywordToResume: (keyword) => {
      if (!keyword || typeof keyword !== 'string') return null;
      const kwTrimmed = keyword.trim();
      const state = get();

      // Guard: ONLY target sections dedicated to Skills (never Languages alone, Experience, or Education)
      let targetSec = state.sections.find(
        (s) =>
          s.type === 'skills' ||
          s.title?.toLowerCase().includes('skill') ||
          s.id?.toLowerCase().includes('skill')
      );

      // If no skills section exists, find or create one specifically for Skills
      if (!targetSec) {
        const newSecId = generateId('sec');
        targetSec = {
          id: newSecId,
          type: 'skills',
          title: 'Technical Skills',
          visible: true,
          order: state.sections.length,
          items: [
            {
              id: generateId('item'),
              category: 'Technical Skills',
              skills: [kwTrimmed],
            },
          ],
        };
        const updatedSecHtml = renderStructuredSectionHtml(targetSec, state.settings);
        targetSec.content = updatedSecHtml;
        targetSec.contentHtml = updatedSecHtml;

        set((s) => ({
          ...recordHistory(s, true),
          sections: [...s.sections, targetSec],
          isDirty: true,
        }));
        return {
          sectionId: targetSec.id,
          sectionTitle: targetSec.title,
        };
      }

      let currentHtml = '';
      if (typeof targetSec.content === 'string' && targetSec.content.trim()) {
        currentHtml = targetSec.content.trim();
      } else if (targetSec.content && typeof targetSec.content === 'object') {
        currentHtml = renderTiptapJson(targetSec.content).trim();
      } else if (targetSec.contentHtml && typeof targetSec.contentHtml === 'string') {
        currentHtml = targetSec.contentHtml.trim();
      }

      let updatedHtml = '';
      let updatedItems = targetSec.items;

      if (Array.isArray(targetSec.items) && targetSec.items.length > 0) {
        // Smart category placement: if category is 'Languages' and keyword is clearly not a language,
        // prefer 'Cloud & DevOps', 'Tools', 'Frameworks' or general skills category
        const isLikelyDevOpsOrTool = /kubernetes|docker|aws|gcp|azure|ci\/cd|terraform|ansible|git|linux|helm/i.test(kwTrimmed);
        let targetCategoryIndex = 0;

        if (isLikelyDevOpsOrTool) {
          const devOpsIdx = targetSec.items.findIndex((it) =>
            /cloud|devops|tools|infrastructure|platform/i.test(it.category || '')
          );
          if (devOpsIdx !== -1) {
            targetCategoryIndex = devOpsIdx;
          } else {
            // If the first category is exclusively 'Languages', look for a non-languages category
            const nonLangIdx = targetSec.items.findIndex(
              (it) => !/^(languages?|programming languages?)$/i.test((it.category || '').trim())
            );
            if (nonLangIdx !== -1) {
              targetCategoryIndex = nonLangIdx;
            }
          }
        }

        updatedItems = targetSec.items.map((it, idx) => {
          if (idx === targetCategoryIndex) {
            const currentSkills = Array.isArray(it.skills) ? [...it.skills] : [];
            if (!currentSkills.some((s) => s.toLowerCase() === kwTrimmed.toLowerCase())) {
              return { ...it, skills: [...currentSkills, kwTrimmed] };
            }
          }
          return it;
        });
        updatedHtml = renderStructuredSectionHtml({ ...targetSec, items: updatedItems }, state.settings);
      } else if (!currentHtml) {
        updatedHtml = `<p>${kwTrimmed}</p>`;
      } else if (currentHtml.includes('</ul>')) {
        const lastUl = currentHtml.lastIndexOf('</ul>');
        updatedHtml = currentHtml.slice(0, lastUl) + `<li>${kwTrimmed}</li>` + currentHtml.slice(lastUl);
      } else if (currentHtml.includes('</ol>')) {
        const lastOl = currentHtml.lastIndexOf('</ol>');
        updatedHtml = currentHtml.slice(0, lastOl) + `<li>${kwTrimmed}</li>` + currentHtml.slice(lastOl);
      } else if (currentHtml.includes('</p>')) {
        const lastP = currentHtml.lastIndexOf('</p>');
        const beforeP = currentHtml.slice(0, lastP).trim();
        const sep = beforeP.endsWith(':') || beforeP.endsWith(',') ? ' ' : ', ';
        updatedHtml = beforeP + sep + kwTrimmed + '</p>' + currentHtml.slice(lastP + 4);
      } else {
        updatedHtml = `<p>${currentHtml}, ${kwTrimmed}</p>`;
      }

      set((s) => {
        const updatedSections = s.sections.map((sec) =>
          sec.id === targetSec.id
            ? {
                ...sec,
                items: updatedItems,
                content: updatedHtml,
                contentHtml: updatedHtml,
              }
            : sec
        );

        let updatedAnalysis = s.activeJdAnalysis;
        if (updatedAnalysis?.ats_check) {
          const ats = { ...updatedAnalysis.ats_check };
          const missing = (ats.missing_keywords || []).filter(
            (k) => k.toLowerCase().trim() !== kwTrimmed.toLowerCase()
          );
          const recommended = (ats.recommended_keywords || []).filter(
            (k) => k.toLowerCase().trim() !== kwTrimmed.toLowerCase()
          );
          const matched = [
            ...new Set([...(ats.matched_keywords || []), kwTrimmed]),
          ];
          ats.missing_keywords = missing;
          ats.recommended_keywords = recommended;
          ats.matched_keywords = matched;
          updatedAnalysis = { ...updatedAnalysis, ats_check: ats };
        }

        return {
          ...recordHistory(s, true),
          sections: updatedSections,
          activeJdAnalysis: updatedAnalysis,
          isDirty: true,
        };
      });

      return {
        sectionId: targetSec.id,
        sectionTitle: targetSec.title || 'Skills',
      };
    },
  }))
);
