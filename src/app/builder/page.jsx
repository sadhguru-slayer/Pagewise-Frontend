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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { resumesApi } from '@/lib/api';
import { useResumeStore } from '@/lib/resume/store';
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
          loadResume({
            id: data.id,
            name: data.name,
            headerJson: data.header_json,
            settingsJson: data.settings_json,
            sectionsJson: data.sections_json,
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

  // ─── Auto-Save ─────────────────────────────────────────────────────────────
  const saveResume = useCallback(async () => {
    if (!resumeId) return;
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
  }, [resumeId, resumeName, sections, header, settings, setSaving, markSaved, setSaveError]);

  const handleManualSave = async () => {
    if (!resumeId) return;
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
  }, [resumeId, resumeName, sections, header, settings]);

  useEffect(() => {
    if (!isDirty || !resumeId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveResume, 1500);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [isDirty, resumeId, saveResume]);

  useEffect(() => {
    if (sections && sections.length > 0 && !activeSectionId) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId, setActiveSectionId]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#090a0f] text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-zinc-400">Loading Resume Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col overflow-hidden select-none">
      {/* ─── STUDIO HEADER ─────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-zinc-800/80 bg-[#10121a]/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-medium cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Editable Title */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              className="bg-transparent hover:bg-zinc-800/50 focus:bg-zinc-900 border border-transparent focus:border-zinc-700 px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold text-white tracking-tight focus:outline-none max-w-[150px] sm:max-w-xs transition-colors"
              placeholder="Resume Name"
            />
          </div>

          {/* Manual Save Button & Auto-save Status */}
          <div className="flex items-center gap-2 ml-1">
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isDirty
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/70'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Save resume immediately to database (or press Ctrl+S)"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-blue-400" />
                  <span>Save</span>
                </>
              )}
            </button>

            <div className="hidden md:flex items-center gap-1 text-[11px] text-zinc-500">
              {isSaving ? (
                <span className="text-blue-400 font-mono">Syncing...</span>
              ) : isDirty ? (
                <span className="text-amber-400 font-medium">Unsaved changes</span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Saved</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Viewport Vertical Panel Toggles */}
        <div className="hidden lg:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              !isLeftCollapsed
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title={isLeftCollapsed ? 'Expand Menu Panel' : 'Collapse Menu Panel'}
          >
            <PanelLeft className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Menu</span>
          </button>

          <button
            onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              !isEditorCollapsed
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title={isEditorCollapsed ? 'Expand Text Editor' : 'Collapse Text Editor'}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Editor</span>
          </button>

          <button
            onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              !isPreviewCollapsed
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title={isPreviewCollapsed ? 'Expand Resume Preview' : 'Collapse Resume Preview'}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Preview</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-2.5 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 rounded-xl text-xs font-medium border border-blue-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Extract & import an existing resume PDF using Gemini AI"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import PDF</span>
          </button>

          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium border border-zinc-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {/* Mobile view toggle */}
          <div className="flex lg:hidden bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
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

          <ExportMenu />
        </div>
      </header>

      {/* ─── 3-PANEL WORKSPACE WITH LEETCODE-STYLE RESIZERS ─────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── 1. LEFT PANEL: MENU & SECTIONS ──────────────────────────────── */}
        {isLeftCollapsed ? (
          <div className="w-11 bg-[#0a0c13] border-r border-zinc-800/80 flex flex-col items-center py-3 gap-3 shrink-0 z-10">
            <button
              onClick={() => setIsLeftCollapsed(false)}
              title="Expand Left Menu"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-blue-600 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
            <div className="h-px w-6 bg-zinc-800 my-1" />
            <button
              onClick={() => {
                setIsLeftCollapsed(false);
                setLeftTab('sections');
              }}
              title="Sections"
              className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                leftTab === 'sections' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsLeftCollapsed(false);
                setLeftTab('header');
              }}
              title="Header"
              className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                leftTab === 'header' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Heading className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsLeftCollapsed(false);
                setLeftTab('settings');
              }}
              title="Settings"
              className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                leftTab === 'settings' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            style={{ width: `${leftWidth}px` }}
            className={`border-r border-zinc-800/80 bg-[#0d0f17] flex flex-col shrink-0 ${
              mobileView === 'preview' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Left Header with Tabs & Collapse Button */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/50 p-1.5 shrink-0">
              <div className="flex items-center gap-1 flex-1 mr-1">
                <button
                  onClick={() => setLeftTab('sections')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    leftTab === 'sections'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sections
                </button>
                <button
                  onClick={() => setLeftTab('header')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    leftTab === 'header'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Header
                </button>
                <button
                  onClick={() => setLeftTab('settings')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    leftTab === 'settings'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Settings
                </button>
              </div>

              <button
                onClick={() => setIsLeftCollapsed(true)}
                title="Collapse Menu (Double-click border to reset width)"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Left Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
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
          <div className="w-10 bg-[#0a0c13] border-r border-zinc-800/80 flex flex-col items-center py-3 gap-3 shrink-0 z-10">
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
            className={`flex flex-col bg-[#0b0c13] border-r border-zinc-800/80 overflow-hidden shrink-0 ${
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
          <div className="w-10 bg-[#0a0c13] flex flex-col items-center py-3 gap-3 shrink-0 z-10">
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
            className={`flex-1 bg-[#151722] flex flex-col overflow-hidden ${
              mobileView === 'editor' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Preview Toolbar */}
            <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Interactive Live A4 Preview</span>
                </span>
                <span className="text-[10px] text-zinc-500 hidden sm:inline">
                  (Click any section or header to edit)
                </span>
              </div>

              <button
                onClick={() => setIsPreviewCollapsed(true)}
                title="Collapse Preview"
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
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
        <ImportPdfModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} mode="current" />
      )}
    </div>
  );
}

export default function ResumeBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#090a0f] text-zinc-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
