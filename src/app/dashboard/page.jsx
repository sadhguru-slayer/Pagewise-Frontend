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
import PricingModal from '@/components/pricing/PricingModal';
import MobileNotice from '@/components/layout/MobileNotice';
import { useModal } from '@/lib/modal-context';
import { paymentsApi } from '@/lib/api';

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
  Activity,
  ShieldCheck,
  Database,
  Sparkles,
  Zap,
  Lock,
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

// ─── Precision Progress Track (Supports Dual Bar / Bar-Over-Bar) ──────────────
function ResourceBar({
  label,
  value,
  primaryValue,
  secondaryValue,
  max = 10,
  unit = '',
  primaryColor = '#C88A58',
  secondaryColor = '#10B981',
}) {
  const actualPrimary = primaryValue !== undefined ? primaryValue : (value ?? 0);
  const actualSecondary = secondaryValue;

  const safeMax = Math.max(max, actualPrimary, actualSecondary ?? 0, 1);
  const primaryPct = Math.min(100, Math.round((actualPrimary / safeMax) * 100));
  const secondaryPct = actualSecondary !== undefined
    ? Math.min(100, Math.round((actualSecondary / safeMax) * 100))
    : 0;

  const isDualLayer = actualSecondary !== undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#F1F3F9] font-medium">{label}</span>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-white font-bold">
            {actualPrimary} <span className="text-[#7E869B] font-normal">{unit}</span>
          </span>
          {isDualLayer && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {actualSecondary} active
            </span>
          )}
        </div>
      </div>

      {/* Dual Bar Track (Bar-over-bar) */}
      <div className="relative h-2 rounded-full overflow-hidden bg-white/[0.06]">
        {/* Layer 1: Cumulative Footprint / Total Generated (Base layer in distinct amber/accent tone) */}
        {actualPrimary > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(primaryPct, 3)}%`,
              background: isDualLayer ? 'rgba(200, 138, 88, 0.35)' : `linear-gradient(90deg, ${primaryColor}, #E0A97E)`,
              borderRight: isDualLayer ? '1px solid rgba(200, 138, 88, 0.7)' : 'none',
            }}
          />
        )}

        {/* Layer 2: Active Assets in Studio (Overlay layer rendered over base bar) */}
        {isDualLayer && actualSecondary > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(secondaryPct, 2)}%`,
              background: `linear-gradient(90deg, ${secondaryColor}, #34D399)`,
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
            }}
          />
        )}
      </div>

      {/* Dual Layer Indicator Legend */}
      {isDualLayer && (
        <div className="flex items-center justify-between text-[10px] text-[#7E869B] font-mono pt-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Active in workspace: <strong className="text-white font-medium">{actualSecondary}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
            <span>Total generated: <strong className="text-white font-medium">{actualPrimary}</strong></span>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Navigation ───────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, user, onLogout, onOpenUpgrade, planStatus }) {
  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'resumes', label: 'My Resumes', icon: FileText },
    { id: 'templates', label: 'Templates Library', icon: Palette },
    { id: 'exports', label: 'Export History', icon: FileDown },
    { id: 'usage', label: 'Intelligence & Usage', icon: BarChart3 },
  ];

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const isPilot = planStatus?.plan_type === 'pilot';
  const planBadge = isPilot
    ? 'Pilot'
    : planStatus?.plan_type === 'pro_monthly'
    ? 'Pro'
    : planStatus?.plan_type === 'day_pass'
    ? 'Day Pass'
    : 'Free';

  return (
    <aside
      className="hidden md:flex flex-col w-[240px] shrink-0 h-full overflow-hidden"
      style={{
        background: '#0B0D13',
        borderRight: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
      }}
    >
      {/* Brand Header */}
      <div
        className="px-5 py-4 border-b shrink-0"
        style={{ borderColor: BRAND_CONFIG.colors.borderSubtle }}
      >
        <Link href="/" className="group block">
          <BrandLockup size={28} showTagline={true} badgeText={planBadge} />
        </Link>
      </div>

      {/* Nav List - Independently scrollable */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
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

      {/* Bottom Pinned Section: Upgrade Card above Settings after margin */}
      <div
        className="shrink-0 mt-auto border-t"
        style={{ borderColor: BRAND_CONFIG.colors.borderSubtle }}
      >
        {/* Upgrade / Plan Card */}
        <div className="p-3 pb-2">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D49A6A]">
                {planStatus?.plan_name || 'Pagewise Free'}
              </span>
              {user?.is_admin && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-[#D49A6A] font-mono font-bold">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8E94A5] mt-1 line-clamp-2">
              {isPilot
                ? '70 workspaces · 100 exports/mo'
                : planStatus?.plan_type === 'pro_monthly'
                ? '5 workspaces · 30 exports/mo'
                : planStatus?.plan_type === 'day_pass'
                ? '1 workspace · 5 exports (24h)'
                : '1 workspace · 1 export/mo'}
            </p>
            <button
              onClick={onOpenUpgrade}
              className="mt-2.5 w-full py-1.5 px-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-[#EDEDF2] text-[11px] font-semibold border border-white/[0.08] flex items-center justify-center transition cursor-pointer"
            >
              <span>{isPilot ? 'Pilot Plan Details' : planStatus?.plan_type === 'pro_monthly' ? 'Subscription Details' : 'Upgrade Plan'}</span>
            </button>
            {user?.is_admin && (
              <Link
                href="/admin-290123-7234878"
                className="mt-2 text-[10px] text-[#D49A6A] hover:underline font-mono block text-center border-t border-white/[0.06] pt-1.5 transition"
              >
                → Secret Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* User & Settings Section */}
        <div className="px-3 pb-3 space-y-1.5">
          <Link
            href="/settings"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#8E94A5] hover:text-[#EDEDF2] hover:bg-white/[0.04] transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Account &amp; Studio</span>
          </Link>

          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{ background: BRAND_CONFIG.colors.surfaceCard }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: BRAND_CONFIG.colors.primary }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#EDEDF2] truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[#8E94A5] truncate">{user?.email}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1 text-[#8E94A5] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
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
  const [systemTemplates, setSystemTemplates] = useState(builtInTemplates);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(builtInTemplates[0].id);
  const [creatingResume, setCreatingResume] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  // Pricing & Subscription state
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);

  const fetchPlanStatus = useCallback(async () => {
    try {
      const data = await paymentsApi.getStatus();
      setPlanStatus(data);
    } catch (e) {
      console.warn('Could not load plan status:', e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlanStatus();
    }
  }, [isAuthenticated, fetchPlanStatus]);

  // Authentication Guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [resumesData, exportsData, templatesData, statsData, sysTemplatesData] = await Promise.all([
        resumesApi.list().catch(() => []),
        exportsApi.list().catch(() => []),
        templatesApi.list().catch(() => []),
        resumesApi.getUsageStats({ period: selectedPeriod }).catch(() => null),
        templatesApi.getSystemTemplates().catch(() => []),
      ]);

      setResumes(Array.isArray(resumesData) ? resumesData : []);
      setExportsList(Array.isArray(exportsData) ? exportsData : []);
      setUserTemplates(Array.isArray(templatesData) ? templatesData : []);
      setUsageStats(statsData);

      if (Array.isArray(sysTemplatesData) && sysTemplatesData.length > 0) {
        const mapped = sysTemplatesData.map((t) => ({
          id: t.template_key || String(t.id),
          dbId: t.id,
          name: t.name,
          category: t.category || 'General',
          tag: t.badge || (t.min_plan_tier === 'pro_monthly' ? 'Pagewise Pro' : t.min_plan_tier === 'day_pass' ? 'Day Pass' : 'Standard Free'),
          badgeColor: t.min_plan_tier === 'pro_monthly' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : t.min_plan_tier === 'day_pass' ? 'bg-[#C88A58]/10 text-[#D49A6A] border-[#C88A58]/25' : 'bg-white/[0.04] text-[#8E94A5] border-white/[0.08]',
          min_plan_tier: t.min_plan_tier || 'free',
          is_locked: !!t.is_locked,
          description: t.description || '',
          settings: t.settings_json || {},
          header: t.header_style_json || {},
          sectionDefaults: t.section_defaults_json || {},
        }));
        setSystemTemplates(mapped);
      }
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
      const selectedTpl = systemTemplates.find((t) => t.id === selectedTemplateKey) || systemTemplates[0];

      if (selectedTpl?.is_locked) {
        toast.error(`The '${selectedTpl.name}' layout requires ${selectedTpl.min_plan_tier === 'pro_monthly' ? 'Pagewise Pro' : 'Wiser Day Pass'}. Please upgrade.`);
        setPricingModalOpen(true);
        return;
      }

      const headerData = typeof defaultHeader === 'function' ? defaultHeader() : defaultHeader;
      const settingsData = typeof defaultSettings === 'function' ? defaultSettings() : defaultSettings;
      const sectionsData = typeof defaultSections === 'function' ? defaultSections() : defaultSections;

      const newResume = await resumesApi.create({
        name: newResumeName.trim(),
        template_key: selectedTemplateKey,
        header_json: { ...headerData, ...(selectedTpl?.header || {}) },
        settings_json: { ...settingsData, ...(selectedTpl?.settings || {}) },
        sections_json: (Array.isArray(sectionsData) ? sectionsData : []).map((s) => ({
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

  // Set Master / Primary Resume Action
  const handleSetPrimary = async (resumeId) => {
    try {
      const updated = await resumesApi.setPrimary(resumeId);
      toast.success(`'${updated.name}' set as Master Workspace.`);
      await Promise.all([loadDashboardData(), fetchPlanStatus()]);
    } catch (err) {
      toast.error(err.message || 'Failed to set master workspace');
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
  const templateCount = systemTemplates.length + userTemplates.length;
  const totalCustomTemplates = Math.max(usageStats?.total_templates_created ?? 0, userTemplates.length);
  const wiserJobHelps = Math.max(usageStats?.wiser_job_helps_count ?? 0, targetedCount);
  const wiserAtsChecks = usageStats?.wiser_ats_checks_count ?? 0;
  const wiserTotal = usageStats?.wiser_total_invocations ?? (wiserJobHelps + wiserAtsChecks);
  const lifetimeWiserTotal = Math.max(usageStats?.lifetime_wiser_invocations ?? 0, wiserTotal);

  const recentResumes = [...resumes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 4);

  return (
    <div className="h-screen w-full bg-[#090B10] text-[#F1F3F9] flex font-sans overflow-hidden">
      {/* Precision Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={logout}
        onOpenUpgrade={() => setPricingModalOpen(true)}
        planStatus={planStatus}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 shrink-0 border-b backdrop-blur-md"
          style={{ background: 'rgba(9,11,16,0.9)', borderColor: BRAND_CONFIG.colors.borderSubtle }}
        >
          <BrandLockup
            size={24}
            badgeText={
              planStatus?.plan_type === 'pilot'
                ? 'Pilot'
                : planStatus?.plan_type === 'pro_monthly'
                ? 'Pro'
                : planStatus?.plan_type === 'day_pass'
                ? 'Day Pass'
                : 'Free'
            }
          />
          <Link href="/settings" className="p-2 text-[#7E869B] hover:text-white">
            <Settings className="w-4 h-4" />
          </Link>
        </header>

        {/* Content Body - Independent Vertical Scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-8 w-full max-w-7xl mx-auto pb-24 md:pb-12">
          {/* Mobile Screen Recommendation Notice */}
          <MobileNotice className="mb-4" />

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
                    onClick={() => setPricingModalOpen(true)}
                    className="flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
                  >
                    <span>{planStatus?.plan_name || 'Upgrade Plan'}</span>
                  </button>

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

              {/* Quick Workspace Stats Header */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7E869B]">
                  Workspace Quick Metrics
                </span>
                <button
                  onClick={() => setActiveTab('usage')}
                  className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Intelligence &amp; Usage Telemetry</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bento Metric Matrix */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={FileText}
                  value={resumeCount}
                  label="Master Resumes"
                  subtext={`${totalResumes} all-time crafted`}
                  highlightColor="#C88A58"
                />
                <MetricCard
                  icon={Cpu}
                  value={wiserTotal}
                  label="Wiser AI Actions"
                  subtext={`${lifetimeWiserTotal} lifetime invocations`}
                  highlightColor="#F59E0B"
                />
                <MetricCard
                  icon={Palette}
                  value={templateCount}
                  label="Available Formats"
                  subtext={`${systemTemplates.length} Standard + ${userTemplates.length} Custom`}
                  highlightColor="#10B981"
                />
                <MetricCard
                  icon={Download}
                  value={totalExports}
                  label="Verified Exports"
                  subtext={`${exportCount} active in workspace`}
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
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#C88A58] hover:bg-[#B87A47] transition-all inline-flex items-center gap-1.5 shadow-sm"
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
                          {/* Status and Targeting Pill */}
                          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                            {resume.is_primary ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40">
                                ★ Master Workspace
                              </span>
                            ) : resume.is_locked ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30">
                                🔒 Read-Only
                              </span>
                            ) : null}

                            {resume.target_job_title ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 truncate max-w-[170px]">
                                🎯 {resume.target_company ? `${resume.target_company} · ` : ''}{resume.target_job_title}
                              </span>
                            ) : !resume.is_primary && !resume.is_locked ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-[#7E869B] bg-white/[0.04] border border-white/[0.06]">
                                Workspace
                              </span>
                            ) : null}
                          </div>

                          <h3 className="font-bold text-sm text-[#F1F3F9] group-hover:text-amber-400 transition-colors line-clamp-1">
                            {resume.name}
                          </h3>

                          <p className="text-[11px] text-[#7E869B] mt-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#7E869B]" />
                            <span>Updated {relativeDate(resume.updated_at)}</span>
                          </p>
                        </div>

                        <div className="pt-4 mt-3 border-t border-white/[0.06] flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/builder?id=${resume.id}`}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-[#C88A58] hover:text-white text-[#EDEDF2] transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span>{resume.is_locked ? 'View' : 'Open'}</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>

                            {!resume.is_primary && (
                              <button
                                onClick={() => handleSetPrimary(resume.id)}
                                className="px-2 py-1.5 rounded-lg text-[10px] font-mono text-[#D49A6A] hover:text-white bg-[#C88A58]/10 hover:bg-[#C88A58]/25 border border-[#C88A58]/20 transition cursor-pointer"
                                title="Set this resume as your Primary Master workspace"
                              >
                                Set Master
                              </button>
                            )}
                          </div>

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
                  className="px-4 py-2 bg-[#C88A58] hover:bg-[#B87A47] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
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
                          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {resume.is_primary ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40">
                                  ★ Master Workspace
                                </span>
                              ) : resume.is_locked ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30">
                                  🔒 Read-Only Workspace
                                </span>
                              ) : null}

                              {resume.target_job_title ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-semibold truncate max-w-[180px]">
                                  🎯 {resume.target_company ? `${resume.target_company} · ` : ''}{resume.target_job_title}
                                </span>
                              ) : !resume.is_primary && !resume.is_locked ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-[#7E869B] bg-white/[0.04] border border-white/[0.06]">
                                  Workspace
                                </span>
                              ) : null}
                            </div>

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

                        <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/builder?id=${resume.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-[#C88A58] hover:text-white text-[#EDEDF2] transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{resume.is_locked ? 'View (Read-Only)' : 'Launch Studio'}</span>
                            </Link>

                            {!resume.is_primary && (
                              <button
                                onClick={() => handleSetPrimary(resume.id)}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-[#D49A6A] hover:text-white bg-[#C88A58]/10 hover:bg-[#C88A58]/25 border border-[#C88A58]/20 transition cursor-pointer"
                                title="Promote this resume to your Master active workspace"
                              >
                                Set as Master
                              </button>
                            )}
                          </div>

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
                    Industry Formats ({systemTemplates.length})
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
                  {systemTemplates.map((tpl) => {
                    const isLocked = tpl.is_locked;
                    const isPro = tpl.min_plan_tier === 'pro_monthly';
                    const isDayPass = tpl.min_plan_tier === 'day_pass';

                    return (
                      <div
                        key={tpl.id}
                        className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group relative ${
                          isLocked ? 'border-white/[0.08] opacity-90' : 'hover:border-amber-500/40'
                        }`}
                        style={{
                          background: BRAND_CONFIG.colors.surfaceCard,
                          border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                        }}
                      >
                        <div>
                          {/* Format category badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold flex items-center gap-1 ${
                              isPro
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                : isDayPass
                                ? 'bg-[#C88A58]/15 text-[#D49A6A] border-[#C88A58]/30'
                                : 'bg-white/[0.04] text-[#8E94A5] border-white/[0.08]'
                            }`}>
                              {isLocked && <Lock className="w-2.5 h-2.5" />}
                              {tpl.tag || (isPro ? 'Pro Exclusive' : isDayPass ? 'Day Pass' : 'Standard Free')}
                            </span>
                            <span className="text-[10px] text-[#7E869B] font-mono">
                              {tpl.settings?.bodyFont?.split(',')[0]}
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-[#F1F3F9] group-hover:text-amber-400 transition-colors flex items-center gap-2">
                            <span>{tpl.name}</span>
                            {isLocked && <Lock className="w-3.5 h-3.5 text-[#7E869B] shrink-0" />}
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
                            <div className="flex justify-between">
                              <span>Required Plan:</span>
                              <span className={`font-semibold ${isPro ? 'text-indigo-400' : isDayPass ? 'text-[#D49A6A]' : 'text-emerald-400'}`}>
                                {isPro ? 'Pagewise Pro' : isDayPass ? 'Day Pass / Pro' : 'Free Forever'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                          {isLocked ? (
                            <button
                              onClick={() => setPricingModalOpen(true)}
                              className="w-full py-2 bg-gradient-to-r from-amber-500/10 to-[#C88A58]/20 hover:from-amber-500/20 hover:to-[#C88A58]/30 text-[#D49A6A] border border-[#C88A58]/30 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5 text-[#D49A6A]" />
                              <span>Unlock with {isPro ? 'Pagewise Pro' : 'Wiser Day Pass'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTemplateKey(tpl.id);
                                setNewResumeName(`${tpl.name} Resume`);
                                setIsCreateModalOpen(true);
                              }}
                              className="w-full py-2 bg-white/[0.06] hover:bg-[#C88A58] hover:text-white text-[#EDEDF2] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Use This Architecture</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-[#C88A58] hover:text-white text-[#EDEDF2] transition-all cursor-pointer"
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
                                  className="px-2.5 py-1 bg-white/[0.06] hover:bg-[#C88A58] hover:text-white rounded-lg text-xs font-semibold text-[#EDEDF2] transition-all flex items-center gap-1 cursor-pointer"
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
              {/* Header with Duration Filter */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-white/[0.06]">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#F1F3F9] tracking-tight">
                    Intelligence &amp; Usage Telemetry
                  </h1>
                  <p className="text-xs text-[#7E869B] mt-1">
                    Audited resource quotas, billing duration breakdown, and Wiser AI engine telemetry.
                  </p>
                </div>

                {/* Primary Duration / Billing Cycle Filter */}
                <div className="flex items-center gap-1.5 bg-[#12141D] p-1.5 rounded-2xl border border-white/[0.08] self-start lg:self-auto overflow-x-auto max-w-full">
                  {BILLING_PERIODS.map((bp) => (
                    <button
                      key={bp.key}
                      onClick={() => handleSelectPeriod(bp.key)}
                      disabled={loadingStats}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        selectedPeriod === bp.key
                          ? 'bg-amber-500 text-black shadow-lg font-bold'
                          : 'text-[#7E869B] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedicated Plan Allowance & Telemetry Limits Card */}
              <div
                className="rounded-2xl p-6 space-y-6"
                style={{
                  background: BRAND_CONFIG.colors.surfaceCard,
                  border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
                        Plan Quota Matrix
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          planStatus?.plan_type === 'pilot'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : planStatus?.plan_type === 'pro_monthly'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : planStatus?.plan_type === 'day_pass'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {planStatus?.plan_name || 'Pagewise Free'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-[#F1F3F9] mt-1">
                      Current Plan Allowance &amp; Telemetry Limits
                    </h2>
                    <p className="text-xs text-[#7E869B] mt-0.5">
                      Strict limit tracking across your active workspaces, exports, and Wiser AI evaluations.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {planStatus?.expires_at && (
                      <div className="text-right">
                        <span className="text-[10px] text-[#7E869B] uppercase font-mono block">Pass Expires</span>
                        <span className="text-xs font-mono font-bold text-[#D49A6A]">
                          {new Date(planStatus.expires_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => setPricingModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#C88A58] hover:bg-[#B87A47] text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
                    >
                      {planStatus?.plan_type === 'pro_monthly' ? 'Manage Plan' : 'Upgrade Plan'}
                    </button>
                  </div>
                </div>

                {/* Quota Progress Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. Resume Workspaces */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F1F3F9]">Resume Workspaces</span>
                      <span className="text-xs font-mono text-[#7E869B]">
                        <strong className="text-white">{planStatus?.usage?.active_resumes ?? 0}</strong> / {planStatus?.limits?.resumes ?? 1}
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          (planStatus?.remaining?.resumes ?? 0) === 0 ? 'bg-rose-500' : 'bg-[#C88A58]'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(((planStatus?.usage?.active_resumes ?? 0) / (planStatus?.limits?.resumes || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7E869B]">
                      <span>{planStatus?.remaining?.resumes ?? 0} workspace(s) left</span>
                      {(planStatus?.remaining?.resumes ?? 0) === 0 ? (
                        <span className="text-rose-400 font-semibold">Limit Reached</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Active</span>
                      )}
                    </div>
                  </div>

                  {/* 2. Verified Exports */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F1F3F9]">Verified Exports</span>
                      <span className="text-xs font-mono text-[#7E869B]">
                        <strong className="text-white">{planStatus?.usage?.exports_used ?? 0}</strong> / {planStatus?.limits?.exports ?? 1}
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          (planStatus?.remaining?.exports ?? 0) === 0 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(((planStatus?.usage?.exports_used ?? 0) / (planStatus?.limits?.exports || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7E869B]">
                      <span>{planStatus?.remaining?.exports ?? 0} export(s) left</span>
                      {(planStatus?.remaining?.exports ?? 0) === 0 ? (
                        <span className="text-rose-400 font-semibold">Exhausted</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Available</span>
                      )}
                    </div>
                  </div>

                  {/* 3. Wiser Job Help */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F1F3F9]">Wiser Job Help (JD Match)</span>
                      <span className="text-xs font-mono text-[#7E869B]">
                        <strong className="text-white">{planStatus?.usage?.wiser_job_help_used ?? 0}</strong> / {planStatus?.limits?.wiser_job_help ?? 1}
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          (planStatus?.remaining?.wiser_job_help ?? 0) === 0 ? 'bg-rose-500' : 'bg-sky-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(((planStatus?.usage?.wiser_job_help_used ?? 0) / (planStatus?.limits?.wiser_job_help || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7E869B]">
                      <span>{planStatus?.remaining?.wiser_job_help ?? 0} analysis left</span>
                      {(planStatus?.remaining?.wiser_job_help ?? 0) === 0 ? (
                        <span className="text-rose-400 font-semibold">Exhausted</span>
                      ) : (
                        <span className="text-sky-400 font-semibold">Available</span>
                      )}
                    </div>
                  </div>

                  {/* 4. Wiser ATS Check */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F1F3F9]">Wiser ATS Evaluations</span>
                      <span className="text-xs font-mono text-[#7E869B]">
                        <strong className="text-white">{planStatus?.usage?.wiser_ats_used ?? 0}</strong> / {planStatus?.limits?.wiser_ats ?? 1}
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          (planStatus?.remaining?.wiser_ats ?? 0) === 0 ? 'bg-rose-500' : 'bg-indigo-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(((planStatus?.usage?.wiser_ats_used ?? 0) / (planStatus?.limits?.wiser_ats || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7E869B]">
                      <span>{planStatus?.remaining?.wiser_ats ?? 0} evaluation(s) left</span>
                      {(planStatus?.remaining?.wiser_ats ?? 0) === 0 ? (
                        <span className="text-rose-400 font-semibold">Exhausted</span>
                      ) : (
                        <span className="text-indigo-400 font-semibold">Available</span>
                      )}
                    </div>
                  </div>

                  {/* 5. Custom Templates */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F1F3F9]">Custom Style Presets</span>
                      <span className="text-xs font-mono text-[#7E869B]">
                        <strong className="text-white">{planStatus?.usage?.custom_templates_count ?? 0}</strong> / {planStatus?.limits?.custom_templates ?? 1}
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          (planStatus?.remaining?.custom_templates ?? 0) === 0 ? 'bg-rose-500' : 'bg-purple-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(((planStatus?.usage?.custom_templates_count ?? 0) / (planStatus?.limits?.custom_templates || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7E869B]">
                      <span>{planStatus?.remaining?.custom_templates ?? 0} preset(s) left</span>
                      {(planStatus?.remaining?.custom_templates ?? 0) === 0 ? (
                        <span className="text-rose-400 font-semibold">Exhausted</span>
                      ) : (
                        <span className="text-purple-400 font-semibold">Available</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Duration Status Banner */}
              <div className="p-4 rounded-2xl bg-[#111319] border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">
                        Active Timeframe: {usageStats?.period_label || 'All Time'}
                      </span>
                      {loadingStats && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />}
                    </div>
                    <p className="text-[11px] text-[#7E869B] font-mono mt-0.5">
                      {usageStats?.period_start
                        ? `${new Date(usageStats.period_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${
                            usageStats?.period_end
                              ? new Date(usageStats.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Present'
                          } (UTC)`
                        : 'Cumulative all-time workspace ledger history'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#9DA4B7] border border-white/[0.07]">
                    Ledger Status: <span className="text-emerald-400 font-semibold">Active &amp; Verified</span>
                  </span>
                </div>
              </div>

              {/* Bento Metric Matrix for the selected duration */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={FileText}
                  value={selectedPeriod === 'all' ? totalResumes : (usageStats?.period_resumes_created ?? 0)}
                  label={selectedPeriod === 'all' ? 'Master Resumes' : `Resumes (${usageStats?.period_label || 'Period'})`}
                  subtext={`${resumeCount} active in studio`}
                  highlightColor="#C88A58"
                />
                <MetricCard
                  icon={Cpu}
                  value={wiserTotal}
                  label={selectedPeriod === 'all' ? 'Wiser AI Actions' : `Wiser AI (${usageStats?.period_label || 'Period'})`}
                  subtext={`${wiserJobHelps} JD + ${wiserAtsChecks} ATS checks`}
                  highlightColor="#F59E0B"
                />
                <MetricCard
                  icon={Download}
                  value={selectedPeriod === 'all' ? totalExports : (usageStats?.period_exports_generated ?? 0)}
                  label={selectedPeriod === 'all' ? 'Verified Exports' : `Exports (${usageStats?.period_label || 'Period'})`}
                  subtext={`${exportCount} active in studio`}
                  highlightColor="#E2E8F0"
                />
                <MetricCard
                  icon={Palette}
                  value={selectedPeriod === 'all' ? totalCustomTemplates : (usageStats?.period_templates_created ?? 0)}
                  label={selectedPeriod === 'all' ? 'Custom Style Presets' : `Presets (${usageStats?.period_label || 'Period'})`}
                  subtext={`${userTemplates.length} active in studio`}
                  highlightColor="#10B981"
                />
              </div>

              {/* Dual Quota & Resource Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Workspace Resource Allocations (Dual Bar: Total Footprint vs Active) */}
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
                        Active assets in studio vs audited generation ledger
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Dual-Track Accounting
                    </span>
                  </div>

                  <div className="space-y-4 pt-2">
                    <ResourceBar
                      label="Master Resume Architectures"
                      primaryValue={selectedPeriod === 'all' ? totalResumes : (usageStats?.period_resumes_created ?? 0)}
                      secondaryValue={resumeCount}
                      max={25}
                      unit="resumes"
                    />
                    <ResourceBar
                      label="Job-Targeted Branches"
                      primaryValue={targetedCount}
                      max={20}
                      unit="branches"
                    />
                    <ResourceBar
                      label="Verified Document Exports"
                      primaryValue={selectedPeriod === 'all' ? totalExports : (usageStats?.period_exports_generated ?? 0)}
                      secondaryValue={exportCount}
                      max={50}
                      unit="files"
                    />
                    <ResourceBar
                      label="Custom Style Presets"
                      primaryValue={selectedPeriod === 'all' ? totalCustomTemplates : (usageStats?.period_templates_created ?? 0)}
                      secondaryValue={userTemplates.length}
                      max={15}
                      unit="presets"
                    />
                  </div>
                </div>

                {/* 2. Wiser AI Processing & Quota Metering */}
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
                        <Cpu className="w-4 h-4 text-amber-400" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1F3F9]">
                          Wiser AI Engine Processing
                        </h2>
                      </div>
                      <p className="text-[11px] text-[#7E869B] mt-0.5">
                        Autonomous career telemetry and diagnostic throughput
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                      Subscription Meter
                    </span>
                  </div>

                  <div className="space-y-4 pt-2">
                    <ResourceBar
                      label="Wiser Job Helps (JD + ATS Matching Runs)"
                      primaryValue={wiserJobHelps}
                      max={50}
                      unit="runs"
                    />
                    <ResourceBar
                      label="Wiser ATS Audits (Standalone Diagnostics)"
                      primaryValue={wiserAtsChecks}
                      max={50}
                      unit="audits"
                    />
                    <ResourceBar
                      label={`Total Wiser AI Invocations (${usageStats?.period_label || 'Selected Duration'})`}
                      primaryValue={wiserTotal}
                      max={100}
                      unit="actions"
                    />
                  </div>

                  {selectedPeriod !== 'all' && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs text-[#9DA4B7]">
                      <span>All-Time Cumulative Wiser Invocations:</span>
                      <span className="font-mono font-bold text-white">
                        {usageStats?.lifetime_wiser_invocations ?? wiserTotal} actions
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Compliance & Accounting Policies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] text-[#9DA4B7] shrink-0 border border-white/[0.06]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F3F9]">
                      Audit Retention &amp; Historical Ledger
                    </h3>
                    <p className="text-xs text-[#7E869B] leading-relaxed">
                      Document creation records, export transactions, and style configurations are permanently preserved in your workspace ledger. Deleting a document from your active list removes it from the editor view while maintaining an accurate compliance and billing audit trail.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] text-[#9DA4B7] shrink-0 border border-white/[0.06]">
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F3F9]">
                      Wiser Metering &amp; Quota Enforcement
                    </h3>
                    <p className="text-xs text-[#7E869B] leading-relaxed">
                      Wiser AI processing—encompassing Job Description targeting and ATS compliance evaluations—is metered per billing period. Usage counters automatically reconcile against plan quotas at the beginning of each billing cycle.
                    </p>
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
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#F1F3F9]">
                    Recent Modifications &amp; Audits
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#7E869B]">
                    {resumes.length} tracked records
                  </span>
                </div>

                {resumes.length === 0 ? (
                  <p className="text-xs text-[#7E869B]">No recent activity recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {resumes.slice(0, 6).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/[0.04]"
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
              {systemTemplates.map((tpl) => {
                const isLocked = tpl.is_locked;
                const isSelected = selectedTemplateKey === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      if (isLocked) {
                        toast.error(`'${tpl.name}' requires ${tpl.min_plan_tier === 'pro_monthly' ? 'Pagewise Pro' : 'Day Pass'}. Please upgrade.`);
                        setPricingModalOpen(true);
                        return;
                      }
                      setSelectedTemplateKey(tpl.id);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10'
                        : isLocked
                        ? 'border-white/[0.04] bg-white/[0.01] opacity-75 hover:border-amber-500/30'
                        : 'hover:border-white/20'
                    }`}
                    style={{
                      background: BRAND_CONFIG.colors.surfaceCard,
                      borderColor: isSelected ? undefined : BRAND_CONFIG.colors.borderSubtle,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white line-clamp-1">{tpl.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {isLocked && !isSelected && <Lock className="w-3 h-3 text-[#7E869B] shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-[#7E869B] line-clamp-1">{tpl.tag || tpl.category}</p>
                      {isLocked && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                          {tpl.min_plan_tier === 'pro_monthly' ? 'Pro' : 'Day Pass'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
              className="px-4 py-2 bg-[#C88A58] hover:bg-[#B87A47] text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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

      {/* ── MODAL: PRICING & RAZORPAY UPGRADE ────────────────────────────── */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        currentPlan={planStatus?.plan_type || 'free'}
        planStatus={planStatus}
        onNavigateUsage={() => setActiveTab('usage')}
        onPlanUpdated={(newPlan) => {
          setPlanStatus(newPlan);
          fetchPlanStatus();
          loadDashboardData();
        }}
      />
    </div>
  );
}
