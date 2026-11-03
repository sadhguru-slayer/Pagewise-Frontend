'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Image, Code, Loader2, ChevronDown, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResumeStore } from '@/lib/resume/store';
import { generateResumeDocumentHtml } from '@/lib/resume/renderDocument';
import { exportsApi } from '@/lib/api';
import { BRAND_CONFIG } from '@/lib/brand';
import Modal from '@/components/ui/Modal';

export default function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [exportType, setExportType] = useState(null); // 'pdf' | 'png' | 'html'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const menuRef = useRef(null);

  const { resumeId, resumeName, header, sections, settings } = useResumeStore();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openExportPrompt = (type) => {
    setIsOpen(false);
    setExportType(type);
    setExportFilename(resumeName || 'My Resume');
    setIsExportModalOpen(true);
  };

  const handleExecuteExport = async (e) => {
    e.preventDefault();
    if (!exportFilename.trim()) {
      toast.error('Please enter a file name');
      return;
    }

    setIsProcessing(true);
    const targetName = exportFilename.trim();
    const typeLabel = exportType === 'pdf' ? 'PDF' : exportType === 'png' ? 'Retina Image' : 'HTML Document';
    const toastId = toast.loading(`Generating ${typeLabel}...`);

    try {
      const state = useResumeStore.getState();
      const currentHeader = state.header;
      const currentSections = state.sections;
      const currentSettings = state.settings;
      const currentResumeId = state.resumeId;

      const fullHtml = generateResumeDocumentHtml({
        header: currentHeader,
        sections: currentSections,
        settings: currentSettings,
      });

      let exportRecord;
      if (exportType === 'pdf') {
        exportRecord = await exportsApi.exportPdf({
          resumeId: currentResumeId || null,
          name: targetName,
          html: fullHtml,
        });
      } else if (exportType === 'png') {
        exportRecord = await exportsApi.exportImage({
          resumeId: currentResumeId || null,
          name: targetName,
          html: fullHtml,
        });
      } else {
        exportRecord = await exportsApi.exportHtml({
          resumeId: currentResumeId || null,
          name: targetName,
          html: fullHtml,
        });
      }

      await exportsApi.downloadFile(exportRecord.id, exportRecord.file_name);
      toast.success(`${typeLabel} downloaded successfully!`, { id: toastId });
      setIsExportModalOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(err.message || `Failed to export ${typeLabel}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
            boxShadow: `0 4px 14px ${BRAND_CONFIG.colors.primaryGlow}`,
          }}
          title="Export resume in PDF, Image, or HTML formats"
        >
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Export</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="origin-top-right absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl p-1.5 z-50 overflow-hidden"
            style={{
              background: '#0F121A',
              border: `1px solid ${BRAND_CONFIG.colors.borderSubtle}`,
            }}
          >
            {/* 1. PDF (Recommended) */}
            <button
              onClick={() => openExportPrompt('pdf')}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-xs text-[#F1F3F9]">Export as PDF</p>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-[10px] text-[#7E869B] mt-0.5">Vector multi-page A4 document</p>
              </div>
            </button>

            {/* 2. Image (PNG) */}
            <button
              onClick={() => openExportPrompt('png')}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Image className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xs text-[#F1F3F9]">Export as Image (.png)</p>
                <p className="text-[10px] text-[#7E869B] mt-0.5">High-resolution 2x Retina preview</p>
              </div>
            </button>

            {/* 3. HTML Document */}
            <button
              onClick={() => openExportPrompt('html')}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Code className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xs text-[#F1F3F9]">Export as HTML (.html)</p>
                <p className="text-[10px] text-[#7E869B] mt-0.5">Self-contained web markup file</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Export Confirmation / File Naming Modal (Mounted to body via React Portal to prevent header containing block trapping) */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => !isProcessing && setIsExportModalOpen(false)}
        title={`Export as ${exportType === 'pdf' ? 'PDF' : exportType === 'png' ? 'Image' : 'HTML'}`}
        icon={Download}
        size="sm"
        hideCloseButton={isProcessing}
        closeOnBackdrop={!isProcessing}
        closeOnEscape={!isProcessing}
      >
        <form onSubmit={handleExecuteExport} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7E869B] mb-1.5">
              Confirm Export File Name
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                required
                autoFocus
                placeholder="My Resume"
                className="flex-1 px-3 py-2 rounded-l-xl text-xs text-white bg-black/40 border border-white/[0.08] focus:border-amber-500 focus:outline-none transition-colors"
              />
              <span className="px-3 py-2 rounded-r-xl text-xs font-mono bg-white/[0.05] border border-l-0 border-white/[0.08] text-[#7E869B]">
                .{exportType}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setIsExportModalOpen(false)}
              className="px-3 py-1.5 text-xs text-[#7E869B] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Download File</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
