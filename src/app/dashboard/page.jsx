'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { resumesApi, exportsApi } from '@/lib/api';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Edit3,
  Calendar,
  Layers,
  FileCode,
  LogOut,
  Loader2,
  AlertCircle,
  ExternalLink,
  Search,
  FilePlus,
  FolderOpen,
  CheckCircle2,
  FileDown,
  X,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { defaultHeader, defaultSections, defaultSettings } from '@/lib/resume/defaults';
import { RESUME_TEMPLATES as templates } from '@/lib/resume/templates';
import ImportPdfModal from '@/components/resume-builder/ImportPdfModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('resumes'); // 'resumes' | 'exports'
  const [resumes, setResumes] = useState([]);
  const [exportsList, setExportsList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState('My Resume');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('standard');
  const [creatingResume, setCreatingResume] = useState(false);

  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [exportToDelete, setExportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick export state
  const [exportingId, setExportingId] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load user data
  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    try {
      const [resumesData, exportsData] = await Promise.all([
        resumesApi.list(),
        exportsApi.list(),
      ]);
      setResumes(resumesData || []);
      setExportsList(exportsData || []);
    } catch (err) {
      toast.error('Failed to load dashboard data: ' + err.message);
    } finally {
      setLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  // Create new resume handler
  const handleCreateResume = async (e) => {
    e.preventDefault();
    if (!newResumeName.trim()) {
      toast.error('Please enter a resume title');
      return;
    }

    setCreatingResume(true);
    try {
      let initialHeader = defaultHeader();
      let initialSections = defaultSections();
      let initialSettings = defaultSettings();

      const chosenTpl = templates.find((t) => t.id === selectedTemplateKey);
      if (chosenTpl) {
        if (chosenTpl.header) initialHeader = { ...initialHeader, ...chosenTpl.header };
        if (chosenTpl.sections) initialSections = chosenTpl.sections;
        if (chosenTpl.settings) initialSettings = { ...initialSettings, ...chosenTpl.settings };
      }

      const created = await resumesApi.create({
        name: newResumeName.trim(),
        headerJson: initialHeader,
        settingsJson: initialSettings,
        sectionsJson: initialSections,
      });

      toast.success('Resume created successfully!');
      setIsCreateModalOpen(false);
      router.push(`/builder?id=${created.id}`);
    } catch (err) {
      toast.error('Error creating resume: ' + err.message);
    } finally {
      setCreatingResume(false);
    }
  };

  // Delete resume handler
  const confirmDeleteResume = async () => {
    if (!resumeToDelete) return;
    setIsDeleting(true);
    try {
      await resumesApi.delete(resumeToDelete.id);
      toast.success('Resume deleted');
      setResumes((prev) => prev.filter((r) => r.id !== resumeToDelete.id));
      setResumeToDelete(null);
    } catch (err) {
      toast.error('Failed to delete resume: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete export handler
  const confirmDeleteExport = async () => {
    if (!exportToDelete) return;
    setIsDeleting(true);
    try {
      await exportsApi.delete(exportToDelete.id);
      toast.success('Export removed');
      setExportsList((prev) => prev.filter((item) => item.id !== exportToDelete.id));
      setExportToDelete(null);
    } catch (err) {
      toast.error('Failed to remove export: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick export Word directly from dashboard
  const handleQuickExportDocx = async (resumeId) => {
    setExportingId(resumeId);
    try {
      const fullResume = await resumesApi.get(resumeId);
      const res = await exportsApi.exportDocx({
        resumeId: fullResume.id,
        name: fullResume.name,
        headerJson: fullResume.header_json,
        settingsJson: fullResume.settings_json,
        sectionsJson: fullResume.sections_json,
      });

      toast.success('Word document generated!');
      // Trigger download
      window.open(exportsApi.getDownloadUrl(res.id), '_blank');
      // Refresh exports
      const updatedExports = await exportsApi.list();
      setExportsList(updatedExports || []);
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportingId(null);
    }
  };

  if (authLoading || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090a0f] text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-zinc-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const filteredResumes = resumes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-[#10121a]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/25">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Resumo
              </span>
            </Link>

            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Studio Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="py-1.5 px-3 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 font-medium text-xs sm:text-sm rounded-lg border border-blue-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Import and parse existing resume PDF using Gemini AI"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import PDF</span>
            </button>

            <button
              onClick={() => {
                setNewResumeName('My Resume');
                setIsCreateModalOpen(true);
              }}
              className="py-1.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm rounded-lg shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Resume</span>
            </button>

            <div className="h-4 w-px bg-zinc-800" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-200">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-zinc-200 truncate max-w-[140px]">{user?.name}</p>
                <p className="text-[11px] text-zinc-500 truncate max-w-[140px]">{user?.email}</p>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Hello, {user?.name || 'Creator'} 👋
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage your tailored resumes, launch the studio editor, or download previously exported files.
            </p>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 w-fit">
            <button
              onClick={() => setActiveTab('resumes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'resumes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Resumes</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                  activeTab === 'resumes' ? 'bg-blue-700 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {resumes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('exports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'exports'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileDown className="w-4 h-4" />
              <span>Exported Resumes</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                  activeTab === 'exports' ? 'bg-blue-700 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {exportsList.length}
              </span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: MY RESUMES ────────────────────────────────────────────── */}
        {activeTab === 'resumes' && (
          <div>
            {/* Search Bar & Actions */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search resumes by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  setNewResumeName('My Resume');
                  setIsCreateModalOpen(true);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-400" />
                <span>New Resume</span>
              </button>
            </div>

            {loadingData ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                <p className="text-sm text-zinc-400">Loading your resumes...</p>
              </div>
            ) : filteredResumes.length === 0 ? (
              <div className="py-16 px-4 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">No resumes found</h3>
                <p className="mt-1 text-sm text-zinc-400 max-w-md mx-auto">
                  {searchQuery
                    ? 'No resumes match your search query. Try clearing the filter.'
                    : "You haven't created any resumes yet. Start creating your first professional resume!"}
                </p>
                <button
                  onClick={() => {
                    setNewResumeName('My Resume');
                    setIsCreateModalOpen(true);
                  }}
                  className="mt-5 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Resume Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Create Card Shortcut */}
                <div
                  onClick={() => {
                    setNewResumeName('My Resume');
                    setIsCreateModalOpen(true);
                  }}
                  className="group min-h-[220px] rounded-2xl border border-dashed border-zinc-800 hover:border-blue-500/50 bg-zinc-900/20 hover:bg-zinc-900/50 p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 text-blue-400 flex items-center justify-center mb-3 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-white text-sm">Create New Resume</p>
                  <p className="text-xs text-zinc-500 mt-1">Start from a template or blank</p>
                </div>

                {/* Resume Cards */}
                {filteredResumes.map((resume) => {
                  const updatedDate = new Date(resume.updated_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={resume.id}
                      className="group bg-[#12141c]/90 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header & Badges */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-zinc-400" />
                              {resume.section_count} sections
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-white text-base tracking-tight truncate group-hover:text-blue-400 transition-colors">
                          {resume.name}
                        </h3>

                        {/* Date */}
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Last updated {updatedDate}</span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <Link
                          href={`/builder?id=${resume.id}`}
                          className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Resume</span>
                        </Link>

                        <button
                          onClick={() => handleQuickExportDocx(resume.id)}
                          disabled={exportingId === resume.id}
                          title="Export Word (.docx)"
                          className="p-1.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {exportingId === resume.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          ) : (
                            <FileCode className="w-4 h-4 text-sky-400" />
                          )}
                        </button>

                        <button
                          onClick={() => setResumeToDelete(resume)}
                          title="Delete Resume"
                          className="p-1.5 bg-zinc-800/90 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg border border-zinc-700 hover:border-red-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: EXPORTED RESUMES ───────────────────────────────────────── */}
        {activeTab === 'exports' && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Export History</h2>
                <p className="text-xs text-zinc-400">
                  Every resume exported as PDF or Word is securely saved and ready for re-download.
                </p>
              </div>

              <button
                onClick={loadDashboardData}
                className="py-1.5 px-3 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-700 transition-colors"
              >
                Refresh
              </button>
            </div>

            {loadingData ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                <p className="text-sm text-zinc-400">Loading export history...</p>
              </div>
            ) : exportsList.length === 0 ? (
              <div className="py-16 px-4 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                  <FileDown className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">No exported resumes yet</h3>
                <p className="mt-1 text-sm text-zinc-400 max-w-md mx-auto">
                  When you export your resume from the builder studio as PDF or Word, it will appear here for instant download anytime.
                </p>
              </div>
            ) : (
              <div className="bg-[#12141c]/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[11px] font-semibold tracking-wider">
                      <tr>
                        <th className="py-3 px-4 sm:px-6">Document</th>
                        <th className="py-3 px-4 sm:px-6">Format</th>
                        <th className="py-3 px-4 sm:px-6">Size</th>
                        <th className="py-3 px-4 sm:px-6">Export Date</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {exportsList.map((item) => {
                        const isPdf = item.file_type === 'pdf';
                        const sizeKb = Math.round(item.file_size / 1024);
                        const exportDate = new Date(item.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                    isPdf
                                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                      : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                                  }`}
                                >
                                  {isPdf ? 'PDF' : 'DOC'}
                                </div>
                                <div>
                                  <p className="font-semibold text-white">{item.resume_name}</p>
                                  <p className="text-[11px] text-zinc-500 truncate max-w-[200px]">
                                    {item.file_name}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 sm:px-6">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                                  isPdf
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                }`}
                              >
                                {item.file_type}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 text-zinc-300 text-xs">
                              {sizeKb} KB
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 text-zinc-400 text-xs">
                              {exportDate}
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={exportsApi.getDownloadUrl(item.id)}
                                  download={item.file_name}
                                  className="py-1 px-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-medium border border-blue-500/30 transition-colors inline-flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>

                                <button
                                  onClick={() => setExportToDelete(item)}
                                  title="Remove export"
                                  className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── MODAL: CREATE RESUME ─────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12141c] border border-zinc-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Create New Resume</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResume} className="mt-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Resume Title
                </label>
                <input
                  type="text"
                  value={newResumeName}
                  onChange={(e) => setNewResumeName(e.target.value)}
                  placeholder="e.g. Senior Software Engineer - Google"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Choose a Starter Template
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateKey(tpl.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedTemplateKey === tpl.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white">{tpl.name}</span>
                        {selectedTemplateKey === tpl.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">{tpl.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingResume}
                  className="py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 inline-flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {creatingResume ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Launch Resume Studio</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRM DELETE RESUME ─────────────────────────────────── */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12141c] border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Resume?</h3>
            <p className="mt-2 text-xs text-zinc-400">
              Are you sure you want to delete <span className="text-white font-semibold">&quot;{resumeToDelete.name}&quot;</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResumeToDelete(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteResume}
                disabled={isDeleting}
                className="py-1.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRM DELETE EXPORT ─────────────────────────────────── */}
      {exportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12141c] border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Exported File?</h3>
            <p className="mt-2 text-xs text-zinc-400">
              Delete exported record for <span className="text-white font-semibold">&quot;{exportToDelete.file_name}&quot;</span>? The saved file will be removed from storage.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setExportToDelete(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteExport}
                disabled={isDeleting}
                className="py-1.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: IMPORT PDF (GEMINI AI) ─────────────────────────────────── */}
      {isImportModalOpen && (
        <ImportPdfModal
          isOpen={isImportModalOpen}
          onClose={() => {
            setIsImportModalOpen(false);
            loadDashboardData();
          }}
          mode="new"
        />
      )}
    </div>
  );
}
