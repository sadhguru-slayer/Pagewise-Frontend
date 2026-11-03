'use client';

import { useState } from 'react';
import {
  X,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code2,
  Award,
  FileText,
  Plus,
  Layers,
  Edit3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useResumeStore } from '@/lib/resume/store';
import { SECTION_TYPES } from '@/lib/resume/sectionSchemas';

const PREDEFINED_SECTIONS = [
  {
    type: SECTION_TYPES.EXPERIENCE,
    title: 'Work Experience',
    description: 'Companies, positions, dates, accomplishments, tech stack & links',
    mode: 'Structured Form',
    icon: Briefcase,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    type: SECTION_TYPES.EDUCATION,
    title: 'Education',
    description: 'Degrees, schools, graduation years, GPA & relevant coursework',
    mode: 'Structured Form',
    icon: GraduationCap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    type: SECTION_TYPES.PROJECTS,
    title: 'Projects',
    description: 'Systems, open-source work, tech stack tags, impact & repository links',
    mode: 'Structured Form',
    icon: FolderGit2,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    type: SECTION_TYPES.SKILLS,
    title: 'Skills & Technologies',
    description: 'Categorized technical skills, tools & automatic JD keyword integration',
    mode: 'Structured Form',
    icon: Code2,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    type: SECTION_TYPES.CERTIFICATIONS,
    title: 'Certifications',
    description: 'Licenses, issuing organizations, dates & credential verification URLs',
    mode: 'Structured Form',
    icon: Award,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
  {
    type: SECTION_TYPES.SUMMARY,
    title: 'Professional Summary',
    description: 'High-level career narrative or target objective formatted with rich text',
    mode: 'Rich Text Editor',
    icon: FileText,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
];

export default function AddSectionModal({ isOpen, onClose }) {
  const addSection = useResumeStore((s) => s.addSection);
  const sections = useResumeStore((s) => s.sections);

  const [customTitle, setCustomTitle] = useState('');

  if (!isOpen) return null;

  const handleAddPredefined = (item) => {
    // Check if section type already exists to advise user
    const existingCount = sections.filter(
      (s) =>
        s.type === item.type ||
        s.title?.toLowerCase() === item.title.toLowerCase()
    ).length;

    const title = existingCount > 0 ? `${item.title} ${existingCount + 1}` : item.title;
    addSection(title, item.type);
    toast.success(`Added ${title} section!`);
    onClose();
  };

  const handleAddCustom = (e) => {
    if (e) e.preventDefault();
    const title = customTitle.trim();
    if (!title) {
      toast.error('Please enter a name for your custom section');
      return;
    }

    addSection(title, SECTION_TYPES.CUSTOM);
    toast.success(`Added ${title} custom section!`);
    setCustomTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#121524]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Resume Section</h2>
              <p className="text-xs text-zinc-400">
                Choose a structured format or create a custom section with rich text
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Predefined Sections */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-3">
              Standard Resume Sections
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PREDEFINED_SECTIONS.map((sec) => {
                const IconComponent = sec.icon;
                return (
                  <button
                    key={sec.type}
                    type="button"
                    onClick={() => handleAddPredefined(sec)}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all text-left cursor-pointer group"
                  >
                    <div className={`p-2.5 rounded-xl border ${sec.bg} ${sec.color} shrink-0`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                          {sec.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
                          {sec.mode}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                        {sec.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Section Creator */}
          <div className="pt-4 border-t border-white/[0.08]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-2">
              Custom Section (Rich Text Editor)
            </span>
            <p className="text-xs text-zinc-400 mb-3">
              Have something unique? Add a free-form custom section (e.g. Volunteer Experience, Publications, Awards & Honors, Hobbies) with full TipTap formatting control.
            </p>

            <form onSubmit={handleAddCustom} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Publications, Volunteer Work, Awards..."
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!customTitle.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Section</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
