'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BRAND_CONFIG, BrandLockup } from '@/lib/brand';
import { authApi } from '@/lib/api';
import AuthShowcasePanel from '@/components/layout/AuthShowcasePanel';
import {
  Mail,
  KeyRound,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = {
  EMAIL: 'EMAIL',
  OTP: 'OTP',
  NEW_PASSWORD: 'NEW_PASSWORD',
  SUCCESS: 'SUCCESS',
};

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Resend countdown timer
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      toast.success(res?.message || 'Verification code sent to your email.');
      setStep(STEPS.OTP);
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyResetOTP(email.trim(), cleanOtp);
      toast.success('Code verified successfully.');
      setResetToken(res.reset_token);
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(resetToken, newPassword);
      toast.success(res?.message || 'Password updated successfully!');
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      toast.success(res?.message || 'New code sent.');
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#08090d] text-zinc-100 font-sans">
      {/* ─── Left Side: Direction 1 - Split Studio Showcase ─── */}
      <AuthShowcasePanel
        badge="Account Recovery Terminal"
        headline="Secure access recovery for your PageWise documents."
        subline="Safeguarding your master career archives, custom typography presets, and export history."
      />

      {/* ─── Right Side: Human-Crafted Auth Form ─── */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16 xl:p-20 relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-white/[0.08] mb-8">
          <Link href="/" className="inline-block">
            <BrandLockup size={26} showTagline={false} />
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-zinc-300 hover:text-white"
          >
            Back to Sign In →
          </Link>
        </div>

        {/* Center Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          {/* Header */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold block mb-1">
              Security Protocol
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {step === STEPS.EMAIL && 'Reset Your Password'}
              {step === STEPS.OTP && 'Verify Security Code'}
              {step === STEPS.NEW_PASSWORD && 'Choose New Password'}
              {step === STEPS.SUCCESS && 'Password Reset Complete'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              {step === STEPS.EMAIL && 'Enter your email to receive a 6-digit authentication code'}
              {step === STEPS.OTP && `Enter the 6-digit verification code transmitted to ${email}`}
              {step === STEPS.NEW_PASSWORD && 'Create a strong password with at least 8 characters'}
              {step === STEPS.SUCCESS && 'Your credentials have been securely updated'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-mono text-[11px] truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => setStep(STEPS.EMAIL)}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Enter 6-Digit Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm font-mono tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                  className="text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === STEPS.NEW_PASSWORD && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Save Password &amp; Finish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success */}
          {step === STEPS.SUCCESS && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Your password has been reset successfully. You can now sign in with your new credentials.
              </p>
              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Bottom link */}
          {step !== STEPS.SUCCESS && (
            <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-zinc-400">
              <Link
                href="/login"
                className="text-zinc-300 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          )}
        </div>

        {/* Desktop Bottom Helper Strip */}
        <div className="hidden lg:flex items-center justify-between text-xs text-zinc-500 pt-8 border-t border-white/[0.06]">
          <span>© {new Date().getFullYear()} PageWise Studio</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Home
            </Link>
            <a href="mailto:pagewises@gmail.com" className="hover:text-zinc-300 transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
