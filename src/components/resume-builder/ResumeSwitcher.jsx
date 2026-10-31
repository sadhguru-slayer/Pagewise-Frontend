'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  Clock,
  Palette,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useResumeStore } from '@/lib/resume/store';
import { formatRelativeTime } from '@/lib/resume/utils';
import { resumesApi } from '@/lib/api';

export default function ResumeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const dropdownRef = useRef(null);

  const resumeId = useResumeStore((s) => s.resumeId);
  const resumeName = useResumeStore((s) => s.resumeName);
  const isDirty = useResumeStore((s) => s.isDirty);
  const savedResumes = useResumeStore((s) => s.savedResumes);
  const setSavedResumes = useResumeStore((s) => s.setSavedResumes);
  const loadResume = useResumeStore((s) => s.loadResume);
  const createNewResume = useResumeStore((s) => s.createNewResume);
  const duplicateCurrentResume = useResumeStore((s) => s.duplicateCurrentResume);
  const applyFormatFromResume = useResumeStore((s) => s.applyFormatFromResume);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchResumes = async () => {
    setIsLoadingList(true);
    try {
      const data = await resumesApi.list();
      if (data) {
        setSavedResumes(data);
      }
    } catch (e) {
      console.error('Error fetching resume list:', e);
    } finally {
      setIsLoadingList(false);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchResumes();
    }
    setIsOpen(!isOpen);
  };

  const handleSelectResume = async (resume) => {
    if (resume.id === resumeId) {
      setIsOpen(false);
      return;
    }

    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes on the current resume. Switch anyway?'
      );
      if (!confirmed) return;
    }

    try {
      const fullResume = await resumesApi.get(resume.id);
      loadResume({
        id: fullResume.id,
        name: fullResume.name,
        headerJson: fullResume.header_json,
        settingsJson: fullResume.settings_json,
        sectionsJson: fullResume.sections_json,
        updatedAt: fullResume.updated_at,
      });
      toast.success(`Loaded "${fullResume.name}"`);
    } catch (e) {
      toast.error('Failed to load resume');
    }
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Start a new resume anyway?'
      );
      if (!confirmed) return;
    }
    createNewResume();
    toast.success('Started a new resume');
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    duplicateCurrentResume();
    toast.success('Created a new copy! Save it to store.');
    setIsOpen(false);
  };

  const handleDelete = async (e, rId, rTitle) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete "${rTitle}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeletingId(rId);
    try {
      await resumesApi.delete(rId);

      const updated = savedResumes.filter((r) => r.id !== rId);
      setSavedResumes(updated);
      toast.success(`Deleted "${rTitle}"`);

      if (resumeId === rId) {
        if (updated.length > 0) {
          const first = await resumesApi.get(updated[0].id);
          loadResume({
            id: first.id,
            name: first.name,
            headerJson: first.header_json,
            settingsJson: first.settings_json,
            sectionsJson: first.sections_json,
            updatedAt: first.updated_at,
          });
        } else {
          createNewResume();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs text-zinc-200 hover:text-white transition-all cursor-pointer shadow-sm"
        title="View and switch between your saved resumes"
      >
        <FileText className="w-3.5 h-3.5 text-accent" />
        <span className="font-medium max-w-[140px] sm:max-w-[180px] truncate">
          {resumeName || 'Untitled Resume'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-[#0c0e18] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 border-b border-white/10 bg-[#0f121e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Saved Resumes ({savedResumes.length})
              </span>
            </div>
            {isLoadingList && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            )}
          </div>

          <div className="p-2 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-accent/30 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Resume</span>
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              title="Duplicate current resume and format into a new copy"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Save as Copy</span>
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
            {savedResumes.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                No saved resumes yet. Click Save to store in SQLite!
              </div>
            ) : (
              savedResumes.map((r) => {
                const isActive = r.id === resumeId;

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectResume(r)}
                    className={`pt-1.5 first:pt-0 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group ${
                      isActive
                        ? 'bg-accent/10 border border-accent/40'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[180px]">
                          {r.name || 'Untitled Resume'}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-mono uppercase bg-accent/20 text-accent border border-accent/30 px-1.5 py-0.2 rounded-md">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {formatRelativeTime(r.updatedAt || r.createdAt)}
                        </span>
                        <span>·</span>
                        <span>
                          {r.sectionsJson?.length || 0} sections
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyFormatFromResume(r);
                            toast.success(`Applied styling from "${r.name}"!`);
                            setIsOpen(false);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-accent hover:bg-white/10 transition-colors"
                          title="Apply this resume's styling & fonts to your current content"
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, r.id, r.name)}
                        disabled={isDeletingId === r.id}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete resume"
                      >
                        {isDeletingId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
