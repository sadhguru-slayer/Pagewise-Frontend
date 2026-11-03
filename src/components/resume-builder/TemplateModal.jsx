'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Check,
  Palette,
  LayoutTemplate,
  Eye,
  FolderOpen,
  Calendar,
  ArrowRight,
  GitBranch,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useResumeStore } from '@/lib/resume/store';
import { RESUME_TEMPLATES } from '@/lib/resume/templates';
import { renderTiptapJson } from '@/lib/resume/renderTiptap';
import { formatRelativeTime } from '@/lib/resume/utils';
import { getContactLineHtml, isPortfolioSection, normalizeFontFamily } from '@/lib/resume/renderDocument';
import { resumesApi } from '@/lib/api';

export default function TemplateModal({ isOpen, onClose }) {
  const router = useRouter();

  const resumeId = useResumeStore((s) => s.resumeId);
  const resumeName = useResumeStore((s) => s.resumeName);
  const header = useResumeStore((s) => s.header);
  const sections = useResumeStore((s) => s.sections);
  const settings = useResumeStore((s) => s.settings);
  const savedResumes = useResumeStore((s) => s.savedResumes);
  const setSavedResumes = useResumeStore((s) => s.setSavedResumes);
  const updateSettings = useResumeStore((s) => s.updateSettings);
  const updateHeader = useResumeStore((s) => s.updateHeader);
  const updateSectionSettings = useResumeStore((s) => s.updateSectionSettings);
  const applyFormatFromResume = useResumeStore((s) => s.applyFormatFromResume);
  const loadResume = useResumeStore((s) => s.loadResume);

  const [activeTab, setActiveTab] = useState('standard');
  const [selectedTemplateId, setSelectedTemplateId] = useState(RESUME_TEMPLATES[0].id);
  const [selectedSavedResumeId, setSelectedSavedResumeId] = useState(null);
  const [isBranching, setIsBranching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function refreshResumes() {
      try {
        const list = await resumesApi.list();
        if (list) {
          setSavedResumes(list);
          if (!selectedSavedResumeId && list.length > 0) {
            setSelectedSavedResumeId(list[0].id);
          }
        }
      } catch (e) {
        // use local store fallback
      }
    }
    refreshResumes();
  }, [isOpen, selectedSavedResumeId, setSavedResumes]);

  useEffect(() => {
    if (savedResumes.length > 0 && !selectedSavedResumeId) {
      setSelectedSavedResumeId(savedResumes[0].id);
    }
  }, [savedResumes, selectedSavedResumeId]);

  if (!isOpen) return null;

  const currentTemplate =
    RESUME_TEMPLATES.find((t) => t.id === selectedTemplateId) || RESUME_TEMPLATES[0];

  const selectedSavedResume =
    savedResumes.find((r) => r.id === selectedSavedResumeId) || savedResumes[0] || null;

  const visibleSections = [...(sections || [])]
    .filter((s) => {
      if (s.visible === false) return false;
      if (isPortfolioSection(s)) {
        const linkCount = s.links?.length || 0;
        if (linkCount > 0 && linkCount <= 3) return false;
      }
      return true;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // ── Option 1: Apply format to current resume ──────────────────────────────
  const handleApplyTemplate = (template) => {
    updateSettings({
      marginTop: template.settings.marginTop,
      marginBottom: template.settings.marginBottom,
      marginLeft: template.settings.marginLeft,
      marginRight: template.settings.marginRight,
      bodyFont: template.settings.bodyFont,
      bodyFontSize: template.settings.bodyFontSize,
      lineHeight: template.settings.lineHeight,
      headingColor: template.settings.headingColor,
      accentColor: template.settings.accentColor,
      sectionSpacing: template.settings.sectionSpacing,
    });

    updateHeader({
      alignment: template.header.alignment,
      nameFont: template.header.nameFont,
      nameFontSize: template.header.nameFontSize,
      nameFontWeight: template.header.nameFontWeight,
      contactFontSize: template.header.contactFontSize,
      contactColor: template.header.contactColor,
      showDivider: template.header.showDivider,
      divider: { ...template.header.divider },
    });

    sections.forEach((sec) => {
      updateSectionSettings(sec.id, {
        headingAlign: template.sectionDefaults.headingAlign,
        showDividerAfterHeading: template.sectionDefaults.showDividerAfterHeading,
        headingBold: template.sectionDefaults.headingBold,
        headingUppercase: template.sectionDefaults.headingUppercase,
        headingUnderline: template.sectionDefaults.headingUnderline,
        headingColor: undefined,
      });
    });

    toast.success(`Applied "${template.name}" format to current resume!`);
    onClose();
  };

  // ── Option 2: Create new resume branch with this format ───────────────────
  const handleCreateNewBranch = async (template) => {
    setIsBranching(true);
    const toastId = toast.loading(`Creating branch with "${template.name}"...`);

    try {
      const branchedHeader = {
        ...header,
        alignment: template.header.alignment,
        nameFont: template.header.nameFont,
        nameFontSize: template.header.nameFontSize,
        nameFontWeight: template.header.nameFontWeight,
        contactFontSize: template.header.contactFontSize,
        contactColor: template.header.contactColor,
        showDivider: template.header.showDivider,
        divider: template.header.divider ? { ...template.header.divider } : header?.divider,
      };

      const branchedSettings = {
        ...settings,
        marginTop: template.settings.marginTop,
        marginBottom: template.settings.marginBottom,
        marginLeft: template.settings.marginLeft,
        marginRight: template.settings.marginRight,
        bodyFont: template.settings.bodyFont,
        bodyFontSize: template.settings.bodyFontSize,
        lineHeight: template.settings.lineHeight,
        headingColor: template.settings.headingColor,
        accentColor: template.settings.accentColor,
        sectionSpacing: template.settings.sectionSpacing,
      };

      const branchedSections = (sections || []).map((sec) => ({
        ...sec,
        headingAlign: template.sectionDefaults.headingAlign,
        showDividerAfterHeading: template.sectionDefaults.showDividerAfterHeading,
        headingBold: template.sectionDefaults.headingBold,
        headingUppercase: template.sectionDefaults.headingUppercase,
        headingUnderline: template.sectionDefaults.headingUnderline,
        headingColor: undefined,
      }));

      const baseName = resumeName || 'Resume';
      const branchName = `${baseName} (${template.name})`;

      const created = await resumesApi.create({
        name: branchName,
        headerJson: branchedHeader,
        settingsJson: branchedSettings,
        sectionsJson: branchedSections,
      });

      loadResume({
        id: created.id,
        name: created.name,
        headerJson: created.header_json,
        settingsJson: created.settings_json,
        sectionsJson: created.sections_json,
        updatedAt: created.updated_at,
      });

      router.replace(`/builder?id=${created.id}`);
      toast.success(`Created new branch "${created.name}"!`, { id: toastId });
      onClose();
    } catch (err) {
      console.error('Failed to create resume branch:', err);
      toast.error('Failed to create branch: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      setIsBranching(false);
    }
  };

  const handleApplySavedFormat = (savedResume) => {
    if (!savedResume) return;
    applyFormatFromResume(savedResume);
    toast.success(`Applied formatting & styling from "${savedResume.name}"!`);
    onClose();
  };

  const handleBranchFromSavedFormat = async (savedResume) => {
    if (!savedResume) return;
    setIsBranching(true);
    const toastId = toast.loading(`Branching with format from "${savedResume.name}"...`);

    try {
      const sHeader = savedResume.headerJson || {};
      const sSettings = savedResume.settingsJson || {};

      const branchedHeader = {
        ...header,
        alignment: sHeader.alignment ?? header.alignment,
        nameFont: sHeader.nameFont ?? header.nameFont,
        nameFontSize: sHeader.nameFontSize ?? header.nameFontSize,
        nameFontWeight: sHeader.nameFontWeight ?? header.nameFontWeight,
        contactFontSize: sHeader.contactFontSize ?? header.contactFontSize,
        contactColor: sHeader.contactColor ?? header.contactColor,
        showDivider: sHeader.showDivider ?? header.showDivider,
        divider: sHeader.divider ? { ...sHeader.divider } : header.divider,
      };

      const branchedSettings = {
        ...settings,
        ...sSettings,
      };

      const baseName = resumeName || 'Resume';
      const branchName = `${baseName} (${savedResume.name} Style)`;

      const created = await resumesApi.create({
        name: branchName,
        headerJson: branchedHeader,
        settingsJson: branchedSettings,
        sectionsJson: sections || [],
      });

      loadResume({
        id: created.id,
        name: created.name,
        headerJson: created.header_json,
        settingsJson: created.settings_json,
        sectionsJson: created.sections_json,
        updatedAt: created.updated_at,
      });

      router.replace(`/builder?id=${created.id}`);
      toast.success(`Created new branch "${created.name}"!`, { id: toastId });
      onClose();
    } catch (err) {
      console.error('Failed to branch from saved format:', err);
      toast.error('Failed to create branch: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      setIsBranching(false);
    }
  };

  const handleOpenSavedResume = async (savedResume) => {
    if (!savedResume) return;
    try {
      const data = await resumesApi.get(savedResume.id);
      loadResume({
        id: data.id,
        name: data.name,
        headerJson: data.header_json,
        settingsJson: data.settings_json,
        sectionsJson: data.sections_json,
        updatedAt: data.updated_at,
      });
      router.replace(`/builder?id=${data.id}`);
      toast.success(`Loaded "${data.name}"`);
    } catch (e) {
      toast.error('Failed to load resume');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-6xl h-[92vh] max-h-[880px] bg-[#0c0e17] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#0f121d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Resume Formats & Templates
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Choose an ATS-optimized industry format. You can apply it to your current resume or branch into a new copy.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#090b12] px-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            className={`py-3 px-4 text-xs font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'standard'
                ? 'border-blue-500 text-blue-400 bg-blue-500/[0.04] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Industry Standards ({RESUME_TEMPLATES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`py-3 px-4 text-xs font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'border-blue-500 text-blue-400 bg-blue-500/[0.04] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>My Saved Resumes & Formats ({savedResumes.length})</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Template List */}
          <div className="w-full lg:w-[420px] xl:w-[460px] border-b lg:border-b-0 lg:border-r border-white/10 bg-[#090b12] flex flex-col shrink-0">
            {activeTab === 'standard' ? (
              <>
                <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  <span>Standard Styles</span>
                  <span className="text-[11px] text-zinc-500">Select to preview</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {RESUME_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;

                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${tmpl.badgeColor}`}
                              >
                                {tmpl.tag}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1.5 truncate">
                              {tmpl.name}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5 font-medium line-clamp-1">
                              {tmpl.category}
                            </p>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-white/10 text-[10px] font-mono text-zinc-400">
                          <span className="bg-white/5 px-2 py-0.5 rounded">
                            Font: {tmpl.settings.bodyFont.split(',')[0]}
                          </span>
                          <span className="bg-white/5 px-2 py-0.5 rounded">
                            Gap: {tmpl.settings.sectionSpacing}pt
                          </span>
                          <span className="bg-white/5 px-2 py-0.5 rounded">
                            Align: {tmpl.header.alignment}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Bottom Action Controls: 2 Options ── */}
                <div className="p-3.5 border-t border-white/10 bg-[#0c0e17] flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isBranching}
                    onClick={() => handleApplyTemplate(currentTemplate)}
                    className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-normal flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                    title="Apply this template's formatting, fonts, and margins directly to your active resume"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Apply to Current</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBranching}
                    onClick={() => handleCreateNewBranch(currentTemplate)}
                    className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-normal flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                    title="Branch this format into a new resume copy, keeping your current resume unchanged"
                  >
                    {isBranching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Branching...</span>
                      </>
                    ) : (
                      <>
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Create New Branch</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  <span>Previously Created Formats</span>
                  <span className="text-[11px] text-zinc-500">{savedResumes.length} saved</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {savedResumes.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-400 space-y-3">
                      <FolderOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="font-medium text-zinc-300">No saved resumes yet</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Whenever you save a resume, its layout, fonts, margins, and styling will
                        appear here as a custom format you can reuse anytime.
                      </p>
                    </div>
                  ) : (
                    savedResumes.map((r) => {
                      const isSelected = selectedSavedResumeId === r.id;
                      const rFont = r.settingsJson?.bodyFont?.split(',')[0] || 'Georgia';
                      const rSpacing = r.settingsJson?.sectionSpacing ?? 12;
                      const rAlign = r.headerJson?.alignment || 'center';

                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedSavedResumeId(r.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5'
                              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-white truncate">
                                {r.name || 'Untitled Resume'}
                              </h3>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1 font-mono">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-zinc-500" />
                                  {formatRelativeTime(r.updatedAt || r.createdAt)}
                                </span>
                                <span>·</span>
                                <span>{r.sectionsJson?.length || 0} sections</span>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-white/10 text-[10px] font-mono text-zinc-400">
                            <span className="bg-white/5 px-2 py-0.5 rounded">Font: {rFont}</span>
                            <span className="bg-white/5 px-2 py-0.5 rounded">Gap: {rSpacing}pt</span>
                            <span className="bg-white/5 px-2 py-0.5 rounded">Align: {rAlign}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedSavedResume && (
                  <div className="p-3.5 border-t border-white/10 bg-[#0c0e17] flex flex-col sm:flex-row items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isBranching}
                      onClick={() => handleApplySavedFormat(selectedSavedResume)}
                      className="w-full flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-normal flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                      title="Apply format & styling of this resume to current content"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>Apply Format</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBranching}
                      onClick={() => handleBranchFromSavedFormat(selectedSavedResume)}
                      className="w-full flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-normal flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                      title="Branch current content with this saved resume format"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Create Branch</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBranching}
                      onClick={() => handleOpenSavedResume(selectedSavedResume)}
                      className="w-full flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs tracking-normal flex items-center justify-center gap-1.5 transition-all border border-white/15 disabled:opacity-50 cursor-pointer"
                      title="Open this saved resume"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Interactive Live Preview with Quick Actions */}
          <div className="flex-1 flex flex-col bg-[#05060a] overflow-hidden">
            <div className="px-5 py-2.5 border-b border-white/10 bg-[#0a0c14] flex items-center justify-between text-xs text-zinc-400 shrink-0 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-mono text-white font-semibold truncate">
                  {activeTab === 'standard'
                    ? `Live Preview: ${currentTemplate.name}`
                    : `Saved Resume: ${selectedSavedResume?.name || 'Preview'}`}
                </span>
              </div>

              {/* Quick Action Buttons in Preview Header */}
              <div className="flex items-center gap-2 shrink-0">
                {activeTab === 'standard' ? (
                  <>
                    <button
                      type="button"
                      disabled={isBranching}
                      onClick={() => handleApplyTemplate(currentTemplate)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Apply format to current resume"
                    >
                      <Palette className="w-3 h-3" />
                      <span className="hidden sm:inline">Apply Format</span>
                      <span className="sm:hidden">Apply</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBranching}
                      onClick={() => handleCreateNewBranch(currentTemplate)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Create new resume branch"
                    >
                      <GitBranch className="w-3 h-3" />
                      <span className="hidden sm:inline">Create Branch</span>
                      <span className="sm:hidden">Branch</span>
                    </button>
                  </>
                ) : selectedSavedResume ? (
                  <>
                    <button
                      type="button"
                      disabled={isBranching}
                      onClick={() => handleApplySavedFormat(selectedSavedResume)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Palette className="w-3 h-3" />
                      <span className="hidden sm:inline">Apply Format</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBranching}
                      onClick={() => handleBranchFromSavedFormat(selectedSavedResume)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <GitBranch className="w-3 h-3" />
                      <span className="hidden sm:inline">Create Branch</span>
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {/* Preview Sheet on Dark Studio Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start bg-[#0e111a]">
              <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&family=Lato:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap"
              />
              <style>{`
                .tiptap-preview p { margin-bottom: 2pt; line-height: inherit; }
                .header-contact-line a {
                  color: inherit;
                  text-decoration: underline;
                }
                .tiptap-preview ul {
                  list-style-type: disc !important;
                  padding-left: 14pt !important;
                  margin-top: 1pt !important;
                  margin-bottom: 2pt !important;
                }
                .tiptap-preview ol {
                  list-style-type: decimal !important;
                  padding-left: 14pt !important;
                  margin-top: 1pt !important;
                  margin-bottom: 2pt !important;
                }
                .tiptap-preview li {
                  display: list-item !important;
                  list-style: inherit !important;
                  margin-bottom: 1pt !important;
                }
                .tiptap-preview li p {
                  display: inline !important;
                  margin-bottom: 0 !important;
                }
              `}</style>

              {activeTab === 'standard' ? (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '700px',
                    minHeight: '880px',
                    padding: `${currentTemplate.settings.marginTop}mm ${currentTemplate.settings.marginRight}mm ${currentTemplate.settings.marginBottom}mm ${currentTemplate.settings.marginLeft}mm`,
                    fontFamily: normalizeFontFamily(currentTemplate.settings.bodyFont),
                    fontSize: `${currentTemplate.settings.bodyFontSize}pt`,
                    lineHeight: currentTemplate.settings.lineHeight,
                    background: '#ffffff',
                    color: '#111827',
                    boxSizing: 'border-box',
                  }}
                  className="shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 rounded-[2px] transition-all text-left"
                >
                  <div style={{ textAlign: currentTemplate.header.alignment, paddingBottom: 6 }}>
                    <h1
                      style={{
                        fontFamily: normalizeFontFamily(currentTemplate.header.nameFont),
                        fontSize: `${currentTemplate.header.nameFontSize}pt`,
                        fontWeight: currentTemplate.header.nameFontWeight,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: currentTemplate.previewColors.header,
                        margin: 0,
                      }}
                    >
                      {header?.name || 'YOUR NAME'}
                    </h1>
                    <div
                      className="header-contact-line"
                      style={{
                        fontSize: `${currentTemplate.header.contactFontSize}pt`,
                        color: currentTemplate.header.contactColor,
                        marginTop: 4,
                        marginBottom: 0,
                        lineHeight: 1.2,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: getContactLineHtml(header, visibleSections) || 'City, Country · email@example.com',
                      }}
                    />
                    {currentTemplate.header.showDivider && currentTemplate.header.divider && (
                      <hr
                        style={{
                          marginTop: currentTemplate.header.divider.marginTop,
                          marginBottom: currentTemplate.header.divider.marginBottom,
                          border: 'none',
                          borderTopWidth: currentTemplate.header.divider.thickness,
                          borderTopStyle: currentTemplate.header.divider.style,
                          borderTopColor: currentTemplate.header.divider.color,
                        }}
                      />
                    )}
                  </div>

                  {visibleSections.map((sec) => (
                    <div
                      key={sec.id}
                      style={{
                        marginBottom: `${currentTemplate.settings.sectionSpacing}pt`,
                        fontFamily: currentTemplate.settings.bodyFont,
                        fontSize: `${currentTemplate.settings.bodyFontSize}pt`,
                        lineHeight: currentTemplate.settings.lineHeight,
                      }}
                    >
                      <div style={{ textAlign: currentTemplate.sectionDefaults.headingAlign }}>
                        <h2
                          style={{
                            fontSize: `${(currentTemplate.settings.bodyFontSize * 1.18).toFixed(1)}pt`,
                            fontWeight: currentTemplate.sectionDefaults.headingBold
                              ? 'bold'
                              : 'normal',
                            color: currentTemplate.settings.headingColor,
                            textTransform: currentTemplate.sectionDefaults.headingUppercase
                              ? 'uppercase'
                              : 'none',
                            textDecoration: currentTemplate.sectionDefaults.headingUnderline
                              ? 'underline'
                              : 'none',
                            letterSpacing: '0.06em',
                            marginBottom: 2,
                            marginTop: 0,
                          }}
                        >
                          {sec.title}
                        </h2>
                        {currentTemplate.sectionDefaults.showDividerAfterHeading && (
                          <hr
                            style={{
                              border: 'none',
                              borderTop: `1px solid ${currentTemplate.settings.headingColor}33`,
                              marginBottom: 3,
                            }}
                          />
                        )}
                      </div>

                      {sec.links?.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 3,
                          }}
                        >
                          {sec.links.map((link) => (
                            <span
                              key={link.id}
                              style={{
                                color: currentTemplate.settings.accentColor,
                                fontSize: `${currentTemplate.settings.bodyFontSize - 1}pt`,
                                textDecoration: 'underline',
                              }}
                            >
                              {link.label || link.url}
                            </span>
                          ))}
                        </div>
                      )}

                      <div
                        className="tiptap-preview"
                        dangerouslySetInnerHTML={{ __html: renderTiptapJson(sec.content) }}
                        style={{ color: currentTemplate.previewColors.text }}
                      />
                    </div>
                  ))}
                </div>
              ) : selectedSavedResume ? (
                (() => {
                  const sSettings = selectedSavedResume.settingsJson || {};
                  const sHeader = selectedSavedResume.headerJson || {};
                  const sSections = (selectedSavedResume.sectionsJson || [])
                    .filter((s) => {
                      if (s.visible === false) return false;
                      if (isPortfolioSection(s)) {
                        const linkCount = s.links?.length || 0;
                        if (linkCount > 0 && linkCount <= 3) return false;
                      }
                      return true;
                    })
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                  return (
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '700px',
                        minHeight: '880px',
                        padding: `${sSettings.marginTop ?? 15}mm ${sSettings.marginRight ?? 15}mm ${sSettings.marginBottom ?? 15}mm ${sSettings.marginLeft ?? 15}mm`,
                        fontFamily: normalizeFontFamily(sSettings.bodyFont || 'Georgia, serif'),
                        fontSize: `${sSettings.bodyFontSize ?? 9}pt`,
                        lineHeight: sSettings.lineHeight ?? 1.3,
                        background: '#ffffff',
                        color: '#111827',
                        boxSizing: 'border-box',
                      }}
                      className="shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 rounded-[2px] transition-all text-left"
                    >
                      <div style={{ textAlign: sHeader.alignment || 'center', paddingBottom: 6 }}>
                        <h1
                          style={{
                            fontFamily: normalizeFontFamily(sHeader.nameFont || 'Georgia, serif'),
                            fontSize: `${sHeader.nameFontSize ?? 22}pt`,
                            fontWeight: sHeader.nameFontWeight || 'bold',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: '#111827',
                            margin: 0,
                          }}
                        >
                          {sHeader.name || selectedSavedResume.name}
                        </h1>
                        <div
                          className="header-contact-line"
                          style={{
                            fontSize: `${sHeader.contactFontSize ?? 9.5}pt`,
                            color: sHeader.contactColor || '#4b5563',
                            marginTop: 3,
                            marginBottom: 0,
                            lineHeight: 1.2,
                          }}
                          dangerouslySetInnerHTML={{
                            __html: getContactLineHtml(sHeader, sSections) || '',
                          }}
                        />
                        {sHeader.showDivider && sHeader.divider && (
                          <hr
                            style={{
                              marginTop: sHeader.divider.marginTop ?? 5,
                              marginBottom: sHeader.divider.marginBottom ?? 5,
                              border: 'none',
                              borderTopWidth: sHeader.divider.thickness ?? 1,
                              borderTopStyle: sHeader.divider.style ?? 'solid',
                              borderTopColor: sHeader.divider.color ?? '#d1d5db',
                            }}
                          />
                        )}
                      </div>

                      {sSections.map((sec) => (
                        <div
                          key={sec.id}
                          style={{
                            marginBottom: `${sSettings.sectionSpacing ?? 4}pt`,
                            fontFamily: sSettings.bodyFont || 'Georgia, serif',
                            fontSize: `${sSettings.bodyFontSize ?? 9}pt`,
                            lineHeight: sSettings.lineHeight ?? 1.3,
                          }}
                        >
                          <div style={{ textAlign: sec.headingAlign || 'left' }}>
                            <h2
                              style={{
                                fontSize: `${((sSettings.bodyFontSize ?? 9) * 1.18).toFixed(1)}pt`,
                                fontWeight: sec.headingBold !== false ? 'bold' : 'normal',
                                color: sec.headingColor || sSettings.headingColor || '#111827',
                                textTransform: sec.headingUppercase !== false ? 'uppercase' : 'none',
                                textDecoration: sec.headingUnderline ? 'underline' : 'none',
                                letterSpacing: '0.06em',
                                marginBottom: 2,
                                marginTop: 0,
                              }}
                            >
                              {sec.title}
                            </h2>
                            {sec.showDividerAfterHeading && (
                              <hr
                                style={{
                                  border: 'none',
                                  borderTop: `1px solid ${sec.headingColor || sSettings.headingColor || '#111827'}33`,
                                  marginBottom: 3,
                                }}
                              />
                            )}
                          </div>

                          {sec.links?.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                                marginBottom: 3,
                              }}
                            >
                              {sec.links.map((link) => (
                                <span
                                  key={link.id}
                                  style={{
                                    color: sSettings.accentColor || '#1a56db',
                                    fontSize: `${(sSettings.bodyFontSize ?? 9) - 1}pt`,
                                    textDecoration: 'underline',
                                  }}
                                >
                                  {link.label || link.url}
                                </span>
                              ))}
                            </div>
                          )}

                          <div
                            className="tiptap-preview"
                            dangerouslySetInnerHTML={{ __html: renderTiptapJson(sec.content) }}
                            style={{ color: '#1f2937' }}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
