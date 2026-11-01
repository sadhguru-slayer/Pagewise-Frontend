'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BRAND_CONFIG, BrandLockup } from '@/lib/brand';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
