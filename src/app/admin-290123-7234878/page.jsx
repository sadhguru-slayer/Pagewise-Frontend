'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, getAdminToken } from '@/lib/api';
import { BrandLogo } from '@/lib/brand';
import {
  Users,
  DollarSign,
  Receipt,
  Cpu,
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
  Layers,
  CreditCard,
  Check,
  Sliders,
  Sparkles,
  Zap,
  ExternalLink,
  ChevronRight,
  Home,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  MessageSquare,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

import FinancesTab from './components/FinancesTab';
import OrdersTab from './components/OrdersTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import TemplatesTab from './components/TemplatesTab';
import AIUsageTab from './components/AIUsageTab';

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Sign-in form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sidebar & CRM Navigation
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [runningBulkAction, setRunningBulkAction] = useState(false);

  // Admin panel state
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'users' | 'security'

  // User Feedbacks state
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [feedbackDetailOpen, setFeedbackDetailOpen] = useState(false);
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
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

  // Bulk Action handlers
  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleRunBulkAction = async () => {
    if (!bulkAction) {
      toast.error('Please select an action from the dropdown.');
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error('No users selected. Check one or more rows.');
      return;
    }

    if (bulkAction === 'delete_selected') {
      if (!window.confirm(`Permanently delete ${selectedUserIds.length} user account(s)? This cannot be undone.`)) {
        return;
      }
    }

    try {
      setRunningBulkAction(true);
      for (const id of selectedUserIds) {
        if (bulkAction === 'grant_pilot') {
          await adminApi.updateUser(id, { plan_type: 'pilot' });
        } else if (bulkAction === 'upgrade_pro') {
          await adminApi.updateUser(id, { plan_type: 'pro_monthly' });
        } else if (bulkAction === 'upgrade_day_pass') {
          await adminApi.updateUser(id, { plan_type: 'day_pass' });
        } else if (bulkAction === 'set_free') {
          await adminApi.updateUser(id, { plan_type: 'free' });
        } else if (bulkAction === 'make_admin') {
          await adminApi.updateUser(id, { is_admin: true });
        } else if (bulkAction === 'revoke_admin') {
          await adminApi.updateUser(id, { is_admin: false });
        } else if (bulkAction === 'delete_selected') {
          await adminApi.deleteUser(id);
        }
      }
      toast.success(`Action applied to ${selectedUserIds.length} user(s)!`);
      setSelectedUserIds([]);
      setBulkAction('');
      fetchUsers();
      fetchInsights();
    } catch (err) {
      toast.error('Bulk action failed: ' + err.message);
    } finally {
      setRunningBulkAction(false);
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

  // Global Templates Management state
  const [adminTemplates, setAdminTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [tplForm, setTplForm] = useState({
    name: '',
    template_key: '',
    description: '',
    category: '',
    badge: '',
    min_plan_tier: 'free',
    display_order: 0,
    is_active: true,
  });
  const [tplSubmitting, setTplSubmitting] = useState(false);

  // Pricing & Tiers Management state
  const [adminTiers, setAdminTiers] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [savingTierKey, setSavingTierKey] = useState(null);

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

  // 4. Fetch Global Templates
  const fetchAdminTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const data = await adminApi.listTemplates();
      setAdminTemplates(data || []);
    } catch (err) {
      toast.error('Failed to load templates: ' + err.message);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const handleQuickTierChange = async (templateId, newTier) => {
    try {
      await adminApi.updateTemplate(templateId, { min_plan_tier: newTier });
      setAdminTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, min_plan_tier: newTier } : t))
      );
      toast.success(`Template tier updated to "${newTier}"!`);
    } catch (err) {
      toast.error('Failed to update template tier: ' + err.message);
    }
  };

  const handleToggleTemplateActive = async (template) => {
    try {
      const nextState = !template.is_active;
      await adminApi.updateTemplate(template.id, { is_active: nextState });
      setAdminTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, is_active: nextState } : t))
      );
      toast.success(`Template ${nextState ? 'activated' : 'hidden'}.`);
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this global template?')) return;
    try {
      await adminApi.deleteTemplate(templateId);
      setAdminTemplates((prev) => prev.filter((t) => t.id !== templateId));
      toast.success('Template deleted.');
    } catch (err) {
      toast.error('Failed to delete template: ' + err.message);
    }
  };

  const handleSubmitTemplate = async (e) => {
    e.preventDefault();
    setTplSubmitting(true);
    try {
      if (editingTemplate) {
        await adminApi.updateTemplate(editingTemplate.id, tplForm);
        toast.success('Template updated successfully!');
      } else {
        await adminApi.createTemplate(tplForm);
        toast.success('Template created successfully!');
      }
      setTemplateModalOpen(false);
      fetchAdminTemplates();
    } catch (err) {
      toast.error('Failed to save template: ' + err.message);
    } finally {
      setTplSubmitting(false);
    }
  };

  // 5. Fetch Dynamic Tiers & Pricing
  const fetchAdminTiers = useCallback(async () => {
    try {
      setTiersLoading(true);
      const data = await adminApi.listTiers();
      setAdminTiers(data || []);
    } catch (err) {
      toast.error('Failed to load tiers: ' + err.message);
    } finally {
      setTiersLoading(false);
    }
  }, []);

  const handleUpdateTierField = (tierKey, field, val) => {
    setAdminTiers((prev) =>
      prev.map((t) => (t.tier_key === tierKey ? { ...t, [field]: val } : t))
    );
  };

  const [activatingPilot, setActivatingPilot] = useState(false);

  const handleApplyPilotMode = async (archiveOthers = true) => {
    const promptMsg = archiveOthers
      ? "Activate Pilot Mode? This will migrate all non-admin users to PageWise Pilot (20 workspaces, 100 exports, 50 AI) and archive paid tiers to prevent payment prompts."
      : "Restore All Tiers? This will unarchive all tiers so they are visible again.";
    if (!window.confirm(promptMsg)) {
      return;
    }
    try {
      setActivatingPilot(true);
      const res = await adminApi.applyPilotAll(archiveOthers);
      toast.success(res.message || "Pilot Mode updated successfully!");
      fetchAdminTiers();
      fetchUsers();
      fetchInsights();
    } catch (err) {
      toast.error("Failed to update Pilot Mode: " + err.message);
    } finally {
      setActivatingPilot(false);
    }
  };

  const handleSaveTier = async (tier) => {
    try {
      setSavingTierKey(tier.tier_key);
      await adminApi.updateTier(tier.tier_key, {
        name: tier.name,
        tagline: tier.tagline,
        badge: tier.badge,
        base_price_inr: Number(tier.base_price_inr),
        discount_price_inr: Number(tier.discount_price_inr),
        discount_percent: Number(tier.discount_percent || 0),
        billing_period_text: tier.billing_period_text,
        duration_days: tier.duration_days !== null && tier.duration_days !== '' ? Number(tier.duration_days) : null,
        resume_limit: Number(tier.resume_limit),
        export_limit: Number(tier.export_limit),
        wiser_ai_limit: Number(tier.wiser_ai_limit),
        wiser_job_help_limit: Number(tier.wiser_job_help_limit),
        wiser_ats_limit: Number(tier.wiser_ats_limit),
        custom_template_limit: Number(tier.custom_template_limit),
        premium_templates_allowed: Number(tier.premium_templates_allowed),
        features: tier.features || [],
        is_active: tier.is_active,
        is_archived: Boolean(tier.is_archived),
        display_order: Number(tier.display_order || 0),
      });
      toast.success(`Plan "${tier.name}" saved successfully!`);
    } catch (err) {
      toast.error(`Failed to save tier: ` + err.message);
    } finally {
      setSavingTierKey(null);
    }
  };

  const handleAddTierFeature = (tierKey) => {
    setAdminTiers((prev) =>
      prev.map((t) => {
        if (t.tier_key !== tierKey) return t;
        return { ...t, features: [...(t.features || []), 'New feature perk'] };
      })
    );
  };

  const handleRemoveTierFeature = (tierKey, index) => {
    setAdminTiers((prev) =>
      prev.map((t) => {
        if (t.tier_key !== tierKey) return t;
        const copy = [...(t.features || [])];
        copy.splice(index, 1);
        return { ...t, features: copy };
      })
    );
  };

  const handleEditTierFeature = (tierKey, index, val) => {
    setAdminTiers((prev) =>
      prev.map((t) => {
        if (t.tier_key !== tierKey) return t;
        const copy = [...(t.features || [])];
        copy[index] = val;
        return { ...t, features: copy };
      })
    );
  };

  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [creatingTier, setCreatingTier] = useState(false);
  const [syncingTiers, setSyncingTiers] = useState(false);
  const [deletingTierKey, setDeletingTierKey] = useState(null);

  const initialTierForm = {
    tier_key: '',
    name: '',
    tagline: '',
    badge: '',
    base_price_inr: 99,
    discount_price_inr: 99,
    discount_percent: 0,
    billing_period_text: 'INR 99 / month',
    duration_days: 30,
    resume_limit: 5,
    export_limit: 25,
    wiser_ai_limit: 30,
    wiser_job_help_limit: 20,
    wiser_ats_limit: 20,
    custom_template_limit: 5,
    premium_templates_allowed: 10,
    features: ['5 resume workspaces', '25 exports/month', '30 Wiser AI runs'],
    is_active: true,
    is_archived: false,
    display_order: 10,
  };
  const [tierForm, setTierForm] = useState(initialTierForm);

  const handleSyncDefaults = async () => {
    if (!window.confirm('Restore and synchronize canonical default plans (Free, Pilot 20 workspaces, Day Pass, Pro)? Any custom tiers you created will remain untouched.')) {
      return;
    }
    try {
      setSyncingTiers(true);
      const res = await adminApi.syncDefaultTiers();
      toast.success(res.message || 'Tiers synced successfully!');
      fetchAdminTiers();
    } catch (err) {
      toast.error('Failed to sync tiers: ' + err.message);
    } finally {
      setSyncingTiers(false);
    }
  };

  const handleDeleteTier = async (tierKey, tierName) => {
    if (!window.confirm(`Are you sure you want to delete tier "${tierName}" (${tierKey})? Default core tiers will be archived instead of permanently deleted.`)) {
      return;
    }
    try {
      setDeletingTierKey(tierKey);
      const res = await adminApi.deleteTier(tierKey);
      toast.success(res.message || 'Tier deleted/archived successfully!');
      fetchAdminTiers();
    } catch (err) {
      toast.error('Failed to delete tier: ' + err.message);
    } finally {
      setDeletingTierKey(null);
    }
  };

  const handleCreateTier = async (e) => {
    e.preventDefault();
    if (!tierForm.tier_key.trim() || !tierForm.name.trim()) {
      toast.error('Tier key and display name are required');
      return;
    }
    try {
      setCreatingTier(true);
      await adminApi.createTier({
        ...tierForm,
        tier_key: tierForm.tier_key.trim().toLowerCase().replace(/\s+/g, '_'),
        base_price_inr: Number(tierForm.base_price_inr),
        discount_price_inr: Number(tierForm.discount_price_inr),
        discount_percent: Number(tierForm.discount_percent || 0),
        duration_days: tierForm.duration_days !== null && tierForm.duration_days !== '' ? Number(tierForm.duration_days) : null,
        resume_limit: Number(tierForm.resume_limit),
        export_limit: Number(tierForm.export_limit),
        wiser_ai_limit: Number(tierForm.wiser_ai_limit),
        wiser_job_help_limit: Number(tierForm.wiser_job_help_limit),
        wiser_ats_limit: Number(tierForm.wiser_ats_limit),
        custom_template_limit: Number(tierForm.custom_template_limit),
        premium_templates_allowed: Number(tierForm.premium_templates_allowed),
        display_order: Number(tierForm.display_order || 0),
      });
      toast.success(`Plan "${tierForm.name}" created successfully!`);
      setTierModalOpen(false);
      setTierForm(initialTierForm);
      fetchAdminTiers();
    } catch (err) {
      toast.error('Failed to create tier: ' + err.message);
    } finally {
      setCreatingTier(false);
    }
  };

  const handleAddCreateFeature = () => {
    setTierForm((prev) => ({
      ...prev,
      features: [...prev.features, 'New feature perk'],
    }));
  };

  const handleRemoveCreateFeature = (index) => {
    setTierForm((prev) => {
      const copy = [...prev.features];
      copy.splice(index, 1);
      return { ...prev, features: copy };
    });
  };

  const handleEditCreateFeature = (index, val) => {
    setTierForm((prev) => {
      const copy = [...prev.features];
      copy[index] = val;
      return { ...prev, features: copy };
    });
  };

  // 6. Fetch Feedbacks & Moderation
  const fetchFeedbacks = useCallback(async () => {
    try {
      setFeedbacksLoading(true);
      const [listRes, statsRes] = await Promise.all([
        adminApi.getFeedbacks({
          category: feedbackCategoryFilter,
          status: feedbackStatusFilter,
          search: feedbackSearch,
          page: feedbackPage,
          page_size: 15,
        }),
        adminApi.getFeedbackStats().catch(() => null),
      ]);
      setFeedbacks(listRes?.items || []);
      setFeedbackTotalPages(listRes?.total_pages || 1);
      if (statsRes) setFeedbackStats(statsRes);
    } catch (err) {
      toast.error('Failed to load feedbacks: ' + err.message);
    } finally {
      setFeedbacksLoading(false);
    }
  }, [feedbackCategoryFilter, feedbackStatusFilter, feedbackSearch, feedbackPage]);

  const handleUpdateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      await adminApi.updateFeedback(feedbackId, { status: newStatus });
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus } : f))
      );
      if (selectedFeedback && selectedFeedback.id === feedbackId) {
        setSelectedFeedback((prev) => ({ ...prev, status: newStatus }));
      }
      toast.success(`Status updated to "${newStatus}"!`);
      const updatedStats = await adminApi.getFeedbackStats().catch(() => null);
      if (updatedStats) setFeedbackStats(updatedStats);
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedFeedback) return;
    try {
      setSavingNotes(true);
      const updated = await adminApi.updateFeedback(selectedFeedback.id, {
        admin_notes: adminNotesDraft,
      });
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === selectedFeedback.id ? { ...f, admin_notes: adminNotesDraft } : f))
      );
      setSelectedFeedback(updated);
      toast.success('Internal notes saved!');
    } catch (err) {
      toast.error('Failed to save notes: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Delete this feedback record permanently?')) return;
    try {
      await adminApi.deleteFeedback(feedbackId);
      setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
      if (selectedFeedback && selectedFeedback.id === feedbackId) {
        setFeedbackDetailOpen(false);
        setSelectedFeedback(null);
      }
      toast.success('Feedback deleted.');
      const updatedStats = await adminApi.getFeedbackStats().catch(() => null);
      if (updatedStats) setFeedbackStats(updatedStats);
    } catch (err) {
      toast.error('Failed to delete feedback: ' + err.message);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchInsights();
      fetchUsers();
      fetchAdminTemplates();
      fetchAdminTiers();
      fetchFeedbacks();
    }
  }, [adminUser, fetchInsights, fetchUsers, fetchAdminTemplates, fetchAdminTiers, fetchFeedbacks]);

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

  // ─── ADMIN CONTROL PANEL INTERFACE (PLATFORM CRM SUITE) ──────────────────────
  return (
    <div className="h-screen w-full bg-[#0A0C10] text-zinc-100 flex font-sans overflow-hidden">
      {/* ── Fixed Left Sidebar: Model Registry / Navigation ── */}
      <aside
        className={`bg-[#0C0E14] border-r border-zinc-800/80 flex flex-col h-full shrink-0 select-none transition-all duration-200 z-20 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* CRM / Platform Admin Brand Header */}
        <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#0E1018]">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold font-mono text-xs shadow-inner shrink-0">
                PW
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs tracking-wide text-zinc-100 block truncate">
                  PageWise CRM
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block truncate">
                  PageWise Administration
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold font-mono text-xs">
              PW
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`}
            />
          </button>
        </div>

        {/* Navigation App Tree */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-5 text-xs">
          {/* Section 1: OVERVIEW & TELEMETRY */}
          <div>
            {!sidebarCollapsed && (
              <span className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">
                Overview &amp; Telemetry
              </span>
            )}
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('insights')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'insights'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="Platform Insights & Telemetry"
              >
                <BarChart3 className="w-4 h-4 shrink-0 text-amber-400" />
                {!sidebarCollapsed && <span>Platform Insights</span>}
              </button>

              <button
                onClick={() => setActiveTab('finances')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'finances'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="Finances & Revenue Telemetry"
              >
                <DollarSign className="w-4 h-4 shrink-0 text-emerald-400" />
                {!sidebarCollapsed && <span>Finances &amp; Revenue</span>}
              </button>
            </div>
          </div>

          {/* Section 2: COMMERCE & BILLING */}
          <div>
            {!sidebarCollapsed && (
              <span className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">
                Commerce &amp; Billing
              </span>
            )}
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'orders'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="Orders & Payment Transactions"
              >
                <Receipt className="w-4 h-4 shrink-0 text-amber-400" />
                {!sidebarCollapsed && <span>Payments &amp; Orders</span>}
              </button>

              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'subscriptions'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="Subscriptions & Quotas"
              >
                <CreditCard className="w-4 h-4 shrink-0 text-sky-400" />
                {!sidebarCollapsed && <span>Subscriptions</span>}
              </button>

              <button
                onClick={() => setActiveTab('tiers')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'tiers'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="Pricing & Tiers Matrix"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sliders className="w-4 h-4 shrink-0 text-rose-400" />
                  {!sidebarCollapsed && <span>Pricing &amp; Tiers</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-medium">
                    {adminTiers.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section 3: CRM & USERS */}
          <div>
            {!sidebarCollapsed && (
              <span className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">
                Customer Accounts (CRM)
              </span>
            )}
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'users'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="User Accounts & Permissions"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="w-4 h-4 shrink-0 text-sky-400" />
                  {!sidebarCollapsed && <span>Customer Accounts</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-medium">
                    {totalUsers}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section 4: STUDIO & AI INTELLIGENCE */}
          <div>
            {!sidebarCollapsed && (
              <span className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">
                Studio &amp; AI Intelligence
              </span>
            )}
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('templates')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'templates'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="Layout Architectures & Typography Styles"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className="w-4 h-4 shrink-0 text-purple-400" />
                  {!sidebarCollapsed && <span>Templates &amp; Styles</span>}
                </div>
              </button>

              <button
                onClick={() => setActiveTab('ai_usage')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'ai_usage'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="AI Token Consumption & Feature Telemetry"
              >
                <Cpu className="w-4 h-4 shrink-0 text-indigo-400" />
                {!sidebarCollapsed && <span>AI Usage &amp; Tokens</span>}
              </button>

              <button
                onClick={() => setActiveTab('feedbacks')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'feedbacks'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="User Feedback & Pilot Reports"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="w-4 h-4 shrink-0 text-[#D49A6A]" />
                  {!sidebarCollapsed && <span>User Feedbacks</span>}
                </div>
                {!sidebarCollapsed && feedbackStats && feedbackStats.new_count > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    {feedbackStats.new_count} new
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section 5: ACCESS CONTROL & CREDENTIALS */}
          <div>
            {!sidebarCollapsed && (
              <span className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">
                Access Control
              </span>
            )}
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  activeTab === 'security'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
                title="Master Credentials & Superuser Security"
              >
                <KeyRound className="w-4 h-4 shrink-0 text-emerald-400" />
                {!sidebarCollapsed && <span>Master Credentials</span>}
              </button>
            </div>
          </div>
        </div>
        {/* Sidebar Footer: View Site & Superuser Info */}
        <div className="shrink-0 border-t border-zinc-800 p-2.5 bg-[#0E1018] space-y-2">
          {!sidebarCollapsed && (
            <Link
              href="/dashboard"
              target="_blank"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>View Live Site</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">↗</span>
            </Link>
          )}

          <div className="px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                {adminUser?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-200 block truncate">
                    {adminUser?.name || 'Administrator'}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono block truncate">
                    Superuser
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleAdminLogout}
              className="p-1 text-zinc-400 hover:text-rose-400 transition rounded cursor-pointer"
              title="Sign out of CRM"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Workspace Area ── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#0A0C10]">
        {/* Top Breadcrumb & Quick Action Bar */}
        <header className="h-14 shrink-0 border-b border-zinc-800 bg-[#0C0E14] px-6 flex items-center justify-between z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('insights')}
              className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
            >
              <Home className="w-3 h-3 text-amber-500" />
              <span>Home</span>
            </button>
            <span className="text-zinc-600">›</span>
            <span className="text-zinc-400 font-medium">
              {activeTab === 'insights' && 'Telemetry & Analytics'}
              {activeTab === 'finances' && 'Finance & Billing'}
              {activeTab === 'orders' && 'Commerce & Billing'}
              {activeTab === 'subscriptions' && 'Subscriptions & Quotas'}
              {activeTab === 'users' && 'Customer CRM & Access'}
              {activeTab === 'security' && 'Security & Access Control'}
              {activeTab === 'templates' && 'Resume Studio Content'}
              {activeTab === 'ai_usage' && 'AI Intelligence Engine'}
              {activeTab === 'tiers' && 'Billing & Subscriptions'}
              {activeTab === 'feedbacks' && 'User Telemetry & Feedback'}
            </span>
            <span className="text-zinc-600">›</span>
            <span className="text-amber-400 font-semibold font-sans">
              {activeTab === 'insights' && 'Platform Insights'}
              {activeTab === 'finances' && 'Gross Revenue & Unit Economics'}
              {activeTab === 'orders' && 'Payments & Orders Ledger'}
              {activeTab === 'subscriptions' && 'User Subscriptions'}
              {activeTab === 'users' && 'Customer Accounts'}
              {activeTab === 'security' && 'Master Credentials'}
              {activeTab === 'templates' && 'Layout Architectures & Visual Styles'}
              {activeTab === 'ai_usage' && 'AI Token Telemetry & Feature Quotas'}
              {activeTab === 'tiers' && 'Pricing Tiers Config'}
              {activeTab === 'feedbacks' && 'User Feedbacks & Pilot Reports'}
            </span>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                fetchInsights();
                fetchUsers();
                fetchAdminTemplates();
                fetchAdminTiers();
              }}
              className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 border border-zinc-800 transition flex items-center gap-1.5 font-medium cursor-pointer"
              title="Sync with live database"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>Sync DB</span>
            </button>

            {activeTab === 'users' && (
              <button
                onClick={handleOpenAddUser}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User +</span>
              </button>
            )}

            {activeTab === 'templates' && (
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setTplForm({
                    name: '',
                    template_key: '',
                    description: '',
                    category: 'Standard',
                    badge: '',
                    min_plan_tier: 'free',
                    display_order: adminTemplates.length + 1,
                    is_active: true,
                  });
                  setTemplateModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Template +</span>
              </button>
            )}

            <div className="h-4 w-px bg-zinc-800" />

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              LIVE PRODUCTION DB
            </span>
          </div>
        </header>

        {/* Content Body - Independent Vertical Scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 space-y-6">

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

        {/* ─── TAB 2: USER MANAGEMENT (CRM CHANGELIST) ────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search Toolbar */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[240px] relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user accounts by name or email address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="created_at">Order: Date Registered</option>
                  <option value="name">Order: Full Name</option>
                  <option value="email">Order: Email</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
                  title="Toggle sort order"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Admin Actions Bar */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono text-zinc-400">
                  <span className="font-bold text-zinc-300">Action:</span>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">--------- Choose action ---------</option>
                    <option value="grant_pilot">Grant PageWise Pilot Access (20 Resumes · 100 Exports · 50 AI)</option>
                    <option value="upgrade_pro">Upgrade selected to Pagewise Pro (₹199)</option>
                    <option value="upgrade_day_pass">Grant Wiser Day Pass (₹49 / 24h)</option>
                    <option value="set_free">Demote selected to Pagewise Free</option>
                    <option value="make_admin">Grant Staff / Superuser Privileges</option>
                    <option value="revoke_admin">Revoke Staff / Superuser Privileges</option>
                    <option value="delete_selected">Delete selected user accounts</option>
                  </select>
                  <button
                    onClick={handleRunBulkAction}
                    disabled={runningBulkAction || selectedUserIds.length === 0}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-semibold rounded-lg border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    {runningBulkAction && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Go</span>
                  </button>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  {selectedUserIds.length} of {users.length} selected
                </span>
              </div>

              {selectedUserIds.length > 0 && (
                <button
                  onClick={() => setSelectedUserIds([])}
                  className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Clear selection
                </button>
              )}
            </div>

            {/* Two-Column: Table + Right-hand Filters */}
            <div className="flex flex-col lg:flex-row gap-5 items-start">
              {/* Left: Main Data Table */}
              <div className="flex-1 min-w-0 w-full space-y-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800">
                        <tr>
                          <th className="w-9 py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.length === users.length && users.length > 0}
                              onChange={handleSelectAllUsers}
                              className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0 cursor-pointer"
                              title="Select all on this page"
                            />
                          </th>
                          <th className="py-3.5 px-4">User</th>
                          <th className="py-3.5 px-4">Role</th>
                          <th className="py-3.5 px-4">Plan</th>
                          <th className="py-3.5 px-4 text-center">Resumes (Branched)</th>
                          <th className="py-3.5 px-4 text-center">Exports</th>
                          <th className="py-3.5 px-4 text-center">Custom Tmpl</th>
                          <th className="py-3.5 px-4 text-center">Wiser AI</th>
                          <th className="py-3.5 px-4">Registered</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {usersLoading ? (
                          <tr>
                            <td colSpan="10" className="py-12 text-center text-zinc-500">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                              Loading accounts from database...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="py-12 text-center text-zinc-500">
                              No users found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => {
                            const isSelf = u.id === adminUser.id;
                            const isSelected = selectedUserIds.includes(u.id);
                            const planType = u.subscription?.plan_type || 'free';

                            return (
                              <tr
                                key={u.id}
                                className={`transition ${
                                  isSelected ? 'bg-amber-500/5' : 'hover:bg-zinc-800/40'
                                }`}
                              >
                                <td className="w-9 py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectUser(u.id)}
                                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0 cursor-pointer"
                                  />
                                </td>

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
                                    <div className="text-zinc-400 group-hover:text-zinc-300 text-[11px] font-mono transition-colors">
                                      {u.email}
                                    </div>
                                  </button>
                                </td>

                                <td className="py-3 px-4">
                                  {u.is_admin ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      <ShieldCheck className="w-3 h-3" />
                                      Superuser
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400">
                                      Member
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      planType === 'pilot'
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold'
                                        : planType === 'pro_monthly'
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
                                  <span className="font-semibold text-amber-400">
                                    {u.metrics?.wiser_total || 0}
                                  </span>
                                  <span className="text-zinc-500 text-[10px] ml-1">
                                    ({u.metrics?.wiser_job_helps || 0} / {u.metrics?.wiser_ats_checks || 0})
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-zinc-400 text-[11px] font-mono">
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

                {/* Changelist Footer Counter */}
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>
                    {users.length} user{users.length === 1 ? '' : 's'} (of {totalUsers} registered in database)
                  </span>
                  {selectedUserIds.length > 0 && (
                    <span className="text-amber-400 font-semibold">
                      {selectedUserIds.length} selected for action
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Signature Filter Box */}
              <div className="hidden lg:block w-60 shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-200 font-bold uppercase tracking-wider text-[11px] pb-2.5 border-b border-zinc-800">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span>Filter Options</span>
                </div>

                {/* Filter by Plan */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block mb-1.5">
                    By Subscription Plan
                  </span>
                  <div className="space-y-0.5">
                    {[
                      { id: '', label: 'All Plans' },
                      { id: 'free', label: 'Pagewise Free' },
                      { id: 'day_pass', label: 'Wiser Day Pass' },
                      { id: 'pro_monthly', label: 'Pagewise Pro' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPlanFilter(opt.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          planFilter === opt.id
                            ? 'bg-amber-500/15 text-amber-400 font-semibold'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter by Staff / Role */}
                <div className="pt-3 border-t border-zinc-800">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block mb-1.5">
                    By Staff Status
                  </span>
                  <div className="space-y-0.5">
                    {[
                      { id: '', label: 'All Staff & Users' },
                      { id: 'admin', label: 'Yes (Superusers only)' },
                      { id: 'user', label: 'No (Regular members)' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setRoleFilter(opt.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          roleFilter === opt.id
                            ? 'bg-amber-500/15 text-amber-400 font-semibold'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter by Sort */}
                <div className="pt-3 border-t border-zinc-800">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block mb-1.5">
                    Sort Column
                  </span>
                  <div className="space-y-0.5">
                    {[
                      { id: 'created_at', label: 'Registration Date' },
                      { id: 'name', label: 'Full Name' },
                      { id: 'email', label: 'Email Address' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSortBy(opt.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          sortBy === opt.id
                            ? 'bg-amber-500/15 text-amber-400 font-semibold'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
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

        {/* ─── TAB: FINANCES & REVENUE ─────────────────────────────────────── */}
        {activeTab === 'finances' && (
          <FinancesTab onNavigateToOrders={() => setActiveTab('orders')} />
        )}

        {/* ─── TAB: ORDERS & PAYMENTS ───────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <OrdersTab />
        )}

        {/* ─── TAB: SUBSCRIPTIONS & QUOTAS ──────────────────────────────────── */}
        {activeTab === 'subscriptions' && (
          <SubscriptionsTab />
        )}

        {/* ─── TAB: TEMPLATES & VISUAL STYLES ───────────────────────────────── */}
        {activeTab === 'templates' && (
          <TemplatesTab />
        )}

        {/* ─── TAB: AI USAGE & TELEMETRY ────────────────────────────────────── */}
        {activeTab === 'ai_usage' && (
          <AIUsageTab />
        )}

        {/* ─── TAB 5: PRICING & TIER CONFIGURATION ─────────────────────────────── */}
        {activeTab === 'tiers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-rose-400" />
                    <span>Dynamic Tiers &amp; Pricing Configuration</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Real-time management for pricing, discounts, limits, and public feature checklists. Edits take effect immediately in checkout, customer billing, and quota enforcement.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => setTierModalOpen(true)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-black" />
                    <span>+ Add New Tier</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncDefaults}
                    disabled={syncingTiers}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition flex items-center gap-1.5 text-xs font-medium cursor-pointer border border-zinc-700 disabled:opacity-50"
                    title="Synchronize and restore canonical default tiers (Pilot 20 workspaces, Free, Day Pass, Pro)"
                  >
                    {syncingTiers ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Sync Default Plans</span>
                  </button>

                  <button
                    type="button"
                    onClick={fetchAdminTiers}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer border border-zinc-800"
                    title="Reload Tiers"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload</span>
                  </button>
                </div>
              </div>

              {/* Pilot Program Automation Card */}
              <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Pilot Program Automation
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      VIP Early Testing Controls
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    One-Click Pilot Mode Activation
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    Instantly migrate all non-admin users to the <strong className="text-amber-400">PageWise Pilot</strong> tier (20 workspaces, 100 exports/mo, 50 Wiser Job Help, 50 ATS evaluations, 30 custom templates, all layouts unlocked). Automatically archives paid tiers so users aren’t prompted for payment.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApplyPilotMode(true)}
                    disabled={activatingPilot}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black shadow-lg shadow-amber-500/10 transition cursor-pointer flex items-center gap-2"
                  >
                    {activatingPilot ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Zap className="w-4 h-4 text-black" />
                    )}
                    <span>Activate Pilot Mode (Archive Paid Tiers)</span>
                  </button>

                  <button
                    onClick={() => handleApplyPilotMode(false)}
                    disabled={activatingPilot}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                    title="Unarchive all paid plans"
                  >
                    <span>Restore All Tiers</span>
                  </button>
                </div>
              </div>

              {tiersLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-xs font-mono">Loading subscription tiers...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
                  {adminTiers.map((tier) => {
                    const isSaving = savingTierKey === tier.tier_key;
                    const isPilot = tier.tier_key === 'pilot';
                    const isPro = tier.tier_key === 'pro_monthly';
                    const isDayPass = tier.tier_key === 'day_pass';
                    const isArchived = Boolean(tier.is_archived);

                    return (
                      <div
                        key={tier.tier_key}
                        className={`bg-zinc-950 border rounded-2xl p-6 flex flex-col justify-between transition shadow-md ${
                          isPilot
                            ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-zinc-950 shadow-amber-500/5'
                            : isPro
                            ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-950/20 to-zinc-950'
                            : isDayPass
                            ? 'border-amber-500/30 bg-gradient-to-b from-amber-950/10 to-zinc-950'
                            : 'border-zinc-800'
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Tier Header inputs */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                                  {tier.tier_key}
                                </span>
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                    isArchived
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                  }`}
                                >
                                  {isArchived ? 'Archived' : 'Published'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={tier.is_active}
                                    onChange={(e) => handleUpdateTierField(tier.tier_key, 'is_active', e.target.checked)}
                                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0"
                                  />
                                  <span>Active</span>
                                </label>

                                <label className="flex items-center gap-1 text-[11px] text-rose-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isArchived}
                                    onChange={(e) => handleUpdateTierField(tier.tier_key, 'is_archived', e.target.checked)}
                                    className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-0"
                                  />
                                  <span>Archive</span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteTier(tier.tier_key, tier.name)}
                                  disabled={deletingTierKey === tier.tier_key}
                                  className="p-1 text-zinc-500 hover:text-rose-400 rounded transition cursor-pointer hover:bg-rose-500/10"
                                  title={`Delete or archive tier ${tier.tier_key}`}
                                >
                                  {deletingTierKey === tier.tier_key ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <label className="block text-[11px] font-medium text-zinc-400 mb-1">Plan Display Name</label>
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) => handleUpdateTierField(tier.tier_key, 'name', e.target.value)}
                              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                            />

                            <label className="block text-[11px] font-medium text-zinc-400 mt-2 mb-1">Tagline</label>
                            <input
                              type="text"
                              value={tier.tagline || ''}
                              onChange={(e) => handleUpdateTierField(tier.tier_key, 'tagline', e.target.value)}
                              className="w-full px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                              placeholder="e.g. Essential resume building forever"
                            />

                            <label className="block text-[11px] font-medium text-zinc-400 mt-2 mb-1">Badge Text</label>
                            <input
                              type="text"
                              value={tier.badge || ''}
                              onChange={(e) => handleUpdateTierField(tier.tier_key, 'badge', e.target.value)}
                              className="w-full px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                              placeholder="e.g. Recommended"
                            />
                          </div>

                          {/* Pricing Fields */}
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                            <h4 className="text-xs font-semibold text-zinc-200">Pricing &amp; Discounts (INR)</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1">Base Price (₹)</label>
                                <input
                                  type="number"
                                  value={tier.base_price_inr}
                                  onChange={(e) => handleUpdateTierField(tier.tier_key, 'base_price_inr', Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1">Effective / Discounted (₹)</label>
                                <input
                                  type="number"
                                  value={tier.discount_price_inr}
                                  onChange={(e) => handleUpdateTierField(tier.tier_key, 'discount_price_inr', Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1">Billing Text</label>
                                <input
                                  type="text"
                                  value={tier.billing_period_text || ''}
                                  onChange={(e) => handleUpdateTierField(tier.tier_key, 'billing_period_text', e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                                  placeholder="/ month"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1">Duration Days</label>
                                <input
                                  type="number"
                                  value={tier.duration_days ?? ''}
                                  onChange={(e) => handleUpdateTierField(tier.tier_key, 'duration_days', e.target.value ? Number(e.target.value) : null)}
                                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                                  placeholder="Empty for recurring"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Quotas & Limits */}
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                            <h4 className="text-xs font-semibold text-zinc-200">Quotas &amp; Allowances</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-0.5">Resume Limit</label>
                                <input
                                  type="number"
                                  value={tier.resume_limit}
                                  onChange={(e) => handleUpdateTierField(tier.tier_key, 'resume_limit', Number(e.target.value))}
                                  className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs font-mono text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-0.5">Export Limit</label>
                                <input
                                  type="number"
                                  value={tier.export_limit}
                                  onChange={(e) => handleUpdateTierField(tier.tier_key, 'export_limit', Number(e.target.value))}
                                  className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs font-mono text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-0.5">Job Help Analyses</label>
                                <input
                                  type="number"
                                  value={tier.wiser_job_help_limit}
                                  onChange={(e) => handleUpdateTierField(tier.tier_key, 'wiser_job_help_limit', Number(e.target.value))}
                                  className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs font-mono text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-0.5">ATS Evaluations</label>
                                <input
                                  type="number"
                                  value={tier.wiser_ats_limit}
                                  onChange={(e) => handleUpdateTierField(tier.tier_key, 'wiser_ats_limit', Number(e.target.value))}
                                  className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs font-mono text-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Public Feature Bullets */}
                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-zinc-200">Public Benefit Checklist</h4>
                              <button
                                type="button"
                                onClick={() => handleAddTierFeature(tier.tier_key)}
                                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Bullet</span>
                              </button>
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {(tier.features || []).map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={feat}
                                    onChange={(e) => handleEditTierFeature(tier.tier_key, idx, e.target.value)}
                                    className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTierFeature(tier.tier_key, idx)}
                                    className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-5 border-t border-zinc-800">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveTier(tier)}
                            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                          >
                            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Save {tier.name} Settings</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: USER FEEDBACKS & PILOT REPORTS ──────────────────────────── */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-6">
            {/* Telemetry Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Total Feedbacks</span>
                <p className="text-3xl font-extrabold text-white mt-2 leading-none">
                  {feedbackStats?.total ?? 0}
                </p>
                <p className="text-[11px] text-zinc-400 mt-2">All submitted reviews &amp; reports</p>
              </div>

              <div className="bg-zinc-950 border border-amber-500/25 rounded-2xl p-5 bg-gradient-to-b from-amber-950/10 to-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400">New / Unreviewed</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <p className="text-3xl font-extrabold text-amber-300 mt-2 leading-none">
                  {feedbackStats?.new_count ?? 0}
                </p>
                <p className="text-[11px] text-zinc-400 mt-2">Needs triage or review</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Average Rating</span>
                <p className="text-3xl font-extrabold text-white mt-2 leading-none flex items-center gap-2">
                  <span>{feedbackStats?.avg_rating ? `${feedbackStats.avg_rating}` : '—'}</span>
                  {feedbackStats?.avg_rating && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
                </p>
                <p className="text-[11px] text-zinc-400 mt-2">Across rated submissions (1-5★)</p>
              </div>

              <div className="bg-zinc-950 border border-emerald-500/20 rounded-2xl p-5">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Resolved</span>
                <p className="text-3xl font-extrabold text-white mt-2 leading-none">
                  {feedbackStats?.resolved_count ?? 0}
                </p>
                <p className="text-[11px] text-zinc-400 mt-2">Bugs &amp; requests addressed</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={feedbackSearch}
                    onChange={(e) => {
                      setFeedbackSearch(e.target.value);
                      setFeedbackPage(1);
                    }}
                    placeholder="Search by keyword, subject, user or email..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={feedbackCategoryFilter}
                  onChange={(e) => {
                    setFeedbackCategoryFilter(e.target.value);
                    setFeedbackPage(1);
                  }}
                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="pilot_feedback">Pilot Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="wiser_ai">Wiser AI</option>
                  <option value="general">General</option>
                </select>

                <select
                  value={feedbackStatusFilter}
                  onChange={(e) => {
                    setFeedbackStatusFilter(e.target.value);
                    setFeedbackPage(1);
                  }}
                  className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>

                <button
                  onClick={fetchFeedbacks}
                  className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Refresh list"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Feedbacks List */}
            {feedbacksLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40 text-amber-400" />
                <p className="text-sm font-semibold text-zinc-300">No feedbacks match your filter criteria.</p>
                <p className="text-xs text-zinc-500 mt-1">Submitted in-app user feedbacks will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((fb) => {
                  const ratingVal = fb.rating;
                  const isNew = fb.status === 'new';

                  return (
                    <div
                      key={fb.id}
                      className={`bg-zinc-950 border rounded-2xl p-5 transition-all space-y-3 ${
                        isNew
                          ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/10 via-zinc-950 to-zinc-950'
                          : 'border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Top Row: Category, Rating, Status, Date */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              background: 'rgba(200, 138, 88, 0.15)',
                              color: '#D49A6A',
                              border: '1px solid rgba(200, 138, 88, 0.3)',
                            }}
                          >
                            {fb.category.replace('_', ' ')}
                          </span>

                          {ratingVal && (
                            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{ratingVal}★</span>
                            </div>
                          )}

                          <select
                            value={fb.status}
                            onChange={(e) => handleUpdateFeedbackStatus(fb.id, e.target.value)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer border focus:outline-none ${
                              fb.status === 'new'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : fb.status === 'reviewed'
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : fb.status === 'in_progress'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : fb.status === 'resolved'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            <option value="new">● New</option>
                            <option value="reviewed">● Reviewed</option>
                            <option value="in_progress">● In Progress</option>
                            <option value="resolved">● Resolved</option>
                            <option value="archived">● Archived</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                          <span>{new Date(fb.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Content Row */}
                      <div>
                        {fb.title && (
                          <h4 className="text-sm font-bold text-white mb-1">
                            {fb.title}
                          </h4>
                        )}
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {fb.message}
                        </p>
                      </div>

                      {/* Submitter & Metadata Row */}
                      <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-3 flex-wrap text-xs">
                        <div className="flex items-center gap-3 text-zinc-400 flex-wrap">
                          <span className="font-semibold text-zinc-200">
                            {fb.user_name || fb.email || 'Anonymous / Guest'}
                          </span>
                          {fb.user_email && fb.user_name && (
                            <span className="text-zinc-500 font-mono text-[11px]">({fb.user_email})</span>
                          )}
                          {fb.ip_address && (
                            <span className="text-zinc-600 font-mono text-[10px]">IP: {fb.ip_address}</span>
                          )}
                          {fb.metadata_json?.path && (
                            <span className="text-zinc-500 font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800">
                              Route: {fb.metadata_json.path}
                            </span>
                          )}
                          {fb.admin_notes && (
                            <span className="text-sky-400 text-[11px] italic line-clamp-1 max-w-xs">
                              Note: {fb.admin_notes}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedFeedback(fb);
                              setAdminNotesDraft(fb.admin_notes || '');
                              setFeedbackDetailOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 transition cursor-pointer"
                          >
                            Inspect Details
                          </button>

                          <button
                            onClick={() => handleDeleteFeedback(fb.id)}
                            className="p-1 text-zinc-600 hover:text-rose-400 transition cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {feedbackTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 text-xs text-zinc-400">
                    <button
                      disabled={feedbackPage <= 1}
                      onClick={() => setFeedbackPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white disabled:opacity-40 transition cursor-pointer"
                    >
                      ← Previous
                    </button>
                    <span className="font-mono">
                      Page {feedbackPage} of {feedbackTotalPages}
                    </span>
                    <button
                      disabled={feedbackPage >= feedbackTotalPages}
                      onClick={() => setFeedbackPage((p) => Math.min(feedbackTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white disabled:opacity-40 transition cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      </div>

            {/* ─── FEEDBACK DETAIL & ADMIN NOTES MODAL ────────────────────────── */}
      {feedbackDetailOpen && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Feedback Inspection #{selectedFeedback.id}
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {selectedFeedback.title || 'User Submission'}
                </h3>
              </div>
              <button
                onClick={() => setFeedbackDetailOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta Tags */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/25">
                {selectedFeedback.category.replace('_', ' ')}
              </span>
              {selectedFeedback.rating && (
                <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {selectedFeedback.rating} ★ Rating
                </span>
              )}
              <span className="text-zinc-400 text-[11px] font-mono">
                {new Date(selectedFeedback.created_at).toLocaleString()}
              </span>
            </div>

            {/* Submitter Info */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">User / Submitter:</span>
                <span className="text-white font-semibold">
                  {selectedFeedback.user_name || selectedFeedback.email || 'Anonymous / Guest'}
                </span>
              </div>
              {selectedFeedback.user_email && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Registered Email:</span>
                  <span className="font-mono text-zinc-300">{selectedFeedback.user_email}</span>
                </div>
              )}
              {selectedFeedback.ip_address && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Client IP:</span>
                  <span className="font-mono text-zinc-500">{selectedFeedback.ip_address}</span>
                </div>
              )}
            </div>

            {/* Message Body */}
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Feedback Message
              </label>
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {selectedFeedback.message}
              </div>
            </div>

            {/* Client Telemetry Metadata */}
            {selectedFeedback.metadata_json && Object.keys(selectedFeedback.metadata_json).length > 0 && (
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Client Environment Metadata
                </label>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400 max-h-24 overflow-y-auto">
                  {JSON.stringify(selectedFeedback.metadata_json, null, 2)}
                </div>
              </div>
            )}

            {/* Admin Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Admin Internal Notes
                </label>
                <button
                  type="button"
                  disabled={savingNotes}
                  onClick={handleSaveAdminNotes}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
              <textarea
                value={adminNotesDraft}
                onChange={(e) => setAdminNotesDraft(e.target.value)}
                placeholder="Internal notes for other admins (e.g., ticket ID, fix status, follow-up notes)..."
                rows={3}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setFeedbackDetailOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <option value="pilot">PageWise Pilot (Generous Quotas: 20 Resumes, 100 Exports, 50 AI)</option>
                    <option value="pro_monthly">Pagewise Pro (₹199)</option>
                    <option value="day_pass">Wiser Day Pass (₹49)</option>
                    <option value="free">Pagewise Free</option>
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

      {/* ─── ADD / EDIT GLOBAL TEMPLATE MODAL ──────────────────────────────── */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">
                {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create New Global Resume Architecture'}
              </h3>
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTemplate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Architecture Name</label>
                <input
                  type="text"
                  required
                  value={tplForm.name}
                  onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Modern Product Specialist"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Template Key (Unique Identifier)</label>
                <input
                  type="text"
                  value={tplForm.template_key}
                  onChange={(e) => setTplForm({ ...tplForm, template_key: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="e.g. modern-product-specialist (auto-generated if empty)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Category / Industry</label>
                  <input
                    type="text"
                    value={tplForm.category}
                    onChange={(e) => setTplForm({ ...tplForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Tech, SaaS & Product"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={tplForm.badge}
                    onChange={(e) => setTplForm({ ...tplForm, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Recommended"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Minimum Plan Tier Access</label>
                <select
                  value={tplForm.min_plan_tier}
                  onChange={(e) => setTplForm({ ...tplForm, min_plan_tier: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="free">Pagewise Free (Available to all users)</option>
                  <option value="day_pass">Wiser Day Pass &amp; Pro</option>
                  <option value="pro_monthly">Pagewise Pro Only (Exclusive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={tplForm.description}
                  onChange={(e) => setTplForm({ ...tplForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Details about layout, typography, ATS compatibility..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tplForm.is_active}
                    onChange={(e) => setTplForm({ ...tplForm, is_active: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0"
                  />
                  <span>Active &amp; Visible in User Library</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tplSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 transition cursor-pointer"
                >
                  {tplSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTemplate ? 'Save Template Changes' : 'Create Architecture'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD NEW SUBSCRIPTION TIER MODAL ─── */}
      {tierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Create New Plan / Subscription Tier
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Define custom pricing, quotas, and feature list. Immediately accessible via API and checkout.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTierModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTier} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Tier Key / Identifier <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tierForm.tier_key}
                    onChange={(e) => setTierForm({ ...tierForm, tier_key: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. starter_monthly or student_pass"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Unique slug used in database.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Display Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tierForm.name}
                    onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Starter Pack, Student Pass"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={tierForm.tagline}
                    onChange={(e) => setTierForm({ ...tierForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Essential resume builder for new grads"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Badge Text (Optional)</label>
                  <input
                    type="text"
                    value={tierForm.badge}
                    onChange={(e) => setTierForm({ ...tierForm, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Popular, Best Value, 40% OFF"
                  />
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-200">Pricing & Billing (INR)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Base Price (INR)</label>
                    <input
                      type="number"
                      min="0"
                      value={tierForm.base_price_inr}
                      onChange={(e) => {
                        const base = Number(e.target.value);
                        const disc = Number(tierForm.discount_price_inr);
                        const pct = base > 0 ? Math.max(0, Math.round(((base - disc) / base) * 100)) : 0;
                        setTierForm({ ...tierForm, base_price_inr: base, discount_percent: pct });
                      }}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Discount Price (INR)</label>
                    <input
                      type="number"
                      min="0"
                      value={tierForm.discount_price_inr}
                      onChange={(e) => {
                        const disc = Number(e.target.value);
                        const base = Number(tierForm.base_price_inr);
                        const pct = base > 0 ? Math.max(0, Math.round(((base - disc) / base) * 100)) : 0;
                        setTierForm({ ...tierForm, discount_price_inr: disc, discount_percent: pct });
                      }}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Billing Period Text</label>
                    <input
                      type="text"
                      value={tierForm.billing_period_text}
                      onChange={(e) => setTierForm({ ...tierForm, billing_period_text: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g. INR 99 / month or One-time"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Duration Days (Empty for recurring)</label>
                    <input
                      type="number"
                      min="0"
                      value={tierForm.duration_days ?? ''}
                      onChange={(e) => setTierForm({ ...tierForm, duration_days: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g. 30 (or leave empty)"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={tierForm.display_order}
                      onChange={(e) => setTierForm({ ...tierForm, display_order: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Quotas & Allowances */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-200">Quotas & Feature Limits</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Workspaces Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={tierForm.resume_limit}
                      onChange={(e) => setTierForm({ ...tierForm, resume_limit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Export Limit</label>
                    <input
                      type="number"
                      min="0"
                      value={tierForm.export_limit}
                      onChange={(e) => setTierForm({ ...tierForm, export_limit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Job Help Analyses</label>
                    <input
                      type="number"
                      min="0"
                      value={tierForm.wiser_job_help_limit}
                      onChange={(e) => setTierForm({ ...tierForm, wiser_job_help_limit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">ATS Evaluations</label>
                    <input
                      type="number"
                      min="0"
                      value={tierForm.wiser_ats_limit}
                      onChange={(e) => setTierForm({ ...tierForm, wiser_ats_limit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Public Features Checklist */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-200">Public Benefit Checklist</h4>
                  <button
                    type="button"
                    onClick={handleAddCreateFeature}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Bullet</span>
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(tierForm.features || []).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => handleEditCreateFeature(idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                        placeholder="e.g. 5 Resume Workspaces"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCreateFeature(idx)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tierForm.is_active}
                    onChange={(e) => setTierForm({ ...tierForm, is_active: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0"
                  />
                  <span>Active Plan</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-rose-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tierForm.is_archived}
                    onChange={(e) => setTierForm({ ...tierForm, is_archived: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-950 text-rose-500 focus:ring-0"
                  />
                  <span>Archive Immediately (Hide from users)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setTierModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTier}
                  className="px-5 py-2.5 rounded-xl text-xs bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-2 transition cursor-pointer font-bold disabled:opacity-50 shadow-md"
                >
                  {creatingTier && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
                  <span>Create Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
