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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { resumesApi, paymentsApi } from '@/lib/api';
import { useResumeStore } from '@/lib/resume/store';
import { applyWiserEnhancementsToSections } from '@/lib/resume/applyWiserEnhancements';
import { renderTiptapJson } from '@/lib/resume/renderTiptap';
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
    activeJdAnalysis,
    setActiveJdAnalysis,
    replaceSections,
    addKeywordToResume,
    dismissedSuggestionKeys = [],
    dismissSuggestion,
    appliedSuggestionKeys = [],
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
        return 'Generating precision bullet upgrades for each section...';
      default:
        return 'Analyzing with Reasoning...';
    }
  };
  const [addedKeywords, setAddedKeywords] = useState(new Set());
  // Store appliedSuggestionKeys is source of truth across panel & editor
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

  const handleStartAnalysis = async () => {
    if (wiserMode === 'jobhelp' && (!jobDescription || jobDescription.trim().length < 30)) {
      toast.error('Please paste a job description (at least 30 characters).');
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
      // Flush save to DB if store is dirty
      if (useResumeStore.getState().isDirty && resumeId) {
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

      const currentResumeOverride = {
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

      let res;
      if (wiserMode === 'jobhelp') {
        res = await resumesApi.analyzeJobDescription({
          resumeId: resumeId || null,
          jobDescription: jobDescription.trim(),
          currentResumeOverride,
        });
      } else {
        res = await resumesApi.analyzeStandaloneAts({
          resumeId: resumeId || null,
          currentResumeOverride,
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
      toast('Jumped to section editor! Review inline suggestions on bullets.', { icon: '🎯' });
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
    const { sections: nextSections, appliedCount } = applyWiserEnhancementsToSections(
      sections,
      singleAnalysis
    );
    if (appliedCount > 0) {
      replaceSections(nextSections);
      if (sug?.id) markSuggestionApplied(String(sug.id));
      dismissSuggestion(String(sug.id));
      toast.success('Applied to resume!', { icon: '✨' });
    } else {
      toast.error('Could not match original bullet in resume.');
    }
  };

  const handleApplyAllSuggestions = () => {
    if (!currentAnalysis) return;
    const { sections: nextSections, appliedCount } = applyWiserEnhancementsToSections(
      sections,
      currentAnalysis
    );
    if (appliedCount > 0) {
      replaceSections(nextSections);
      sectionEnhancements.forEach((sec) => {
        sec.suggestions?.forEach((s) => {
          if (s?.id) {
            markSuggestionApplied(String(s.id));
            dismissSuggestion(String(s.id));
          }
        });
      });
      toast.success(`Applied ${appliedCount} enhancements to your resume!`, { icon: '✨' });
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
    <div className="h-full flex flex-col bg-[#0b0d14] text-[#e2e8f0] select-none min-h-0 border-l border-white/[0.08]">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#0d0f18]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C88A58]/15 border border-[#C88A58]/30 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#D49A6A]" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Wiser AI Career Suite</h3>
            <p className="text-[10px] text-zinc-400">ATS Audit & Evidence Alignment</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {score !== null && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${getGradeBadgeCls(
                score
              )}`}
            >
              Score: {score}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
            title="Close Wiser panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode selection tabs */}
      <div className="px-3 pt-2 pb-2 bg-[#090b13] border-b border-white/[0.06] flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setWiserMode('jobhelp')}
          className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium transition cursor-pointer text-center ${
            wiserMode === 'jobhelp'
              ? 'bg-[#C88A58]/20 text-[#D49A6A] border border-[#C88A58]/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
          }`}
        >
          JD Match & Help
        </button>
        <button
          onClick={() => setWiserMode('standalone_ats')}
          className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium transition cursor-pointer text-center ${
            wiserMode === 'standalone_ats'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
          }`}
        >
          General ATS Audit
        </button>
      </div>

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0 text-xs">
        {/* If JD mode, show textarea */}
        {wiserMode === 'jobhelp' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
              <span>Target Job Description</span>
              {jobDescription.length > 0 && (
                <span className="text-[10px] font-mono text-zinc-500">{jobDescription.length} chars</span>
              )}
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description or requirements here..."
              rows={4}
              className="w-full bg-[#111420] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#C88A58]/50 resize-none font-sans"
            />
          </div>
        )}

        {/* Trigger analyze button */}
        <button
          onClick={handleStartAnalysis}
          disabled={isAnalyzing}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#C88A58] to-[#B07340] hover:from-[#d49a6a] hover:to-[#c88a58] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-black/40 transition disabled:opacity-50 cursor-pointer text-xs"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{getAnalysisMessage()}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{score !== null ? 'Re-Analyze Resume' : 'Analyze Resume'}</span>
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
            <div className="bg-[#121524] border border-white/[0.08] rounded-xl p-3 flex items-center gap-3">
              <CompactGauge score={score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{score} / 100</span>
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
            <div className="flex items-center border-b border-white/[0.08] gap-3 text-xs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-1.5 font-medium transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'text-white border-b-2 border-[#C88A58]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`pb-1.5 font-medium transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'suggestions'
                    ? 'text-white border-b-2 border-[#C88A58]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Upgrades</span>
                {sectionEnhancements.reduce((acc, s) => acc + (s.suggestions?.length || 0), 0) > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#C88A58]/20 text-[#D49A6A] text-[9px] flex items-center justify-center font-bold">
                    {sectionEnhancements.reduce((acc, s) => acc + (s.suggestions?.length || 0), 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('keywords')}
                className={`pb-1.5 font-medium transition cursor-pointer ${
                  activeTab === 'keywords'
                    ? 'text-white border-b-2 border-[#C88A58]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Keywords
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                {atsCheck?.category_scores && (
                  <div className="space-y-2 bg-[#0e101a] border border-white/[0.06] rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                      Evaluation Breakdown
                    </span>
                    {Object.entries(atsCheck.category_scores).map(([cat, val]) => (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-300 capitalize">{cat.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-zinc-400">{val}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-[#C88A58] rounded-full"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Improvements or Critical Issues */}
                {(atsCheck?.improvements || atsCheck?.critical_issues) && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Key Areas for Improvement
                    </span>
                    <ul className="space-y-1 bg-amber-500/5 border border-amber-500/20 rounded-xl p-2.5">
                      {(atsCheck.improvements || atsCheck.critical_issues).map((item, idx) => (
                        <li key={idx} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
                          <span className="text-amber-400">•</span>
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-300">Section Upgrades</span>
                  {sectionEnhancements.length > 0 && (
                    <button
                      onClick={handleApplyAllSuggestions}
                      className="text-[10px] text-[#D49A6A] hover:underline font-semibold cursor-pointer"
                    >
                      Apply All
                    </button>
                  )}
                </div>

                {sectionEnhancements.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-[11px]">
                    No bullet improvements needed for this section!
                  </div>
                ) : (
                  sectionEnhancements.map((sec) => (
                    <div key={sec.section_id} className="space-y-2">
                      <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                        {sec.section_title}
                      </span>
                      {sec.suggestions?.map((sug) => {
                        const isApplied = appliedSuggestionKeys?.includes(String(sug.id));
                        return (
                          <div
                            key={sug.id}
                            className="bg-[#111420] border border-white/[0.08] rounded-xl p-2.5 space-y-2"
                          >
                            <div className="text-[11px] text-zinc-400 line-through opacity-70">
                              {sug.original_text}
                            </div>
                            <div
                              className="text-[11px] text-emerald-300 font-medium"
                              dangerouslySetInnerHTML={{ __html: sug.enhanced_html }}
                            />
                            {sug.reasoning && (
                              <p className="text-[10px] text-zinc-500 italic">{sug.reasoning}</p>
                            )}
                            <div className="pt-1 flex items-center justify-between gap-2">
                              <button
                                onClick={() => handleReviewAndApply(sec.section_id)}
                                className="text-[10px] text-[#D49A6A] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                                title="Go to this section in editor to review inline"
                              >
                                <span>Review in Editor ›</span>
                              </button>
                              <div className="flex items-center gap-1.5">
                                {isApplied ? (
                                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Applied
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleApplySingleSuggestion(sug, sec.section_id)}
                                    className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
                                    title="Apply directly to resume"
                                  >
                                    <Check className="w-3 h-3" /> Apply
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: KEYWORDS */}
            {activeTab === 'keywords' && (
              <div className="space-y-3">
                {/* Missing / Recommended Keywords */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                    Missing Keywords (Click to Add)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {((atsCheck?.missing_keywords || atsCheck?.recommended_keywords) || []).map((kw) => {
                      const isAdded = addedKeywords.has(kw);
                      return (
                        <button
                          key={kw}
                          onClick={() => !isAdded && handleAddKeyword(kw)}
                          disabled={isAdded}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 border ${
                            isAdded
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                          }`}
                        >
                          {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{kw}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Matched Keywords */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                    Matched in Resume
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(atsCheck?.matched_keywords || []).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1"
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
