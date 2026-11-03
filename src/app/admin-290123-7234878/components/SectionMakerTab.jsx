'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { CANONICAL_SECTION_SCHEMAS, FIELD_TYPES } from '@/lib/resume/sectionSchemas';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Eye,
  RefreshCw,
  Loader2,
  Sliders,
  Sparkles,
  X,
  Code2,
  Copy,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  BookOpen,
  HeartHandshake,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Curated Preset Schemas for Quick Creation ───────────────────────────────
const PRESET_SCHEMAS = {
  publications: {
    section_key: 'publications',
    label: 'Publications & Research Papers',
    description: 'Peer-reviewed papers, conference proceedings, preprints, and journal articles.',
    is_repeatable: true,
    fields: [
      { key: 'title', label: 'Paper / Article Title', type: 'text', required: true, placeholder: 'e.g. Attention Is All You Need', gridSpan: 12 },
      { key: 'publisher', label: 'Journal / Conference / Venue', type: 'text', required: false, placeholder: 'e.g. NeurIPS, IEEE, ArXiv', gridSpan: 6 },
      { key: 'date', label: 'Publication Date', type: 'text', required: false, placeholder: 'e.g. Jun 2023', gridSpan: 6 },
      { key: 'url', label: 'Paper or DOI URL', type: 'url', required: false, placeholder: 'https://arxiv.org/abs/...', gridSpan: 12 },
      { key: 'points', label: 'Key Findings & Abstract', type: 'bullet_list', required: false, placeholder: 'Describe breakthrough, methodology, or citations...', gridSpan: 12 },
    ],
  },
  awards: {
    section_key: 'awards',
    label: 'Honors & Awards',
    description: 'Academic honors, hackathon championships, company awards, and fellowships.',
    is_repeatable: true,
    fields: [
      { key: 'title', label: 'Award / Honor Name', type: 'text', required: true, placeholder: 'e.g. 1st Place Global AI Hackathon', gridSpan: 12 },
      { key: 'issuer', label: 'Granting Organization / Issuer', type: 'text', required: false, placeholder: 'e.g. Google Cloud, ACM, University', gridSpan: 6 },
      { key: 'date', label: 'Date Received', type: 'text', required: false, placeholder: 'e.g. Nov 2023', gridSpan: 6 },
      { key: 'summary', label: 'Brief Details', type: 'textarea', required: false, placeholder: 'Ranked top 1% out of 5,000 competitors...', gridSpan: 12 },
    ],
  },
  volunteer: {
    section_key: 'volunteer',
    label: 'Volunteer & Leadership',
    description: 'Community service, open-source maintainership, and club leadership.',
    is_repeatable: true,
    fields: [
      { key: 'role', label: 'Role / Title', type: 'text', required: true, placeholder: 'e.g. Chapter Lead & Mentor', gridSpan: 6 },
      { key: 'organization', label: 'Organization / Cause', type: 'text', required: true, placeholder: 'e.g. Girls Who Code, Code.org', gridSpan: 6 },
      { key: 'location', label: 'Location', type: 'text', required: false, placeholder: 'e.g. New York, NY / Remote', gridSpan: 4 },
      { key: 'start_date', label: 'Start Date', type: 'text', required: false, placeholder: 'e.g. Jan 2022', gridSpan: 4 },
      { key: 'end_date', label: 'End Date', type: 'text', required: false, placeholder: 'e.g. Present', gridSpan: 4 },
      { key: 'points', label: 'Contributions & Initiatives', type: 'bullet_list', required: false, placeholder: 'Mentored 50+ students in Python fundamentals...', gridSpan: 12 },
    ],
  },
  patents: {
    section_key: 'patents',
    label: 'Patents & Inventions',
    description: 'Granted patents, patent applications, and intellectual property disclosures.',
    is_repeatable: true,
    fields: [
      { key: 'patent_title', label: 'Patent Title', type: 'text', required: true, placeholder: 'e.g. Autonomous Routing for Distributed Edge Nodes', gridSpan: 12 },
      { key: 'patent_office', label: 'Patent Office / Jurisdiction', type: 'text', required: false, placeholder: 'e.g. USPTO, EPO, WIPO', gridSpan: 6 },
      { key: 'patent_number', label: 'Patent / Application Number', type: 'text', required: false, placeholder: 'e.g. US 11,234,567 B2', gridSpan: 6 },
      { key: 'date', label: 'Issue / Filing Date', type: 'text', required: false, placeholder: 'e.g. Oct 2022', gridSpan: 6 },
      { key: 'url', label: 'Patent Link / Verification', type: 'url', required: false, placeholder: 'https://patents.google.com/patent/...', gridSpan: 6 },
      { key: 'summary', label: 'Patent Abstract & Commercial Use', type: 'textarea', required: false, placeholder: 'Technical innovation summary...', gridSpan: 12 },
    ],
  },
};

export default function SectionMakerTab() {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('custom'); // 'custom' | 'canonical'
  const [searchQuery, setSearchQuery] = useState('');

  // Editor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);

  // Form State
  const [sectionKey, setSectionKey] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [isRepeatable, setIsRepeatable] = useState(true);
  const [rawJson, setRawJson] = useState('[]');
  const [jsonError, setJsonError] = useState(null);
  const [parsedFields, setParsedFields] = useState([]);
  const [saving, setSaving] = useState(false);

  // Fetch custom section schemas from backend
  const loadSchemas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSectionSchemas();
      setSchemas(data || []);
    } catch (err) {
      toast.error('Failed to load section schemas: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchemas();
  }, [loadSchemas]);

  // Live validate raw JSON string
  useEffect(() => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!Array.isArray(parsed)) {
        setJsonError('Schema root must be a JSON Array of field definitions.');
        setParsedFields([]);
      } else {
        setJsonError(null);
        setParsedFields(parsed);
      }
    } catch (e) {
      setJsonError(e.message);
      setParsedFields([]);
    }
  }, [rawJson]);

  // Modal open handlers
  const handleOpenCreate = (presetKey = null) => {
    setEditingSchema(null);
    if (presetKey && PRESET_SCHEMAS[presetKey]) {
      const p = PRESET_SCHEMAS[presetKey];
      setSectionKey(p.section_key);
      setLabel(p.label);
      setDescription(p.description);
      setIsRepeatable(p.is_repeatable);
      setRawJson(JSON.stringify(p.fields, null, 2));
    } else {
      setSectionKey('');
      setLabel('');
      setDescription('');
      setIsRepeatable(true);
      setRawJson(JSON.stringify(PRESET_SCHEMAS.publications.fields, null, 2));
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schema) => {
    setEditingSchema(schema);
    setSectionKey(schema.section_key);
    setLabel(schema.label);
    setDescription(schema.description || '');
    setIsRepeatable(schema.is_repeatable !== false);
    const fields = typeof schema.fields_json === 'string'
      ? schema.fields_json
      : JSON.stringify(schema.fields_json, null, 2);
    setRawJson(fields);
    setIsModalOpen(true);
  };

  const handleCloneCanonical = (canonicalKey, canonicalObj) => {
    setEditingSchema(null);
    setSectionKey(`${canonicalKey}_custom`);
    setLabel(`${canonicalObj.label} (Custom)`);
    setDescription(`Customized architecture adapted from standard ${canonicalObj.label}.`);
    setIsRepeatable(canonicalObj.isRepeatable !== false);
    setRawJson(JSON.stringify(canonicalObj.fields || [], null, 2));
    setIsModalOpen(true);
  };

  const handleDelete = async (schemaId, schemaLabel, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the custom schema "${schemaLabel}"?`)) return;
    try {
      await adminApi.deleteSectionSchema(schemaId);
      toast.success('Section schema deleted');
      loadSchemas();
    } catch (err) {
      toast.error('Failed to delete schema: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (jsonError) {
      toast.error('Please fix the JSON syntax errors first.');
      return;
    }
    if (!sectionKey.trim() || !label.trim()) {
      toast.error('Section Key and Label are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        section_key: sectionKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        label: label.trim(),
        description: description.trim(),
        is_repeatable: isRepeatable,
        fields_json: parsedFields,
        is_active: true,
      };

      if (editingSchema) {
        await adminApi.updateSectionSchema(editingSchema.id, payload);
        toast.success(`Schema "${payload.label}" updated successfully!`);
      } else {
        await adminApi.createSectionSchema(payload);
        toast.success(`Schema "${payload.label}" published to resume studio!`);
      }

      setIsModalOpen(false);
      loadSchemas();
    } catch (err) {
      toast.error('Save failed: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  // Helper to append a field template to the JSON editor
  const handleAppendField = (fieldType) => {
    try {
      const current = Array.isArray(parsedFields) ? [...parsedFields] : [];
      const newFieldKey = `field_${current.length + 1}`;
      let newField = {
        key: newFieldKey,
        label: `New ${fieldType.toUpperCase()} Field`,
        type: fieldType,
        required: false,
        placeholder: `Enter ${fieldType}...`,
        gridSpan: 12,
      };
      if (fieldType === 'bullet_list') {
        newField.placeholder = 'Add bullet point, press Enter...';
      } else if (fieldType === 'tags') {
        newField.placeholder = 'Add keyword or chip, press Enter...';
      }
      const updated = [...current, newField];
      setRawJson(JSON.stringify(updated, null, 2));
      toast.success(`Added ${fieldType} field to schema`);
    } catch {
      toast.error('Could not append field. Ensure JSON is valid first.');
    }
  };

  const filteredCustomSchemas = schemas.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.label?.toLowerCase().includes(q) || s.section_key?.toLowerCase().includes(q);
  });

  const canonicalEntries = Object.entries(CANONICAL_SECTION_SCHEMAS);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <span>Section Architecture &amp; Dynamic Schema Maker</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Create, test, and distribute custom structured resume sections with deterministic fields, live form validation, and AI prompt alignment.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadSchemas}
            disabled={loading}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Reload from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <button
            onClick={() => handleOpenCreate()}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Section Schema</span>
          </button>
        </div>
      </div>

      {/* ── Sub Navigation & Search Bar ─────────────────────────────────────── */}
      <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Sub-tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'custom'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <span>Custom Sections</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              activeSubTab === 'custom' ? 'bg-indigo-800 text-indigo-200' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {schemas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('canonical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'canonical'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <span>Core Canonical Sections</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              activeSubTab === 'canonical' ? 'bg-indigo-800 text-indigo-200' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {canonicalEntries.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schemas by name or key..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ── SUBTAB 1: CUSTOM SCHEMAS ────────────────────────────────────────── */}
      {activeSubTab === 'custom' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-zinc-500">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs">Loading section architectures...</p>
            </div>
          ) : schemas.length === 0 ? (
            /* Empty State with Presets */
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-6">
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">No Custom Section Schemas Yet</h3>
                <p className="text-xs text-zinc-400">
                  Custom schemas let you define structured sections with dynamic fields (inputs, textareas, tags, bullet lists). Candidates will see these in their "Add Section" dialog.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenCreate()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Schema from Scratch</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets Grid */}
              <div className="border-t border-zinc-800/80 pt-6">
                <p className="text-xs font-semibold text-zinc-400 mb-4">Or start instantly from a standard industry preset:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
                  {Object.entries(PRESET_SCHEMAS).map(([key, p]) => (
                    <div
                      key={key}
                      onClick={() => handleOpenCreate(key)}
                      className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-indigo-400 mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider">{p.section_key}</span>
                          <Sparkles className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {p.label}
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                      <div className="pt-3 flex items-center justify-between text-[10px] text-zinc-400 border-t border-zinc-800/60 mt-2">
                        <span>{p.fields.length} fields</span>
                        <span className="text-indigo-400 font-semibold group-hover:underline">Use Preset →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Custom Schemas Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomSchemas.map((s) => {
                const fields = Array.isArray(s.fields_json) ? s.fields_json : [];
                return (
                  <div
                    key={s.id}
                    className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {s.section_key}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-400 bg-zinc-800/60">
                              {s.is_repeatable ? 'Repeatable' : 'Single'}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-2 group-hover:text-indigo-200 transition-colors">
                            {s.label}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {fields.length} {fields.length === 1 ? 'field' : 'fields'}
                        </span>
                      </div>

                      {s.description && (
                        <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                          {s.description}
                        </p>
                      )}

                      {/* Fields Chips Preview */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/60">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">
                          Defined Fields
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {fields.slice(0, 6).map((f, i) => (
                            <span
                              key={f.key || i}
                              className="px-2 py-0.5 rounded text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 flex items-center gap-1"
                              title={`${f.key} (${f.type})`}
                            >
                              <span>{f.label || f.key}</span>
                              <span className="text-[8px] text-zinc-500 font-mono">[{f.type}]</span>
                            </span>
                          ))}
                          {fields.length > 6 && (
                            <span className="px-1.5 py-0.5 text-[9px] text-zinc-500 font-mono">
                              +{fields.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ID: #{s.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                          title="Edit Schema JSON & Properties"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(s.id, s.label, e)}
                          className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                          title="Delete Schema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUBTAB 2: CORE CANONICAL SCHEMAS ─────────────────────────────────── */}
      {activeSubTab === 'canonical' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-200">
              <strong className="text-white">Built-in Canonical Schemas</strong> are natively supported by all Resumo templates, WeasyPrint PDF compiler, and the Wiser AI extraction pipeline.
              You can click <strong>"Clone to Custom"</strong> on any schema to adapt its fields for specialized roles (e.g. customized Tech Projects or Academic Experience).
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {canonicalEntries.map(([typeKey, schema]) => (
              <div
                key={typeKey}
                className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {typeKey}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5">{schema.label}</h3>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {schema.fields?.length || 0} fields
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-2">
                    Item model: <code className="text-zinc-300 font-mono text-[11px]">{schema.itemName || 'Item'}</code>
                    {' • '}
                    {schema.isRepeatable ? 'Repeatable' : 'Single block'}
                  </p>

                  <div className="mt-3 pt-3 border-t border-zinc-800/60">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">
                      Canonical Fields
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(schema.fields || []).slice(0, 7).map((f) => (
                        <span
                          key={f.key}
                          className="px-2 py-0.5 rounded text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
                        >
                          {f.label || f.key}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">Standard System Architecture</span>
                  <button
                    type="button"
                    onClick={() => handleCloneCanonical(typeKey, schema)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Clone to Custom</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CREATE & EDIT MODAL (RAW JSON & LIVE PREVIEW) ─────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c0e17] border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingSchema ? `Edit Section: ${editingSchema.label}` : 'New Custom Section Schema'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Define fields schema via raw JSON and verify live layout before publishing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Top Form Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Section Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={sectionKey}
                    onChange={(e) => setSectionKey(e.target.value)}
                    placeholder="e.g. publications, patents"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Machine-readable unique key.</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Display Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Publications & Research"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Section heading on resume.</span>
                </div>

                <div className="flex flex-col justify-between">
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Repeatable Items
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={isRepeatable}
                      onChange={(e) => setIsRepeatable(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs text-zinc-300">Allow multiple entries</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 block">Candidate can add & reorder items.</span>
                </div>

                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    User Guidance / Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief guidance for users on what to include..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Quick Field Helpers Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-zinc-400">Append Field:</span>
                  <button
                    type="button"
                    onClick={() => handleAppendField('text')}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition"
                  >
                    + Text
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendField('textarea')}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition"
                  >
                    + Textarea
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendField('bullet_list')}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition"
                  >
                    + Bullet List
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendField('tags')}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition"
                  >
                    + Tags / Chips
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendField('url')}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition"
                  >
                    + URL Link
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-500">Presets:</span>
                  {Object.keys(PRESET_SCHEMAS).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        const p = PRESET_SCHEMAS[k];
                        setSectionKey(p.section_key);
                        setLabel(p.label);
                        setDescription(p.description);
                        setIsRepeatable(p.is_repeatable);
                        setRawJson(JSON.stringify(p.fields, null, 2));
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/40 text-indigo-300 text-[10px] capitalize transition"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Editor: Raw JSON on Left, Live Form on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Raw JSON */}
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Raw Fields JSON Schema</span>
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">
                      [{parsedFields.length} fields]
                    </span>
                  </div>

                  <div className="relative flex-1 min-h-[300px]">
                    <textarea
                      rows={16}
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      className={`w-full h-full font-mono text-[11px] p-3 rounded-xl bg-[#07080e] border ${
                        jsonError
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-zinc-800 focus:border-indigo-500'
                      } text-zinc-200 outline-none resize-none leading-relaxed`}
                    />
                  </div>

                  {jsonError ? (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{jsonError}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid JSON schema ({parsedFields.length} fields defined)</span>
                    </div>
                  )}
                </div>

                {/* Right Column: Live Form Preview */}
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Live Candidate Form Preview</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">Real-time candidate experience</span>
                  </div>

                  <div className="flex-1 min-h-[300px] max-h-[420px] bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 overflow-y-auto space-y-4">
                    {/* Simulated Header */}
                    <div className="border-b border-zinc-800 pb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {label || 'Section Title'}
                      </h4>
                      {description && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">{description}</p>
                      )}
                    </div>

                    {parsedFields.length === 0 ? (
                      <div className="py-12 text-center text-zinc-600 text-xs italic">
                        No fields defined yet. Add fields in the JSON editor to see live form controls.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {parsedFields.map((field, idx) => (
                          <div key={field.key || idx} className="space-y-1">
                            <label className="text-[11px] font-medium text-zinc-300 flex items-center justify-between">
                              <span>
                                {field.label || field.key}{' '}
                                {field.required && <span className="text-rose-400 font-bold">*</span>}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500 uppercase">
                                {field.type}
                              </span>
                            </label>

                            {field.type === 'textarea' ? (
                              <textarea
                                placeholder={field.placeholder || ''}
                                rows={2}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
                              />
                            ) : field.type === 'bullet_list' ? (
                              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-dashed border-zinc-800 space-y-1.5">
                                <input
                                  type="text"
                                  placeholder={field.placeholder || 'Type bullet point and press Enter...'}
                                  className="w-full bg-transparent border-none text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
                                />
                                <div className="text-[10px] text-zinc-500">
                                  • Bullet 1 (e.g. key impact accomplishment)
                                </div>
                              </div>
                            ) : field.type === 'tags' ? (
                              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-dashed border-zinc-800 space-y-1.5">
                                <input
                                  type="text"
                                  placeholder={field.placeholder || 'Type tag and press Enter...'}
                                  className="w-full bg-transparent border-none text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
                                />
                                <div className="flex gap-1">
                                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                                    Sample Tag ×
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <input
                                type={field.type === 'url' ? 'url' : 'text'}
                                placeholder={field.placeholder || ''}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
                              />
                            )}
                          </div>
                        ))}

                        {isRepeatable && (
                          <div className="pt-2 border-t border-zinc-800/60">
                            <button
                              type="button"
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add another {label ? label.replace(/s$/i, '') : 'entry'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || Boolean(jsonError)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSchema ? 'Update Schema' : 'Save & Publish Schema'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
