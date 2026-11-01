'use client';

import { useState, useEffect } from 'react';
import {
  FileSearch,
  Sparkles,
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
        {/* Track */}
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
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
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white leading-none">{score}</span>
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

/* ─── Main Component ──────────────────────────────────────────────── */
export default function JDAnalyzerModal({ isOpen, onClose }) {
  const router = useRouter();
  const { resumeId, resumeName, header, sections, settings, targetJobDescription, activeJdAnalysis, setActiveJdAnalysis } =
    useResumeStore();

  const [jobDescription, setJobDescription] = useState(targetJobDescription || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(activeJdAnalysis || null);
  const [activeTab, setActiveTab] = useState('ats'); // 'ats' | 'jobmatch'
  const [isCloningResume, setIsCloningResume] = useState(false);

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

  if (!isOpen) return null;

  /* ── Analysis ── */
  const handleStartAnalysis = async () => {
    if (!jobDescription || jobDescription.trim().length < 40) {
      toast.error('Please paste a substantive Job Description (at least 40 characters).');
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading('Analyzing JD & running strict ATS check…');

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
        // Also sync state in store
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
        toast.success('ATS Analysis ready!', { id: toastId });
      } else {
        throw new Error('Analysis completed with unexpected response structure.');
      }
    } catch (err) {
      console.error('[JD Analysis error]:', err);
      toast.error(err.message || 'Failed to analyze Job Description', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ── Clone & route ── */
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

  /* ── Enhance manually ── */
  const handleEnhanceManually = () => {
    if (setActiveJdAnalysis) setActiveJdAnalysis(analysisResult);
    onClose();
  };

  const atsScore = analysisResult?.ats_check?.overall_score ?? 0;
  const atsGrade = analysisResult?.ats_check?.grade ?? 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => !isAnalyzing && !isCloningResume && onClose()}
      />

      {/* Modal shell */}
      <div
        className="relative z-10 w-full max-w-4xl flex flex-col rounded-2xl overflow-hidden shadow-2xl text-[#e2e8f0]"
        style={{
          background: '#090b13',
          border: '1px solid rgba(255,255,255,0.08)',
          height: '85vh',
        }}
      >
        {/* ── Top bar ── */}
        <div
          className="px-5 py-3.5 flex items-center justify-between shrink-0"
          style={{ background: '#111420', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
              <Target className="w-4 h-4 text-[#f97316]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                JD Analyzer &amp; ATS Checker
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                Paste a job description to score your resume and plan your next move.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isAnalyzing || isCloningResume}
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: '#6b7280' }}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left panel – JD input */}
          <div
            className="w-full lg:w-[360px] shrink-0 flex flex-col p-4 space-y-3 overflow-y-auto"
            style={{
              background: '#090b13',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#e2e8f0' }}>
                <FileSearch className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Job Description</span>
              </label>
              <span className="text-[10px] font-mono" style={{ color: '#6b7280' }}>
                {jobDescription.length} chars
              </span>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting here (title, requirements, responsibilities, tools)…"
              disabled={isAnalyzing}
              className="w-full flex-1 min-h-[260px] lg:min-h-[420px] rounded-xl p-3 text-xs placeholder-zinc-600 focus:outline-none resize-none font-sans leading-relaxed"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e2e8f0',
              }}
            />

            <button
              type="button"
              disabled={isAnalyzing || !jobDescription.trim()}
              onClick={handleStartAnalysis}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-normal flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              style={{
                background: 'linear-gradient(to right, #f97316, #ea580c)',
                color: '#fff',
              }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze &amp; Target</span>
                </>
              )}
            </button>
          </div>

          {/* Right panel – results */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#090b13' }}>
            {analysisResult ? (
              <>
                {/* Tabs */}
                <div
                  className="flex items-center justify-between px-4 shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#111420' }}
                >
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'ats', icon: ShieldCheck, label: `ATS Score (${atsScore}%)` },
                      { id: 'jobmatch', icon: Layers, label: 'Job Match' },
                    ].map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id)}
                        className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${activeTab === id
                            ? 'border-[#f97316] text-[#f97316]'
                            : 'border-transparent hover:text-white'
                          }`}
                        style={{ color: activeTab === id ? '#f97316' : '#6b7280' }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold ${getGradeBadgeCls(atsScore)}`}
                  >
                    {atsGrade}
                  </span>
                </div>

                {/* ── ATS Score tab ── */}
                {activeTab === 'ats' && (
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Gauge + grade */}
                    <div
                      className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl"
                      style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <AtsGauge score={atsScore} />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">Strict ATS Compliance Rating</h3>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getGradeBadgeCls(atsScore)}`}>
                            {atsGrade}
                          </span>
                        </div>
                        {/* Category subscores */}
                        {analysisResult.ats_check?.category_scores && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            {Object.entries(analysisResult.ats_check.category_scores).map(([k, v]) => (
                              <div
                                key={k}
                                className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg"
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                              >
                                <span className="text-[10px] capitalize" style={{ color: '#6b7280' }}>
                                  {k.replace(/_/g, ' ')}:
                                </span>
                                <span className="font-bold" style={{ color: '#e2e8f0' }}>{v}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Matched */}
                      <div
                        className="p-4 rounded-xl space-y-3"
                        style={{ background: '#111420', border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Matched Keywords ({analysisResult.ats_check?.matched_keywords?.length || 0})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.ats_check?.matched_keywords?.map((kw, i) => (
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

                      {/* Missing */}
                      <div
                        className="p-4 rounded-xl space-y-3"
                        style={{ background: '#111420', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Missing Keywords ({analysisResult.ats_check?.missing_keywords?.length || 0})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.ats_check?.missing_keywords?.map((kw, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#fca5a5',
                              }}
                            >
                              + {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Positives & Improvements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div
                        className="p-4 rounded-xl space-y-2"
                        style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <span className="font-semibold flex items-center gap-1.5" style={{ color: '#e2e8f0' }}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ATS Format Passes</span>
                        </span>
                        <ul className="space-y-1.5" style={{ color: '#6b7280' }}>
                          {analysisResult.ats_check?.positives?.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-emerald-500 shrink-0">✓</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div
                        className="p-4 rounded-xl space-y-2"
                        style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                          <span>High Priority Improvements</span>
                        </span>
                        <ul className="space-y-1.5" style={{ color: '#6b7280' }}>
                          {analysisResult.ats_check?.improvements?.map((imp, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-amber-500 shrink-0">→</span>
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Job Match tab ── */}
                {activeTab === 'jobmatch' && (
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div
                      className="p-4 rounded-xl space-y-3"
                      style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <h4 className="text-sm font-bold text-white">Role Overview</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-mono" style={{ color: '#6b7280' }}>Job Title:</span>
                          <p className="font-semibold mt-0.5" style={{ color: '#e2e8f0' }}>
                            {analysisResult.job_analysis?.title || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <span className="font-mono" style={{ color: '#6b7280' }}>Company:</span>
                          <p className="font-semibold mt-0.5" style={{ color: '#e2e8f0' }}>
                            {analysisResult.job_analysis?.company || 'Not detected'}
                          </p>
                        </div>
                        <div>
                          <span className="font-mono" style={{ color: '#6b7280' }}>Seniority:</span>
                          <p className="font-semibold mt-0.5" style={{ color: '#e2e8f0' }}>
                            {analysisResult.job_analysis?.seniority || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      {analysisResult.job_analysis?.summary && (
                        <p className="text-xs leading-relaxed pt-1" style={{ color: '#6b7280' }}>
                          {analysisResult.job_analysis.summary}
                        </p>
                      )}
                    </div>

                    <div
                      className="p-4 rounded-xl space-y-2"
                      style={{ background: '#111420', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <h4 className="text-sm font-bold text-white">Key Requirements</h4>
                      <ul className="space-y-1.5 text-xs" style={{ color: '#e2e8f0' }}>
                        {analysisResult.job_analysis?.key_requirements?.map((req, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2 leading-relaxed">
                            <span className="text-[#f97316] shrink-0 font-bold">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* ── Action Footer ── */}
                <div
                  className="shrink-0 p-4 space-y-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#111420' }}
                >
                  <p className="text-xs font-bold" style={{ color: '#e2e8f0' }}>
                    What do you want to do?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Card A – Clone */}
                    <button
                      type="button"
                      disabled={isCloningResume}
                      onClick={handleCreateTargetedResume}
                      className="group text-left p-4 rounded-xl transition-all cursor-pointer disabled:opacity-60"
                      style={{
                        background: 'rgba(249,115,22,0.06)',
                        border: '1.5px solid rgba(249,115,22,0.35)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {isCloningResume ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#f97316]" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#f97316]" />
                        )}
                        <span className="text-sm font-bold text-white">
                          {isCloningResume ? 'Cloning…' : 'Create Targeted Resume'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: '#6b7280' }}>
                        Clone your current resume into a new job-targeted version. The original stays untouched.
                      </p>
                    </button>

                    {/* Card B – Enhance manually */}
                    <button
                      type="button"
                      onClick={handleEnhanceManually}
                      className="group text-left p-4 rounded-xl transition-all cursor-pointer"
                      style={{
                        background: 'rgba(59,130,246,0.06)',
                        border: '1.5px solid rgba(59,130,246,0.35)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Zap className="w-4 h-4 text-[#3b82f6]" />
                        <span className="text-sm font-bold text-white">Enhance Manually</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: '#6b7280' }}>
                        Stay in this resume. We&apos;ll show keyword hints in the editor.
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
                  <Target className="w-7 h-7 text-[#f97316]" />
                </div>
                <h3 className="text-sm font-bold text-white">Paste a Job Description on the left</h3>
                <p className="text-xs max-w-sm leading-relaxed" style={{ color: '#6b7280' }}>
                  Our ATS checker will score your resume, surface missing keywords, and help you decide
                  whether to clone &amp; target or enhance manually.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
