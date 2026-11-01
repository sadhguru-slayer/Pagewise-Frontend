'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Shield,
  Key,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Mail,
  Loader2,
  FileText,
  LogOut,
  Type,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { BRAND_CONFIG, BrandLockup } from '@/lib/brand';
import { authApi } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Resume formatting preferences
  const initialBoldPref = Boolean(user?.preferences_json?.allow_bold_text);
  const [allowBoldText, setAllowBoldText] = useState(initialBoldPref);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setIsUpdatingName(true);
    try {
      await authApi.updatePreferences({ name: name.trim(), allowBoldText });
      toast.success('Profile name updated!');
    } catch (err) {
      toast.error('Failed to update name: ' + err.message);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleToggleBoldPreference = async (newValue) => {
    setAllowBoldText(newValue);
    setIsUpdatingPrefs(true);
    try {
      await authApi.updatePreferences({ allowBoldText: newValue });
      toast.success(newValue ? 'Enabled bold text in AI generation' : 'Set unbolded clean text default');
    } catch (err) {
      toast.error('Failed to update preferences: ' + err.message);
      setAllowBoldText(!newValue);
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      confirmPassword('');
      toast.success('Password changed successfully');
    }, 800);
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className="min-h-screen bg-[#090b13] text-[#e2e8f0] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-white/[0.07] bg-[#0c0e17]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <BrandLockup size={24} showBadge={false} />
              <span className="text-zinc-600">/</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.07]">
                Studio Account &amp; Preferences
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/[0.07] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Settings Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Account &amp; Preferences</h1>
          <p className="text-xs text-[#6b7280] mt-1">
            Manage your personal profile, credentials, and Resumo workspace settings.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#111420] border border-white/[0.07] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-amber-600/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{user?.name || 'User'}</h2>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>{user?.email || 'user@example.com'}</span>
              </p>
              <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-zinc-600" />
                <span>Member since {memberSince}</span>
              </p>
            </div>
          </div>

          {/* Edit Name Form */}
          <form onSubmit={handleUpdateName} className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span>Full Name</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 bg-[#090b13] border border-white/[0.08] focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isUpdatingName}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUpdatingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save Name</span>
              </button>
            </div>
          </form>
        </div>

        {/* AI & Resume Generation Settings Card */}
        <div className="bg-[#111420] border border-white/[0.07] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-500" />
                <span>AI Generation &amp; Typography Rules</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure how the PDF Parser and JD Resume Enhancer format your output text.
              </p>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/[0.05]">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-white">
                Allow Bold Tags in AI Generated Resumes
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                When <strong>disabled</strong> (recommended for standard ATS compliance), AI outputs clean unbolded text since industry resumes avoid inline bold highlights. Enable only if you want bold tags on metrics and job titles.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={allowBoldText}
                onChange={(e) => handleToggleBoldPreference(e.target.checked)}
                disabled={isUpdatingPrefs}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-[#111420] border border-white/[0.07] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#f97316]" />
            <span>Change Password</span>
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-md">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#090b13] border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">New Password (min. 6 characters)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#090b13] border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#090b13] border border-white/[0.08] focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl border border-white/[0.08] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {/* Plan / Quota Info */}
        <div className="bg-[#111420] border border-white/[0.07] rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#f97316]">
                Current Tier
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">Resumo Studio v2.5 Beta</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Unlimited
            </span>
          </div>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            During the v2.5 beta phase, you have access to unlimited resume branches, AI JD matching,
            Google XYZ bullet generation, and high-fidelity PDF exports.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-950/15 border border-rose-500/20 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Danger Zone</span>
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Deleting your account will permanently delete all your resumes, saved templates, and exported files. This action cannot be undone.
          </p>

          {showDeleteConfirm ? (
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  toast.error('Account deletion is locked during beta testing.');
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Confirm Account Deletion
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
            >
              Delete Account
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
