'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Cpu,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { resumesApi } from '@/lib/api';
import { useResumeStore } from '@/lib/resume/store';

export default function ImportPdfModal({ isOpen, onClose, mode = 'current' }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importOption, setImportOption] = useState(mode); // 'current' | 'new'

  const updateHeader = useResumeStore((s) => s.updateHeader);
  const setSections = useResumeStore((s) => s.setSections);
  const setActiveSectionId = useResumeStore((s) => s.setActiveSectionId);
  const setResumeName = useResumeStore((s) => s.setResumeName);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Please select a valid PDF document (.pdf)');
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
        setErrorMessage('Please select a valid PDF document (.pdf)');
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleStartImport = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a resume PDF file to upload.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setCurrentStep('Extracting PDF text with PyMuPDF...');

    try {
      setCurrentStep('Analyzing sections & structure with Wiser AI...');

      const result = await resumesApi.parsePdf({
        file: selectedFile,
        createResume: importOption === 'new',
        resumeName: selectedFile.name.replace(/\.pdf$/i, ''),
      });

      if (importOption === 'new' && result.created_resume_id) {
        toast.success('Resume imported successfully!');
        onClose();
        router.push(`/builder?id=${result.created_resume_id}`);
        return;
      }

      // Update current resume in store
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

      toast.success('Sections & contact details extracted with Wiser AI!');
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setErrorMessage(err.message || 'Failed to extract sections from PDF.');
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#12141c] border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Wiser AI Resume Importer</h3>
              <p className="text-[11px] text-zinc-400">Powered by Wiser AI Intelligence Engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dropzone */}
        <div className="mt-5">
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
              className="border-2 border-dashed border-zinc-800 hover:border-blue-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-zinc-900/40 hover:bg-zinc-900/80 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-white">Click or drag & drop your resume PDF</p>
              <p className="text-xs text-zinc-500 mt-1">Supports standard text PDFs up to 10 MB</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white truncate max-w-[220px]">{selectedFile.name}</p>
                  <p className="text-xs text-zinc-500">{Math.round(selectedFile.size / 1024)} KB</p>
                </div>
              </div>

              {!isProcessing && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Change
                </button>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Import Destination
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setImportOption('current')}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                importOption === 'current'
                  ? 'border-blue-500 bg-blue-500/10 text-white font-medium'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span className="font-semibold block text-white">Update Current Resume</span>
              <span className="text-[11px] text-zinc-500">Populate open editor sections</span>
            </button>

            <button
              type="button"
              onClick={() => setImportOption('new')}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                importOption === 'new'
                  ? 'border-blue-500 bg-blue-500/10 text-white font-medium'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span className="font-semibold block text-white">Create as New Resume</span>
              <span className="text-[11px] text-zinc-500">Save as separate document</span>
            </button>
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-5 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-blue-300">{currentStep}</p>
              <p className="text-blue-400/70 text-[11px]">This usually takes 3 to 6 seconds...</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartImport}
            disabled={isProcessing || !selectedFile}
            className="py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Extract & Import Resume</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
