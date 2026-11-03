'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Key,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Mail,
  Loader2,
  LogOut,
  Type,
  RefreshCw,
  X,
  Lock,
  User as UserIcon,
  Zap,
  Receipt,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PilotBanner from '@/components/ui/PilotBanner';
import { useAuth } from '@/lib/auth-context';
import { BRAND_CONFIG, BrandLockup } from '@/lib/brand';
import { authApi, paymentsApi } from '@/lib/api';
import PricingModal from '@/components/pricing/PricingModal';
import BillingHistoryCard from '@/components/billing/BillingHistoryCard';

function getAllowBoldPref(usr) {
  if (!usr?.preferences_json) return true;
  let prefs = usr.preferences_json;
  if (typeof prefs === 'string') {
    try {
      prefs = JSON.parse(prefs);
    } catch {
      return true;
    }
  }
  return prefs?.allow_bold_text !== false;
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');

  const { user, logout, isAuthenticated, loading, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState(
    ['profile', 'preferences', 'subscription', 'billing'].includes(requestedTab)
      ? requestedTab
      : 'profile'
  );

  // Sync tab if URL param changes
  useEffect(() => {
    if (requestedTab && ['profile', 'preferences', 'subscription', 'billing'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

  // Resume formatting preferences (Defaults to true)
  const [allowBoldText, setAllowBoldText] = useState(getAllowBoldPref(user));
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);

  // Profile Password Reset (OTP Flow: reset -> otp -> show otp form -> verify -> reset password)
  const [pwStage, setPwStage] = useState('INIT'); // 'INIT' | 'OTP_FORM' | 'NEW_PW_FORM'
  const [profileOtp, setProfileOtp] = useState('');
  const [profileResetToken, setProfileResetToken] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwCountdown, setPwCountdown] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);

  // Re-synchronize state when auth loads or user profile updates
  useEffect(() => {
    if (user) {
      setAllowBoldText(getAllowBoldPref(user));
    }
  }, [user]);

  // Auth guard
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Resend timer countdown
  useEffect(() => {
    let timer;
    if (pwCountdown > 0) {
      timer = setTimeout(() => setPwCountdown(pwCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [pwCountdown]);

  const loadPlan = async () => {
    try {
      const res = await paymentsApi.getStatus();
      setPlanStatus(res);
    } catch (err) {
      console.warn('Failed to fetch plan in settings:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPlan();
    }
  }, [isAuthenticated]);

  const handleToggleBoldPreference = async (newValue) => {
    setAllowBoldText(newValue);
    setIsUpdatingPrefs(true);
    try {
      await authApi.updatePreferences({ allowBoldText: newValue });
      if (refreshUser) await refreshUser();
      toast.success(newValue ? 'Enabled bold formatting for AI resumes' : 'Disabled bold tags (plain text output)');
    } catch (err) {
      toast.error('Failed to update preferences: ' + err.message);
      setAllowBoldText(!newValue);
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  // Step 1: User initiates reset inside profile -> request OTP
  const handleRequestProfileOtp = async () => {
    setPwLoading(true);
    try {
      const res = await authApi.profileRequestResetOTP();
      toast.success(res?.message || 'Security code dispatched to your email!');
      setPwStage('OTP_FORM');
      setPwCountdown(60);
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch security code.');
    } finally {
      setPwLoading(false);
    }
  };

  // Step 2: Show OTP form -> user enters OTP -> verify OTP
  const handleVerifyProfileOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = profileOtp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await authApi.profileVerifyResetOTP(cleanOtp);
      if (!res?.reset_token) {
        throw new Error('Verification failed. Please re-enter the code.');
      }
      setProfileResetToken(res.reset_token);
      toast.success('Code verified. Set your new password below.');
      setPwStage('NEW_PW_FORM');
    } catch (err) {
      toast.error(err.message || 'Invalid or expired verification code.');
    } finally {
      setPwLoading(false);
    }
  };

  // Step 3: Enter new password -> Reset Password
  const handleResetProfilePassword = async (e) => {
    e.preventDefault();
    if (!profileNewPassword || profileNewPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (profileNewPassword !== profileConfirmPassword) {
      toast.error('Passwords do not match. Please re-type.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await authApi.profileResetPassword(profileResetToken, profileNewPassword);
      toast.success(res?.message || 'Password changed successfully!');
      setPwStage('INIT');
      setProfileOtp('');
      setProfileResetToken('');
      setProfileNewPassword('');
      setProfileConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleCancelPasswordReset = () => {
    setPwStage('INIT');
    setProfileOtp('');
    setProfileResetToken('');
    setProfileNewPassword('');
    setProfileConfirmPassword('');
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  const SETTINGS_TABS = [
    { id: 'profile', label: 'Profile & Security', icon: UserIcon, description: 'Credentials & password' },
    { id: 'preferences', label: 'Studio & AI Rules', icon: Type, description: 'Bold text & generation rules' },
    { id: 'subscription', label: 'Plan & Quotas', icon: Zap, description: 'Limits & workspaces' },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt, description: 'Receipts & payment history' },
  ];

  return (
    <div className="min-h-screen bg-[#090b13] text-[#e2e8f0] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-white/[0.07] bg-[#0c0e17]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                Settings &amp; Workspace
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

      {/* Main Settings Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Account &amp; Studio Settings</h1>
          <p className="text-xs text-[#7E869B] mt-1">
            Centralized hub for your authentication, AI typography rules, quotas, and billing records.
          </p>
        </div>

        {/* Global Pilot Notice */}
        <PilotBanner variant="card" dismissible={false} className="mb-6" />

        {/* Centralized Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 p-1.5 bg-black/40 rounded-2xl border border-white/[0.06]">
          {SETTINGS_TABS.map(({ id, label, icon: Icon, description }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center sm:items-start gap-2.5 p-3 rounded-xl transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#181B26] text-white border border-[#C88A58]/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isActive ? 'bg-[#C88A58]/20 text-[#D49A6A]' : 'bg-white/[0.04] text-zinc-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 hidden sm:block">
                  <span className="text-xs font-semibold block truncate leading-tight">{label}</span>
                  <span className="text-[10px] text-zinc-500 block truncate mt-0.5">{description}</span>
                </div>
                <span className="text-xs font-semibold sm:hidden block truncate">{label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Profile & Security */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Overview Card */}
            <div className="bg-[#111420] border border-white/[0.07] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-amber-600/20 shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{user?.name || 'User'}</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                      @{user?.name || 'user'}
                    </span>
                  </div>
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
            </div>

            {/* Change Password Card — Authenticated OTP Flow */}
            <div className="bg-[#111420] border border-white/[0.07] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>Security &amp; Password Management</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Multi-step OTP verification ensures your account credentials remain strictly protected.
                  </p>
                </div>
                {pwStage !== 'INIT' && (
                  <button
                    type="button"
                    onClick={handleCancelPasswordReset}
                    className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              {/* STAGE 1: Request OTP */}
              {pwStage === 'INIT' && (
                <div className="p-5 rounded-xl bg-black/40 border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Reset Profile Password</span>
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                      Click the button to receive a 6-digit one-time security code sent to{' '}
                      <strong className="text-zinc-200">{user?.email}</strong> to authenticate and reset your password.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestProfileOtp}
                    disabled={pwLoading}
                    className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer hover:opacity-95"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                      boxShadow: `0 4px 18px ${BRAND_CONFIG.colors.primaryGlow}`,
                    }}
                  >
                    {pwLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Request Reset OTP</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STAGE 2: Show OTP Form */}
              {pwStage === 'OTP_FORM' && (
                <form onSubmit={handleVerifyProfileOtp} className="p-5 rounded-xl bg-black/40 border border-amber-500/20 space-y-4 max-w-md">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                      Step 2 of 3: Verify Security Code
                    </span>
                    <p className="text-xs text-zinc-300">
                      Enter the 6-digit verification code sent to <strong className="text-white">{user?.email}</strong>.
                    </p>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={8}
                      value={profileOtp}
                      onChange={(e) => setProfileOtp(e.target.value.replace(/\s+/g, ''))}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-white/[0.12] rounded-xl text-base tracking-[0.3em] font-mono font-bold text-amber-400 placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-all text-center"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-zinc-500">Didn&apos;t receive code?</span>
                    <button
                      type="button"
                      onClick={handleRequestProfileOtp}
                      disabled={pwLoading || pwCountdown > 0}
                      className="inline-flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${pwLoading ? 'animate-spin' : ''}`} />
                      <span>{pwCountdown > 0 ? `Resend in ${pwCountdown}s` : 'Resend Code'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer hover:opacity-95"
                      style={{
                        background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                        boxShadow: `0 4px 18px ${BRAND_CONFIG.colors.primaryGlow}`,
                      }}
                    >
                      {pwLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify OTP</span>
                          <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPasswordReset}
                      className="px-4 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* STAGE 3: Show New Password Form */}
              {pwStage === 'NEW_PW_FORM' && (
                <form onSubmit={handleResetProfilePassword} className="p-5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-4 max-w-md">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Identity verified. Enter your new account password below.</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">New Password (min. 6 characters)</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={profileNewPassword}
                        onChange={(e) => setProfileNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoFocus
                        className="w-full pl-10 pr-4 py-2 bg-[#090b13] border border-white/[0.08] focus:border-amber-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={profileConfirmPassword}
                        onChange={(e) => setProfileConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-4 py-2 bg-[#090b13] border border-white/[0.08] focus:border-amber-500 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer hover:opacity-95"
                      style={{
                        background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                        boxShadow: `0 4px 18px ${BRAND_CONFIG.colors.primaryGlow}`,
                      }}
                    >
                      {pwLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPasswordReset}
                      className="px-4 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-950/15 border border-rose-500/20 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Danger Zone</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Deleting your account will permanently purge all your resumes, saved templates, and exported files. This action cannot be undone.
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
                    className="px-3 py-2 text-xs text-zinc-400 hover:text-white cursor-pointer"
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
          </div>
        )}

        {/* TAB 2: Studio & AI Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-[#111420] border border-white/[0.07] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Type className="w-4 h-4 text-amber-500" />
                    <span>AI Generation &amp; Typography Rules</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure typography formatting and bold tag highlighting generated by Wiser AI and PDF parsing.
                  </p>
                </div>
              </div>

              {/* Bold Texts Option (Default TRUE) */}
              <div className="flex items-start justify-between gap-4 p-5 rounded-xl bg-black/40 border border-white/[0.05]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Allow Bold Formatting in AI Resumes
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                      Recommended Default
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    When <strong>enabled (default)</strong>, Wiser AI strategically emphasizes key impact metrics, technologies, and achievements in bold to improve recruiter scannability. If you prefer strictly plain text with zero bold tags, uncheck this option.
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

              {/* Formatting Feature Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-[#D49A6A]" />
                    <span>Single-Page Intelligent Spacing</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Templates dynamically scale line-height and margin spacing to enforce strict single-page PDF output.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-[#D49A6A]" />
                    <span>ATS Canonical Tags</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Skills and technologies are parsed into structured arrays for optimal parsing by Workday, Greenhouse, and Lever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Plan & Quotas */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-[#111420] border border-white/[0.07] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                    Current Active Tier
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {planStatus?.plan_name || 'Pagewise Free'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {planStatus?.expires_at
                      ? `Active until ${new Date(planStatus.expires_at).toLocaleDateString()} (${Math.max(
                          0,
                          Math.ceil((new Date(planStatus.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
                        )} days remaining)`
                      : 'Free Forever · Quotas refresh on calendar month'}
                  </p>
                </div>
                <button
                  onClick={() => setPricingOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition cursor-pointer"
                >
                  {planStatus?.plan_type === 'pro_monthly' ? 'Manage Plan' : 'Upgrade Plan'}
                </button>
              </div>

              {/* Granular Tracking Counters */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                  Quota &amp; Usage Balance
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Resumes */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.05]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Resume Workspaces</span>
                      <span className="font-mono font-semibold text-white">
                        {planStatus?.usage?.active_resumes || 0} / {planStatus?.limits?.resumes ?? 1}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((planStatus?.usage?.active_resumes || 0) / (planStatus?.limits?.resumes || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1.5 block">
                      {planStatus?.remaining?.resumes ?? 0} workspace(s) remaining
                    </span>
                  </div>

                  {/* Exports */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.05]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Exports (Current Period)</span>
                      <span className="font-mono font-semibold text-white">
                        {planStatus?.usage?.exports_used || 0} / {planStatus?.limits?.exports ?? 1}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((planStatus?.usage?.exports_used || 0) / (planStatus?.limits?.exports || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1.5 block">
                      {planStatus?.remaining?.exports ?? 0} export(s) remaining
                    </span>
                  </div>

                  {/* Wiser Job Help */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.05]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Wiser Job Help (JD Analyses)</span>
                      <span className="font-mono font-semibold text-white">
                        {planStatus?.usage?.wiser_job_help_used || 0} / {planStatus?.limits?.wiser_job_help ?? 1}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((planStatus?.usage?.wiser_job_help_used || 0) / (planStatus?.limits?.wiser_job_help || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1.5 block">
                      {planStatus?.remaining?.wiser_job_help ?? 0} analysis run(s) remaining
                    </span>
                  </div>

                  {/* Wiser ATS checks */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.05]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Wiser ATS Audits</span>
                      <span className="font-mono font-semibold text-white">
                        {planStatus?.usage?.wiser_ats_used || 0} / {planStatus?.limits?.wiser_ats ?? 1}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((planStatus?.usage?.wiser_ats_used || 0) / (planStatus?.limits?.wiser_ats || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1.5 block">
                      {planStatus?.remaining?.wiser_ats ?? 0} ATS audit(s) remaining
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Billing & Invoices */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <BillingHistoryCard user={user} onUpgradeClick={() => setPricingOpen(true)} />
          </div>
        )}

        {/* Pricing Modal */}
        <PricingModal
          isOpen={pricingOpen}
          onClose={() => setPricingOpen(false)}
          currentPlan={planStatus?.plan_type || 'free'}
          onPlanUpdated={(newPlan) => {
            setPlanStatus(newPlan);
            loadPlan();
          }}
        />
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090b13] flex items-center justify-center text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#D49A6A]" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
