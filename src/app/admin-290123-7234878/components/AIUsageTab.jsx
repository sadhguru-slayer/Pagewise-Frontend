'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import {
  Cpu,
  Sparkles,
  Bot,
  Zap,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Code,
  Users,
  BarChart3,
  FileText,
  Briefcase,
  CheckCircle,
  Copy,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_LABELS = {
  wiser_job_help: {
    label: 'Job Match & Tailoring',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Briefcase,
  },
  wiser_ats_check: {
    label: 'ATS Optimization',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: CheckCircle,
  },
  wiser_pdf_import: {
    label: 'Smart PDF Extraction',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: FileText,
  },
  general_ai: {
    label: 'General AI Assistant',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Sparkles,
  },
};

export default function AIUsageTab() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Inspector modal state
  const [inspectLog, setInspectLog] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await adminApi.getAIUsageStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load AI stats:', err);
      toast.error('Failed to load AI telemetry: ' + err.message);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const params = {
        page,
        limit: perPage,
        per_page: perPage,
      };
      if (search.trim()) params.search = search.trim();
      if (actionFilter) {
        params.action = actionFilter;
        params.action_type = actionFilter;
      }

      const data = await adminApi.getAIUsageLogs(params);
      setLogs(data.logs || data.items || []);
      setTotal(data.total || 0);
      setPages(data.total_pages || data.pages || 1);
    } catch (err) {
      console.error('Failed to load AI logs:', err);
      toast.error('Failed to load AI audit log: ' + err.message);
    } finally {
      setLoadingLogs(false);
    }
  }, [page, perPage, search, actionFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleFilterUser = (userEmail) => {
    setSearch(userEmail);
    setPage(1);
  };

  const handleCopyJson = () => {
    if (!inspectLog) return;
    navigator.clipboard.writeText(JSON.stringify(inspectLog, null, 2));
    setCopiedJson(true);
    toast.success('Log payload copied to clipboard');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const totalTokens = stats?.total_tokens || 0;
  const promptTokens = stats?.prompt_tokens || 0;
  const completionTokens = stats?.completion_tokens || 0;
  const totalCalls = stats?.total_calls || 0;
  const avgTokens = totalCalls > 0 ? Math.round(totalTokens / totalCalls) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            AI Telemetry & Token Audit
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time LLM token consumption, feature usage breakdown, and execution audit ledger
          </p>
        </div>
        <button
          onClick={() => {
            loadStats();
            loadLogs();
            toast.success('Telemetry refreshed');
          }}
          disabled={loadingStats || loadingLogs}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white rounded-lg border border-zinc-700/50 text-xs font-medium transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStats || loadingLogs ? 'animate-spin' : ''}`} />
          Refresh Audit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0C0E14] border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Total Invocations</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loadingStats ? '—' : totalCalls.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
            Across all studio features
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0E14] border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Total Tokens</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loadingStats ? '—' : totalTokens.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-2 font-mono">
            {promptTokens > 0 || completionTokens > 0 ? (
              <>
                <span>In: {promptTokens.toLocaleString()}</span>
                <span>•</span>
                <span>Out: {completionTokens.toLocaleString()}</span>
              </>
            ) : (
              <span>Processed tokens</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0E14] border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Avg Tokens / Call</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loadingStats ? '—' : avgTokens.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Average footprint per call
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0E14] border border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Top Consumers</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loadingStats ? '—' : (stats?.top_users?.length || 0)}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Active power users tracked
          </div>
        </div>
      </div>

      {/* Feature & Model Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations by Feature */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0C0E14] border border-zinc-800">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-zinc-400" />
            Operations by Studio Feature
          </h3>
          <div className="space-y-3">
            {stats?.by_action && Object.keys(stats.by_action).length > 0 ? (
              Object.entries(stats.by_action).map(([act, rawVal]) => {
                const callCount = typeof rawVal === 'object' && rawVal !== null ? (rawVal.calls ?? 0) : (rawVal ?? 0);
                const tokenCount = typeof rawVal === 'object' && rawVal !== null ? (rawVal.tokens ?? 0) : 0;
                const info = ACTION_LABELS[act] || {
                  label: act.replace(/_/g, ' '),
                  color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                  icon: Sparkles,
                };
                const IconComponent = info.icon;
                const pct = totalCalls > 0 ? Math.round((callCount / totalCalls) * 100) : 0;

                return (
                  <div key={act} className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-md border ${info.color}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-zinc-200">{info.label}</div>
                          <div className="text-[10px] font-mono text-zinc-500">{act}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white">{callCount.toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-500 ml-1.5">({pct}%)</span>
                        {tokenCount > 0 && (
                          <div className="text-[10px] font-mono text-zinc-400">{tokenCount.toLocaleString()} tokens</div>
                        )}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                No feature invocations recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Models & Top Users */}
        <div className="space-y-6">
          {/* Models */}
          <div className="p-5 rounded-xl bg-[#0C0E14] border border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-400" />
              Active Models
            </h3>
            <div className="space-y-2">
              {stats?.by_model && Object.keys(stats.by_model).length > 0 ? (
                Object.entries(stats.by_model).map(([model, count]) => (
                  <div
                    key={model}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-xs"
                  >
                    <span className="font-mono text-indigo-300 font-medium">{model || 'gemini-2.5-flash'}</span>
                    <span className="font-mono text-zinc-400">{count} calls</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-xs font-mono">No model data recorded</div>
              )}
            </div>
          </div>

          {/* Top Users */}
          <div className="p-5 rounded-xl bg-[#0C0E14] border border-zinc-800">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              Top Consuming Accounts
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {stats?.top_users && stats.top_users.length > 0 ? (
                stats.top_users.slice(0, 5).map((u, idx) => {
                  const userTok = u.tokens ?? u.total_tokens ?? 0;
                  const userCalls = u.calls ?? u.total_calls ?? 0;
                  return (
                    <div
                      key={u.user_id || idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/40 text-xs hover:border-zinc-700 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-zinc-200 font-medium truncate text-[11px]">
                          {u.name || 'User #' + u.user_id}
                        </div>
                        <div className="text-zinc-500 truncate text-[10px] font-mono">{u.email}</div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <div className="font-mono text-white text-[11px]">
                            {Number(userTok).toLocaleString()} tok
                          </div>
                          <div className="text-[10px] text-zinc-500">{userCalls} calls</div>
                        </div>
                        <button
                          onClick={() => handleFilterUser(u.email)}
                          title="Filter logs by this user"
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-zinc-500 text-xs font-mono">No consumer data available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0C0E14] border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit log by user email, name, or action..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/80 border border-zinc-700/60 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-medium border border-zinc-700/60 transition-colors cursor-pointer"
            >
              Filter
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="bg-zinc-900/80 border border-zinc-700/60 rounded-lg text-xs text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Features</option>
              <option value="wiser_job_help">Job Match & Tailoring</option>
              <option value="wiser_ats_check">ATS Optimization</option>
              <option value="wiser_pdf_import">Smart PDF Extraction</option>
              <option value="general_ai">General Assistant</option>
            </select>

            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-zinc-900/80 border border-zinc-700/60 rounded-lg text-xs text-zinc-300 px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={15}>15 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl bg-[#0C0E14] border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-400 font-mono">
            Showing <span className="text-white font-bold">{logs.length}</span> of{' '}
            <span className="text-white font-bold">{total}</span> total AI audit events
          </div>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="text-[11px] text-zinc-400 hover:text-amber-400 font-mono flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear filter: &ldquo;{search}&rdquo;
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Studio Feature</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4 text-right">Tokens Used</th>
                <th className="py-3 px-4 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {loadingLogs ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    Querying audit log...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                    No matching AI usage records found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const act = log.action_type || log.action || 'ai_invocation';
                  const modelName = log.ai_model || log.model || 'gemini-2.5-flash';
                  const tokensCount = log.tokens_used ?? log.total_tokens ?? 0;
                  const info = ACTION_LABELS[act] || {
                    label: act.replace(/_/g, ' '),
                    color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                    icon: Sparkles,
                  };
                  const IconComp = info.icon;

                  return (
                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        #{log.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {log.user_email ? (
                          <div className="max-w-[200px] truncate">
                            <div className="font-medium text-white truncate text-xs">
                              {log.user_name || 'User #' + log.user_id}
                            </div>
                            <div className="font-mono text-zinc-500 text-[10px] truncate">{log.user_email}</div>
                          </div>
                        ) : (
                          <span className="font-mono text-zinc-600 text-xs">User #{log.user_id || 'System'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${info.color}`}
                        >
                          <IconComp className="w-3 h-3" />
                          {info.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-300">
                        {modelName}
                      </td>
                      <td className="py-3 px-4 font-mono text-right whitespace-nowrap">
                        <div className="text-white font-bold">
                          {Number(tokensCount).toLocaleString()}
                        </div>
                        {log.prompt_tokens !== undefined && log.completion_tokens !== undefined && (
                          <div className="text-[10px] text-zinc-500">
                            {Number(log.prompt_tokens).toLocaleString()} / {Number(log.completion_tokens).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setInspectLog(log)}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-mono inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Code className="w-3 h-3" />
                          JSON
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Page <span className="text-white font-bold">{page}</span> of{' '}
              <span className="text-white font-bold">{pages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loadingLogs}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 hover:text-white border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                disabled={page >= pages || loadingLogs}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 hover:text-white border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Payload Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0C0E14] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  AI Invocation Payload #{inspectLog.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedJson ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => setInspectLog(null)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-xs font-mono">
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase">Action</div>
                  <div className="text-white font-medium truncate">{inspectLog.action_type || inspectLog.action}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase">Model</div>
                  <div className="text-indigo-300 font-medium truncate">{inspectLog.ai_model || inspectLog.model || 'gemini-2.5-flash'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase">Total Tokens</div>
                  <div className="text-amber-400 font-bold">{(inspectLog.tokens_used ?? inspectLog.total_tokens ?? 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase">User</div>
                  <div className="text-zinc-300 truncate">{inspectLog.user_email || '#' + inspectLog.user_id}</div>
                </div>
              </div>

              {/* Raw JSON viewer */}
              <div>
                <div className="text-xs font-mono text-zinc-400 mb-2 flex items-center justify-between">
                  <span>Audit Record Metadata & Details</span>
                </div>
                <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-96 leading-relaxed select-all">
                  {JSON.stringify(inspectLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
