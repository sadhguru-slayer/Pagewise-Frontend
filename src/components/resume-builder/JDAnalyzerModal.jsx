'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ArrowDownToLine,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { resumesApi, paymentsApi } from '@/lib/api';
import { useResumeStore } from '@/lib/resume/store';
import { applyWiserEnhancementsToSections } from '@/lib/resume/applyWiserEnhancements';
import { renderTiptapJson } from '@/lib/resume/renderTiptap';
import PricingModal from '@/components/pricing/PricingModal';

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
export default function JDAnalyzerModal({ isOpen, onClose, isLocked = false, onPromoteToMaster, targetResume = null, allResumes = [] }) {
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
    replaceSections,
    addKeywordToResume,
    dismissedSuggestionKeys = [],
    dismissSuggestion,
  } = useResumeStore();

  const [activeResumeId, setActiveResumeId] = useState(targetResume?.id || (allResumes && allResumes.length > 0 ? allResumes[0].id : null));
  const [activeResumeDetail, setActiveResumeDetail] = useState(null);

  useEffect(() => {
    if (targetResume?.id) {
      setActiveResumeId(targetResume.id);
    } else if (!resumeId && allResumes && allResumes.length > 0 && !activeResumeId) {
      setActiveResumeId(allResumes[0].id);
    }
  }, [targetResume, allResumes, resumeId, activeResumeId]);

  const effectiveResumeId = resumeId || activeResumeId;
  const currentSelectedSummary = allResumes.find((r) => r.id === effectiveResumeId) || targetResume;
  const effectiveResumeName = resumeName || currentSelectedSummary?.name || 'Untitled Resume';
  const effectiveIsLocked = resumeId ? isLocked : !!currentSelectedSummary?.is_locked;

  useEffect(() => {
    if (isOpen && effectiveResumeId && !resumeId) {
      resumesApi.get(effectiveResumeId).then((det) => {
        if (det) {
          setActiveResumeDetail(det);
          if (det.jd_analysis_json) {
            try {
              const parsed = typeof det.jd_analysis_json === 'string' ? JSON.parse(det.jd_analysis_json) : det.jd_analysis_json;
              setAnalysisResult(parsed);
            } catch {}
          }
          if (det.target_job_description && !jobDescription) {
            setJobDescription(det.target_job_description);
          }
        }
      }).catch((e) => console.warn('Could not load resume detail:', e));
    }
  }, [isOpen, effectiveResumeId, resumeId]);

  // Wiser Mode: 'standalone_ats' (General Audit & Polish) | 'jobhelp' (Target a Specific Job)
  const [wiserMode, setWiserMode] = useState(
    targetJobDescription && targetJobDescription.trim().length > 30 ? 'jobhelp' : 'standalone_ats'
  );

  const [jobDescription, setJobDescription] = useState(targetJobDescription || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(activeJdAnalysis || null);
  const [standaloneResult, setStandaloneResult] = useState(null);
  const [activeTab, setActiveTab] = useState('ats'); // 'ats' | 'jobmatch' | 'enhancements'
  const [isCloningResume, setIsCloningResume] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [planStatus, setPlanStatus] = useState(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const fetchPlanStatus = useCallback(async () => {
    try {
      const data = await paymentsApi.getStatus();
      setPlanStatus(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPlanStatus();
    }
  }, [isOpen, fetchPlanStatus]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isAnalyzing && !isCloningResume && !isApplying) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, isAnalyzing, isCloningResume, isApplying, onClose]);

  // Synchronize persisted JD text and analysis if available
  useEffect(() => {
    if (isOpen) {
      if (activeJdAnalysis) {
        if (activeJdAnalysis.job_analysis) {
          setAnalysisResult(activeJdAnalysis);
          setWiserMode('jobhelp');
        } else if (activeJdAnalysis.inferred_domain) {
          setStandaloneResult(activeJdAnalysis);
          setWiserMode('standalone_ats');
        } else {
          setAnalysisResult(activeJdAnalysis);
        }
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
        resumeId: effectiveResumeId || null,
        jobDescription: jobDescription.trim(),
      };
      if (resumeId) {
        // If there are pending changes in store, flush save to DB
        if (useResumeStore.getState().isDirty) {
          try {
            await resumesApi.update(resumeId, {
              name: resumeName,
              headerJson: header,
              settingsJson: settings,
              sectionsJson: sections,
            });
            useResumeStore.getState().markSaved(new Date().toISOString());
          } catch (e) {
            console.warn('Auto-save prior to analysis failed:', e);
          }
        }

        payload.currentResumeOverride = {
          id: resumeId,
          name: resumeName,
          header_json: header,
          settings_json: settings,
          sections_json: sections.map((sec) => ({
            id: sec.id,
            title: sec.title,
            content: sec.content,
            contentHtml:
              typeof sec.content === 'string'
                ? sec.content
                : renderTiptapJson(sec.content) || sec.contentHtml || '',
          })),
        };
      }

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
        fetchPlanStatus();
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
        resumeId: effectiveResumeId || null,
      };
      if (resumeId) {
        if (useResumeStore.getState().isDirty) {
          try {
            await resumesApi.update(resumeId, {
              name: resumeName,
              headerJson: header,
              settingsJson: settings,
              sectionsJson: sections,
            });
            useResumeStore.getState().markSaved(new Date().toISOString());
          } catch (e) {
            console.warn('Auto-save prior to analysis failed:', e);
          }
        }

        payload.currentResumeOverride = {
          id: resumeId,
          name: resumeName,
          header_json: header,
          settings_json: settings,
          sections_json: sections.map((sec) => ({
            id: sec.id,
            title: sec.title,
            content: sec.content,
            contentHtml:
              typeof sec.content === 'string'
                ? sec.content
                : renderTiptapJson(sec.content) || sec.contentHtml || '',
          })),
        };
      }

      const res = await resumesApi.analyzeStandaloneAts(payload);
      if (res && res.success && res.data) {
        setStandaloneResult(res.data);
        const atsCk = res.data.ats_check || {};
        const inferred = res.data.inferred_domain || {};
        useResumeStore.setState({
          activeJdAnalysis: res.data,
          targetAtsScore: atsCk.overall_score ?? null,
          targetJobTitle: inferred.title || useResumeStore.getState().targetJobTitle,
        });
        setActiveTab('ats');
        toast.success('Resume Audit & AI Polish ready!', { id: toastId });
        fetchPlanStatus();
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

  const remainingWorkspaces = planStatus?.remaining?.resumes ?? 1;
  const atWorkspaceCap = remainingWorkspaces <= 0;
  const jobHelpLeft =
    planStatus?.plan_type === 'free'
      ? (planStatus?.remaining?.wiser_ai_combined ?? planStatus?.remaining?.wiser_job_help ?? 0)
      : (planStatus?.remaining?.wiser_job_help ?? 0);
  const atsLeft =
    planStatus?.plan_type === 'free'
      ? (planStatus?.remaining?.wiser_ai_combined ?? planStatus?.remaining?.wiser_ats ?? 0)
      : (planStatus?.remaining?.wiser_ats ?? 0);

  const persistTargetingOnCurrent = async () => {
    if (!resumeId) return;
    const currentData = wiserMode === 'jobhelp' ? analysisResult : (standaloneResult || analysisResult);
    const jobAn = currentData?.job_analysis || currentData?.inferred_domain || {};
    await resumesApi.cloneResume(resumeId, {
      applyToExisting: true,
      targetJobTitle: jobAn.title || '',
      targetCompany: jobAn.company || '',
      targetAtsScore: currentData?.ats_check?.overall_score ?? null,
      targetJobDescription: jobDescription.trim(),
      jdAnalysisJson: currentData,
    });
  };

  const handleAddKeyword = (kw) => {
    if (!addKeywordToResume) return;
    const res = addKeywordToResume(kw);
    if (res) {
      toast.success(`Added "${kw}" to ${res.sectionTitle}!`);
      // Update local state so UI updates instantly
      if (wiserMode === 'jobhelp' && analysisResult?.ats_check) {
        const ats = { ...analysisResult.ats_check };
        ats.missing_keywords = (ats.missing_keywords || []).filter((k) => k !== kw);
        ats.matched_keywords = [...new Set([...(ats.matched_keywords || []), kw])];
        setAnalysisResult({ ...analysisResult, ats_check: ats });
      } else if (standaloneResult?.ats_check) {
        const ats = { ...standaloneResult.ats_check };
        ats.recommended_keywords = (ats.recommended_keywords || []).filter((k) => k !== kw);
        ats.matched_keywords = [...new Set([...(ats.matched_keywords || []), kw])];
        setStandaloneResult({ ...standaloneResult, ats_check: ats });
      }
    }
  };

  const handleApplyToThisResume = async () => {
    if (!resumeId) {
      toast.error('No resume loaded.');
      return;
    }
    const currentData = wiserMode === 'jobhelp' ? analysisResult : (standaloneResult || analysisResult);
    if (!currentData) {
      toast.error('Please run the evaluation first.');
      return;
    }
    setIsApplying(true);
    const toastId = toast.loading('Loading enhancements into editor…');
    try {
      if (isLocked && typeof onPromoteToMaster === 'function') {
        await onPromoteToMaster();
      }

      // Persist targeting on current resume
      await persistTargetingOnCurrent();

      // Find first section that has suggestions
      const enhancements = currentData.section_enhancements || [];
      const firstSecMatch = enhancements.find((s) => s.suggestions && s.suggestions.length > 0);

      let targetSectionId = sections[0]?.id;
      let targetSectionTitle = sections[0]?.title;

      if (firstSecMatch) {
        const matchingSection = sections.find(
          (s) =>
            s.id === firstSecMatch.section_id ||
            s.title?.toLowerCase().trim() === firstSecMatch.section_title?.toLowerCase().trim()
        );
        if (matchingSection) {
          targetSectionId = matchingSection.id;
          targetSectionTitle = matchingSection.title;
        }
      }

      const jobAn = currentData?.job_analysis || currentData?.inferred_domain || {};
      const atsCk = currentData?.ats_check || {};
      useResumeStore.setState({
        activeJdAnalysis: currentData,
        activeSectionId: targetSectionId,
        highlightedSectionId: targetSectionId,
        targetJobTitle: jobAn.title || useResumeStore.getState().targetJobTitle,
        targetCompany: jobAn.company || useResumeStore.getState().targetCompany,
        targetJobDescription: currentData?.job_analysis?.summary || jobDescription.trim().slice(0, 300),
        targetAtsScore: atsCk.overall_score ?? useResumeStore.getState().targetAtsScore,
      });

      toast.success(
        `Loaded recommendations for ${targetSectionTitle || 'your resume'}. Apply them at your cursor!`,
        { id: toastId, icon: '🎯' }
      );
      onClose();
    } catch (err) {
      console.error('[Load Wiser upgrades error]:', err);
      toast.error(err.message || 'Failed to load upgrades.', { id: toastId });
    } finally {
      setIsApplying(false);
    }
  };

  /* ── Clone into targeted resume, or retarget Master when at cap ── */
  const handleCreateTargetedResume = async () => {
    if (!resumeId) {
      toast.error('No resume loaded.');
      return;
    }
    if (atWorkspaceCap) {
      await handleApplyToThisResume();
      return;
    }
    setIsCloningResume(true);
    const toastId = toast.loading('Creating a job-targeted copy…');
    try {
      const cloned = await resumesApi.cloneResume(resumeId, {
        targetJobTitle: analysisResult?.job_analysis?.title || '',
        targetCompany: analysisResult?.job_analysis?.company || '',
        targetAtsScore: analysisResult?.ats_check?.overall_score ?? null,
        targetJobDescription: jobDescription.trim(),
        jdAnalysisJson: analysisResult,
      });
      toast.success('Targeted resume created. Export it anytime — copies live in your export archive.', { id: toastId });
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
    const dataToUse = currentResult || analysisResult || standaloneResult;
    if (dataToUse) {
      useResumeStore.setState({ activeJdAnalysis: dataToUse });
    }
    onClose();
    toast.success('Suggestions loaded into editor. Place your cursor and click Apply at Cursor!');
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
        onClick={() => !isAnalyzing && !isCloningResume && !isApplying && onClose()}
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
              style={{ background: 'rgba(200, 138, 88, 0.15)', border: '1px solid rgba(200, 138, 88, 0.3)' }}
            >
              <Target className="w-4 h-4 text-[#D49A6A]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
            {allResumes && allResumes.length > 1 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/40 border border-white/[0.08]">
                <span className="text-[11px] font-mono text-[#7E869B] hidden sm:inline">Resume:</span>
                <select
                  value={effectiveResumeId || ''}
                  onChange={(e) => {
                    const newId = Number(e.target.value);
                    setActiveResumeId(newId);
                    setAnalysisResult(null);
                    setStandaloneResult(null);
                  }}
                  className="bg-transparent text-xs text-[#EDEDF2] font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
                >
                  {allResumes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#111420] text-white">
                      {r.name} {r.is_primary ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  Wiser AI Studio
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold text-[#D49A6A] bg-[#C88A58]/10 border border-[#C88A58]/20">
                  Career Intelligence
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280]">
                {wiserMode === 'jobhelp'
                  ? 'Match your resume to a specific job description and tailor your bullets.'
                  : 'Independent quality & parseability audit: power phrasing, impact verification, and bullet polish.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Pill */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.08]">
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
                <span>General Audit &amp; Polish</span>
                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/20 text-amber-200 font-mono">No JD</span>
              </button>

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
                <span>Target a Specific Job</span>
                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-white/[0.06] text-zinc-300 font-mono">With JD</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isAnalyzing || isCloningResume || isApplying}
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
                    <FileSearch className="w-3.5 h-3.5 text-[#D49A6A]" />
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

                {planStatus && (
                  <div className="flex items-center justify-between text-[11px] px-1 font-mono">
                    <span className="text-[#7E869B]">Plan Allowance:</span>
                    <span className={`font-semibold ${jobHelpLeft <= 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {jobHelpLeft} / {planStatus?.limits?.wiser_job_help ?? 1} remaining
                    </span>
                  </div>
                )}

                {planStatus && jobHelpLeft <= 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Job Help Allowance Exhausted</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      You have used all {planStatus?.limits?.wiser_job_help ?? 1} evaluations for {planStatus?.plan_name}. Upgrade to Wiser Day Pass or Pagewise Pro to continue.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsPricingModalOpen(true)}
                      className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Upgrade Plan
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isAnalyzing || !jobDescription.trim() || Boolean(planStatus && jobHelpLeft <= 0)}
                  onClick={handleStartJdAnalysis}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(to right, #C88A58, #B87A47)',
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(200, 138, 88, 0.3)',
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
                      <span>General Resume Review &amp; AI Polish</span>
                    </div>
                    <p className="text-[11px] text-[#9DA4B7] leading-relaxed">
                      Evaluate your resume's overall strength, parseability, power phrasing, and evidence of impact without requiring a job description.
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
                      Audit &amp; Polish Checklist:
                    </span>
                    <ul className="space-y-1.5 text-[11px]">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Structure &amp; parseability compliance
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Content specificity &amp; action verbs
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Evidence of impact (grounded verification)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> Grounded section-by-section bullet upgrades
                      </li>
                    </ul>
                  </div>
                </div>

                {planStatus && (
                  <div className="flex items-center justify-between text-[11px] px-1 font-mono">
                    <span className="text-[#7E869B]">Plan Allowance:</span>
                    <span className={`font-semibold ${atsLeft <= 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {atsLeft} / {planStatus?.limits?.wiser_ats ?? 1} remaining
                    </span>
                  </div>
                )}

                {planStatus && atsLeft <= 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Evaluation Allowance Exhausted</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      You have used all {planStatus?.limits?.wiser_ats ?? 1} evaluations for {planStatus?.plan_name}. Upgrade to Wiser Day Pass or Pagewise Pro to continue.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsPricingModalOpen(true)}
                      className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Upgrade Plan
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isAnalyzing || Boolean(planStatus && atsLeft <= 0)}
                  onClick={handleStartStandaloneAts}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #C88A58, #B87A47)',
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(200, 138, 88, 0.3)',
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Auditing &amp; Polishing…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Run Resume Audit &amp; AI Polish</span>
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
                          ? 'border-[#f97316] text-[#D49A6A]'
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
                            ? 'border-[#f97316] text-[#D49A6A]'
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
                          ? 'border-[#f97316] text-[#D49A6A]'
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
                          <Briefcase className="w-4 h-4 text-[#D49A6A] shrink-0" />
                          <div>
                            <span className="font-mono text-[10px] text-[#D49A6A] uppercase font-semibold">
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
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleAddKeyword(kw)}
                              className="text-[11px] px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5 transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98]"
                              style={{
                                background: wiserMode === 'jobhelp' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                                border: wiserMode === 'jobhelp' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)',
                                color: wiserMode === 'jobhelp' ? '#fca5a5' : '#fcd34d',
                              }}
                              title={`Click to add "${kw}" to your Skills section`}
                            >
                              <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform shrink-0" />
                              <span>{kw}</span>
                              <span className="text-[9px] uppercase font-sans font-semibold px-1 py-0.2 rounded bg-white/[0.08] text-white opacity-75 group-hover:opacity-100">
                                Add
                              </span>
                            </button>
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
                            <span className="text-[#D49A6A] shrink-0 font-bold">•</span>
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
                            <span className="text-[10px] font-mono text-[#D49A6A]">
                              {sec.suggestions?.length || 0} suggestion(s)
                            </span>
                          </div>
                          {sec.critique && (
                            <p className="text-xs text-[#9DA4B7] leading-relaxed">{sec.critique}</p>
                          )}

                          <div className="space-y-3 pt-2">
                            {sec.suggestions
                              ?.filter((sug) => !dismissedSuggestionKeys.includes(sug.id || sug.original_text))
                              ?.map((sug) => {
                              const needsConfirmation = sug.verification_status === 'needs_confirmation' || sug.factual_risk === 'high';
                              const changeTypeLabels = {
                                REPHRASING: 'Rephrasing',
                                METRIC_INCORPORATION: 'Metric Integration',
                                KEYWORD_ALIGNMENT: 'Keyword Alignment',
                                CLARIFICATION_NEEDED: 'Clarification Needed',
                              };
                              const changeLabel = changeTypeLabels[sug.change_type] || sug.change_type;
                              const sugKey = sug.id || sug.original_text;

                              return (
                                <div
                                  key={sug.id}
                                  className="p-3 rounded-lg bg-black/40 border border-white/[0.05] space-y-2 text-xs"
                                >
                                  {/* Verification status, change type, and dismiss button */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {changeLabel && (
                                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08] uppercase tracking-wider font-semibold">
                                          {changeLabel}
                                        </span>
                                      )}
                                      {needsConfirmation ? (
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium flex items-center gap-1" title="Please ensure metrics match your actual achievement">
                                          <AlertTriangle className="w-2.5 h-2.5" />
                                          <span>Verify numbers</span>
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-medium flex items-center gap-1">
                                          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                          <span>Verified</span>
                                        </span>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        dismissSuggestion?.(sugKey);
                                        toast('Suggestion ignored', { icon: '🗑️' });
                                      }}
                                      className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
                                      title="Ignore this recommendation"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {sug.original_text && (
                                    <div>
                                      <span className="text-[10px] font-mono text-zinc-500 block mb-0.5">
                                        Original Bullet:
                                      </span>
                                      <p className="line-through text-[#7E869B] text-[11px] leading-relaxed">
                                        {sug.original_text}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-[10px] font-mono text-amber-400 block mb-0.5">
                                      Recommended Bullet:
                                    </span>
                                    <div
                                      className="text-white text-xs leading-relaxed font-sans"
                                      dangerouslySetInnerHTML={{ __html: sug.enhanced_html }}
                                    />
                                  </div>

                                  <div className="pt-1.5 flex justify-end gap-2 border-t border-white/[0.04]">
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
                              );
                            })}
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
                  {atWorkspaceCap && wiserMode === 'jobhelp' && (
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Workspace limit reached. Apply Wiser upgrades to this Master resume, then Export — downloads are stored as copies and do not need another workspace.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={isApplying || isCloningResume}
                      onClick={() => {
                        if (!resumeId) {
                          onClose();
                          router.push(`/builder?id=${effectiveResumeId}&wiser=true`);
                        } else {
                          handleApplyToThisResume();
                        }
                      }}
                      className="group text-left p-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-60"
                      style={{
                        background: 'rgba(200, 138, 88, 0.12)',
                        border: '1.5px solid rgba(200, 138, 88, 0.45)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isApplying ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#D49A6A]" />
                        ) : (
                          <Zap className="w-4 h-4 text-[#D49A6A]" />
                        )}
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {!resumeId
                            ? 'Open in Studio to Apply Upgrades →'
                            : isApplying
                            ? 'Loading into Studio…'
                            : 'Review & Apply in Editor →'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#7E869B]">
                        {!resumeId
                          ? 'Transfers these tailored bullet upgrades into the interactive studio.'
                          : 'Focuses directly on your resume section with suggestions open so you can apply each bullet manually at your cursor.'}
                      </p>
                    </button>

                    {wiserMode === 'jobhelp' && !atWorkspaceCap ? (
                      <button
                        type="button"
                        disabled={isCloningResume || isApplying}
                        onClick={handleCreateTargetedResume}
                        className="group text-left p-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-60"
                        style={{
                          background: 'rgba(59,130,246,0.06)',
                          border: '1.5px solid rgba(59,130,246,0.35)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isCloningResume ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#3b82f6]" />
                          ) : (
                            <Copy className="w-4 h-4 text-[#3b82f6]" />
                          )}
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {isCloningResume ? 'Cloning…' : 'Keep Original · Clone Targeted Copy'}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#6b7280]">
                          Uses 1 workspace slot. Export later if you want a downloadable snapshot.
                        </p>
                      </button>
                    ) : wiserMode === 'jobhelp' ? (
                      <button
                        type="button"
                        onClick={() => setIsPricingModalOpen(true)}
                        className="group text-left p-3.5 rounded-xl transition-all cursor-pointer"
                        style={{
                          background: 'rgba(59,130,246,0.06)',
                          border: '1.5px solid rgba(59,130,246,0.35)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-4 h-4 text-[#3b82f6]" />
                          <span className="text-xs sm:text-sm font-bold text-white">
                            Upgrade for Another Workspace
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#6b7280]">
                          Keep this master and store extra targeted versions in parallel.
                        </p>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEnhanceManually}
                        className="group text-left p-3.5 rounded-xl transition-all cursor-pointer"
                        style={{
                          background: 'rgba(16,185,129,0.08)',
                          border: '1.5px solid rgba(16,185,129,0.4)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs sm:text-sm font-bold text-white">
                            Review &amp; Apply at Cursor →
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#7E869B]">
                          Loads upgrades into the editor so you can review and place them with full cursor control.
                        </p>
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(200, 138, 88, 0.1)', border: '1px solid rgba(200, 138, 88, 0.2)' }}
                >
                  <FileSearch className="w-7 h-7 text-[#D49A6A]" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {wiserMode === 'jobhelp'
                    ? 'Paste a Job Description on the left'
                    : 'Click "Run Resume Audit & AI Polish" on the left'}
                </h3>
                <p className="text-xs max-w-sm leading-relaxed text-[#6b7280]">
                  {wiserMode === 'jobhelp'
                    ? 'Wiser AI will evaluate role keyword density, score compatibility, and generate role-tailored bullet upgrades.'
                    : 'Wiser AI will evaluate your resume for parseability, active power phrasing, and evidence of impact without requiring a job description.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentPlan={planStatus?.plan_type || 'free'}
        onPlanUpdated={(newPlan) => {
          setPlanStatus(newPlan);
          fetchPlanStatus();
        }}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
