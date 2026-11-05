'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BRAND_CONFIG, BrandLockup } from '@/lib/brand';
import { authApi } from '@/lib/api';
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
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
      setError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and create account
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#090B10] text-[#F1F3F9]">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-white/[0.04] blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center group">
            <BrandLockup size={32} showTagline={true} />
          </Link>
          <h1 className="mt-6 text-2xl font-extrabold text-[#F1F3F9] tracking-tight">
            {step === 'INFO' ? 'Create Studio Account' : 'Verify Your Email'}
          </h1>
          <p className="mt-1.5 text-xs text-[#7E869B]">
            {step === 'INFO'
              ? 'Launch your precision resume craft & ATS audit workspace'
              : `Enter the 6-digit verification code sent to ${email}`}
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

          {/* STEP 1: Registration Form */}
          {step === 'INFO' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E869B] mb-1.5 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E869B] mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7E869B] mb-1.5 font-mono">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#7E869B] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>A verification code will be sent to confirm your email.</span>
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
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Email &amp; Sign Up</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Email OTP Verification Form */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#7E869B] font-mono">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('INFO');
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
                  onClick={handleResendOtp}
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
                    <span>Verifying &amp; creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Create Account</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-xs text-[#7E869B]">
              Already have an account?{' '}
              <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-[#7E869B] hover:text-[#F1F3F9] transition-colors">
            ← Back to PageWise Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
