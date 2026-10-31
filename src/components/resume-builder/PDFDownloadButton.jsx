'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResumeStore } from '@/lib/resume/store';
import { generateResumeDocumentHtml } from '@/lib/resume/renderDocument';
import { exportsApi } from '@/lib/api';

export default function PDFDownloadButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { resumeId, header, sections, settings, resumeName } = useResumeStore();

  const handleDownload = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Generating professional PDF...');

    try {
      const fullHtml = generateResumeDocumentHtml({
        header,
        sections,
        settings,
      });

      const record = await exportsApi.exportPdf({
        resumeId: resumeId || null,
        name: resumeName || 'Resume',
        html: fullHtml,
      });

      await exportsApi.downloadFile(record.id, record.file_name);
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error(err.message || 'Failed to download PDF', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      type="button"
      className="flex items-center gap-1.5 sm:gap-2 bg-accent hover:bg-accent/90 text-zinc-950 font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(78,205,196,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      title="Download resume as A4 PDF"
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span className="font-semibold">{isLoading ? 'Generating...' : 'Download PDF'}</span>
    </button>
  );
}
