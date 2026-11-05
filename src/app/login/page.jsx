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
  Loader2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithOtp, isAuthenticated } = useAuth();

  // Mode: 'PASSWORD' | 'OTP'
  const [authMode, setAuthMode] = useState('PASSWORD');

  // OTP Login sub-step: 'REQUEST' | 'VERIFY'
  const [otpStep, setOtpStep] = useState('REQUEST');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // Handle standard password login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle requesting one-time login OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.requestLoginOTP(email.trim());
      toast.success(res?.message || 'Login code sent to your email.');
      setOtpStep('VERIFY');
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Could not send login code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle verifying one-time login OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await loginWithOtp(email.trim(), cleanOtp);
      toast.success('Signed in successfully!');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.requestLoginOTP(email.trim());
      toast.success(res?.message || 'New login code sent.');
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
        badge="PageWise Studio Access"
        headline="Welcome back to your precision career studio."
        subline="Access your master resume lineages, job-targeted branches, and vector print-calibrated documents."
      />

      {/* ─── Right Side: Human-Crafted Auth Form ─── */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16 xl:p-20 relative">
        {/* Mobile Header (Shown on small screens where showcase is hidden) */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-white/[0.08] mb-8">
          <Link href="/" className="inline-block">
            <BrandLockup size={26} showTagline={false} />
          </Link>
          <Link
            href="/register"
            className="text-xs font-semibold text-zinc-300 hover:text-white"
          >
            Create account →
          </Link>
        </div>

        {/* Center Auth Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          {/* Header Title */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold block mb-1">
              Authentication Terminal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sign in to Studio
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Select your sign-in method to resume editing your documents
            </p>
          </div>

          {/* Mode Switcher Tabs (Clean SaaS style) */}
          <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('PASSWORD');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authMode === 'PASSWORD'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('OTP');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'OTP'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Email Code</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Password Login */}
          {authMode === 'PASSWORD' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                  />
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
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Email OTP Login */}
          {authMode === 'OTP' && (
            <div className="space-y-4">
              {otpStep === 'REQUEST' && (
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
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                      We will transmit a 6-digit one-time sign-in code to this email.
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
                        <span>Sending Security Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send One-Time Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {otpStep === 'VERIFY' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-zinc-400 truncate max-w-[200px]">{email}</span>
                    <button
                      type="button"
                      onClick={() => setOtpStep('REQUEST')}
                      className="text-xs text-zinc-300 hover:text-white underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      6-Digit Security Code
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
                        <span>Validating Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify &amp; Sign In</span>
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
            </div>
          )}

          {/* Bottom link to Register */}
          <div className="pt-4 border-t border-white/[0.06] text-center text-xs text-zinc-400">
            <span>Don&apos;t have a PageWise Studio account? </span>
            <Link
              href="/register"
              className="text-white font-semibold hover:underline cursor-pointer"
            >
              Create Account Free
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
