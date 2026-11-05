'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BRAND_CONFIG, BrandLockup } from '@/lib/brand';
import { authApi } from '@/lib/api';
import AuthShowcasePanel from '@/components/layout/AuthShowcasePanel';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  // Steps: 'INFO' | 'OTP'
  const [step, setStep] = useState('INFO');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Validate info and request email verification OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.requestRegisterOTP(email.trim());
      toast.success(res?.message || 'Verification code sent to your email.');
      setStep('OTP');
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Could not send verification email. Try another address.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize user creation
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP with backend to get signed register token
      const verifyRes = await authApi.verifyRegisterOTP(email.trim(), cleanOtp);
      const registerToken = verifyRes?.register_token;

      if (!registerToken) {
        throw new Error('Verification failed. Please re-enter the code.');
      }

      // 2. Complete registration with verified token
      await register(email.trim(), password, registerToken);
      toast.success('Email verified! Account created successfully.');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.requestRegisterOTP(email.trim());
      toast.success(res?.message || 'New verification code sent.');
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
        badge="Zero Paywall Studio"
        headline="Craft production-ready resumes that pass ATS checks."
        subline="Never lose your career milestones again. Branch tailored copies from a single master profile with pixel-accurate exports."
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
            Sign in instead →
          </Link>
        </div>

        {/* Center Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          {/* Header */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold block mb-1">
              New Studio Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {step === 'INFO' ? 'Create Your Account' : 'Verify Your Email'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              {step === 'INFO'
                ? 'Join professionals crafting resumes with millimeter A4 geometry'
                : `We transmitted a 6-digit confirmation code to ${email}`}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {step === 'INFO' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email Address
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

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                  />
                </div>
              </div>

              {/* Guarantees checklist */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5 text-[11px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Free vector print-calibrated A4 PDF download</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Native editable Microsoft Word (.docx) export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No credit card required to start</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Email Security...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Email Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Email OTP Verification */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-zinc-300 truncate font-mono text-[11px]">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('INFO')}
                  className="text-xs text-zinc-400 hover:text-white underline cursor-pointer shrink-0 ml-2"
                >
                  Edit
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Enter 6-Digit Verification Code
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
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Please check your inbox (and spam folder) for the 6-digit confirmation code.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Studio Account...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Launch Studio</span>
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

          {/* Bottom link to Login */}
          <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-zinc-400">
            <span>Already have a PageWise Studio account? </span>
            <Link
              href="/login"
              className="text-white font-semibold hover:underline cursor-pointer"
            >
              Sign In
            </Link>
          </div>
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
