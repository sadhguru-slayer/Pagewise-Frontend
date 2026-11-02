'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, getAdminToken } from '@/lib/api';
import { BrandLogo } from '@/lib/brand';
import {
  Users,
  BarChart3,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  ShieldCheck,
  Download,
  FileText,
  Palette,
  GitBranch,
  RefreshCw,
  Loader2,
  X,
  ArrowUpDown,
  KeyRound,
  Lock,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Sign-in form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin panel state
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'users' | 'security'
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Users table state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    is_admin: false,
    plan_type: 'free',
  });
  const [submitting, setSubmitting] = useState(false);

  // User Detailed Inspection Modal state
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectedUser, setInspectedUser] = useState(null);
  const [inspectTab, setInspectTab] = useState('overview'); // 'overview' | 'payments' | 'resumes' | 'exports' | 'templates' | 'ai_logs'

  const handleInspectUser = async (u) => {
    try {
      setInspectLoading(true);
      setInspectModalOpen(true);
      setInspectTab('overview');
      const detail = await adminApi.getUserDetail(u.id);
      setInspectedUser(detail);
    } catch (err) {
      toast.error('Failed to load user inspection details: ' + err.message);
    } finally {
      setInspectLoading(false);
    }
  };

  // Confidential Admin Security Reset state
  const [selfSecurity, setSelfSecurity] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    new_email: '',
    new_name: '',
  });
  const [updatingSelf, setUpdatingSelf] = useState(false);

  // 1. Check existing admin session on mount
  const checkAdminAuth = useCallback(async () => {
    try {
      const token = getAdminToken();
      if (!token) {
        setAdminUser(null);
        setCheckingAuth(false);
        return;
      }
      const me = await adminApi.getMe();
      if (me && me.is_admin) {
        setAdminUser(me);
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  // 2. Fetch Insights
  const fetchInsights = useCallback(async () => {
    try {
      setInsightsLoading(true);
      const data = await adminApi.getInsights();
      setInsights(data);
    } catch (err) {
      toast.error('Failed to load insights: ' + err.message);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  // 3. Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await adminApi.listUsers({
        search,
        plan: planFilter || undefined,
        role: roleFilter || undefined,
        sortBy,
        sortOrder,
      });
      setUsers(res.users || []);
      setTotalUsers(res.total || 0);
    } catch (err) {
      toast.error('Failed to load users: ' + err.message);
    } finally {
      setUsersLoading(false);
    }
  }, [search, planFilter, roleFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (adminUser) {
      fetchInsights();
      fetchUsers();
    }
  }, [adminUser, fetchInsights, fetchUsers]);

  // Handle dedicated Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      toast.error('Username/email and password required.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await adminApi.login(loginIdentifier.trim(), loginPassword);
      setAdminUser(res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
    } catch (err) {
      toast.error(err.message || 'Invalid administrator credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    adminApi.logout();
    setAdminUser(null);
    toast.success('Signed out of Admin Console');
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      is_admin: false,
      plan_type: 'free',
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      is_admin: Boolean(u.is_admin),
      plan_type: u.subscription?.plan_type || 'free',
    });
    setUserModalOpen(true);
  };

  const handleDeleteUser = async (u) => {
    if (u.id === adminUser.id) {
      toast.error('You cannot delete your own logged-in admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete ${u.name} (${u.email})? This removes all their resumes, exports, and data.`)) {
      return;
    }
    try {
      await adminApi.deleteUser(u.id);
      toast.success('User deleted successfully');
      fetchUsers();
      fetchInsights();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = {
          name: formData.name,
          email: formData.email,
          is_admin: formData.is_admin,
          plan_type: formData.plan_type,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await adminApi.updateUser(editingUser.id, payload);
        toast.success('User updated successfully');
      } else {
        await adminApi.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          is_admin: formData.is_admin,
          plan_type: formData.plan_type,
        });
        toast.success('User created successfully');
      }
      setUserModalOpen(false);
      fetchUsers();
      fetchInsights();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSelfSecurity = async (e) => {
    e.preventDefault();
    if (!selfSecurity.current_password) {
      toast.error('Current password is required to verify identity.');
      return;
    }
    if (selfSecurity.new_password && selfSecurity.new_password !== selfSecurity.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    if (selfSecurity.new_password && selfSecurity.new_password.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    try {
      setUpdatingSelf(true);
      const res = await adminApi.updateSelfSecurity({
        current_password: selfSecurity.current_password,
        new_password: selfSecurity.new_password,
        new_email: selfSecurity.new_email || undefined,
        new_name: selfSecurity.new_name || undefined,
      });
      toast.success('Admin credentials updated securely!');
      setAdminUser({ ...adminUser, ...res.admin });
      setSelfSecurity({
        current_password: '',
        new_password: '',
        confirm_password: '',
        new_email: '',
        new_name: '',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to update admin credentials');
    } finally {
      setUpdatingSelf(false);
    }
  };

  // Loading Screen
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
        <span className="text-xs font-mono text-zinc-500">Connecting to secure console...</span>
      </div>
    );
  }

  // ─── DEDICATED ADMIN SIGN-IN PORTAL ───────────────────────────────────────
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans select-none">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-zinc-800 border border-zinc-700/80 mb-2">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Confidential Admin Console
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Administrator Authentication</h1>
            <p className="text-xs text-zinc-400 max-w-xs">
              Access restricted to authorized platform personnel. Sign in with your designated admin credentials.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Admin Username or Email
              </label>
              <input
                type="text"
                required
                autoFocus
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="sadguruchenu or ims.guru29@gmail.com"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Admin Master Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-600/20"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <span>Access Admin Control Console</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800/80 text-center text-[11px] text-zinc-500">
            PageWise Studio Internal Security Gateway
          </div>
        </div>
      </div>
    );
  }

  // ─── ADMIN CONTROL PANEL INTERFACE ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size={26} />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-white">PageWise Admin</span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              SECURE CONSOLE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchInsights();
              fetchUsers();
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Refresh analytics & data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{adminUser.email}</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <button
            onClick={handleAdminLogout}
            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition text-xs flex items-center gap-1 cursor-pointer"
            title="Sign out of Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Platform Insights &amp; Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>User Accounts ({totalUsers})</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Admin Security &amp; Credentials</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New User</span>
            </button>
          )}
        </div>

        {/* ─── TAB 1: INSIGHTS & METRICS ────────────────────────────────────────── */}
        {activeTab === 'insights' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {insightsLoading || !insights ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500 mb-2" />
                <p className="text-xs">Aggregating platform metrics across all databases...</p>
              </div>
            ) : (
              <>
                {/* Top Row: User & Plan Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Total Registered</span>
                      <Users className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-white">{insights.total_users}</span>
                      <span className="text-xs text-zinc-400 ml-2">users onboarded</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Pagewise Free</span>
                      <span className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 border border-zinc-700">₹0</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-white">{insights.active_plans?.free || 0}</span>
                      <span className="text-xs text-zinc-400 ml-2">free tier</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Wiser Day Pass</span>
                      <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">₹49</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-amber-400">{insights.active_plans?.day_pass || 0}</span>
                      <span className="text-xs text-zinc-400 ml-2">24h passes</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">Pagewise Pro</span>
                      <span className="px-2 py-0.5 text-[10px] rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">₹199/mo</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-indigo-400">{insights.active_plans?.pro_monthly || 0}</span>
                      <span className="text-xs text-zinc-400 ml-2">pro subscribers</span>
                    </div>
                  </div>
                </div>

                {/* Section: Wiser AI Usage Deep Dive */}
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Wiser AI Intelligence Usage</h3>
                      <p className="text-xs text-zinc-400">Execution breakdown across Job Help and ATS audits</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold font-mono">
                      Total AI Runs: {insights.ai_usage?.total_invocations || 0}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-xs text-zinc-400">Wiser Job Help (JD Match &amp; Bullets)</span>
                      <p className="text-2xl font-bold text-white mt-1">{insights.ai_usage?.wiser_job_helps || 0}</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Targeted analyses run by users</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-xs text-zinc-400">Wiser ATS (Standalone Audits)</span>
                      <p className="text-2xl font-bold text-white mt-1">{insights.ai_usage?.wiser_ats_checks || 0}</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Instant ATS scannability checks</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-xs text-zinc-400">AI Invocations Per Head (Avg)</span>
                      <p className="text-2xl font-bold text-amber-400 mt-1">{insights.ai_usage?.avg_ai_per_user || 0}</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Average runs per registered user</p>
                    </div>
                  </div>
                </div>

                {/* Section: Comprehensive Metrics Matrix */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                    Resource Analytics (Total, Per-Head Average, Max &amp; Min)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Exports Metric Card */}
                    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-semibold text-zinc-300">Exports Generated</span>
                        <Download className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">{insights.exports?.total || 0}</div>
                      <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Avg/Head</span>
                          <span className="font-semibold text-zinc-200">{insights.exports?.avg_per_user || 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Max</span>
                          <span className="font-semibold text-emerald-400">{insights.exports?.max_per_user || 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Min</span>
                          <span className="font-semibold text-zinc-400">{insights.exports?.min_per_user || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Resumes Metric Card */}
                    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-semibold text-zinc-300">Active Resumes</span>
                        <FileText className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">{insights.resumes?.total || 0}</div>
                      <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Avg/Head</span>
                          <span className="font-semibold text-zinc-200">{insights.resumes?.avg_per_user || 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Max</span>
                          <span className="font-semibold text-sky-400">{insights.resumes?.max_per_user || 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Min</span>
                          <span className="font-semibold text-zinc-400">{insights.resumes?.min_per_user || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Branched Resumes Metric Card */}
                    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-semibold text-zinc-300">Branched Resumes</span>
                        <GitBranch className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">{insights.branched_resumes?.total || 0}</div>
                      <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Avg/Head</span>
                          <span className="font-semibold text-zinc-200">{insights.branched_resumes?.avg_per_user || 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Max</span>
                          <span className="font-semibold text-purple-400">{insights.branched_resumes?.max_per_user || 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Min</span>
                          <span className="font-semibold text-zinc-400">{insights.branched_resumes?.min_per_user || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom Templates Metric Card */}
                    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="text-xs font-semibold text-zinc-300">Custom Templates</span>
                        <Palette className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">{insights.custom_templates?.total || 0}</div>
                      <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Avg/Head</span>
                          <span className="font-semibold text-zinc-200">{insights.custom_templates?.avg_per_user || 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Max</span>
                          <span className="font-semibold text-amber-400">{insights.custom_templates?.max_per_user || 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Min</span>
                          <span className="font-semibold text-zinc-400">{insights.custom_templates?.min_per_user || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── TAB 2: USER MANAGEMENT TABLE ──────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search and Filters Bar */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[240px] relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">All Plans</option>
                  <option value="free">Pagewise Free</option>
                  <option value="day_pass">Wiser Day Pass (₹49)</option>
                  <option value="pro_monthly">Pagewise Pro (₹199)</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="user">Regular Users</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="created_at">Registered Date</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white"
                  title="Toggle sort order"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Users Data Table */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Plan</th>
                      <th className="py-3.5 px-4 text-center">Resumes (Branched)</th>
                      <th className="py-3.5 px-4 text-center">Exports</th>
                      <th className="py-3.5 px-4 text-center">Custom Tmpl</th>
                      <th className="py-3.5 px-4 text-center">Wiser AI (JH / ATS)</th>
                      <th className="py-3.5 px-4">Registered</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {usersLoading ? (
                      <tr>
                        <td colSpan="9" className="py-12 text-center text-zinc-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                          Loading accounts...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-12 text-center text-zinc-500">
                          No users found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const isSelf = u.id === adminUser.id;
                        const planType = u.subscription?.plan_type || 'free';
                        return (
                          <tr key={u.id} className="hover:bg-zinc-800/40 transition">
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleInspectUser(u)}
                                className="text-left group cursor-pointer"
                                title="Click to inspect user purchases, limits & telemetry"
                              >
                                <div className="font-semibold text-white group-hover:text-amber-400 flex items-center gap-2 transition-colors">
                                  <span>{u.name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-zinc-400 group-hover:text-zinc-300 text-[11px] font-mono transition-colors">{u.email}</div>
                              </button>
                            </td>

                            <td className="py-3 px-4">
                              {u.is_admin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <ShieldCheck className="w-3 h-3" />
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                                  User
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  planType === 'pro_monthly'
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                    : planType === 'day_pass'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}
                              >
                                {u.subscription?.plan_name || 'Pagewise Free'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-white">{u.metrics?.resumes || 0}</span>
                              <span className="text-zinc-500 text-[10px] ml-1">
                                ({u.metrics?.branched_resumes || 0})
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center font-semibold text-emerald-400">
                              {u.metrics?.exports || 0}
                            </td>

                            <td className="py-3 px-4 text-center text-zinc-300">
                              {u.metrics?.custom_templates || 0}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-amber-400">{u.metrics?.wiser_total || 0}</span>
                              <span className="text-zinc-500 text-[10px] ml-1">
                                ({u.metrics?.wiser_job_helps || 0} / {u.metrics?.wiser_ats_checks || 0})
                              </span>
                            </td>

                            <td className="py-3 px-4 text-zinc-400 text-[11px]">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleInspectUser(u)}
                                  className="p-1.5 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition cursor-pointer"
                                  title="Inspect user telemetry, quotas & purchases"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                                  title="Edit user & plan"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={isSelf}
                                  onClick={() => handleDeleteUser(u)}
                                  className={`p-1.5 rounded-lg transition ${
                                    isSelf
                                      ? 'text-zinc-600 cursor-not-allowed'
                                      : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer'
                                  }`}
                                  title={isSelf ? 'Cannot delete self' : 'Delete user'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: CONFIDENTIAL ADMIN SECURITY ────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Confidential Admin Password &amp; Profile Reset</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Securely update your admin master password, email address, or username. All changes require valid verification of your current password.
                </p>
              </div>

              <form onSubmit={handleUpdateSelfSecurity} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Current Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={selfSecurity.current_password}
                    onChange={(e) => setSelfSecurity({ ...selfSecurity, current_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="Enter current password to authorize changes"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={selfSecurity.new_password}
                      onChange={(e) => setSelfSecurity({ ...selfSecurity, new_password: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={selfSecurity.confirm_password}
                      onChange={(e) => setSelfSecurity({ ...selfSecurity, confirm_password: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Update Username / Display Name
                    </label>
                    <input
                      type="text"
                      value={selfSecurity.new_name}
                      onChange={(e) => setSelfSecurity({ ...selfSecurity, new_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                      placeholder={adminUser?.name || 'sadguruchenu'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Update Admin Email
                    </label>
                    <input
                      type="email"
                      value={selfSecurity.new_email}
                      onChange={(e) => setSelfSecurity({ ...selfSecurity, new_email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                      placeholder={adminUser?.email || 'ims.guru29@gmail.com'}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <div className="text-[11px] text-zinc-500">
                    Active admin session: <span className="text-zinc-400 font-mono">{adminUser?.email}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={updatingSelf}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 transition cursor-pointer"
                  >
                    {updatingSelf && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Update Credentials</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ─── ADD / EDIT USER MODAL ─────────────────────────────────────────── */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">
                {editingUser ? `Edit Account: ${editingUser.name}` : 'Create New User Account'}
              </h3>
              <button
                onClick={() => setUserModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Password {editingUser && <span className="text-zinc-500">(Leave blank to keep unchanged)</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Subscription Plan</label>
                  <select
                    value={formData.plan_type}
                    onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="free">Pagewise Free</option>
                    <option value="day_pass">Wiser Day Pass (₹49)</option>
                    <option value="pro_monthly">Pagewise Pro (₹199)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Role / Permissions</label>
                  <select
                    value={formData.is_admin ? 'admin' : 'user'}
                    onChange={(e) => setFormData({ ...formData, is_admin: e.target.value === 'admin' })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="user">Regular User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? 'Save Changes' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── USER TELEMETRY & QUOTA DEEP-DIVE INSPECTION MODAL ─────────────── */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-base">
                  {inspectedUser?.user?.name ? inspectedUser.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{inspectedUser?.user?.name || 'User Inspection'}</h2>
                    {inspectedUser?.user?.is_admin && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold font-mono">
                        ADMIN
                      </span>
                    )}
                    <span className="text-xs text-zinc-500 font-mono">ID: #{inspectedUser?.user?.id}</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">{inspectedUser?.user?.email}</p>
                </div>
              </div>

              <button
                onClick={() => { setInspectModalOpen(false); setInspectedUser(null); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectLoading || !inspectedUser ? (
              <div className="py-24 flex flex-col items-center justify-center text-zinc-500">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500 mb-2" />
                <p className="text-xs">Fetching complete ledger, quotas, and telemetry for user...</p>
              </div>
            ) : (
              <>
                {/* Sub-tabs header */}
                <div className="flex items-center gap-1 px-5 border-b border-zinc-800 bg-zinc-950/40 text-xs shrink-0 overflow-x-auto">
                  <button
                    onClick={() => setInspectTab('overview')}
                    className={`py-3 px-3 font-semibold border-b-2 transition cursor-pointer ${
                      inspectTab === 'overview'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    Quotas &amp; Balances
                  </button>
                  <button
                    onClick={() => setInspectTab('payments')}
                    className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                      inspectTab === 'payments'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Purchases</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                      {inspectedUser.payments?.length || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setInspectTab('resumes')}
                    className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                      inspectTab === 'resumes'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Resumes ({inspectedUser.resumes?.length || 0})</span>
                    {inspectedUser.metrics_summary?.branched_resumes > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                        {inspectedUser.metrics_summary.branched_resumes} branched
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setInspectTab('exports')}
                    className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                      inspectTab === 'exports'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Exports</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                      {inspectedUser.exports?.length || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setInspectTab('templates')}
                    className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                      inspectTab === 'templates'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Custom Templates</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                      {inspectedUser.templates?.length || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setInspectTab('ai_logs')}
                    className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                      inspectTab === 'ai_logs'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>AI Logs</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                      {inspectedUser.ai_logs?.length || 0}
                    </span>
                  </button>
                </div>

                {/* Modal Tab Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-zinc-950/40">
                  {/* SUB-TAB: OVERVIEW & QUOTAS */}
                  {inspectTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Plan status strip */}
                      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Subscription Tier</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-base font-bold text-white">
                              {inspectedUser.plan_status?.plan_name || 'Pagewise Free'}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
                              {inspectedUser.plan_status?.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Total Spend</span>
                            <span className="text-amber-400 font-bold text-sm">
                              ₹{inspectedUser.metrics_summary?.total_spent_inr || 0}
                            </span>
                          </div>
                          {inspectedUser.plan_status?.expires_at && (
                            <div>
                              <span className="text-[10px] text-zinc-500 block">Expires</span>
                              <span className="text-white font-bold">
                                {new Date(inspectedUser.plan_status.expires_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quota vs Usage Matrix */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Resource Quota Balances (Used / Limit / Left)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Resume workspaces */}
                          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-300 font-semibold">Workspaces</span>
                              <span className="font-mono text-zinc-400">
                                <strong className="text-white">{inspectedUser.plan_status?.usage?.active_resumes ?? 0}</strong> / {inspectedUser.plan_status?.limits?.resumes ?? 1}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((inspectedUser.plan_status?.usage?.active_resumes ?? 0) / (inspectedUser.plan_status?.limits?.resumes || 1)) * 100))}%`
                                }}
                              />
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
                              <span>Remaining: <strong className="text-amber-400">{inspectedUser.plan_status?.remaining?.resumes ?? 0}</strong></span>
                              <span>{inspectedUser.metrics_summary?.master_resumes || 0} master</span>
                            </div>
                          </div>

                          {/* Exports */}
                          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-300 font-semibold">Verified Exports</span>
                              <span className="font-mono text-zinc-400">
                                <strong className="text-white">{inspectedUser.plan_status?.usage?.exports_used ?? 0}</strong> / {inspectedUser.plan_status?.limits?.exports ?? 1}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((inspectedUser.plan_status?.usage?.exports_used ?? 0) / (inspectedUser.plan_status?.limits?.exports || 1)) * 100))}%`
                                }}
                              />
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
                              <span>Remaining: <strong className="text-emerald-400">{inspectedUser.plan_status?.remaining?.exports ?? 0}</strong></span>
                              <span>{inspectedUser.exports?.length || 0} total saved</span>
                            </div>
                          </div>

                          {/* Wiser Job Help */}
                          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-300 font-semibold">Wiser Job Help</span>
                              <span className="font-mono text-zinc-400">
                                <strong className="text-white">{inspectedUser.plan_status?.usage?.wiser_job_help_used ?? 0}</strong> / {inspectedUser.plan_status?.limits?.wiser_job_help ?? 1}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((inspectedUser.plan_status?.usage?.wiser_job_help_used ?? 0) / (inspectedUser.plan_status?.limits?.wiser_job_help || 1)) * 100))}%`
                                }}
                              />
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
                              <span>Remaining: <strong className="text-sky-400">{inspectedUser.plan_status?.remaining?.wiser_job_help ?? 0}</strong></span>
                            </div>
                          </div>

                          {/* Wiser ATS */}
                          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-300 font-semibold">Wiser ATS Audits</span>
                              <span className="font-mono text-zinc-400">
                                <strong className="text-white">{inspectedUser.plan_status?.usage?.wiser_ats_used ?? 0}</strong> / {inspectedUser.plan_status?.limits?.wiser_ats ?? 1}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((inspectedUser.plan_status?.usage?.wiser_ats_used ?? 0) / (inspectedUser.plan_status?.limits?.wiser_ats || 1)) * 100))}%`
                                }}
                              />
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
                              <span>Remaining: <strong className="text-indigo-400">{inspectedUser.plan_status?.remaining?.wiser_ats ?? 0}</strong></span>
                            </div>
                          </div>

                          {/* Custom Templates */}
                          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-300 font-semibold">Custom Templates</span>
                              <span className="font-mono text-zinc-400">
                                <strong className="text-white">{inspectedUser.plan_status?.usage?.custom_templates_count ?? 0}</strong> / {inspectedUser.plan_status?.limits?.custom_templates ?? 1}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((inspectedUser.plan_status?.usage?.custom_templates_count ?? 0) / (inspectedUser.plan_status?.limits?.custom_templates || 1)) * 100))}%`
                                }}
                              />
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500 flex justify-between">
                              <span>Remaining: <strong className="text-purple-400">{inspectedUser.plan_status?.remaining?.custom_templates ?? 0}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PURCHASES & ORDERS */}
                  {inspectTab === 'payments' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Payment Orders History ({inspectedUser.payments?.length || 0})
                        </h4>
                        <span className="text-xs text-amber-400 font-mono font-bold">
                          Total Paid: ₹{inspectedUser.metrics_summary?.total_spent_inr || 0}
                        </span>
                      </div>

                      {(!inspectedUser.payments || inspectedUser.payments.length === 0) ? (
                        <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                          No payment orders placed yet. User is on free tier.
                        </div>
                      ) : (
                        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-950/80 text-zinc-400 text-[10px] font-mono uppercase tracking-wider border-b border-zinc-800">
                              <tr>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Plan</th>
                                <th className="py-2.5 px-3">Amount</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Order ID</th>
                                <th className="py-2.5 px-3">Payment ID</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                              {inspectedUser.payments.map((p) => (
                                <tr key={p.id} className="hover:bg-zinc-800/30">
                                  <td className="py-2.5 px-3 text-zinc-400">{new Date(p.created_at).toLocaleString()}</td>
                                  <td className="py-2.5 px-3 text-white font-sans font-semibold uppercase">{p.plan_type}</td>
                                  <td className="py-2.5 px-3 text-amber-400 font-bold">₹{p.amount_inr}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      p.status === 'paid'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-500 truncate max-w-[140px]">{p.razorpay_order_id || '—'}</td>
                                  <td className="py-2.5 px-3 text-zinc-500 truncate max-w-[140px]">{p.razorpay_payment_id || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: RESUMES & BRANCHES */}
                  {inspectTab === 'resumes' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                          Saved Resumes &amp; Branches ({inspectedUser.resumes?.length || 0})
                        </h4>
                        <span className="text-xs text-zinc-400 font-mono">
                          {inspectedUser.metrics_summary?.master_resumes || 0} Primary · {inspectedUser.metrics_summary?.branched_resumes || 0} Branched
                        </span>
                      </div>

                      {(!inspectedUser.resumes || inspectedUser.resumes.length === 0) ? (
                        <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                          No resumes created by this user yet.
                        </div>
                      ) : (
                        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-950/80 text-zinc-400 text-[10px] font-mono uppercase tracking-wider border-b border-zinc-800">
                              <tr>
                                <th className="py-2.5 px-3">Resume Name</th>
                                <th className="py-2.5 px-3">Workspace Status</th>
                                <th className="py-2.5 px-3">Target Role &amp; Company</th>
                                <th className="py-2.5 px-3">ATS Score</th>
                                <th className="py-2.5 px-3">Last Updated</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 text-[11px]">
                              {inspectedUser.resumes.map((r) => (
                                <tr key={r.id} className="hover:bg-zinc-800/30">
                                  <td className="py-2.5 px-3 font-semibold text-white">
                                    <div className="flex items-center gap-1.5">
                                      <span>{r.name}</span>
                                      {r.is_primary && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                                          ★ Master
                                        </span>
                                      )}
                                      {r.is_branched && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                                          Branch (parent #{r.parent_resume_id})
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {r.is_locked ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                                        🔒 Read-Only
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                        Active Workspace
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-300">
                                    {r.target_job_title ? (
                                      <span>🎯 {r.target_company ? `${r.target_company} · ` : ''}{r.target_job_title}</span>
                                    ) : (
                                      <span className="text-zinc-500 font-mono">General</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                                    {r.target_ats_score !== null && r.target_ats_score !== undefined ? `${Math.round(r.target_ats_score)}%` : '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-400 font-mono text-[10px]">
                                    {new Date(r.updated_at).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: EXPORTS ARCHIVE */}
                  {inspectTab === 'exports' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        User Exported Documents ({inspectedUser.exports?.length || 0})
                      </h4>

                      {(!inspectedUser.exports || inspectedUser.exports.length === 0) ? (
                        <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                          No exported resumes recorded for this user yet.
                        </div>
                      ) : (
                        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-950/80 text-zinc-400 text-[10px] font-mono uppercase tracking-wider border-b border-zinc-800">
                              <tr>
                                <th className="py-2.5 px-3">File Name</th>
                                <th className="py-2.5 px-3">Format</th>
                                <th className="py-2.5 px-3">Size</th>
                                <th className="py-2.5 px-3">Targeted Position</th>
                                <th className="py-2.5 px-3">Export Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                              {inspectedUser.exports.map((e) => (
                                <tr key={e.id} className="hover:bg-zinc-800/30">
                                  <td className="py-2.5 px-3 text-white font-sans font-medium">{e.file_name}</td>
                                  <td className="py-2.5 px-3 uppercase text-amber-400 font-bold">{e.file_type}</td>
                                  <td className="py-2.5 px-3 text-zinc-400">
                                    {e.file_size ? `${(e.file_size / 1024).toFixed(1)} KB` : '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-300 font-sans">
                                    {e.target_job_title ? `${e.target_company || ''} ${e.target_job_title}` : 'General'}
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-500 text-[10px]">
                                    {new Date(e.created_at).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: CUSTOM TEMPLATES */}
                  {inspectTab === 'templates' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Custom Style Presets ({inspectedUser.templates?.length || 0})
                      </h4>

                      {(!inspectedUser.templates || inspectedUser.templates.length === 0) ? (
                        <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                          No custom style presets created by this user yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {inspectedUser.templates.map((t) => (
                            <div key={t.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                              <span className="text-sm font-bold text-white block">{t.name}</span>
                              <p className="text-xs text-zinc-400">{t.description || 'No description provided'}</p>
                              <span className="text-[10px] text-zinc-500 font-mono block pt-2">
                                Created {new Date(t.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: AI LOGS */}
                  {inspectTab === 'ai_logs' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Wiser AI Audit &amp; Analysis Logs ({inspectedUser.ai_logs?.length || 0})
                      </h4>

                      {(!inspectedUser.ai_logs || inspectedUser.ai_logs.length === 0) ? (
                        <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                          No AI activity recorded for this user yet.
                        </div>
                      ) : (
                        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-950/80 text-zinc-400 text-[10px] font-mono uppercase tracking-wider border-b border-zinc-800">
                              <tr>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Action</th>
                                <th className="py-2.5 px-3">AI Engine</th>
                                <th className="py-2.5 px-3">Metadata</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                              {inspectedUser.ai_logs.map((a) => (
                                <tr key={a.id} className="hover:bg-zinc-800/30">
                                  <td className="py-2.5 px-3 text-zinc-400">{new Date(a.created_at).toLocaleString()}</td>
                                  <td className="py-2.5 px-3 text-amber-400 font-bold">{a.action_type}</td>
                                  <td className="py-2.5 px-3 text-zinc-300 font-sans">{a.ai_model || 'Wiser AI Engine'}</td>
                                  <td className="py-2.5 px-3 text-zinc-500 truncate max-w-[200px]">{a.meta_json || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
