'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Edit3,
  Check,
  LayoutTemplate,
  Sliders,
  Type,
  Maximize2,
  Minimize2,
  X,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  PanelRightClose,
  PanelRightOpen,
  Layers,
  Heading,
  Settings,
  Upload,
  Target,
  CreditCard,
  Receipt,
  Bookmark,
  BookmarkPlus,
  MoreVertical,
  Download,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { resumesApi, templatesApi, paymentsApi } from '@/lib/api';
import { useResumeStore } from '@/lib/resume/store';
import { BrandLogo, BRAND_CONFIG } from '@/lib/brand';
import SectionManager from '@/components/resume-builder/SectionManager';
import SectionTitleStyleEditor from '@/components/resume-builder/SectionTitleStyleEditor';
import ResumeRichEditor from '@/components/resume-builder/ResumeRichEditor';
import ResumeHeaderEditor from '@/components/resume-builder/ResumeHeaderEditor';
import PageSettingsEditor from '@/components/resume-builder/PageSettingsEditor';
import SectionDividerEditor from '@/components/resume-builder/SectionDividerEditor';
import LinkManager from '@/components/resume-builder/LinkManager';
import ResumePreview from '@/components/resume-builder/ResumePreview';
import ExportMenu from '@/components/resume-builder/ExportMenu';
import TemplateModal from '@/components/resume-builder/TemplateModal';
import ImportPdfModal from '@/components/resume-builder/ImportPdfModal';
import JDAnalyzerModal from '@/components/resume-builder/JDAnalyzerModal';
import PricingModal from '@/components/pricing/PricingModal';
import MobileNotice from '@/components/layout/MobileNotice';

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeQueryId = searchParams.get('id');

  const { isAuthenticated, loading: authLoading } = useAuth();

  const isDirty = useResumeStore((s) => s.isDirty);
  const isSaving = useResumeStore((s) => s.isSaving);
  const lastSaved = useResumeStore((s) => s.lastSaved);
  const resumeId = useResumeStore((s) => s.resumeId);
  const resumeName = useResumeStore((s) => s.resumeName);
  const sections = useResumeStore((s) => s.sections);
  const header = useResumeStore((s) => s.header);
  const settings = useResumeStore((s) => s.settings);
  const setSaving = useResumeStore((s) => s.setSaving);
  const markSaved = useResumeStore((s) => s.markSaved);
  const setSaveError = useResumeStore((s) => s.setSaveError);
  const setResumeId = useResumeStore((s) => s.setResumeId);
  const setResumeName = useResumeStore((s) => s.setResumeName);
  const loadResume = useResumeStore((s) => s.loadResume);
  const activeSectionId = useResumeStore((s) => s.activeSectionId);
  const setActiveSectionId = useResumeStore((s) => s.setActiveSectionId);

  const saveTimeoutRef = useRef(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [leftTab, setLeftTab] = useState('sections'); // 'sections' | 'header' | 'settings'
  const [mobileView, setMobileView] = useState('editor'); // 'editor' | 'preview'
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isJdModalOpen, setIsJdModalOpen] = useState(false);
  const [isStudioMenuOpen, setIsStudioMenuOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const studioMenuRef = useRef(null);

  const fetchPlan = useCallback(async () => {
    try {
      const p = await paymentsApi.getStatus();
      setPlanStatus(p);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleSetMasterFromBuilder = async () => {
    if (!resumeId) return;
    try {
      await resumesApi.setPrimary(resumeId);
      setIsLocked(false);
      setIsPrimary(true);
      toast.success('Resume promoted to Primary Master! Editing enabled.');
      fetchPlan();
    } catch (err) {
      toast.error(err.message || 'Failed to set as master resume');
    }
  };

  // Close studio quick menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (studioMenuRef.current && !studioMenuRef.current.contains(event.target)) {
        setIsStudioMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Save-as-Template modal state ─────────────────────────────────────────
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // ─── Panel Widths & Collapsing States ──────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(310);
  const [editorWidth, setEditorWidth] = useState(440);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);

  // Dragging indicators
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingEditor, setIsDraggingEditor] = useState(false);

  // ─── Authentication Check ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // ─── Load Resume Data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchResume() {
      setInitialLoading(true);
      try {
        if (resumeQueryId) {
          const data = await resumesApi.get(resumeQueryId);
          setIsLocked(Boolean(data.is_locked));
          setIsPrimary(Boolean(data.is_primary));
          loadResume({
            id: data.id,
            name: data.name,
            headerJson: data.header_json,
            settingsJson: data.settings_json,
            sectionsJson: data.sections_json,
            target_job_title: data.target_job_title,
            target_company: data.target_company,
            target_job_description: data.target_job_description,
            target_ats_score: data.target_ats_score,
            jd_analysis_json: data.jd_analysis_json,
            updatedAt: data.updated_at,
          });
        } else {
          const list = await resumesApi.list();
          if (list && list.length > 0) {
            router.replace(`/builder?id=${list[0].id}`);
            return;
          } else {
            const created = await resumesApi.create({
              name: 'My Professional Resume',
            });
            router.replace(`/builder?id=${created.id}`);
            return;
          }
        }
      } catch (err) {
        toast.error('Failed to load resume: ' + err.message);
      } finally {
        setInitialLoading(false);
      }
    }

    fetchResume();
  }, [resumeQueryId, isAuthenticated, loadResume, router]);

  // Open Wiser AI modal if triggered via URL param (e.g. from Dashboard)
  const wiserParam = searchParams.get('wiser');
  useEffect(() => {
    if ((wiserParam === 'true' || wiserParam === 'ats') && !initialLoading) {
      setIsJdModalOpen(true);
    }
  }, [wiserParam, initialLoading]);

  // ─── Auto-Save ─────────────────────────────────────────────────────────────
  const saveResume = useCallback(async () => {
    if (!resumeId || isLocked) return;
    setSaving(true);
    try {
      const data = await resumesApi.update(resumeId, {
        name: resumeName,
        headerJson: header,
        settingsJson: settings,
        sectionsJson: sections,
      });
      markSaved(data.updated_at);
    } catch (err) {
      setSaveError(err.message);
      toast.error('Auto-save error: ' + err.message);
    }
  }, [resumeId, isLocked, resumeName, sections, header, settings, setSaving, markSaved, setSaveError]);

  const handleManualSave = async () => {
    if (!resumeId) return;
    if (isLocked) {
      toast.error('This resume is in Read-Only mode under your workspace limit. Click "Set as Master Resume" above to edit.');
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaving(true);
    try {
      const data = await resumesApi.update(resumeId, {
        name: resumeName,
        headerJson: header,
        settingsJson: settings,
        sectionsJson: sections,
      });
      markSaved(data.updated_at);
      toast.success('Resume saved successfully!');
    } catch (err) {
      setSaveError(err.message);
      toast.error('Failed to save resume: ' + err.message);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resumeId, isLocked, resumeName, sections, header, settings]);

  useEffect(() => {
    if (!isDirty || !resumeId || isLocked) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveResume, 1500);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [isDirty, resumeId, isLocked, saveResume]);

  useEffect(() => {
    if (sections && sections.length > 0 && !activeSectionId) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId, setActiveSectionId]);

  // ─── Save as Template Handler ──────────────────────────────────────────────
  const handleOpenSaveTemplate = () => {
    setTemplateName(resumeName || '');
    setTemplateDescription('');
    setIsSaveTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name.');
      return;
    }
    setIsSavingTemplate(true);
    try {
      await templatesApi.save({
        name: templateName.trim(),
        description: templateDescription.trim() || null,
        settingsJson: settings,
        headerStyleJson: header,
        sectionDefaultsJson: {},
      });
      toast.success('Template saved!');
      setIsSaveTemplateModalOpen(false);
    } catch (err) {
      toast.error('Failed to save template: ' + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // ─── Canva-like Click-to-Edit Handlers ────────────────────────────────────
  const handleSelectSectionFromPreview = (sectionId) => {
    setActiveSectionId(sectionId);
    // Expand editor if it was collapsed
    if (isEditorCollapsed) {
      setIsEditorCollapsed(false);
    }
    // Switch left tab to sections for immediate access
    setLeftTab('sections');
  };

  const handleSelectHeaderFromPreview = () => {
    // Expand left sidebar if it was collapsed
    if (isLeftCollapsed) {
      setIsLeftCollapsed(false);
    }
    setLeftTab('header');
  };

  // ─── Draggable Resizers (LeetCode / VS Code style) ─────────────────────────
  const startDragLeft = (e) => {
    e.preventDefault();
    setIsDraggingLeft(true);
    const startX = e.clientX;
    const startW = leftWidth;

    const onMouseMove = (moveEvt) => {
      const delta = moveEvt.clientX - startX;
      const newW = Math.max(220, Math.min(520, startW + delta));
      setLeftWidth(newW);
    };

    const onMouseUp = () => {
      setIsDraggingLeft(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startDragEditor = (e) => {
    e.preventDefault();
    setIsDraggingEditor(true);
    const startX = e.clientX;
    const startW = editorWidth;

    const onMouseMove = (moveEvt) => {
      const delta = moveEvt.clientX - startX;
      const newW = Math.max(280, Math.min(850, startW + delta));
      setEditorWidth(newW);
    };

    const onMouseUp = () => {
      setIsDraggingEditor(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (authLoading || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090b13] text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-zinc-400">Loading Resume Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-[#090b13] text-[#e2e8f0] flex flex-col overflow-hidden select-none">
      {/* Mobile Screen Recommendation Notice */}
      <MobileNotice className="mx-2 mt-2 z-40" />

      {/* ─── STUDIO HEADER ─────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-white/[0.07] bg-[#111420]/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Back + Resume Name + Save Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center justify-center p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <Link href="/dashboard" title="Resumo Studio">
              <BrandLogo size={22} />
            </Link>
            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer"
              title="Click to view Studio Subscription, Quotas & Invoices"
            >
              {planStatus?.plan_name || 'Free'}
            </button>
          </div>

          <div className="h-4 w-px bg-white/[0.07] shrink-0" />

          {/* Editable Resume Name */}
          <input
            type="text"
            value={resumeName}
            onChange={(e) => setResumeName(e.target.value)}
            className="bg-transparent focus:bg-[#111420] border border-transparent focus:border-white/[0.12] px-2 py-1 rounded-lg text-sm font-semibold text-[#e2e8f0] tracking-tight focus:outline-none max-w-[140px] sm:max-w-[220px] transition-colors placeholder:text-zinc-600"
            placeholder="Resume Name"
          />

          {/* Save Status Indicator */}
          <div className="hidden md:flex items-center gap-1.5 ml-0.5">
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
            ) : isDirty ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-xs text-amber-400">Unsaved changes</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-400">Saved</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Icon-only panel toggles */}
        <div className="hidden lg:flex items-center bg-zinc-900/60 border border-white/[0.06] rounded-xl p-0.5 gap-0.5">
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              !isLeftCollapsed
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isLeftCollapsed ? 'Expand Menu Panel' : 'Collapse Menu Panel'}
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              !isEditorCollapsed
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isEditorCollapsed ? 'Expand Text Editor' : 'Collapse Text Editor'}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              !isPreviewCollapsed
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isPreviewCollapsed ? 'Expand Resume Preview' : 'Collapse Resume Preview'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Wiser AI (JD Matching & Standalone ATS) button */}
          <button
            onClick={() => { if (isDirty) saveResume(); setIsJdModalOpen(true); }}
            className="bg-[#C88A58]/10 hover:bg-[#C88A58]/20 text-[#D49A6A] border border-[#C88A58]/25 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Launch Wiser AI: General Resume Audit, Bullet Polish & Job Match"
          >
            <Target className="w-3.5 h-3.5 text-[#D49A6A]" />
            <span className="hidden sm:inline">Wiser AI</span>
            <span className="text-[10px] bg-[#C88A58]/20 text-[#D49A6A] px-1.5 py-0.5 rounded font-mono">
              Audit &amp; Polish
            </span>
          </button>

          {/* Pilot Feedback Mail Link */}
          <a
            href="mailto:pagewises@gmail.com?subject=PageWise%20Builder%20Feedback"
            className="hidden xl:inline-flex items-center gap-1 text-[11px] font-mono text-[#D49A6A] hover:text-white px-2.5 py-1.5 rounded-xl border border-[#C88A58]/25 bg-[#C88A58]/10 transition-colors"
            title="Pilot Release: Report an edge case or feedback to pagewises@gmail.com"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C88A58] animate-pulse" />
            <span>Pilot Feedback</span>
          </a>

          {/* Import PDF */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors cursor-pointer bg-white/[0.02]"
            title="Extract & import an existing resume PDF using Wiser AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D49A6A]" />
            <span className="hidden sm:inline">Import PDF</span>
          </button>

          {/* Templates */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {/* Mobile view toggle */}
          <div className="flex lg:hidden bg-zinc-900 p-0.5 rounded-lg border border-white/[0.07]">
            <button
              onClick={() => setMobileView('editor')}
              className={`p-1.5 rounded-md text-xs ${
                mobileView === 'editor' ? 'bg-blue-600 text-white' : 'text-zinc-400'
              }`}
              title="Editor View"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`p-1.5 rounded-md text-xs ${
                mobileView === 'preview' ? 'bg-blue-600 text-white' : 'text-zinc-400'
              }`}
              title="Live Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Studio Quick Actions Dropdown Menu */}
          <div className="relative" ref={studioMenuRef}>
            <button
              onClick={() => setIsStudioMenuOpen(!isStudioMenuOpen)}
              className="p-1.5 rounded-xl border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Studio Actions Menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isStudioMenuOpen && (
              <div
                className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl p-1.5 z-50 overflow-hidden"
                style={{
                  background: '#0F121A',
                  border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                }}
              >
                <button
                  onClick={() => { setIsStudioMenuOpen(false); handleOpenSaveTemplate(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#F1F3F9] hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <BookmarkPlus className="w-4 h-4 text-amber-500" />
                  <span>Save Format as Template</span>
                </button>

                <button
                  onClick={() => { setIsStudioMenuOpen(false); setIsTemplateModalOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#F1F3F9] hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <LayoutTemplate className="w-4 h-4 text-blue-400" />
                  <span>Browse Templates</span>
                </button>

                <button
                  onClick={() => { setIsStudioMenuOpen(false); setIsImportModalOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#F1F3F9] hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Import Resume PDF</span>
                </button>

                <button
                  onClick={() => { setIsStudioMenuOpen(false); setIsSubscriptionModalOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#F1F3F9] hover:bg-white/[0.06] transition-colors text-left cursor-pointer border-t border-white/[0.06] mt-1 pt-2"
                >
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>Subscription &amp; Quotas</span>
                </button>
              </div>
            )}
          </div>

          <ExportMenu />

          {/* Manual Save or Read-Only Indicator */}
          {isLocked ? (
            <button
              type="button"
              onClick={handleSetMasterFromBuilder}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Set this resume as your Master Resume to enable editing"
            >
              <span>🔒 Read-Only (Set Master)</span>
            </button>
          ) : isDirty ? (
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save resume (Ctrl+S)"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save</span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Read-Only Workspace Alert Banner */}
      {isLocked && (
        <div className="bg-amber-950/90 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">🔒 Read-Only Workspace</span>
            <span className="text-zinc-300 hidden md:inline">
              — You have reached your active workspace limit for {planStatus?.plan_name || 'your current plan'}. You can inspect and export this resume, but changes cannot be saved.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSetMasterFromBuilder}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition cursor-pointer shadow-sm"
            >
              Set as Master Resume
            </button>
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700 transition cursor-pointer"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}

      {/* ─── 3-PANEL WORKSPACE WITH LEETCODE-STYLE RESIZERS ─────────────────── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* ── 1. LEFT PANEL: MENU & SECTIONS ──────────────────────────────── */}
        {isLeftCollapsed ? (
          <div className="w-11 bg-[#090b13] border-r border-white/[0.07] flex flex-col items-center py-3 gap-2 shrink-0 z-10">
            <button
              onClick={() => setIsLeftCollapsed(false)}
              title="Expand Left Menu"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-blue-600 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
            <div className="h-px w-6 bg-white/[0.07] my-1" />
            <button
              onClick={() => { setIsLeftCollapsed(false); setLeftTab('sections'); }}
              title="Sections"
              className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                leftTab === 'sections' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setIsLeftCollapsed(false); setLeftTab('header'); }}
              title="Header"
              className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                leftTab === 'header' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
              }`}
            >
              <Heading className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setIsLeftCollapsed(false); setLeftTab('settings'); }}
              title="Page Settings"
              className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                leftTab === 'settings' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            style={{ width: `${leftWidth}px` }}
            className={`h-full border-r border-white/[0.07] bg-[#111420] flex flex-col shrink-0 min-h-0 overflow-hidden ${
              mobileView === 'preview' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Left Header: Icon-only Tabs + Collapse */}
            <div className="flex items-center justify-between border-b border-white/[0.06] p-1.5 shrink-0">
              <div className="flex items-center gap-1 flex-1 mr-1">
                <button
                  onClick={() => setLeftTab('sections')}
                  title="Sections"
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    leftTab === 'sections'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLeftTab('header')}
                  title="Header"
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    leftTab === 'header'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <Heading className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLeftTab('settings')}
                  title="Page Settings"
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    leftTab === 'settings'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsLeftCollapsed(true)}
                title="Collapse Menu"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Left Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-4">
              {leftTab === 'sections' && (
                <>
                  <SectionManager />
                  <SectionTitleStyleEditor sectionId={activeSectionId || sections[0]?.id} />
                  <SectionDividerEditor sectionId={activeSectionId || sections[0]?.id} />
                </>
              )}

              {leftTab === 'header' && (
                <>
                  <ResumeHeaderEditor />
                </>
              )}

              {leftTab === 'settings' && (
                <>
                  <PageSettingsEditor />
                  <LinkManager />
                </>
              )}
            </div>

            {/* "Save as Template" button — accessible directly from the sidebar */}
            <div className="p-3 border-t border-white/[0.06] shrink-0">
              <button
                onClick={handleOpenSaveTemplate}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 text-xs font-semibold transition-all cursor-pointer"
                title="Save current typography and format styling as a reusable template"
              >
                <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
                <span>Save Format as Template</span>
              </button>
            </div>
          </div>
        )}

        {/* ── DRAGGABLE DIVIDER 1: Left <-> Editor ────────────────────────── */}
        {!isLeftCollapsed && !isEditorCollapsed && (
          <div
            onMouseDown={startDragLeft}
            onDoubleClick={() => setLeftWidth(310)}
            title="Drag to resize panel (Double-click to reset)"
            className={`w-1.5 hover:w-2 bg-zinc-900 hover:bg-blue-500 cursor-col-resize shrink-0 transition-all z-20 flex items-center justify-center group ${
              isDraggingLeft ? 'bg-blue-500 w-2' : ''
            }`}
          >
            <div className="w-0.5 h-8 bg-zinc-700 group-hover:bg-white rounded-full opacity-60 group-hover:opacity-100" />
          </div>
        )}

        {/* ── 2. CENTER PANEL: RICH TEXT EDITOR ───────────────────────────── */}
        {isEditorCollapsed ? (
          <div className="w-10 bg-[#090b13] border-r border-white/[0.07] flex flex-col items-center py-3 gap-3 shrink-0 z-10">
            <button
              onClick={() => setIsEditorCollapsed(false)}
              title="Expand Text Editor"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-blue-600 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center justify-center [writing-mode:vertical-lr] rotate-180 text-[11px] font-semibold text-zinc-500 tracking-wider uppercase">
              Text Editor (Collapsed)
            </div>
          </div>
        ) : (
          <div
            style={{
              width: isPreviewCollapsed ? '100%' : `${editorWidth}px`,
            }}
            className={`h-full flex flex-col bg-[#0d0f18] border-r border-white/[0.07] overflow-hidden shrink-0 min-h-0 ${
              isPreviewCollapsed ? 'flex-1' : ''
            } ${mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}
          >
            <ResumeRichEditor onCollapse={() => setIsEditorCollapsed(true)} />
          </div>
        )}

        {/* ── DRAGGABLE DIVIDER 2: Editor <-> Preview ─────────────────────── */}
        {!isEditorCollapsed && !isPreviewCollapsed && (
          <div
            onMouseDown={startDragEditor}
            onDoubleClick={() => setEditorWidth(440)}
            title="Drag to resize editor & preview (Double-click to reset)"
            className={`w-1.5 hover:w-2 bg-zinc-900 hover:bg-blue-500 cursor-col-resize shrink-0 transition-all z-20 flex items-center justify-center group ${
              isDraggingEditor ? 'bg-blue-500 w-2' : ''
            }`}
          >
            <div className="w-0.5 h-8 bg-zinc-700 group-hover:bg-white rounded-full opacity-60 group-hover:opacity-100" />
          </div>
        )}

        {/* ── 3. RIGHT PANEL: LIVE A4 PREVIEW ─────────────────────────────── */}
        {isPreviewCollapsed ? (
          <div className="w-10 bg-[#090b13] flex flex-col items-center py-3 gap-3 shrink-0 z-10">
            <button
              onClick={() => setIsPreviewCollapsed(false)}
              title="Expand Live Preview"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-blue-600 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center justify-center [writing-mode:vertical-lr] rotate-180 text-[11px] font-semibold text-zinc-500 tracking-wider uppercase">
              Resume Preview (Collapsed)
            </div>
          </div>
        ) : (
          <div
            className={`h-full flex-1 bg-[#111420] flex flex-col overflow-hidden min-h-0 ${
              mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Preview Toolbar */}
            <div className="px-4 py-2 border-b border-white/[0.07] bg-[#111420] flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Preview</span>

              <button
                onClick={() => setIsPreviewCollapsed(true)}
                title="Collapse Preview"
                className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-xs flex items-center gap-1"
              >
                <span>Collapse</span>
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Preview Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <ResumePreview
                onSelectSection={handleSelectSectionFromPreview}
                onSelectHeader={handleSelectHeaderFromPreview}
              />
            </div>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <TemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} />
      )}

      {/* Import PDF Modal */}
      {isImportModalOpen && (
        <ImportPdfModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          mode="current"
          currentResumeId={resumeId}
          currentResumeName={resumeName}
          onPlanUpgradeRequest={() => {
            setIsImportModalOpen(false);
            setIsPricingModalOpen(true);
          }}
        />
      )}

      {/* JD Analyzer & Strict ATS Checker Modal (v2.5) */}
      {isJdModalOpen && (
        <JDAnalyzerModal
          isOpen={isJdModalOpen}
          onClose={() => setIsJdModalOpen(false)}
          onEnhancementsReady={(analysis) => {
            useResumeStore.getState().setActiveJdAnalysis(analysis);
          }}
        />
      )}

      {/* ─── Save as Template Inline Modal ──────────────────────────────────── */}
      {isSaveTemplateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsSaveTemplateModalOpen(false); }}
        >
          <div className="bg-[#111420] border border-white/[0.07] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-[#D49A6A]" />
                <h2 className="text-sm font-semibold text-[#e2e8f0]">Save as Template</h2>
              </div>
              <button
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. My Clean Resume"
                  className="bg-[#090b13] border border-white/[0.07] focus:border-blue-500/40 rounded-xl px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-zinc-600 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-medium">Description <span className="text-zinc-600">(optional)</span></label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Brief description of this template style..."
                  rows={3}
                  className="bg-[#090b13] border border-white/[0.07] focus:border-blue-500/40 rounded-xl px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-zinc-600 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-1">
              <button
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white border border-white/[0.07] hover:border-white/20 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate || !templateName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C88A58] hover:bg-[#B87A47] text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isSavingTemplate ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <BookmarkPlus className="w-3 h-3" />
                )}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing & Upgrade Modal */}
      
      {/* Studio Subscription & Quotas Modal */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0E1018] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-white/[0.08] bg-[#12141F] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Studio Subscription &amp; Quotas
                </h3>
              </div>
              <button
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Plan Tier Header */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider font-semibold">
                    Current Plan
                  </span>
                  <div className="text-base font-bold text-white mt-0.5">
                    {planStatus?.plan_name || 'Pagewise Free'}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {planStatus?.expires_at
                      ? `Active until ${new Date(planStatus.expires_at).toLocaleDateString()} (${Math.max(0, Math.ceil((new Date(planStatus.expires_at) - new Date()) / (1000 * 60 * 60 * 24)))} days remaining)`
                      : 'Free standard tier · Monthly period refresh'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsSubscriptionModalOpen(false);
                    setIsPricingModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-600/20 cursor-pointer shrink-0"
                >
                  Upgrade
                </button>
              </div>

              {/* Resource Quotas Grid */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                  Resource Usage &amp; Remaining
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                    <span className="text-zinc-400 text-[11px]">PDF Exports</span>
                    <div className="font-mono text-white font-bold text-sm">
                      {planStatus?.remaining?.exports ?? 0} left
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {planStatus?.usage?.exports_used ?? 0} / {planStatus?.limits?.exports ?? 1} used
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                    <span className="text-zinc-400 text-[11px]">Wiser Job Match</span>
                    <div className="font-mono text-white font-bold text-sm">
                      {planStatus?.remaining?.wiser_job_help ?? 0} left
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {planStatus?.usage?.wiser_job_help_used ?? 0} / {planStatus?.limits?.wiser_job_help ?? 1} used
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                    <span className="text-zinc-400 text-[11px]">ATS Keyword Audits</span>
                    <div className="font-mono text-white font-bold text-sm">
                      {planStatus?.remaining?.wiser_ats ?? 0} left
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {planStatus?.usage?.wiser_ats_used ?? 0} / {planStatus?.limits?.wiser_ats ?? 1} used
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                    <span className="text-zinc-400 text-[11px]">Active Resumes</span>
                    <div className="font-mono text-white font-bold text-sm">
                      {planStatus?.remaining?.resumes ?? 0} left
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {planStatus?.usage?.active_resumes ?? 0} / {planStatus?.limits?.resumes ?? 1} active
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices and Bills Link */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <Link
                  href="/settings"
                  target="_blank"
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View All Invoices &amp; Bills in Account →</span>
                </Link>
                <button
                  onClick={() => setIsSubscriptionModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentPlan={planStatus?.plan_type || 'free'}
        planStatus={planStatus}
        onPlanUpdated={(newPlan) => {
          setPlanStatus(newPlan);
          fetchPlan();
        }}
      />
    </div>
  );
}

export default function ResumeBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#090b13] text-zinc-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
