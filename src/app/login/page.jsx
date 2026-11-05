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
  Loader2,
  AlertCircle,
  KeyRound,
  RefreshCw,
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#090B10] text-[#F1F3F9]">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-white/[0.04] blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center justify-center group">
            <BrandLockup size={32} showTagline={true} />
          </Link>
          <h1 className="mt-6 text-2xl font-extrabold text-[#F1F3F9] tracking-tight">Studio Sign In</h1>
          <p className="mt-1.5 text-xs text-[#7E869B]">Access your master resume architectures and ATS audits</p>
        </div>

        {/* Card */}
        <div
          className="border rounded-2xl p-7 shadow-2xl backdrop-blur-xl"
          style={{
            background: BRAND_CONFIG.colors.surfaceCard,
            borderColor: BRAND_CONFIG.colors.borderSubtle,
          }}
        >
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-black/40 p-1 mb-5 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('PASSWORD');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'PASSWORD'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-sm'
                  : 'text-[#7E869B] hover:text-white'
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
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'OTP'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-sm'
                  : 'text-[#7E869B] hover:text-white'
              }`}
            >
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>Email OTP</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Password Login */}
          {authMode === 'PASSWORD' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#7E869B] focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#7E869B] font-mono">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-amber-400/90 hover:text-amber-300 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7E869B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: OTP Login */}
          {authMode === 'OTP' && (
            <>
              {otpStep === 'REQUEST' && (
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

                  <p className="text-[11px] text-[#7E869B] leading-relaxed">
                    We will send a 6-digit one-time passcode to your email. No password needed.
                  </p>

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
                        <span>Send Login Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {otpStep === 'VERIFY' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#7E869B] font-mono">
                        6-Digit Security Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('REQUEST');
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
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify &amp; Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-xs text-[#7E869B]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold hover:underline">
                Sign up free
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
