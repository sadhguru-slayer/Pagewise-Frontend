'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Zap,
  ArrowRight,
  Briefcase,
  Layers,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { resumesApi, paymentsApi } from '@/lib/api';
import { useResumeStore } from '@/lib/resume/store';
import { applyWiserEnhancementsToSections } from '@/lib/resume/applyWiserEnhancements';
import { renderTiptapJson } from '@/lib/resume/renderTiptap';
import { renderStructuredSectionHtml, isStructuredSection } from '@/lib/resume/sectionSchemas';
import PricingModal from '@/components/pricing/PricingModal';

/* ─── Compact Circular Score Gauge ────────────────────────────── */
function CompactGauge({ score }) {
  const radius = 32;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = '#ef4444';
  if (score > 85) strokeColor = '#10b981';
  else if (score > 65) strokeColor = '#3b82f6';
  else if (score >= 40) strokeColor = '#f59e0b';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
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
        <span className="text-xl font-black text-white leading-none">{score}</span>
        <span className="text-[9px] text-[#6b7280] font-mono mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function getGradeBadgeCls(score) {
  if (score > 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (score > 65) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
}

export default function WiserAnalysisPanel({ onClose, isLocked = false }) {
  const {
    resumeId,
    resumeName,
    header,
    sections,
    settings,
    targetJobDescription,
    targetAtsScore,
    activeJdAnalysis,
    setActiveJdAnalysis,
    replaceSections,
    addKeywordToResume,
    dismissedSuggestionKeys = [],
    dismissSuggestion,
    dismissAllSuggestions,
    clearDismissedSuggestions,
    appliedSuggestionKeys = [],
    appliedBulletIndexKeys = [],
    markSuggestionApplied,
  } = useResumeStore();

  const [wiserMode, setWiserMode] = useState(
    targetJobDescription && targetJobDescription.trim().length > 30 ? 'jobhelp' : 'standalone_ats'
  );
  const [jobDescription, setJobDescription] = useState(targetJobDescription || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState('idle'); // 'idle' | 'reading' | 'analyzing' | 'scoring' | 'finalizing'
  const [analysisError, setAnalysisError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'suggestions' | 'keywords'
  const [expandedAppliedIds, setExpandedAppliedIds] = useState(new Set());

  const toggleExpandApplied = (id) => {
    setExpandedAppliedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDismissSingleSuggestion = (sugId) => {
    if (sugId) {
      dismissSuggestion(String(sugId));
      toast('Suggestion dismissed', { icon: '🗑️' });
    }
  };

  const handleDismissAllSuggestions = () => {
    const unappliedKeys = [];
    sectionEnhancements.forEach((sec) => {
      (sec.suggestions || []).forEach((sug) => {
        const sid = String(sug.id);
        const isApplied = appliedSuggestionKeys?.includes(sid);
        const isDismissed = dismissedSuggestionKeys?.includes(sid) && !isApplied;
        if (!isApplied && !isDismissed) {
          unappliedKeys.push(sid);
        }
      });
    });
    if (unappliedKeys.length > 0) {
      dismissAllSuggestions(unappliedKeys);
      toast('All pending suggestions dismissed', { icon: '🗑️' });
    }
  };

  const setActiveSectionId = useResumeStore((s) => s.setActiveSectionId);
  const setHighlightedSectionId = useResumeStore((s) => s.setHighlightedSectionId);

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisPhase('idle');
      return;
    }
    setAnalysisPhase('reading');
    const t1 = setTimeout(() => setAnalysisPhase('analyzing'), 2200);
    const t2 = setTimeout(() => setAnalysisPhase('scoring'), 6500);
    const t3 = setTimeout(() => setAnalysisPhase('finalizing'), 14000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isAnalyzing]);

  const getAnalysisMessage = () => {
    switch (analysisPhase) {
      case 'reading':
        return wiserMode === 'jobhelp'
          ? 'Decomposing Job Description & requirements...'
          : 'Scanning document hierarchy & parseability...';
      case 'analyzing':
        return wiserMode === 'jobhelp'
          ? 'Synthesizing role evidence & technical stack...'
          : 'Analyzing bullet metrics, ownership & clarity...';
      case 'scoring':
        return 'Reasoning model computing ATS scores & keyword gaps...';
      case 'finalizing':
        return 'Generating precision upgrades for each section...';
      default:
        return 'Analyzing with Reasoning...';
    }
  };
  const [addedKeywords, setAddedKeywords] = useState(new Set());
  const [planStatus, setPlanStatus] = useState(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const fetchPlanStatus = useCallback(async () => {
    try {
      const data = await paymentsApi.getStatus();
      setPlanStatus(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPlanStatus();
  }, [fetchPlanStatus]);

  const currentAnalysis = activeJdAnalysis;
  const atsCheck = currentAnalysis?.ats_check;
  const score = atsCheck?.overall_score ?? null;
  const grade = atsCheck?.grade || (score > 85 ? 'Strong' : score > 65 ? 'Good' : 'Needs Work');
  const sectionEnhancements = currentAnalysis?.section_enhancements || [];

  const totalActiveSuggestions = sectionEnhancements.reduce((acc, sec) => {
    const count = (sec.suggestions || []).filter((sug) => {
      const sid = String(sug.id);
      const isApplied = appliedSuggestionKeys?.includes(sid);
      const isDismissed = dismissedSuggestionKeys?.includes(sid) && !isApplied;
      return !isDismissed;
    }).length;
    return acc + count;
  }, 0);

  const totalUnappliedSuggestions = sectionEnhancements.reduce((acc, sec) => {
    const count = (sec.suggestions || []).filter((sug) => {
      const sid = String(sug.id);
      const isApplied = appliedSuggestionKeys?.includes(sid);
      const isDismissed = dismissedSuggestionKeys?.includes(sid) && !isApplied;
      return !isApplied && !isDismissed;
    }).length;
    return acc + count;
  }, 0);

  const handleStartAnalysis = async () => {
    if (wiserMode === 'jobhelp' && (!jobDescription || jobDescription.trim().length < 30)) {
      toast.error('Please paste a target job description (at least 30 characters).');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    const toastId = toast.loading(
      wiserMode === 'jobhelp'
        ? 'Wiser AI evaluating JD alignment with reasoning…'
        : 'Wiser AI running standalone ATS check…'
    );

    try {
      const {
        sections: latestSections,
        header: latestHeader,
        settings: latestSettings,
        resumeName: latestName,
        resumeId: latestResumeId,
        isDirty: latestIsDirty,
      } = useResumeStore.getState();

      const activeRid = latestResumeId || resumeId;

      // Flush save to DB if store is dirty
      if (latestIsDirty && activeRid) {
        try {
          await resumesApi.update(activeRid, {
            name: latestName,
            headerJson: latestHeader,
            settingsJson: latestSettings,
            sectionsJson: latestSections,
          });
          useResumeStore.getState().markSaved(new Date().toISOString());
        } catch (e) {
          console.warn('Auto-save prior to analysis failed:', e);
        }
      }

      // Build applied bullet IDs from both persistent index keys and cross-referenced keys
      const appliedBulletIds = new Set();
      (appliedSuggestionKeys || []).forEach((k) => appliedBulletIds.add(String(k)));
      (appliedBulletIndexKeys || []).forEach((k) => appliedBulletIds.add(String(k)));

      (activeJdAnalysis?.section_enhancements || []).forEach((sec) => {
        (sec.suggestions || []).forEach((sug) => {
          if (appliedSuggestionKeys?.includes(String(sug.id))) {
            if (sug.item_id != null && sug.point_index != null) {
              appliedBulletIds.add(`${sug.item_id}:${sug.point_index}`);
            }
          }
        });
      });
      const appliedList = Array.from(appliedBulletIds);

      const currentResumeOverride = {
        id: activeRid,
        name: latestName,
        target_ats_score: targetAtsScore || score || null,
        applied_bullet_ids: appliedList,
        header_json: latestHeader,
        settings_json: latestSettings,
        sections_json: latestSections.map((sec) => ({
          id: sec.id,
          title: sec.title,
          content: sec.content,
          contentHtml: (() => {
            if (isStructuredSection(sec) && Array.isArray(sec.items) && sec.items.length > 0) {
              return renderStructuredSectionHtml(sec, latestSettings) || sec.contentHtml || '';
            }
            return typeof sec.content === 'string'
              ? sec.content
              : renderTiptapJson(sec.content) || sec.contentHtml || '';
          })(),
          items: isStructuredSection(sec) ? (sec.items || []) : undefined,
        })),
      };

      let res;
      if (wiserMode === 'jobhelp') {
        res = await resumesApi.analyzeJobDescription({
          resumeId: activeRid || null,
          jobDescription: jobDescription.trim(),
          currentResumeOverride,
          appliedBulletIds: appliedList,
        });
      } else {
        res = await resumesApi.analyzeStandaloneAts({
          resumeId: activeRid || null,
          currentResumeOverride,
          appliedBulletIds: appliedList,
        });
      }

      if (res && res.success && res.data) {
        setActiveJdAnalysis(res.data);
        const jobAn = res.data.job_analysis || {};
        const atsCk = res.data.ats_check || {};
        useResumeStore.setState({
          activeJdAnalysis: res.data,
          targetJobDescription: jobAn.summary || (wiserMode === 'jobhelp' ? jobDescription.trim().slice(0, 300) : null),
          targetJobTitle: jobAn.title || res.data.inferred_domain?.title || null,
          targetCompany: jobAn.company || null,
          targetAtsScore: atsCk.overall_score ?? null,
        });
        toast.success('Wiser analysis complete!', { id: toastId });
        fetchPlanStatus();
      } else {
        throw new Error('Analysis completed with unexpected structure.');
      }
    } catch (err) {
      console.error('[Wiser Analysis error]:', err);
      const errMsg = err?.response?.data?.detail || err.message || 'Analysis service temporarily unavailable. Please try again.';
      setAnalysisError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReviewAndApply = (secId) => {
    if (secId) {
      setActiveSectionId(secId);
      setHighlightedSectionId(secId);
      toast('Opened section in editor! Review inline suggestions.', { icon: '🎯' });
    }
  };

  const handleApplySingleSuggestion = (sug, secId) => {
    const singleAnalysis = {
      section_enhancements: [
        {
          section_id: secId,
          suggestions: [sug],
        },
      ],
    };
    const latestSections = useResumeStore.getState().sections;
    const { sections: nextSections, appliedCount } = applyWiserEnhancementsToSections(
      latestSections,
      singleAnalysis
    );
    if (appliedCount > 0) {
      replaceSections(nextSections);
      const bulletKey = sug.item_id != null && sug.point_index != null ? `${sug.item_id}:${sug.point_index}` : null;
      if (sug?.id) markSuggestionApplied(String(sug.id), bulletKey);
      dismissSuggestion(String(sug.id));
      toast.success('Applied to resume!', { icon: '✨' });
    } else {
      toast.error('Could not match original bullet in resume.');
    }
  };

  const handleApplyAllSuggestions = () => {
    if (!currentAnalysis) return;
    const latestSections = useResumeStore.getState().sections;
    const { sections: nextSections, appliedCount } = applyWiserEnhancementsToSections(
      latestSections,
      currentAnalysis
    );
    if (appliedCount > 0) {
      replaceSections(nextSections);
      sectionEnhancements.forEach((sec) => {
        sec.suggestions?.forEach((s) => {
          if (s?.id) {
            const bulletKey = s.item_id != null && s.point_index != null ? `${s.item_id}:${s.point_index}` : null;
            markSuggestionApplied(String(s.id), bulletKey);
            dismissSuggestion(String(s.id));
          }
        });
      });
      toast.success(`Applied ${appliedCount} upgrades to your resume!`, { icon: '✨' });
    } else {
      toast.error('No matching bullets found to apply.');
    }
  };

  const handleAddKeyword = (kw) => {
    addKeywordToResume(kw);
    setAddedKeywords((prev) => new Set(prev).add(kw));
    toast.success(`Added "${kw}" to skills!`, { icon: '🏷️' });
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#e2e8f0] select-none min-h-0 border-l border-white/[0.08] shadow-2xl">
      {/* ── Header bar ────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#0d0f18]/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C88A58]/20 to-[#C88A58]/5 border border-[#C88A58]/35 flex items-center justify-center shadow-inner">
            <Target className="w-4 h-4 text-[#D49A6A]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-wide">Wiser AI Career Suite</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Audit
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 truncate max-w-[190px]">
              {wiserMode === 'jobhelp' && currentAnalysis?.job_analysis?.title
                ? `Target: ${currentAnalysis.job_analysis.title}`
                : 'Objective Parseability & Evidence'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {score !== null && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${getGradeBadgeCls(
                score
              )}`}
            >
              {score}/100
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
            title="Close Wiser panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Segmented Mode Selector ───────────────────────────── */}
      <div className="p-2.5 bg-[#090b13] border-b border-white/[0.06] shrink-0">
        <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
          <button
            onClick={() => setWiserMode('jobhelp')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              wiserMode === 'jobhelp'
                ? 'bg-[#C88A58]/20 text-[#F3D5B5] border border-[#C88A58]/35 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Briefcase className="w-3 h-3" />
            <span>JD Match &amp; Help</span>
          </button>
          <button
            onClick={() => setWiserMode('standalone_ats')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              wiserMode === 'standalone_ats'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/35 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileSearch className="w-3 h-3" />
            <span>General ATS Audit</span>
          </button>
        </div>
      </div>

      {/* ── Main scrollable body ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 min-h-0 text-xs">
        {/* If JD mode, show textarea with clean styling */}
        {wiserMode === 'jobhelp' && (
          <div className="space-y-1.5 bg-[#0e111c] border border-white/[0.07] rounded-2xl p-3 shadow-inner">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-200">
                <Briefcase className="w-3.5 h-3.5 text-[#C88A58]" />
                <span>Target Job Description</span>
              </span>
              {jobDescription.length > 0 && (
                <span className="text-[10px] font-mono text-zinc-500">{jobDescription.length} chars</span>
              )}
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job posting or role requirements here to get tailored evidence upgrades..."
              rows={3}
              className="w-full bg-[#131726] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#C88A58]/60 resize-none font-sans leading-relaxed"
            />
          </div>
        )}

        {/* Trigger analyze button */}
        <button
          onClick={handleStartAnalysis}
          disabled={isAnalyzing}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#C88A58] via-[#B87A46] to-[#A36634] hover:from-[#d49a6a] hover:to-[#c88a58] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-black/40 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer text-xs"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{getAnalysisMessage()}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{score !== null ? 'Re-Analyze with Wiser' : 'Analyze Resume'}</span>
            </>
          )}
        </button>

        {/* Graceful Error Display */}
        {analysisError && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Analysis notice</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              {analysisError}
            </p>
            <button
              type="button"
              onClick={handleStartAnalysis}
              className="text-[11px] font-semibold text-[#D49A6A] hover:underline cursor-pointer block"
            >
              Click here to retry analysis →
            </button>
          </div>
        )}

        {/* Results section */}
        {score !== null && (
          <div className="space-y-4 pt-1">
            {/* Score card */}
            <div className="bg-gradient-to-br from-[#121626] to-[#0d101a] border border-white/[0.09] rounded-2xl p-3.5 flex items-center gap-3.5 shadow-lg">
              <CompactGauge score={score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-white tracking-tight">{score} / 100</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${getGradeBadgeCls(
                      score
                    )}`}
                  >
                    {grade}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  {wiserMode === 'jobhelp'
                    ? (currentAnalysis?.job_analysis?.title
                        ? `Targeting ${currentAnalysis.job_analysis.title}`
                        : 'Role alignment score')
                    : 'Objective parseability & quality audit'}
                </p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center border-b border-white/[0.08] gap-4 text-xs px-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2 font-medium transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'text-white border-b-2 border-[#C88A58] font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`pb-2 font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'suggestions'
                    ? 'text-white border-b-2 border-[#C88A58] font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Upgrades</span>
                {totalUnappliedSuggestions > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#C88A58]/25 text-[#F3D5B5] text-[10px] font-mono font-bold">
                    {totalUnappliedSuggestions}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('keywords')}
                className={`pb-2 font-medium transition cursor-pointer ${
                  activeTab === 'keywords'
                    ? 'text-white border-b-2 border-[#C88A58] font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Keywords
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-3.5">
                {atsCheck?.category_scores && (
                  <div className="space-y-2.5 bg-[#0e111c] border border-white/[0.06] rounded-2xl p-3.5">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                      Evaluation Breakdown
                    </span>
                    {Object.entries(atsCheck.category_scores).map(([cat, val]) => (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-300 capitalize">{cat.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-zinc-400">{val}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-[#C88A58] to-emerald-400 rounded-full"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Improvements or Critical Issues */}
                {(atsCheck?.improvements || atsCheck?.critical_issues) && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Key Areas for Improvement</span>
                    </span>
                    <ul className="space-y-1.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3">
                      {(atsCheck.improvements || atsCheck.critical_issues).map((item, idx) => (
                        <li key={idx} className="text-[11px] text-zinc-300 flex items-start gap-2 leading-relaxed">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SUGGESTIONS */}
            {activeTab === 'suggestions' && (
              <div className="space-y-3.5">
                {/* Header row with context pill */}
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-zinc-200">Actionable Upgrades</span>
                    {totalUnappliedSuggestions > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C88A58]/20 text-[#F3D5B5] font-semibold border border-[#C88A58]/30">
                        {totalUnappliedSuggestions} pending
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> All applied
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {totalUnappliedSuggestions > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleDismissAllSuggestions}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 transition font-medium cursor-pointer"
                          title="Dismiss all recommendations"
                        >
                          Dismiss All
                        </button>
                        <span className="text-zinc-600 text-xs">|</span>
                        <button
                          type="button"
                          onClick={handleApplyAllSuggestions}
                          className="text-[10px] text-[#F3D5B5] hover:underline font-semibold cursor-pointer flex items-center gap-1 bg-[#C88A58]/20 px-2 py-0.5 rounded-lg border border-[#C88A58]/35"
                        >
                          <Check className="w-3 h-3" />
                          <span>Apply All</span>
                        </button>
                      </>
                    )}
                    {dismissedSuggestionKeys?.length > 0 && totalUnappliedSuggestions === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          clearDismissedSuggestions();
                          toast('Restored dismissed suggestions', { icon: '↩️' });
                        }}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 font-medium cursor-pointer"
                      >
                        Undo Dismiss ({dismissedSuggestionKeys.length})
                      </button>
                    )}
                  </div>
                </div>

                {sectionEnhancements.length === 0 || totalActiveSuggestions === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-[11px] space-y-2.5 bg-[#101322]/60 border border-white/[0.05] rounded-2xl p-5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <p className="text-zinc-200 font-semibold text-xs">All bullets look strong and verified!</p>
                    <p className="text-zinc-400 text-[10px] leading-relaxed max-w-xs mx-auto">
                      Wiser strictly avoids cosmetic or lateral edits. No unnecessary rephrasing or bolding required for your resume.
                    </p>
                    {dismissedSuggestionKeys?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          clearDismissedSuggestions();
                          toast('Restored dismissed suggestions', { icon: '↩️' });
                        }}
                        className="text-[10px] text-[#D49A6A] hover:underline cursor-pointer block mx-auto pt-1"
                      >
                        Restore {dismissedSuggestionKeys.length} dismissed suggestions
                      </button>
                    )}
                  </div>
                ) : (
                  sectionEnhancements.map((sec) => {
                    const visibleSuggestions = (sec.suggestions || []).filter((sug) => {
                      const sid = String(sug.id);
                      const isApplied = appliedSuggestionKeys?.includes(sid);
                      const isDismissed = dismissedSuggestionKeys?.includes(sid) && !isApplied;
                      return !isDismissed;
                    });

                    if (visibleSuggestions.length === 0) return null;

                    return (
                      <div key={sec.section_id} className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-[#C88A58]" />
                            <span>{sec.section_title}</span>
                          </span>
                        </div>

                        {visibleSuggestions.map((sug) => {
                          const sid = String(sug.id);
                          const isApplied = appliedSuggestionKeys?.includes(sid);
                          const isExpanded = expandedAppliedIds.has(sid);

                          if (isApplied && !isExpanded) {
                            const cleanSnippet = (sug.enhanced_html || sug.original_text || '')
                              .replace(/<[^>]+>/g, '')
                              .trim();
                            return (
                              <div
                                key={sug.id}
                                className="bg-[#0e121e] border border-emerald-500/25 rounded-xl px-3 py-2 flex items-center justify-between gap-2.5 transition hover:border-emerald-500/40 shadow-sm"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-400 shrink-0 uppercase tracking-wider font-mono">
                                    Applied
                                  </span>
                                  <span className="text-[11px] text-zinc-400 truncate font-normal">
                                    {cleanSnippet}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleExpandApplied(sid)}
                                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-white/[0.05] transition cursor-pointer shrink-0"
                                  title="Expand applied details"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={sug.id}
                              className={`border rounded-2xl p-3.5 space-y-3 transition shadow-md ${
                                isApplied
                                  ? 'bg-[#0e121e] border-emerald-500/30'
                                  : 'bg-[#101322] border-white/[0.09] hover:border-white/[0.16]'
                              }`}
                            >
                              {/* Card Header */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  {isApplied ? (
                                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                                      <Check className="w-3 h-3 stroke-[3]" /> Applied to Resume
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-medium text-[#F3D5B5] flex items-center gap-1.5 bg-[#C88A58]/15 px-2 py-0.5 rounded-lg border border-[#C88A58]/30">
                                      <Sparkles className="w-3 h-3 text-[#D49A6A]" />
                                      <span>Upgrade Recommendation</span>
                                    </span>
                                  )}
                                </div>

                                {isApplied ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandApplied(sid)}
                                    className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-white/[0.05] transition cursor-pointer flex items-center gap-1 text-[10px]"
                                    title="Minimize"
                                  >
                                    <span>Minimize</span>
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleDismissSingleSuggestion(sug.id)}
                                    className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
                                    title="Dismiss suggestion"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Two-tone Content Box: Original vs Upgrade */}
                              <div className="space-y-2">
                                {/* Current text block (dimmed, clean, no strike-through) */}
                                <div className="bg-[#090b14]/90 rounded-xl p-2.5 border border-white/[0.05] space-y-1">
                                  <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">
                                    Current Bullet
                                  </div>
                                  <div className="text-[11px] text-zinc-400 leading-relaxed">
                                    {sug.original_text?.replace(/<[^>]+>/g, '').trim()}
                                  </div>
                                </div>

                                {/* Upgraded text block (clean emerald container) */}
                                <div className="bg-emerald-500/[0.07] rounded-xl p-2.5 border border-emerald-500/25 space-y-1">
                                  <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>Suggested Upgrade</span>
                                  </div>
                                  <div
                                    className="text-[11px] text-emerald-200 font-medium leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: sug.enhanced_html }}
                                  />
                                </div>
                              </div>

                              {/* Target Relevance Callout */}
                              {(sug.relevance_to_role || sug.reasoning) && (
                                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2 flex items-start gap-2 text-[10px] text-zinc-400">
                                  <span className="text-[#D49A6A] font-semibold shrink-0 font-mono">🎯 Why:</span>
                                  <span className="leading-snug text-zinc-300">
                                    {sug.relevance_to_role || sug.reasoning}
                                  </span>
                                </div>
                              )}

                              {/* Action Footer */}
                              <div className="pt-1 flex items-center justify-between gap-2 border-t border-white/[0.04]">
                                <button
                                  onClick={() => handleReviewAndApply(sec.section_id)}
                                  className="text-[10px] text-[#D49A6A] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                                  title="Open this section in the text editor"
                                >
                                  <span>Review in Editor ›</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  {!isApplied && (
                                    <>
                                      <button
                                        onClick={() => handleDismissSingleSuggestion(sug.id)}
                                        className="px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] rounded-lg text-[10px] font-medium transition cursor-pointer"
                                        title="Dismiss"
                                      >
                                        Dismiss
                                      </button>
                                      <button
                                        onClick={() => handleApplySingleSuggestion(sug, sec.section_id)}
                                        className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-[0.98]"
                                        title="Apply upgrade directly to your resume"
                                      >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>Apply</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB: KEYWORDS */}
            {activeTab === 'keywords' && (
              <div className="space-y-4">
                {/* Missing / Recommended Keywords */}
                <div className="space-y-2 bg-[#0e111c] border border-white/[0.06] rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Missing Skills &amp; Keywords (Click to Add)</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {((atsCheck?.missing_keywords || atsCheck?.recommended_keywords) || []).map((kw) => {
                      const isAdded = addedKeywords.has(kw);
                      return (
                        <button
                          key={kw}
                          onClick={() => !isAdded && handleAddKeyword(kw)}
                          disabled={isAdded}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 border active:scale-[0.97] ${
                            isAdded
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                          }`}
                        >
                          {isAdded ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                          <span>{kw}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Matched Keywords */}
                <div className="space-y-2 bg-[#0e111c] border border-white/[0.06] rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Matched in Resume</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(atsCheck?.matched_keywords || []).map((kw) => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isPricingModalOpen && (
        <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
      )}
    </div>
  );
}