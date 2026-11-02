'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Target,
  ShieldCheck,
  TrendingUp,
  Layers,
  Copy,
  Zap,
  Briefcase,
  Award,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { resumesApi } from '@/lib/api';
import { useResumeStore } from '@/lib/resume/store';

/* ─── ATS Score SVG Gauge ─────────────────────────────────────────── */
function AtsGauge({ score }) {
  const radius = 52;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor;
  if (score > 85) strokeColor = '#10b981'; // emerald-500
  else if (score > 65) strokeColor = '#3b82f6'; // blue-500
  else if (score >= 40) strokeColor = '#f59e0b'; // amber-500
  else strokeColor = '#ef4444'; // red-500

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={radius * 2 + strokeWidth * 2}
        height={radius * 2 + strokeWidth * 2}
        className="-rotate-90"
      >
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl sm:text-5xl font-black text-white leading-none">{score}</span>
        <span className="text-[11px] text-[#6b7280] font-mono mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

/* ─── Grade badge colour ──────────────────────────────────────────── */
function getGradeBadgeCls(score) {
  if (score > 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (score > 65) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
}

/* ─── Main Component: Wiser AI Career Intelligence Suite ─────────── */
export default function JDAnalyzerModal({ isOpen, onClose }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    resumeId,
    resumeName,
    header,
    sections,
    settings,
    targetJobDescription,
    activeJdAnalysis,
    setActiveJdAnalysis,
  } = useResumeStore();

  // Wiser Mode: 'jobhelp' (JD + ATS) | 'standalone_ats' (No JD required)
  const [wiserMode, setWiserMode] = useState('jobhelp');

  const [jobDescription, setJobDescription] = useState(targetJobDescription || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(activeJdAnalysis || null);
  const [standaloneResult, setStandaloneResult] = useState(null);
  const [activeTab, setActiveTab] = useState('ats'); // 'ats' | 'jobmatch' | 'enhancements'
  const [isCloningResume, setIsCloningResume] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isAnalyzing && !isCloningResume) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, isAnalyzing, isCloningResume, onClose]);

  // Synchronize persisted JD text and analysis if available
  useEffect(() => {
    if (isOpen) {
      if (activeJdAnalysis) {
        setAnalysisResult(activeJdAnalysis);
      }
      if (targetJobDescription && !jobDescription) {
        setJobDescription(targetJobDescription);
      }
    }
  }, [isOpen, activeJdAnalysis, targetJobDescription]);

  if (!isOpen || !mounted) return null;

  /* ── 1. Wiser Job Help Analysis (JD + ATS) ── */
  const handleStartJdAnalysis = async () => {
    if (!jobDescription || jobDescription.trim().length < 40) {
      toast.error('Please paste a substantive Job Description (at least 40 characters).');
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading('Wiser AI analyzing JD & running strict ATS check…');

    try {
      const payload = {
        resumeId: resumeId || null,
        jobDescription: jobDescription.trim(),
        currentResumeOverride: {
          id: resumeId,
          name: resumeName,
          header_json: header,
          settings_json: settings,
          sections_json: sections,
        },
      };

      const res = await resumesApi.analyzeJobDescription(payload);
      if (res && res.success && res.data) {
        setAnalysisResult(res.data);
        setActiveJdAnalysis(res.data);
        const jobAn = res.data.job_analysis || {};
        const atsCk = res.data.ats_check || {};
        useResumeStore.setState({
          activeJdAnalysis: res.data,
          targetJobDescription: jobAn.summary || jobDescription.trim().slice(0, 300),
          targetJobTitle: jobAn.title || null,
          targetCompany: jobAn.company || null,
          targetAtsScore: atsCk.overall_score ?? null,
        });
        setActiveTab('ats');
        toast.success('Wiser Job Help analysis ready!', { id: toastId });
      } else {
        throw new Error('Analysis completed with unexpected response structure.');
      }
    } catch (err) {
      console.error('[Wiser JD Analysis error]:', err);
      toast.error(err.message || 'Failed to analyze Job Description', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ── 2. Wiser Standalone ATS Audit (No JD Required) ── */
  const handleStartStandaloneAts = async () => {
    setIsAnalyzing(true);
    const toastId = toast.loading('Running Wiser ATS compliance & keyword audit…');

    try {
      const payload = {
        resumeId: resumeId || null,
        currentResumeOverride: {
          id: resumeId,
          name: resumeName,
          header_json: header,
          settings_json: settings,
          sections_json: sections,
        },
      };

      const res = await resumesApi.analyzeStandaloneAts(payload);
      if (res && res.success && res.data) {
        setStandaloneResult(res.data);
        const atsCk = res.data.ats_check || {};
        const inferred = res.data.inferred_domain || {};
        useResumeStore.setState({
          targetAtsScore: atsCk.overall_score ?? null,
          targetJobTitle: inferred.title || useResumeStore.getState().targetJobTitle,
        });
        toast.success('Wiser Standalone ATS Audit complete!', { id: toastId });
      } else {
        throw new Error('Standalone ATS analysis returned unexpected structure.');
      }
    } catch (err) {
      console.error('[Wiser Standalone ATS error]:', err);
      toast.error(err.message || 'Failed to complete Wiser ATS audit', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ── Clone into targeted resume ── */
  const handleCreateTargetedResume = async () => {
    if (!resumeId) {
      toast.error('No resume loaded.');
      return;
    }
    setIsCloningResume(true);
    const toastId = toast.loading('Cloning your resume into a targeted version…');
    try {
      const cloned = await resumesApi.cloneResume(resumeId, {
        targetJobTitle: analysisResult?.job_analysis?.title || '',
        targetCompany: analysisResult?.job_analysis?.company || '',
        targetAtsScore: analysisResult?.ats_check?.overall_score ?? null,
        targetJobDescription: jobDescription.trim(),
      });
      toast.success('Targeted resume created!', { id: toastId });
      onClose();
      router.push('/builder?id=' + cloned.id);
    } catch (err) {
      console.error('[Clone resume error]:', err);
      toast.error(err.message || 'Failed to clone resume.', { id: toastId });
    } finally {
      setIsCloningResume(false);
    }
  };

  /* ── Copy bullet suggestion ── */
  const handleCopySuggestion = (sug) => {
    const cleanText = sug.enhanced_html?.replace(/<[^>]+>/g, '') || '';
    if (cleanText) {
      navigator.clipboard.writeText(cleanText);
      setCopiedId(sug.id);
      toast.success('Copied enhanced bullet to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleEnhanceManually = () => {
    if (wiserMode === 'jobhelp' && setActiveJdAnalysis) {
      setActiveJdAnalysis(analysisResult);
    }
    onClose();
  };

  const currentResult = wiserMode === 'jobhelp' ? analysisResult : standaloneResult;
  const atsScore = currentResult?.ats_check?.overall_score ?? 0;
  const atsGrade = currentResult?.ats_check?.grade ?? 'N/A';

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        onClick={() => !isAnalyzing && !isCloningResume && onClose()}
      />

      {/* Modal Shell */}
      <div
        className="relative z-10 w-full max-w-5xl flex flex-col rounded-2xl overflow-hidden shadow-2xl text-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150"
        style={{
          background: '#090b13',
          border: '1px solid rgba(255,255,255,0.08)',
          height: '88vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Bar with Wiser Branding & Mode Switcher ── */}
        <div
          className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0"
          style={{ background: '#111420', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}
            >
              <Target className="w-4 h-4 text-[#f97316]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  Wiser AI Studio
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold text-orange-400 bg-orange-500/15 border border-orange-500/30">
                  Career Intelligence
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280]">
                {wiserMode === 'jobhelp'
                  ? 'Match your resume to a specific job description and tailor your bullets.'
                  : 'Instant enterprise ATS audit: power verbs, quantified metrics, and keyword positioning.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Pill */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setWiserMode('jobhelp')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  wiserMode === 'jobhelp'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-[#7E869B] hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Wiser Job Help (JD + ATS)</span>
              </button>
              <button
                type="button"
                onClick={() => setWiserMode('standalone_ats')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  wiserMode === 'standalone_ats'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-[#7E869B] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Wiser Standalone ATS</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isAnalyzing || isCloningResume}
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* ── LEFT PANEL: Mode Input / Controls ── */}
          <div
            className="w-full lg:w-[370px] shrink-0 flex flex-col p-4 space-y-4 overflow-y-auto"
            style={{
              background: '#090b13',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {wiserMode === 'jobhelp' ? (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold flex items-center gap-1.5 text-[#e2e8f0]">
                    <FileSearch className="w-3.5 h-3.5 text-[#f97316]" />
                    <span>Target Job Description</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#6b7280]">
                    {jobDescription.length} chars
                  </span>
                </div>

                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job posting here (responsibilities, required tools, tech stack, qualifications)…"
                  disabled={isAnalyzing}
                  className="w-full flex-1 min-h-[220px] lg:min-h-[380px] rounded-xl p-3 text-xs placeholder-zinc-600 focus:outline-none resize-none font-sans leading-relaxed"
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e2e8f0',
                  }}
                />

                <button
                  type="button"
                  disabled={isAnalyzing || !jobDescription.trim()}
                  onClick={handleStartJdAnalysis}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(to right, #f97316, #ea580c)',
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Role &amp; ATS…</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span>Run Wiser Job Help</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              /* Standalone ATS Left Panel */
              <div className="flex flex-col justify-between h-full space-y-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Autonomous ATS Audit</span>
                    </div>
                    <p className="text-[11px] text-[#9DA4B7] leading-relaxed">
                      Wiser audits your resume against algorithms used by Workday, Greenhouse, Lever, and Taleo.
                      No job description needed — get positioning scores, action verb checks, and metric density ratings.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2.5 text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E869B]">
                      Active Target Resume
                    </span>
                    <p className="font-bold text-white text-sm truncate">{resumeName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#7E869B]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {sections.length} sections detected
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-[#7E869B]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white font-semibold">
                      Audit Checklist:
                    </span>
                    <ul className="space-y-1.5 text-[11px]">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Formatting &amp; parseability compliance
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Quantified outcome density (% &amp; $)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Active executive power verbs
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Industry keyword positioning
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleStartStandaloneAts}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Auditing Resume…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Run Wiser ATS Audit</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Results & Intelligence ── */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#090b13' }}>
            {currentResult ? (
              <>
                {/* Result Sub-tabs */}
                <div
                  className="flex items-center justify-between px-4 shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#111420' }}
                >
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('ats')}
                      className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'ats'
                          ? 'border-[#f97316] text-[#f97316]'
                          : 'border-transparent text-[#6b7280] hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ATS Score ({atsScore}%)</span>
                    </button>

                    {wiserMode === 'jobhelp' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('jobmatch')}
                        className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                          activeTab === 'jobmatch'
                            ? 'border-[#f97316] text-[#f97316]'
                            : 'border-transparent text-[#6b7280] hover:text-white'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Job Match</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTab('enhancements')}
                      className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'enhancements'
                          ? 'border-[#f97316] text-[#f97316]'
                          : 'border-transparent text-[#6b7280] hover:text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>
                        Bullet Enhancements ({currentResult?.section_enhancements?.reduce((acc, s) => acc + (s.suggestions?.length || 0), 0) || 0})
                      </span>
                    </button>
                  </div>

                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold ${getGradeBadgeCls(
                      atsScore
                    )}`}
                  >
                    {atsGrade}
                  </span>
                </div>

                {/* ── Sub-Tab 1: ATS Score & Diagnostics ── */}
                {activeTab === 'ats' && (
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Inferred domain banner for standalone ATS */}
                    {currentResult.inferred_domain && (
                      <div
                        className="p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                        style={{ background: '#111420', border: '1px solid rgba(249,115,22,0.25)' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <Briefcase className="w-4 h-4 text-orange-400 shrink-0" />
                          <div>
                            <span className="font-mono text-[10px] text-orange-400 uppercase font-semibold">
                              Inferred Career Focus:
                            </span>
                            <p className="font-bold text-white text-xs sm:text-sm">
                              {currentResult.inferred_domain.title}{' '}
                              {currentResult.inferred_domain.seniority ? `· ${currentResult.inferred_domain.seniority}` : ''}
                            </p>
                          </div>
                        </div>
                        {currentResult.inferred_domain.industry && (
                          <span className="hidden sm:inline font-mono text-[10px] text-[#7E869B] px-2 py-1 rounded bg-black/40 border border-white/[0.05]">
                            {currentResult.inferred_domain.industry}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Gauge + Sub-Scores */}
                    <div
                      className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl"
                      style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <AtsGauge score={atsScore} />
                      <div className="flex-1 space-y-3 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">ATS Compliance Benchmark</h3>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getGradeBadgeCls(
                              atsScore
                            )}`}
                          >
                            {atsGrade}
                          </span>
                        </div>

                        {/* Category subscores */}
                        {currentResult.ats_check?.category_scores && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            {Object.entries(currentResult.ats_check.category_scores).map(([k, v]) => (
                              <div
                                key={k}
                                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg"
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                              >
                                <span className="text-[10px] capitalize text-[#6b7280]">
                                  {k.replace(/_/g, ' ')}:
                                </span>
                                <span className="font-bold text-[#e2e8f0]">{v}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Keyword Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Matched */}
                      <div
                        className="p-4 rounded-xl space-y-3"
                        style={{ background: '#111420', border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {wiserMode === 'jobhelp' ? 'Matched Role Keywords' : 'Verified Positioning Keywords'} ({currentResult.ats_check?.matched_keywords?.length || 0})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {currentResult.ats_check?.matched_keywords?.map((kw, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                              style={{
                                background: 'rgba(16,185,129,0.1)',
                                border: '1px solid rgba(16,185,129,0.3)',
                                color: '#6ee7b7',
                              }}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing or Recommended */}
                      <div
                        className="p-4 rounded-xl space-y-3"
                        style={{
                          background: '#111420',
                          border: wiserMode === 'jobhelp' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)',
                        }}
                      >
                        <div
                          className={`flex items-center gap-2 font-semibold text-xs ${
                            wiserMode === 'jobhelp' ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>
                            {wiserMode === 'jobhelp'
                              ? `Missing Role Keywords (${currentResult.ats_check?.missing_keywords?.length || 0})`
                              : `Recommended Industry Keywords (${currentResult.ats_check?.recommended_keywords?.length || 0})`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(wiserMode === 'jobhelp'
                            ? currentResult.ats_check?.missing_keywords
                            : currentResult.ats_check?.recommended_keywords
                          )?.map((kw, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                              style={{
                                background: wiserMode === 'jobhelp' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                border: wiserMode === 'jobhelp' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)',
                                color: wiserMode === 'jobhelp' ? '#fca5a5' : '#fcd34d',
                              }}
                            >
                              + {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Red Flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div
                        className="p-4 rounded-xl space-y-2"
                        style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <span className="font-semibold flex items-center gap-1.5 text-[#e2e8f0]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Audit Passes &amp; Strengths</span>
                        </span>
                        <ul className="space-y-1.5 text-[#6b7280]">
                          {(currentResult.ats_check?.positives || currentResult.ats_check?.identified_strengths)?.map(
                            (p, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                <span className="text-emerald-500 shrink-0">✓</span>
                                <span>{p}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div
                        className="p-4 rounded-xl space-y-2"
                        style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                          <span>Critical Gaps &amp; Action Items</span>
                        </span>
                        <ul className="space-y-1.5 text-[#6b7280]">
                          {(currentResult.ats_check?.improvements || currentResult.ats_check?.critical_issues)?.map(
                            (imp, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                <span className="text-amber-500 shrink-0">→</span>
                                <span>{imp}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Sub-Tab 2: Job Match (Role Specific) ── */}
                {activeTab === 'jobmatch' && wiserMode === 'jobhelp' && (
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div
                      className="p-4 rounded-xl space-y-3"
                      style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <h4 className="text-sm font-bold text-white">Role Overview</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-mono text-[#6b7280]">Job Title:</span>
                          <p className="font-semibold mt-0.5 text-[#e2e8f0]">
                            {currentResult.job_analysis?.title || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <span className="font-mono text-[#6b7280]">Company:</span>
                          <p className="font-semibold mt-0.5 text-[#e2e8f0]">
                            {currentResult.job_analysis?.company || 'Not detected'}
                          </p>
                        </div>
                        <div>
                          <span className="font-mono text-[#6b7280]">Seniority:</span>
                          <p className="font-semibold mt-0.5 text-[#e2e8f0]">
                            {currentResult.job_analysis?.seniority || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      {currentResult.job_analysis?.summary && (
                        <p className="text-xs leading-relaxed pt-1 text-[#6b7280]">
                          {currentResult.job_analysis.summary}
                        </p>
                      )}
                    </div>

                    <div
                      className="p-4 rounded-xl space-y-2"
                      style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <h4 className="text-sm font-bold text-white">Key Requirements</h4>
                      <ul className="space-y-1.5 text-xs text-[#e2e8f0]">
                        {currentResult.job_analysis?.key_requirements?.map((req, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2 leading-relaxed">
                            <span className="text-[#f97316] shrink-0 font-bold">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* ── Sub-Tab 3: Bullet Enhancements ── */}
                {activeTab === 'enhancements' && (
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {currentResult.section_enhancements?.length === 0 ? (
                      <div className="text-center py-12 text-[#6b7280] text-xs">
                        No section enhancements needed. Your bullets are strong and well-quantified!
                      </div>
                    ) : (
                      currentResult.section_enhancements?.map((sec, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-4 rounded-xl space-y-3"
                          style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white">{sec.section_title}</h4>
                            <span className="text-[10px] font-mono text-orange-400">
                              {sec.suggestions?.length || 0} suggestion(s)
                            </span>
                          </div>
                          {sec.critique && (
                            <p className="text-xs text-[#9DA4B7] leading-relaxed">{sec.critique}</p>
                          )}

                          <div className="space-y-3 pt-2">
                            {sec.suggestions?.map((sug) => (
                              <div
                                key={sug.id}
                                className="p-3 rounded-lg bg-black/40 border border-white/[0.05] space-y-2 text-xs"
                              >
                                {sug.original_text && (
                                  <div>
                                    <span className="text-[10px] font-mono text-rose-400 block mb-0.5">
                                      Original Bullet:
                                    </span>
                                    <p className="line-through text-[#7E869B] text-[11px] leading-relaxed">
                                      {sug.original_text}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-[10px] font-mono text-emerald-400 block mb-0.5">
                                    Wiser XYZ Upgrade:
                                  </span>
                                  <div
                                    className="text-white text-xs leading-relaxed font-sans"
                                    dangerouslySetInnerHTML={{ __html: sug.enhanced_html }}
                                  />
                                </div>
                                {sug.reasoning && (
                                  <p className="text-[10px] text-[#7E869B] italic leading-relaxed">
                                    Why: {sug.reasoning}
                                  </p>
                                )}
                                <div className="pt-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleCopySuggestion(sug)}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-[#F1F3F9] transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedId === sug.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy Bullet</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── Action Footer ── */}
                <div
                  className="shrink-0 p-4 space-y-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#111420' }}
                >
                  <p className="text-xs font-bold text-[#e2e8f0]">Next Steps:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wiserMode === 'jobhelp' ? (
                      <button
                        type="button"
                        disabled={isCloningResume}
                        onClick={handleCreateTargetedResume}
                        className="group text-left p-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-60"
                        style={{
                          background: 'rgba(249,115,22,0.06)',
                          border: '1.5px solid rgba(249,115,22,0.35)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isCloningResume ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#f97316]" />
                          ) : (
                            <Copy className="w-4 h-4 text-[#f97316]" />
                          )}
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {isCloningResume ? 'Cloning…' : 'Clone into Targeted Resume'}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#6b7280]">
                          Creates a dedicated version of this resume bound to the target position.
                        </p>
                      </button>
                    ) : (
                      <div
                        className="p-3.5 rounded-xl"
                        style={{
                          background: 'rgba(16,185,129,0.06)',
                          border: '1.5px solid rgba(16,185,129,0.35)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs sm:text-sm font-bold text-white">
                            ATS Score Saved to Resume ({atsScore}%)
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#6b7280]">
                          Your audit score has been benchmarked and updated on this master resume.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleEnhanceManually}
                      className="group text-left p-3.5 rounded-xl transition-all cursor-pointer"
                      style={{
                        background: 'rgba(59,130,246,0.06)',
                        border: '1.5px solid rgba(59,130,246,0.35)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-[#3b82f6]" />
                        <span className="text-xs sm:text-sm font-bold text-white">
                          Back to Resume Studio
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#6b7280]">
                        Apply enhancements directly in the editor using the insights above.
                      </p>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}
                >
                  <FileSearch className="w-7 h-7 text-[#f97316]" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {wiserMode === 'jobhelp'
                    ? 'Paste a Job Description on the left'
                    : 'Click "Run Wiser ATS Audit" on the left'}
                </h3>
                <p className="text-xs max-w-sm leading-relaxed text-[#6b7280]">
                  {wiserMode === 'jobhelp'
                    ? 'Wiser AI will evaluate role keyword density, score compatibility, and generate role-tailored bullet upgrades.'
                    : 'Wiser AI will audit your resume for enterprise ATS parseability, action verbs, quantified metrics, and strong positioning.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
