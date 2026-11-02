'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { resumesApi, paymentsApi } from '@/lib/api';
import { useResumeStore } from '@/lib/resume/store';
import { BRAND_CONFIG } from '@/lib/brand';
import PricingModal from '@/components/pricing/PricingModal';

export default function ImportPdfModal({
  isOpen,
  onClose,
  mode = 'new', // 'new' | 'current' | 'existing'
  resumesList = null,
  currentResumeId = null,
  currentResumeName = '',
  onPlanUpgradeRequest = null,
}) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [planStatus, setPlanStatus] = useState(null);
  const [userResumes, setUserResumes] = useState(resumesList || []);
  const [selectedResumeId, setSelectedResumeId] = useState(
    currentResumeId ? String(currentResumeId) : ''
  );
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const isInsideBuilder = mode === 'current' || Boolean(currentResumeId && mode !== 'existing');
  const [importOption, setImportOption] = useState(
    mode === 'existing' ? 'existing' : isInsideBuilder ? 'current' : 'new'
  );

  useEffect(() => {
    if (isOpen) {
      paymentsApi
        .getStatus()
        .then((data) => {
          setPlanStatus(data);
          if (
            typeof data?.remaining?.resumes === 'number' &&
            data.remaining.resumes <= 0 &&
            !isInsideBuilder
          ) {
            setImportOption('existing');
          }
        })
        .catch(() => {});

      if (!resumesList || resumesList.length === 0) {
        resumesApi
          .list()
          .then((list) => {
            if (Array.isArray(list)) {
              setUserResumes(list);
              if (!selectedResumeId && list.length > 0) {
                const preferred =
                  list.find((r) => r.is_primary && !r.is_locked) ||
                  list.find((r) => !r.is_locked) ||
                  list[0];
                setSelectedResumeId(String(preferred.id));
              }
            }
          })
          .catch(() => {});
      } else {
        setUserResumes(resumesList);
        if (!selectedResumeId && resumesList.length > 0) {
          const preferred =
            resumesList.find((r) => r.is_primary && !r.is_locked) ||
            resumesList.find((r) => !r.is_locked) ||
            resumesList[0];
          setSelectedResumeId(String(preferred.id));
        }
      }
    }
  }, [isOpen, resumesList, isInsideBuilder, currentResumeId, selectedResumeId]);

  const updateHeader = useResumeStore((s) => s.updateHeader);

  if (!isOpen) return null;

  const remainingResumes = planStatus?.remaining?.resumes;
  const isResumeLimitReached =
    typeof remainingResumes === 'number' && remainingResumes <= 0;

  const wiserCredits =
    planStatus?.remaining?.wiser_ai_combined !== undefined
      ? planStatus.remaining.wiser_ai_combined
      : (planStatus?.remaining?.wiser_job_help ?? 0);

  const isWiserQuotaReached =
    planStatus !== null && typeof wiserCredits === 'number' && wiserCredits <= 0;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Please select a valid PDF file (.pdf)');
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Please select a valid PDF file (.pdf)');
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleOpenUpgrade = () => {
    if (onPlanUpgradeRequest) {
      onPlanUpgradeRequest();
    } else {
      setIsPricingModalOpen(true);
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file to upload.');
      return;
    }

    if (isWiserQuotaReached) {
      setErrorMessage('Wiser AI credit limit reached for your plan.');
      return;
    }

    if (importOption === 'new' && isResumeLimitReached) {
      setErrorMessage('Workspace limit reached. Select an existing resume below to update.');
      return;
    }

    if (importOption === 'existing' && !selectedResumeId) {
      setErrorMessage('Please select an existing resume to update.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const targetId =
        importOption === 'existing'
          ? Number(selectedResumeId)
          : importOption === 'current' && currentResumeId
          ? Number(currentResumeId)
          : null;

      const result = await resumesApi.parsePdf({
        file: selectedFile,
        createResume: importOption === 'new',
        resumeName: selectedFile.name.replace(/\.pdf$/i, ''),
        targetResumeId: targetId,
      });

      if (importOption === 'new' && result.created_resume_id) {
        toast.success('Resume imported successfully!');
        onClose();
        router.push(`/builder?id=${result.created_resume_id}`);
        return;
      }

      if (importOption === 'existing' && (result.updated_resume_id || targetId)) {
        const destId = result.updated_resume_id || targetId;
        const targetObj = userResumes.find((r) => String(r.id) === String(destId));
        toast.success(`"${targetObj?.name || 'Resume'}" updated!`);
        onClose();
        router.push(`/builder?id=${destId}`);
        return;
      }

      if (importOption === 'current') {
        if (result.header) {
          updateHeader(result.header);
        }

        if (result.sections && result.sections.length > 0) {
          const formattedSections = result.sections.map((sec, idx) => {
            const textContent = sec.content || sec.contentHtml || '';
            return {
              id: sec.id || `sec-${idx + 1}`,
              title: sec.title || `Section ${idx + 1}`,
              order: idx,
              visible: sec.visible !== false,
              content: textContent,
              contentHtml: textContent,
              links: sec.links || [],
              headingAlign: 'left',
              headingBold: true,
              headingUppercase: true,
              showDividerAfterHeading: true,
            };
          });

          useResumeStore.setState({
            sections: formattedSections,
            activeSectionId: formattedSections[0]?.id || null,
            isDirty: true,
          });
        }

        toast.success('Resume sections extracted with Wiser AI!');
        onClose();
        return;
      }

      toast.success('Resume parsed successfully!');
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setErrorMessage(err.message || 'Failed to parse resume PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div
          className="rounded-2xl w-full max-w-md p-6 shadow-2xl relative border text-left"
          style={{
            background: BRAND_CONFIG.colors.surfaceCard,
            borderColor: BRAND_CONFIG.colors.borderSubtle,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: BRAND_CONFIG.colors.primary }} />
                <h3 className="text-sm font-bold text-[#EDEDF2]">Import Resume with Wiser AI</h3>
              </div>
              <p className="text-[11px] text-[#8E94A5] mt-0.5">
                Extract structure into PageWise · {wiserCredits ?? 0} credit(s) available
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-[#8E94A5] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-4 space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quota Exhausted Notification */}
            {isWiserQuotaReached && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[#8E94A5]">Wiser AI quota reached for this period.</span>
                <button
                  type="button"
                  onClick={handleOpenUpgrade}
                  className="text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: BRAND_CONFIG.colors.primary }}
                >
                  Upgrade
                </button>
              </div>
            )}

            {/* Dropzone */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-white/[0.12] hover:border-white/25 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-white/[0.03] group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{
                    background: BRAND_CONFIG.colors.primarySurface,
                    color: BRAND_CONFIG.colors.primary,
                  }}
                >
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-[#EDEDF2]">Click or drag &amp; drop PDF</p>
                <p className="text-[11px] text-[#7E869B] mt-0.5">Supports text PDFs up to 10 MB</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 shrink-0" style={{ color: BRAND_CONFIG.colors.primary }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#EDEDF2] truncate max-w-[220px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-[#7E869B] font-mono">
                      {Math.round(selectedFile.size / 1024)} KB
                    </p>
                  </div>
                </div>

                {!isProcessing && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-[11px] text-[#8E94A5] hover:text-white px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                  >
                    Change
                  </button>
                )}
              </div>
            )}

            {/* Destination Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E94A5] font-medium">Destination</span>
                <span className="text-[10px] text-[#7E869B] font-mono">
                  {planStatus?.usage?.active_resumes ?? userResumes.length} / {planStatus?.limits?.resumes ?? 1} workspaces
                </span>
              </div>

              {/* Minimal Segment Control */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setImportOption('new')}
                  disabled={isResumeLimitReached}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-center ${
                    isResumeLimitReached
                      ? 'text-[#545A6D] cursor-not-allowed'
                      : importOption === 'new'
                      ? 'bg-white/[0.08] text-[#EDEDF2] font-semibold shadow-sm'
                      : 'text-[#8E94A5] hover:text-[#EDEDF2] cursor-pointer'
                  }`}
                >
                  <span>New Workspace</span>
                  {isResumeLimitReached && <span className="ml-1 text-[10px] text-[#545A6D]">(Limit)</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setImportOption('existing')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                    importOption === 'existing'
                      ? 'bg-white/[0.08] text-[#EDEDF2] font-semibold shadow-sm'
                      : 'text-[#8E94A5] hover:text-[#EDEDF2]'
                  }`}
                >
                  <span>Update Existing</span>
                </button>
              </div>

              {/* If 'existing' is active: Simple, clean Dropdown */}
              {importOption === 'existing' && (
                <div className="pt-1 space-y-1">
                  <div className="relative">
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/[0.08] text-xs text-[#EDEDF2] focus:outline-none appearance-none pr-8 cursor-pointer"
                      style={{
                        borderColor: BRAND_CONFIG.colors.borderSubtle,
                      }}
                    >
                      {userResumes.map((r) => (
                        <option key={r.id} value={r.id} disabled={r.is_locked}>
                          {r.name} {r.is_primary ? '★ (Master)' : r.is_locked ? '🔒 (Read-Only)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8E94A5] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {isResumeLimitReached && (
                    <p className="text-[10px] text-[#8E94A5]">
                      Workspace limit reached. Content will update your selected resume.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex items-center gap-2.5 py-1 text-xs text-[#8E94A5]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: BRAND_CONFIG.colors.primary }} />
                <span>Extracting sections &amp; structure with Wiser AI...</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs text-[#8E94A5] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            {isWiserQuotaReached ? (
              <button
                type="button"
                onClick={handleOpenUpgrade}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity cursor-pointer shadow-sm"
                style={{ background: BRAND_CONFIG.colors.primary }}
              >
                Upgrade Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartImport}
                disabled={isProcessing || !selectedFile || (importOption === 'new' && isResumeLimitReached)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-opacity cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: BRAND_CONFIG.colors.primary }}
              >
                {isProcessing ? 'Importing...' : 'Import Resume'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      {isPricingModalOpen && (
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          currentPlan={planStatus?.plan_type || 'free'}
          planStatus={planStatus}
          onPlanUpdated={(newPlan) => {
            setPlanStatus(newPlan);
            setIsPricingModalOpen(false);
          }}
        />
      )}
    </>
  );
}
