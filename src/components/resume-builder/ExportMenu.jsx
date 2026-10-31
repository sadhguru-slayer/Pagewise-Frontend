'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileCode, Loader2, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResumeStore } from '@/lib/resume/store';
import { generateResumeDocumentHtml } from '@/lib/resume/renderDocument';
import { renderTiptapJson } from '@/lib/resume/renderTiptap';
import { exportsApi } from '@/lib/api';

export default function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
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

  const handleExportPdf = async () => {
    setIsOpen(false);
    setIsExportingPdf(true);
    const toastId = toast.loading('Generating high-fidelity PDF...');

    try {
      const fullHtml = generateResumeDocumentHtml({
        header,
        sections,
        settings,
      });

      const exportRecord = await exportsApi.exportPdf({
        resumeId: resumeId || null,
        name: resumeName || 'Resume',
        html: fullHtml,
      });

      // Download file using authenticated blob download
      await exportsApi.downloadFile(exportRecord.id, exportRecord.file_name);
      toast.success('PDF exported and downloaded!', { id: toastId });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error(err.message || 'Failed to export PDF', { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    setIsOpen(false);
    setIsExportingDocx(true);
    const toastId = toast.loading('Generating Word document (.docx)...');

    try {
      // Map section tiptap JSON content into HTML for python-docx parser
      const formattedSections = (sections || []).map((sec) => ({
        ...sec,
        contentHtml: sec.content ? renderTiptapJson(sec.content) : '',
      }));

      const exportRecord = await exportsApi.exportDocx({
        resumeId: resumeId || null,
        name: resumeName || 'Resume',
        headerJson: header || {},
        settingsJson: settings || {},
        sectionsJson: formattedSections,
      });

      // Download file using authenticated blob download
      await exportsApi.downloadFile(exportRecord.id, exportRecord.file_name);
      toast.success('Word document exported and downloaded!', { id: toastId });
    } catch (err) {
      console.error('Word export error:', err);
      toast.error(err.message || 'Failed to export Word document', { id: toastId });
    } finally {
      setIsExportingDocx(false);
    }
  };

  const isBusy = isExportingPdf || isExportingDocx;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isBusy}
        className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm tracking-normal shadow-md shadow-blue-600/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        title="Export your resume"
      >
        {isBusy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExportingPdf ? 'Exporting PDF...' : isExportingDocx ? 'Exporting Word...' : 'Export'}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl bg-[#12141c] border border-zinc-800 ring-1 ring-black/5 divide-y divide-zinc-800/80 focus:outline-none z-50 overflow-hidden">
          <div className="p-1.5">
            <button
              onClick={handleExportPdf}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-zinc-200 hover:text-white hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Export as PDF</p>
                <p className="text-[11px] text-zinc-500">Pixel-perfect A4 document</p>
              </div>
            </button>

            <button
              onClick={handleExportDocx}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-zinc-200 hover:text-white hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
                <FileCode className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Export as Word (.docx)</p>
                <p className="text-[11px] text-zinc-500">Fully editable document</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
