'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BRAND_CONFIG, BrandLockup } from '@/lib/brand';
import { authApi } from '@/lib/api';
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
      const res = await authApi.requestPasswordReset(email.trim());
      toast.success(res?.message || 'Verification code sent to your email.');
      setStep(STEPS.OTP);
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Could not send verification code. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 6-digit verification code sent to your inbox.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyResetOTP(email.trim(), cleanOtp);
      if (!res?.reset_token) {
        throw new Error('Verification failed. Please try again.');
      }
      setResetToken(res.reset_token);
      toast.success('Security code verified.');
      setStep(STEPS.NEW_PASSWORD);
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(resetToken, newPassword);
      toast.success(res?.message || 'Password reset successfully!');
      setStep(STEPS.SUCCESS);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to update password. Your reset session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#090B10] text-[#F1F3F9]">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-600/10 blur-[130px] rounded-full" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center group">
            <BrandLockup size={32} showTagline={true} />
          </Link>
          <h1 className="mt-6 text-2xl font-extrabold text-[#F1F3F9] tracking-tight">
            {step === STEPS.EMAIL && 'Reset Account Password'}
            {step === STEPS.OTP && 'Verify Security Code'}
            {step === STEPS.NEW_PASSWORD && 'Create New Password'}
            {step === STEPS.SUCCESS && 'Password Reset Complete'}
          </h1>
          <p className="mt-1.5 text-xs text-[#7E869B]">
            {step === STEPS.EMAIL && 'Enter your email to receive a 6-digit one-time verification code.'}
            {step === STEPS.OTP && `We dispatched a one-time code to ${email}`}
            {step === STEPS.NEW_PASSWORD && 'Choose a secure password for your studio account.'}
            {step === STEPS.SUCCESS && 'You can now sign in with your updated credentials.'}
          </p>
        </div>

        {/* Card */}
        <div
          className="border rounded-2xl p-7 shadow-2xl backdrop-blur-xl"
          style={{
            background: BRAND_CONFIG.colors.surfaceCard,
            borderColor: BRAND_CONFIG.colors.borderSubtle,
          }}
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E869B] mb-1.5 font-mono">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:opacity-95"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                  boxShadow: `0 4px 18px ${BRAND_CONFIG.colors.primaryGlow}`,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#7E869B] font-mono">
                    6-Digit Security Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(STEPS.EMAIL);
                      setError('');
                    }}
                    className="text-[11px] text-[#7E869B] hover:text-white transition-colors"
                  >
                    Edit Email
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={8}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\s+/g, ''))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-base tracking-[0.3em] font-mono font-bold text-amber-400 placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-all text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[#7E869B]">Didn&apos;t receive code?</span>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading || countdown > 0}
                  className="inline-flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:opacity-95"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                  boxShadow: `0 4px 18px ${BRAND_CONFIG.colors.primaryGlow}`,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === STEPS.NEW_PASSWORD && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E869B] mb-1.5 font-mono">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E869B] mb-1.5 font-mono">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:opacity-95"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                  boxShadow: `0 4px 18px ${BRAND_CONFIG.colors.primaryGlow}`,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success confirmation */}
          {step === STEPS.SUCCESS && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Password Updated</h3>
                <p className="text-xs text-[#7E869B] mt-1">
                  Your credentials have been securely updated. Redirecting to studio login...
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-white/[0.08] hover:bg-white/[0.12] text-white transition-colors"
              >
                <span>Go to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[#7E869B] hover:text-[#F1F3F9] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
