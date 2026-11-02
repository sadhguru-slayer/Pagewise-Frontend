'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { resumesApi, exportsApi, templatesApi } from '@/lib/api';
import { BRAND_CONFIG, BrandLogo, BrandLockup } from '@/lib/brand';
import { RESUME_TEMPLATES as builtInTemplates } from '@/lib/resume/templates';
import { defaultHeader, defaultSections, defaultSettings } from '@/lib/resume/defaults';
import { generateResumeDocumentHtml } from '@/lib/resume/renderDocument';
import ImportPdfModal from '@/components/resume-builder/ImportPdfModal';
import Modal from '@/components/ui/Modal';
import PilotBanner from '@/components/ui/PilotBanner';
import { useModal } from '@/lib/modal-context';

import {
  Home,
  FileText,
  Palette,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Upload,
  Target,
  Download,
  Cpu,
  Trash2,
  Edit3,
  ChevronRight,
  Calendar,
  Layers,
  Search,
  Loader2,
  FilePlus,
  FolderOpen,
  FileDown,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowUpRight,
  Bookmark,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BILLING_PERIODS = [
  { key: 'all', label: 'All Time' },
  { key: 'this_billing', label: 'This Billing' },
  { key: 'prev_billing', label: 'Prev Billings' },
  { key: 'last_3_months', label: 'Last 3 Months' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeDate(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function atsColor(score) {
  if (!score && score !== 0) return null;
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  if (score >= 60) return 'text-amber-300 bg-amber-500/10 border-amber-500/25';
  if (score >= 40) return 'text-orange-400 bg-orange-500/10 border-orange-500/25';
  return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
}

// ─── Editorial Metric Card (Industrial Warm Aesthetic) ────────────────────────
function MetricCard({ icon: Icon, value, label, subtext, highlightColor }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group hover:border-white/[0.14]"
      style={{
        background: BRAND_CONFIG.colors.surfaceCard,
        border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-[#7E869B]">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
          style={{
            background: BRAND_CONFIG.colors.surfaceSubtle,
            border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
            color: highlightColor || BRAND_CONFIG.colors.primary,
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl sm:text-4xl font-extrabold text-[#F1F3F9] tracking-tight leading-none">
        {value ?? '—'}
      </p>
      {subtext && (
        <p className="text-[11px] text-[#7E869B] mt-2 font-sans flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: highlightColor || BRAND_CONFIG.colors.primary }} />
          {subtext}
        </p>
      )}
    </div>
  );
}

// ─── Precision Progress Track ────────────────────────────────────────────────
function ResourceBar({ label, value, max = 10, unit = '' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 25;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#F1F3F9] font-medium">{label}</span>
        <span className="text-[#7E869B] font-mono">
          {value} {unit}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${BRAND_CONFIG.colors.primary}, #F59E0B)`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Sidebar Navigation ───────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'resumes', label: 'My Resumes', icon: FileText },
    { id: 'templates', label: 'Templates Library', icon: Palette },
    { id: 'exports', label: 'Export History', icon: FileDown },
    { id: 'usage', label: 'Intelligence & Usage', icon: BarChart3 },
  ];

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <aside
      className="hidden md:flex flex-col w-[230px] shrink-0 min-h-screen sticky top-0"
      style={{
        background: '#0B0D13',
        borderRight: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
      }}
    >
      {/* Brand Header */}
      <div
        className="px-5 py-5 border-b"
        style={{ borderColor: BRAND_CONFIG.colors.borderSubtle }}
      >
        <Link href="/" className="group block">
          <BrandLockup size={28} showTagline={true} />
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer text-left"
              style={{
                background: isActive ? BRAND_CONFIG.colors.primarySurface : 'transparent',
                color: isActive ? BRAND_CONFIG.colors.primary : BRAND_CONFIG.colors.textMuted,
                border: isActive
                  ? `1px solid ${BRAND_CONFIG.colors.primaryBorder}`
                  : '1px solid transparent',
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div
        className="px-3 pb-4 space-y-2 border-t pt-4"
        style={{ borderColor: BRAND_CONFIG.colors.borderSubtle }}
      >
        <Link
          href="/settings"
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#7E869B] hover:text-[#F1F3F9] hover:bg-white/[0.04] transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Account &amp; Studio</span>
        </Link>

        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: BRAND_CONFIG.colors.surfaceCard }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: BRAND_CONFIG.colors.primary }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#F1F3F9] truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-[#7E869B] truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1 text-[#7E869B] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth();
  const modal = useModal();

  const [activeTab, setActiveTab] = useState('home');
  const [templateSubTab, setTemplateSubTab] = useState('formats'); // 'formats' | 'saved'
  const [resumes, setResumes] = useState([]);
  const [exportsList, setExportsList] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectPeriod = async (periodKey) => {
    setSelectedPeriod(periodKey);
    try {
      setLoadingStats(true);
      const updatedStats = await resumesApi.getUsageStats({ period: periodKey });
      if (updatedStats) {
        setUsageStats(updatedStats);
      }
    } catch (err) {
      console.error('[Error fetching usage stats by period]:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Modals & Actions
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState('Senior Engineer Resume');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(builtInTemplates[0].id);
  const [creatingResume, setCreatingResume] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  // Authentication Guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [resumesData, exportsData, templatesData, statsData] = await Promise.all([
        resumesApi.list().catch(() => []),
        exportsApi.list().catch(() => []),
        templatesApi.list().catch(() => []),
        resumesApi.getUsageStats({ period: selectedPeriod }).catch(() => null),
      ]);

      setResumes(Array.isArray(resumesData) ? resumesData : []);
      setExportsList(Array.isArray(exportsData) ? exportsData : []);
      setUserTemplates(Array.isArray(templatesData) ? templatesData : []);
      setUsageStats(statsData);
    } catch (err) {
      console.error('[Dashboard fetch error]:', err);
      toast.error('Could not load dashboard data');
    } finally {
      setLoadingData(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  // Create Resume Action
  const handleCreateResume = async (e) => {
    e.preventDefault();
    if (!newResumeName.trim()) {
      toast.error('Please enter a resume title');
      return;
    }

    try {
      setCreatingResume(true);
      const selectedTpl = builtInTemplates.find((t) => t.id === selectedTemplateKey) || builtInTemplates[0];

      const newResume = await resumesApi.create({
        name: newResumeName.trim(),
        header_json: { ...defaultHeader, ...(selectedTpl?.header || {}) },
        settings_json: { ...defaultSettings, ...(selectedTpl?.settings || {}) },
        sections_json: defaultSections.map((s) => ({
          ...s,
          ...(selectedTpl?.sectionDefaults || {}),
        })),
      });

      toast.success('Resume created successfully!');
      setIsCreateModalOpen(false);
      router.push(`/builder?id=${newResume.id}`);
    } catch (err) {
      toast.error('Failed to create resume: ' + err.message);
    } finally {
      setCreatingResume(false);
    }
  };

  // Delete Resume Action (Centralized Modal)
  const handleDeleteResume = async (resume) => {
    if (!resume) return;
    const ok = await modal.confirm({
      title: 'Delete Resume Architecture?',
      message: `Are you sure you want to permanently delete "${resume.name}"? All sections, tailoring, and styling will be lost. This cannot be undone.`,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await resumesApi.delete(resume.id);
      toast.success('Resume deleted');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to delete resume: ' + err.message);
    }
  };

  // Delete Template Action (Centralized Modal)
  const handleDeleteTemplate = async (template) => {
    if (!template) return;
    const ok = await modal.confirm({
      title: 'Delete Custom Preset?',
      message: `Are you sure you want to delete "${template.name}"? This custom preset style will be permanently removed.`,
      confirmText: 'Delete Preset',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await templatesApi.delete(template.id);
      toast.success('Custom preset deleted');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to delete template: ' + err.message);
    }
  };

  // Delete Export Record Action (Centralized Modal — replaces browser confirm)
  const handleDeleteExport = async (exp) => {
    if (!exp) return;
    const ok = await modal.confirm({
      title: 'Delete Export Record?',
      message: `Are you sure you want to delete the export record for "${exp.file_name}"? This file will be removed from your export archive.`,
      confirmText: 'Delete Export',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await exportsApi.delete(exp.id);
      toast.success('Export file deleted');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to delete export: ' + err.message);
    }
  };

  // Quick Export PDF (Recommended Format)
  const handleQuickExportPdf = async (resumeId) => {
    try {
      setExportingId(resumeId);
      const detail = await resumesApi.get(resumeId);
      const fullHtml = generateResumeDocumentHtml({
        header: detail.header_json || {},
        sections: detail.sections_json || [],
        settings: detail.settings_json || {},
      });

      const res = await exportsApi.exportPdf({
        resumeId: detail.id,
        name: detail.name || 'Resume',
        html: fullHtml,
      });

      if (res && res.id) {
        toast.success('PDF generated! Downloading...');
        await exportsApi.downloadFile(res.id, res.file_name || `${detail.name}.pdf`);
        loadDashboardData();
      }
    } catch (err) {
      toast.error('PDF Export failed: ' + err.message);
    } finally {
      setExportingId(null);
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090B10] text-[#F1F3F9]">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo size={36} />
          <Loader2 className="w-5 h-5 animate-spin text-amber-500 mt-2" />
          <p className="text-xs text-[#7E869B] font-mono">Initializing Resumo Studio...</p>
        </div>
      </div>
    );
  }

  const filteredResumes = resumes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.target_job_title && r.target_job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.target_company && r.target_company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const resumeCount = usageStats?.resume_count ?? resumes.length;
  const totalResumes = Math.max(usageStats?.total_resumes_generated ?? 0, resumeCount);
  const targetedCount = usageStats?.targeted_resume_count ?? resumes.filter((r) => r.target_job_title).length;
  const exportCount = usageStats?.export_count ?? exportsList.length;
  const totalExports = Math.max(usageStats?.total_exports_generated ?? 0, exportCount);
  const templateCount = builtInTemplates.length + userTemplates.length;
  const totalCustomTemplates = Math.max(usageStats?.total_templates_created ?? 0, userTemplates.length);
  const wiserJobHelps = Math.max(usageStats?.wiser_job_helps_count ?? 0, targetedCount);
  const wiserAtsChecks = usageStats?.wiser_ats_checks_count ?? 0;
  const wiserTotal = usageStats?.wiser_total_invocations ?? (wiserJobHelps + wiserAtsChecks);

  const recentResumes = [...resumes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#090B10] text-[#F1F3F9] flex font-sans">
      {/* Precision Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={logout} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header Bar */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30 border-b backdrop-blur-md"
          style={{ background: 'rgba(9,11,16,0.9)', borderColor: BRAND_CONFIG.colors.borderSubtle }}
        >
          <BrandLockup size={24} />
          <Link href="/settings" className="p-2 text-[#7E869B] hover:text-white">
            <Settings className="w-4 h-4" />
          </Link>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {/* Pilot Notification & Feedback Banner */}
          <PilotBanner variant="card" className="mb-6" />

          {/* ── 1. OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'home' && (
            <div className="space-y-8">
              {/* Executive Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.06]">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
                    Studio Workspace
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F1F3F9] tracking-tight mt-1">
                    Welcome back, {user?.name?.split(' ')[0] || 'Architect'}
                  </h1>
                  <p className="text-xs text-[#7E869B] mt-1">
                    {BRAND_CONFIG.tagline} — Craft, tailor, and audit your career assets.
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border hover:border-white/20 text-[#F1F3F9]"
                    style={{
                      background: BRAND_CONFIG.colors.surfaceCard,
                      borderColor: BRAND_CONFIG.colors.borderSubtle,
                    }}
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-500" />
                    <span>Import PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewResumeName('Senior Engineer Resume');
                      setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer hover:opacity-95"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                      boxShadow: `0 4px 18px ${BRAND_CONFIG.colors.primaryGlow}`,
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Resume</span>
                  </button>
                </div>
              </div>

              {/* Analytics & Billing Period Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#111319] border border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">
                        Analytics Period: {usageStats?.period_label || 'All Time'}
                      </span>
                      {loadingStats && <Loader2 className="w-3 h-3 animate-spin text-amber-500" />}
                    </div>
                    <p className="text-[11px] text-[#7E869B] font-mono">
                      {usageStats?.period_start
                        ? `${new Date(usageStats.period_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${
                            usageStats?.period_end
                              ? new Date(usageStats.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Now'
                          }`
                        : 'Cumulative all-time usage history across all workspaces'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-[#161922] p-1 rounded-xl border border-white/[0.08] overflow-x-auto">
                  {BILLING_PERIODS.map((bp) => (
                    <button
                      key={bp.key}
                      onClick={() => handleSelectPeriod(bp.key)}
                      disabled={loadingStats}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        selectedPeriod === bp.key
                          ? 'bg-amber-500 text-black shadow-md font-bold'
                          : 'text-[#7E869B] hover:text-white'
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bento Metric Matrix */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={FileText}
                  value={resumeCount}
                  label="Master Resumes"
                  subtext={`${totalResumes} all-time crafted`}
                  highlightColor="#D97706"
                />
                <MetricCard
                  icon={Cpu}
                  value={wiserTotal}
                  label={selectedPeriod === 'all' ? 'Wiser AI Actions' : `Wiser AI (${usageStats?.period_label || 'Period'})`}
                  subtext={
                    selectedPeriod === 'all'
                      ? `${wiserJobHelps} JD + ${wiserAtsChecks} ATS checks`
                      : `${wiserJobHelps} JD + ${wiserAtsChecks} ATS in cycle (${usageStats?.lifetime_wiser_invocations ?? wiserTotal} lifetime)`
                  }
                  highlightColor="#F59E0B"
                />
                <MetricCard
                  icon={Palette}
                  value={templateCount}
                  label="Available Formats"
                  subtext={`${builtInTemplates.length} Standard + ${userTemplates.length} Custom (${totalCustomTemplates} total)`}
                  highlightColor="#10B981"
                />
                <MetricCard
                  icon={Download}
                  value={exportCount}
                  label="Active Exports"
                  subtext={`${totalExports} lifetime generated`}
                  highlightColor="#E2E8F0"
                />
              </div>

              {/* Recent Resumes Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1F3F9]">
                      Recent Resumes
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#7E869B]">
                      {resumes.length} total
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('resumes')}
                    className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View all files</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {loadingData ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : recentResumes.length === 0 ? (
                  <div
                    className="rounded-2xl border border-dashed p-10 text-center"
                    style={{
                      borderColor: BRAND_CONFIG.colors.borderSubtle,
                      background: BRAND_CONFIG.colors.surfaceCard,
                    }}
                  >
                    <FolderOpen className="w-8 h-8 text-[#7E869B] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#F1F3F9]">No resumes created yet</p>
                    <p className="text-xs text-[#7E869B] mt-1">
                      Choose a template format or import an existing PDF to begin.
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Resume</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recentResumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 group hover:border-amber-500/40"
                        style={{
                          background: BRAND_CONFIG.colors.surfaceCard,
                          border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                        }}
                      >
                        <div>
                          {/* Target Job Pill if present */}
                          {resume.target_job_title ? (
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 truncate">
                                🎯 {resume.target_company ? `${resume.target_company} · ` : ''}{resume.target_job_title}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-[#7E869B] bg-white/[0.04] border border-white/[0.06]">
                                Master Draft
                              </span>
                            </div>
                          )}

                          <h3 className="font-bold text-sm text-[#F1F3F9] group-hover:text-amber-400 transition-colors line-clamp-1">
                            {resume.name}
                          </h3>

                          <p className="text-[11px] text-[#7E869B] mt-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#7E869B]" />
                            <span>Updated {relativeDate(resume.updated_at)}</span>
                          </p>
                        </div>

                        <div className="pt-4 mt-3 border-t border-white/[0.06] flex items-center justify-between">
                          <Link
                            href={`/builder?id=${resume.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-amber-500 hover:text-black text-[#F1F3F9] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleQuickExportPdf(resume.id)}
                              disabled={exportingId === resume.id}
                              title="Quick PDF Export (Recommended)"
                              className="p-1.5 text-[#7E869B] hover:text-[#F1F3F9] rounded-lg transition-colors cursor-pointer"
                            >
                              {exportingId === resume.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteResume(resume)}
                              title="Delete resume"
                              className="p-1.5 text-[#7E869B] hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 2. MY RESUMES TAB ────────────────────────────────────────────── */}
          {activeTab === 'resumes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-white/[0.06]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#F1F3F9] tracking-tight">
                    All Resume Architectures
                  </h1>
                  <p className="text-xs text-[#7E869B] mt-1">
                    Manage your core resumes and job-targeted branches.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setNewResumeName('Senior Engineer Resume');
                    setIsCreateModalOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Resume</span>
                </button>
              </div>

              {/* Search Strip */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by title, company, or target position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-colors"
                  style={{
                    background: BRAND_CONFIG.colors.surfaceCard,
                    border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                  }}
                />
              </div>

              {loadingData ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                </div>
              ) : filteredResumes.length === 0 ? (
                <div
                  className="rounded-2xl border border-dashed p-16 text-center"
                  style={{ borderColor: BRAND_CONFIG.colors.borderSubtle }}
                >
                  <FolderOpen className="w-10 h-10 text-[#7E869B] mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[#F1F3F9]">No resumes match criteria</p>
                  <p className="text-xs text-[#7E869B] mt-1">
                    {searchQuery ? 'Try adjusting your search terms.' : 'Create your first resume to get started.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredResumes.map((resume) => {
                    const score = resume.target_ats_score;
                    const badgeCls = atsColor(score);
                    return (
                      <div
                        key={resume.id}
                        className="rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group hover:border-amber-500/40"
                        style={{
                          background: BRAND_CONFIG.colors.surfaceCard,
                          border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                        }}
                      >
                        <div>
                          {/* Tags header */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            {resume.target_job_title ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-semibold truncate max-w-[180px]">
                                🎯 {resume.target_company ? `${resume.target_company} · ` : ''}{resume.target_job_title}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-[#7E869B] bg-white/[0.04] border border-white/[0.06]">
                                Master Architecture
                              </span>
                            )}

                            {score !== null && score !== undefined && (
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border ${badgeCls}`}>
                                ATS {Math.round(score)}%
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-base text-[#F1F3F9] group-hover:text-amber-400 transition-colors line-clamp-1">
                            {resume.name}
                          </h3>

                          <div className="flex items-center gap-3 mt-2 text-[11px] text-[#7E869B]">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {resume.section_count || 0} sections
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {relativeDate(resume.updated_at)}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                          <Link
                            href={`/builder?id=${resume.id}`}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-amber-600 hover:text-white text-[#F1F3F9] transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Launch Studio</span>
                          </Link>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleQuickExportPdf(resume.id)}
                              disabled={exportingId === resume.id}
                              title="Quick PDF Export (Recommended)"
                              className="p-2 text-[#7E869B] hover:text-[#F1F3F9] rounded-lg transition-colors cursor-pointer"
                            >
                              {exportingId === resume.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteResume(resume)}
                              title="Delete resume"
                              className="p-2 text-[#7E869B] hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* ── 3. TEMPLATES LIBRARY TAB ─────────────────────────────────────── */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              {/* Header with Sub-tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-white/[0.06]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#F1F3F9] tracking-tight">
                    Template &amp; Format Library
                  </h1>
                  <p className="text-xs text-[#7E869B] mt-1">
                    Industry-calibrated typography, margins, and section designs.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-[#12141D] p-1 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => setTemplateSubTab('formats')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      templateSubTab === 'formats'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-[#7E869B] hover:text-white'
                    }`}
                  >
                    Industry Formats ({builtInTemplates.length})
                  </button>
                  <button
                    onClick={() => setTemplateSubTab('saved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      templateSubTab === 'saved'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-[#7E869B] hover:text-white'
                    }`}
                  >
                    My Custom Presets ({userTemplates.length})
                  </button>
                </div>
              </div>

              {/* Subtab 1: Built-in Industry Formats */}
              {templateSubTab === 'formats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {builtInTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group hover:border-amber-500/40"
                      style={{
                        background: BRAND_CONFIG.colors.surfaceCard,
                        border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                      }}
                    >
                      <div>
                        {/* Format category badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                            {tpl.tag || 'Standard'}
                          </span>
                          <span className="text-[10px] text-[#7E869B] font-mono">
                            {tpl.settings?.bodyFont?.split(',')[0]}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-[#F1F3F9] group-hover:text-amber-400 transition-colors">
                          {tpl.name}
                        </h3>

                        <p className="text-xs text-[#7E869B] mt-2 leading-relaxed">
                          {tpl.description}
                        </p>

                        {/* Format Specs Preview */}
                        <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1.5 text-[11px] font-mono text-[#7E869B]">
                          <div className="flex justify-between">
                            <span>Font Family:</span>
                            <span className="text-[#F1F3F9] font-sans">{tpl.settings?.bodyFont?.split(',')[0]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Target Industry:</span>
                            <span className="text-[#F1F3F9] font-sans truncate max-w-[130px]">{tpl.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedTemplateKey(tpl.id);
                            setNewResumeName(`${tpl.name} Resume`);
                            setIsCreateModalOpen(true);
                          }}
                          className="w-full py-2 bg-white/[0.06] hover:bg-amber-600 hover:text-white text-[#F1F3F9] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Use This Architecture</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtab 2: User Saved Custom Presets */}
              {templateSubTab === 'saved' && (
                <div>
                  {userTemplates.length === 0 ? (
                    <div
                      className="rounded-2xl border border-dashed p-16 text-center"
                      style={{
                        borderColor: BRAND_CONFIG.colors.borderSubtle,
                        background: BRAND_CONFIG.colors.surfaceCard,
                      }}
                    >
                      <Bookmark className="w-10 h-10 text-amber-500/60 mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-[#F1F3F9]">No custom presets saved yet</h3>
                      <p className="text-xs text-[#7E869B] max-w-md mx-auto mt-1 leading-relaxed">
                        Customize your typography, margins, and divider rules in the Resume Builder, then click
                        &quot;Save as Template&quot; in the Settings panel to preserve your style.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {userTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group hover:border-amber-500/40"
                          style={{
                            background: BRAND_CONFIG.colors.surfaceCard,
                            border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                                Custom Preset
                              </span>
                              <span className="text-[11px] text-[#7E869B]">
                                {relativeDate(tpl.created_at)}
                              </span>
                            </div>

                            <h3 className="font-bold text-base text-[#F1F3F9]">
                              {tpl.name}
                            </h3>

                            {tpl.description && (
                              <p className="text-xs text-[#7E869B] mt-1.5 leading-relaxed">
                                {tpl.description}
                              </p>
                            )}

                            <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/[0.05] text-[11px] text-[#7E869B] space-y-1">
                              <div>Font: <span className="text-white">{tpl.settings_json?.bodyFont || 'Default'}</span></div>
                              <div>Heading: <span className="text-white">{tpl.settings_json?.headingColor || '#111827'}</span></div>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                            <button
                              onClick={() => {
                                setNewResumeName(`${tpl.name} Resume`);
                                setIsCreateModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-amber-600 hover:text-white text-[#F1F3F9] transition-all cursor-pointer"
                            >
                              Create with Preset
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(tpl)}
                              className="p-1.5 text-[#7E869B] hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete preset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── EXPORT HISTORY TAB ─────────────────────────────────────────── */}
          {activeTab === 'exports' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-white/[0.06]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#F1F3F9] tracking-tight">
                    Exported Resumes Archive
                  </h1>
                  <p className="text-xs text-[#7E869B] mt-1">
                    Track which job, company, and template each export was built for. Redownload or clean up files.
                  </p>
                </div>
              </div>

              {loadingData ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                </div>
              ) : exportsList.length === 0 ? (
                <div
                  className="rounded-2xl border border-dashed p-16 text-center"
                  style={{
                    borderColor: BRAND_CONFIG.colors.borderSubtle,
                    background: BRAND_CONFIG.colors.surfaceCard,
                  }}
                >
                  <FileDown className="w-10 h-10 text-[#7E869B] mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-[#F1F3F9]">No exported files yet</h3>
                  <p className="text-xs text-[#7E869B] max-w-md mx-auto mt-1 leading-relaxed">
                    When you export a PDF, PNG image, or HTML document from the Resume Studio, your generated files and job targeting metadata will be logged here.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden border border-white/[0.07]" style={{ background: BRAND_CONFIG.colors.surfaceCard }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-white/[0.06] bg-black/40 text-[10px] font-mono uppercase tracking-wider text-[#7E869B]">
                        <tr>
                          <th className="py-3 px-4">File Name</th>
                          <th className="py-3 px-4">Format</th>
                          <th className="py-3 px-4">Targeted Job &amp; Company</th>
                          <th className="py-3 px-4">Layout / Font</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {exportsList.map((exp) => (
                          <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#F1F3F9]">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                                <div>
                                  <p className="truncate max-w-[200px]">{exp.resume_name || exp.file_name}</p>
                                  <p className="text-[10px] text-[#7E869B] font-mono truncate max-w-[200px]">{exp.file_name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono uppercase">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  exp.file_type === 'pdf'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : exp.file_type === 'png'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}
                              >
                                {exp.file_type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {exp.target_job_title ? (
                                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                                  <span>🎯</span>
                                  <span>{exp.target_company ? `${exp.target_company} · ` : ''}{exp.target_job_title}</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-[#7E869B]">General Master Export</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-[#7E869B] font-sans">
                              {exp.template_name || 'Standard Format'}
                            </td>
                            <td className="py-3.5 px-4 text-[#7E869B] font-mono text-[11px]">
                              {relativeDate(exp.created_at)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => exportsApi.downloadFile(exp.id, exp.file_name)}
                                  className="px-2.5 py-1 bg-white/[0.06] hover:bg-amber-600 hover:text-white rounded-lg text-xs font-semibold text-[#F1F3F9] transition-all flex items-center gap-1 cursor-pointer"
                                  title="Download this file"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteExport(exp)}
                                  className="p-1.5 text-[#7E869B] hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 4. USAGE & INTELLIGENCE TAB ──────────────────────────────────── */}
          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="pb-5 border-b border-white/[0.06]">
                <h1 className="text-2xl font-extrabold text-[#F1F3F9] tracking-tight">
                  Resource Intelligence &amp; Quotas
                </h1>
                <p className="text-xs text-[#7E869B] mt-1">
                  Track career asset utilization and ATS scanning throughput.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Resource Allocations (Active vs Lifetime Soft-Deleted) */}
                <div
                  className="rounded-2xl p-6 space-y-5"
                  style={{
                    background: BRAND_CONFIG.colors.surfaceCard,
                    border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1F3F9]">
                        Workspace Resource Quotas
                      </h2>
                      <p className="text-[11px] text-[#7E869B] mt-0.5">
                        Active assets in studio vs lifetime creation history
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Soft-Delete Tracked
                    </span>
                  </div>

                  <div className="space-y-4 pt-2">
                    <ResourceBar
                      label={`Master Resumes (${resumeCount} active · ${totalResumes} all-time)`}
                      value={resumeCount}
                      max={25}
                      unit="resumes"
                    />
                    <ResourceBar
                      label={`JD-Targeted Branches (${targetedCount} active)`}
                      value={targetedCount}
                      max={20}
                      unit="branches"
                    />
                    <ResourceBar
                      label={`Verified Exports (${exportCount} active · ${totalExports} lifetime generated)`}
                      value={exportCount}
                      max={50}
                      unit="files"
                    />
                    <ResourceBar
                      label={`Custom Style Presets (${userTemplates.length} active · ${totalCustomTemplates} saved)`}
                      value={userTemplates.length}
                      max={15}
                      unit="presets"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-[#9DA4B7] leading-relaxed">
                    📦 <strong className="text-white">Soft-Delete Preservation:</strong> Even when a resume, export, or preset is removed from your active list, your historical generation footprint is permanently recorded.
                  </div>
                </div>

                {/* 2. Wiser AI Intelligence & Quota Tracking */}
                <div
                  className="rounded-2xl p-6 space-y-5"
                  style={{
                    background: BRAND_CONFIG.colors.surfaceCard,
                    border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-orange-400" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1F3F9]">
                          Wiser AI Quota Tracking
                        </h2>
                      </div>
                      <p className="text-[11px] text-[#7E869B] mt-0.5">
                        Autonomous career AI engine metrics
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                      Subscription Meter
                    </span>
                  </div>

                  <div className="space-y-4 pt-2">
                    <ResourceBar
                      label="Wiser Job Helps (JD + ATS Matching Runs)"
                      value={wiserJobHelps}
                      max={50}
                      unit="runs"
                    />
                    <ResourceBar
                      label="Wiser ATS Audits (Standalone Checks)"
                      value={wiserAtsChecks}
                      max={50}
                      unit="audits"
                    />
                    <ResourceBar
                      label="Total Wiser AI Invocations"
                      value={wiserTotal}
                      max={100}
                      unit="actions"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300 leading-relaxed">
                    ⚡ <strong className="text-white">Subscription Ready:</strong> Wiser is our specialized AI that elevates your resumes. All Wiser Job Helps and Standalone ATS checks are tracked here to power upcoming subscription tier limits.
                  </div>
                </div>
              </div>

              {/* System Activity Feed */}
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{
                  background: BRAND_CONFIG.colors.surfaceCard,
                  border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                }}
              >
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1F3F9]">
                  Recent Modifications
                </h2>

                  {resumes.length === 0 ? (
                    <p className="text-xs text-[#7E869B]">No recent activity recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {resumes.slice(0, 6).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/[0.04]"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-[#F1F3F9] truncate">
                              {r.name}
                            </p>
                            {r.target_job_title && (
                              <p className="text-[10px] text-amber-500 truncate">
                                Targeted for {r.target_job_title}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-[#7E869B] font-mono shrink-0">
                            {relativeDate(r.updated_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
          )}
        </main>
      </div>

      {/* ── MODAL: CREATE RESUME ────────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !creatingResume && setIsCreateModalOpen(false)}
        title="Create New Resume Architecture"
        icon={FilePlus}
        size="lg"
        hideCloseButton={creatingResume}
        closeOnBackdrop={!creatingResume}
        closeOnEscape={!creatingResume}
      >
        <form onSubmit={handleCreateResume} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#7E869B] mb-1.5">
              Resume Title
            </label>
            <input
              type="text"
              value={newResumeName}
              onChange={(e) => setNewResumeName(e.target.value)}
              placeholder="e.g. Senior Backend Engineer - Stripe"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-colors"
              style={{
                background: BRAND_CONFIG.colors.surfaceCard,
                border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#7E869B] mb-2">
              Choose Layout Template
            </label>
            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {builtInTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateKey(tpl.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedTemplateKey === tpl.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'hover:border-white/20'
                  }`}
                  style={{
                    background: BRAND_CONFIG.colors.surfaceCard,
                    borderColor: selectedTemplateKey === tpl.id ? undefined : BRAND_CONFIG.colors.borderSubtle,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white line-clamp-1">{tpl.name}</span>
                    {selectedTemplateKey === tpl.id && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-[#7E869B] line-clamp-2">{tpl.tag || tpl.category}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              disabled={creatingResume}
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-2 text-xs text-[#7E869B] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingResume}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {creatingResume ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Launch Studio</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: IMPORT PDF ──────────────────────────────────────────────── */}
      {isImportModalOpen && (
        <ImportPdfModal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            loadDashboardData();
          }}
          mode="new"
        />
      )}
    </div>
  );
}
