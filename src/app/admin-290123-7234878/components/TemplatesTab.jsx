'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import TemplateDetailModal from './TemplateDetailModal';
import {
  Layers,
  Palette,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Type,
  AlignLeft,
  AlignCenter,
  Maximize2,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Selected Template Modal
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Quick Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTpl, setNewTpl] = useState({
    name: '',
    template_key: '',
    category: 'Standard',
    min_plan_tier: 'free',
    description: '',
  });
  const [creating, setCreating] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listTemplates();
      setTemplates(data || []);
    } catch (err) {
      toast.error('Failed to load templates: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleToggleActive = async (tpl, e) => {
    if (e) e.stopPropagation();
    try {
      await adminApi.updateTemplate(tpl.id, { is_active: !tpl.is_active });
      toast.success(`Template '${tpl.name}' is now ${!tpl.is_active ? 'Active' : 'Hidden'}`);
      loadTemplates();
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (tplId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this template architecture?')) return;
    try {
      await adminApi.deleteTemplate(tplId);
      toast.success('Template deleted');
      loadTemplates();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTpl.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    setCreating(true);
    try {
      await adminApi.createTemplate({
        name: newTpl.name.trim(),
        template_key: newTpl.template_key.trim() || undefined,
        category: newTpl.category,
        min_plan_tier: newTpl.min_plan_tier,
        description: newTpl.description,
        settings_json: {
          bodyFont: 'Georgia, serif',
          bodyFontSize: 11,
          lineHeight: 1.45,
          marginTop: 14,
          marginBottom: 14,
          marginLeft: 16,
          marginRight: 16,
          headingColor: '#111827',
          accentColor: '#374151',
        },
        header_style_json: {
          alignment: 'center',
          showDivider: true,
          nameFontSize: 24,
        },
        section_defaults_json: {
          headingAlign: 'left',
          headingBold: true,
          headingUppercase: true,
          showDividerAfterHeading: true,
        },
        section_schema_json: {
          schema_version: 1,
          sections: [
            { id: 'sec_sum', type: 'summary', label: 'Professional Summary', required: false, enabled: true },
            { id: 'sec_exp', type: 'experience', label: 'Work Experience', required: true, enabled: true },
            { id: 'sec_edu', type: 'education', label: 'Education', required: true, enabled: true },
            { id: 'sec_skl', type: 'skills', label: 'Skills & Technologies', required: true, enabled: true },
            { id: 'sec_prj', type: 'projects', label: 'Projects', required: false, enabled: true },
          ],
        },
        schema_version: 1,
      });
      toast.success('New template created!');
      setCreateModalOpen(false);
      setNewTpl({ name: '', template_key: '', category: 'Standard', min_plan_tier: 'free', description: '' });
      loadTemplates();
    } catch (err) {
      toast.error('Failed to create template: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (tierFilter !== 'all' && t.min_plan_tier !== tierFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        t.name?.toLowerCase().includes(s) ||
        t.template_key?.toLowerCase().includes(s) ||
        t.category?.toLowerCase().includes(s) ||
        t.description?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>Layout Architectures &amp; Typography Styles</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage resume templates, typography rules, margins, header alignment, and subscription tier requirements.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadTemplates}
            disabled={loading}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Template</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by name, key, category..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500 uppercase">Access Tier:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Tiers ({templates.length})</option>
            <option value="free">Pagewise Free</option>
            <option value="day_pass">Day Pass Required</option>
            <option value="pro_monthly">Pro Exclusive</option>
          </select>
        </div>
      </div>

      {/* Templates Visual Grid (Cards with Style Previews) */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-xs font-mono uppercase tracking-wider">Loading template architectures...</span>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((tpl) => {
            const isFree = tpl.min_plan_tier === 'free';
            const isDayPass = tpl.min_plan_tier === 'day_pass';
            const isPro = tpl.min_plan_tier === 'pro_monthly';

            const settings = tpl.settings_json || {};
            const header = tpl.header_style_json || {};
            const sectionDefaults = tpl.section_defaults_json || {};

            const fontName = settings.bodyFont ? settings.bodyFont.split(',')[0].replace(/"/g, '') : 'Georgia';

            return (
              <div
                key={tpl.id}
                onClick={() => {
                  setSelectedTemplate(tpl);
                  setDetailModalOpen(true);
                }}
                className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group cursor-pointer relative shadow-sm hover:shadow-lg hover:shadow-amber-500/5"
              >
                <div>
                  {/* Top Bar: Category & Active status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-zinc-950 text-zinc-400 border border-zinc-800">
                      {tpl.category || 'General'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleToggleActive(tpl, e)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold cursor-pointer transition ${
                        tpl.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-zinc-700'
                      }`}
                      title="Click to toggle visibility"
                    >
                      {tpl.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </div>

                  {/* Title & Key */}
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {tpl.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-zinc-500">
                    <span>key: {tpl.template_key}</span>
                  </div>

                  {/* Description */}
                  {tpl.description && (
                    <p className="text-xs text-zinc-400 mt-2.5 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  )}

                  {/* ─── STYLES PREVIEW PILLS (Core User Request) ─── */}
                  <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      <span className="flex items-center gap-1 text-amber-400">
                        <Palette className="w-3 h-3" />
                        <span>Style Architecture</span>
                      </span>
                      <span className="text-zinc-500">Click to edit</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px] font-mono pt-1">
                      {/* Typography tag */}
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1">
                        <Type className="w-3 h-3 text-sky-400" />
                        <span>{fontName}</span>
                      </span>

                      {/* Font size tag */}
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {settings.bodyFontSize || 11}pt / {settings.lineHeight || 1.45}
                      </span>

                      {/* Margins tag */}
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {settings.marginTop || 14}mm margins
                      </span>

                      {/* Header alignment tag */}
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1">
                        {header.alignment === 'center' ? (
                          <AlignCenter className="w-3 h-3 text-purple-400" />
                        ) : (
                          <AlignLeft className="w-3 h-3 text-purple-400" />
                        )}
                        <span className="capitalize">{header.alignment || 'Center'} Header</span>
                      </span>

                      {/* Divider style tag */}
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {sectionDefaults.showDividerAfterHeading !== false ? 'Divider Rules' : 'No Dividers'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Access Tier & Action buttons */}
                <div className="pt-4 mt-5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                      isPro
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                        : isDayPass
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    }`}
                  >
                    {isPro ? 'Pro Exclusive' : isDayPass ? 'Day Pass Tier' : 'Free Standard'}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedTemplate(tpl);
                        setDetailModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3 text-amber-400" />
                      <span>Edit Details</span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(tpl.id, e)}
                      className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-zinc-500 rounded-2xl bg-zinc-900 border border-zinc-800">
          No templates match your search filter.
        </div>
      )}

      {/* Edit Template Details Modal */}
      <TemplateDetailModal
        template={selectedTemplate}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTemplate(null);
        }}
        onUpdated={loadTemplates}
      />

      {/* Create Template Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111420] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1018]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Create Global Resume Template</span>
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                  Template Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newTpl.name}
                  onChange={(e) => setNewTpl({ ...newTpl, name: e.target.value })}
                  placeholder="e.g. Modern Minimalist"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                  Template Key (Slug)
                </label>
                <input
                  type="text"
                  value={newTpl.template_key}
                  onChange={(e) => setNewTpl({ ...newTpl, template_key: e.target.value })}
                  placeholder="modern-minimalist"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                    Industry Category
                  </label>
                  <input
                    type="text"
                    value={newTpl.category}
                    onChange={(e) => setNewTpl({ ...newTpl, category: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                    Access Tier
                  </label>
                  <select
                    value={newTpl.min_plan_tier}
                    onChange={(e) => setNewTpl({ ...newTpl, min_plan_tier: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="free">Pagewise Free</option>
                    <option value="day_pass">Wiser Day Pass</option>
                    <option value="pro_monthly">Pagewise Pro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTpl.description}
                  onChange={(e) => setNewTpl({ ...newTpl, description: e.target.value })}
                  placeholder="Clean single-column layout for engineering and tech..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-1.5 text-zinc-400 hover:text-white rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
