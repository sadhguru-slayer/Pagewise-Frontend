'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import {
  X,
  Layers,
  Palette,
  FileCode,
  Check,
  RefreshCw,
  Sliders,
  Type,
  AlignLeft,
  AlignCenter,
  Maximize2,
  Lock,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Info,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CANONICAL_SECTION_SCHEMAS, SECTION_TYPES } from '@/lib/resume/sectionSchemas';

const FONT_OPTIONS = [
  { label: 'Georgia (Classic Editorial Serif)', value: 'Georgia, serif' },
  { label: 'Garamond (Elegant Executive Serif)', value: 'Garamond, serif' },
  { label: 'Times New Roman (Formal Corporate Serif)', value: 'Times New Roman, serif' },
  { label: 'Merriweather (Modern Readable Serif)', value: 'Merriweather, serif' },
  { label: 'Inter (Modern Silicon Valley Sans)', value: 'Inter, sans-serif' },
  { label: 'Arial (Clean Corporate Sans)', value: 'Arial, sans-serif' },
  { label: 'Helvetica / Arial (Minimal Sans)', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Calibri (Office Standard Sans)', value: 'Calibri, sans-serif' },
  { label: 'Roboto (Crisp Tech Sans)', value: 'Roboto, sans-serif' },
  { label: 'Lato (Refined Contemporary Sans)', value: 'Lato, sans-serif' },
];

export default function TemplateDetailModal({ template, isOpen, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('styles'); // 'styles' | 'meta' | 'json'
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Standard');
  const [badge, setBadge] = useState('');
  const [minPlanTier, setMinPlanTier] = useState('free');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Visual Style Controls State
  const [bodyFont, setBodyFont] = useState('Georgia, serif');
  const [bodyFontSize, setBodyFontSize] = useState(11);
  const [lineHeight, setLineHeight] = useState(1.45);
  const [marginTop, setMarginTop] = useState(14);
  const [marginBottom, setMarginBottom] = useState(14);
  const [marginLeft, setMarginLeft] = useState(16);
  const [marginRight, setMarginRight] = useState(16);
  const [headingColor, setHeadingColor] = useState('#111827');
  const [accentColor, setAccentColor] = useState('#374151');

  // Header Style Controls
  const [headerAlign, setHeaderAlign] = useState('center');
  const [headerShowDivider, setHeaderShowDivider] = useState(true);
  const [nameFontSize, setNameFontSize] = useState(24);

  // Section Defaults Controls
  const [sectionAlign, setSectionAlign] = useState('left');
  const [sectionHeadingBold, setSectionHeadingBold] = useState(true);
  const [sectionHeadingUppercase, setSectionHeadingUppercase] = useState(true);
  const [sectionHeadingUnderline, setSectionHeadingUnderline] = useState(false);
  const [sectionShowDivider, setSectionShowDivider] = useState(true);

  // Raw JSON strings
  const [settingsJsonStr, setSettingsJsonStr] = useState('{}');
  const [headerStyleJsonStr, setHeaderStyleJsonStr] = useState('{}');
  const [sectionDefaultsJsonStr, setSectionDefaultsJsonStr] = useState('{}');
  const [sectionSchemaJsonStr, setSectionSchemaJsonStr] = useState('{}');

  // Section Schema & Structure State
  const [templateSections, setTemplateSections] = useState([]);
  const [newSecType, setNewSecType] = useState('experience');
  const [newSecLabel, setNewSecLabel] = useState('');
  const [newSecRequired, setNewSecRequired] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setTemplateKey(template.template_key || '');
      setDescription(template.description || '');
      setCategory(template.category || 'Standard');
      setBadge(template.badge || '');
      setMinPlanTier(template.min_plan_tier || 'free');
      setDisplayOrder(template.display_order || 0);
      setIsActive(template.is_active ?? true);

      // Extract settings
      const settings = typeof template.settings_json === 'object' ? template.settings_json : {};
      setBodyFont(settings?.bodyFont || 'Georgia, serif');
      setBodyFontSize(settings?.bodyFontSize || 11);
      setLineHeight(settings?.lineHeight || 1.45);
      setMarginTop(settings?.marginTop ?? 14);
      setMarginBottom(settings?.marginBottom ?? 14);
      setMarginLeft(settings?.marginLeft ?? 16);
      setMarginRight(settings?.marginRight ?? 16);
      setHeadingColor(settings?.headingColor || '#111827');
      setAccentColor(settings?.accentColor || '#374151');

      // Extract header
      const header = typeof template.header_style_json === 'object' ? template.header_style_json : {};
      setHeaderAlign(header?.alignment || 'center');
      setHeaderShowDivider(header?.showDivider ?? true);
      setNameFontSize(header?.nameFontSize || 24);

      // Extract section defaults
      const sectionDefaults =
        typeof template.section_defaults_json === 'object' ? template.section_defaults_json : {};
      setSectionAlign(sectionDefaults?.headingAlign || 'left');
      setSectionHeadingBold(sectionDefaults?.headingBold ?? true);
      setSectionHeadingUppercase(sectionDefaults?.headingUppercase ?? true);
      setSectionHeadingUnderline(sectionDefaults?.headingUnderline ?? false);
      setSectionShowDivider(sectionDefaults?.showDividerAfterHeading ?? true);

      // Extract section schema
      let rawSchema = {};
      if (typeof template.section_schema_json === 'string' && template.section_schema_json.trim()) {
        try {
          rawSchema = JSON.parse(template.section_schema_json);
        } catch (e) {
          rawSchema = {};
        }
      } else if (typeof template.section_schema_json === 'object' && template.section_schema_json) {
        rawSchema = template.section_schema_json;
      }

      const initialSections = Array.isArray(rawSchema.sections) && rawSchema.sections.length > 0
        ? rawSchema.sections
        : [
            { id: 'sec_sum', type: 'summary', label: 'Professional Summary', required: false, enabled: true },
            { id: 'sec_exp', type: 'experience', label: 'Work Experience', required: true, enabled: true },
            { id: 'sec_edu', type: 'education', label: 'Education', required: true, enabled: true },
            { id: 'sec_skl', type: 'skills', label: 'Skills & Technologies', required: true, enabled: true },
            { id: 'sec_prj', type: 'projects', label: 'Projects', required: false, enabled: true },
            { id: 'sec_crt', type: 'certifications', label: 'Certifications', required: false, enabled: false },
          ];

      setTemplateSections(initialSections);

      // Raw JSON strings formatted
      setSettingsJsonStr(JSON.stringify(settings || {}, null, 2));
      setHeaderStyleJsonStr(JSON.stringify(header || {}, null, 2));
      setSectionDefaultsJsonStr(JSON.stringify(sectionDefaults || {}, null, 2));
      setSectionSchemaJsonStr(JSON.stringify({ schema_version: template.schema_version || 1, sections: initialSections }, null, 2));
    }
  }, [template]);

  if (!isOpen || !template) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      let finalSettings = {};
      let finalHeader = {};
      let finalSectionDefaults = {};
      let finalSectionSchema = {};

      if (activeTab === 'json') {
        try {
          finalSettings = JSON.parse(settingsJsonStr);
          finalHeader = JSON.parse(headerStyleJsonStr);
          finalSectionDefaults = JSON.parse(sectionDefaultsJsonStr);
          finalSectionSchema = JSON.parse(sectionSchemaJsonStr);
        } catch (jsonErr) {
          toast.error('Invalid JSON syntax: ' + jsonErr.message);
          setSaving(false);
          return;
        }
      } else {
        finalSettings = {
          bodyFont,
          bodyFontSize: Number(bodyFontSize),
          lineHeight: Number(lineHeight),
          marginTop: Number(marginTop),
          marginBottom: Number(marginBottom),
          marginLeft: Number(marginLeft),
          marginRight: Number(marginRight),
          headingColor,
          accentColor,
          sectionSpacing: 10,
        };

        finalHeader = {
          alignment: headerAlign,
          showDivider: headerShowDivider,
          nameFont: bodyFont,
          nameFontSize: Number(nameFontSize),
          nameFontWeight: 'bold',
          contactFontSize: 10.5,
          contactColor: '#4b5563',
          divider: {
            color: headingColor,
            thickness: 1.5,
            marginTop: 6,
            marginBottom: 8,
            style: 'solid',
          },
        };

        finalSectionDefaults = {
          headingAlign: sectionAlign,
          headingBold: sectionHeadingBold,
          headingUppercase: sectionHeadingUppercase,
          headingUnderline: sectionHeadingUnderline,
          showDividerAfterHeading: sectionShowDivider,
        };

        finalSectionSchema = {
          schema_version: 1,
          sections: templateSections,
        };
      }

      await adminApi.updateTemplate(template.id, {
        name,
        template_key: templateKey,
        description,
        category,
        badge,
        min_plan_tier: minPlanTier,
        display_order: Number(displayOrder),
        is_active: isActive,
        settings_json: finalSettings,
        header_style_json: finalHeader,
        section_defaults_json: finalSectionDefaults,
        section_schema_json: finalSectionSchema,
        schema_version: 1,
      });

      toast.success('Template, Styles & Section Formats updated successfully!');
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      toast.error('Failed to update template: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSectionToTemplate = (e) => {
    if (e) e.preventDefault();
    const type = newSecType;
    const label = newSecLabel.trim() || CANONICAL_SECTION_SCHEMAS[type]?.label || type.toUpperCase();
    const newSec = {
      id: 'sec_' + Math.random().toString(36).substring(2, 7),
      type,
      label,
      enabled: true,
      required: newSecRequired,
    };
    const updated = [...templateSections, newSec];
    setTemplateSections(updated);
    setSectionSchemaJsonStr(JSON.stringify({ schema_version: 1, sections: updated }, null, 2));
    setNewSecLabel('');
    setNewSecRequired(false);
    toast.success(`Added ${label} format to template!`);
  };

  const handleRemoveSectionFromTemplate = (idx) => {
    const updated = templateSections.filter((_, i) => i !== idx);
    setTemplateSections(updated);
    setSectionSchemaJsonStr(JSON.stringify({ schema_version: 1, sections: updated }, null, 2));
  };

  const handleReorderTemplateSections = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= templateSections.length) return;
    const updated = [...templateSections];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setTemplateSections(updated);
    setSectionSchemaJsonStr(JSON.stringify({ schema_version: 1, sections: updated }, null, 2));
  };

  const handleUpdateTemplateSection = (idx, patch) => {
    const updated = templateSections.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setTemplateSections(updated);
    setSectionSchemaJsonStr(JSON.stringify({ schema_version: 1, sections: updated }, null, 2));
  };

  const handleApplyPreset = (presetName) => {
    let sections = [];
    if (presetName === 'standard') {
      sections = [
        { id: 'sec_sum', type: 'summary', label: 'Professional Summary', required: false, enabled: true },
        { id: 'sec_exp', type: 'experience', label: 'Work Experience', required: true, enabled: true },
        { id: 'sec_edu', type: 'education', label: 'Education', required: true, enabled: true },
        { id: 'sec_skl', type: 'skills', label: 'Skills & Technologies', required: true, enabled: true },
      ];
    } else if (presetName === 'tech') {
      sections = [
        { id: 'sec_sum', type: 'summary', label: 'Summary', required: false, enabled: true },
        { id: 'sec_exp', type: 'experience', label: 'Work Experience', required: true, enabled: true },
        { id: 'sec_prj', type: 'projects', label: 'Key Projects', required: false, enabled: true },
        { id: 'sec_skl', type: 'skills', label: 'Technical Skills', required: true, enabled: true },
        { id: 'sec_edu', type: 'education', label: 'Education', required: true, enabled: true },
        { id: 'sec_crt', type: 'certifications', label: 'Certifications', required: false, enabled: true },
      ];
    } else if (presetName === 'executive') {
      sections = [
        { id: 'sec_sum', type: 'summary', label: 'Executive Narrative', required: true, enabled: true },
        { id: 'sec_exp', type: 'experience', label: 'Executive Leadership', required: true, enabled: true },
        { id: 'sec_prj', type: 'projects', label: 'Major Initiatives & Transformations', required: false, enabled: true },
        { id: 'sec_edu', type: 'education', label: 'Academic Credentials', required: true, enabled: true },
      ];
    }
    setTemplateSections(sections);
    setSectionSchemaJsonStr(JSON.stringify({ schema_version: 1, sections }, null, 2));
    toast.success(`Loaded ${presetName} section structure!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111420] border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1018]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{name || 'Template Details'}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 uppercase">
                  {minPlanTier}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">key: {templateKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-zinc-800 bg-[#0e1018] flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('styles')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'styles'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Visual Styles &amp; Typography</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'sections'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Section Formats &amp; Structure</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('meta')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'meta'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Metadata &amp; Access Tier</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'json'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw JSON Inspector</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* TAB 1: VISUAL STYLES & TYPOGRAPHY */}
          {activeTab === 'styles' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Typography Section */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Typography &amp; Hierarchy
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Body &amp; Header Font Family
                    </label>
                    <select
                      value={bodyFont}
                      onChange={(e) => setBodyFont(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Header Candidate Name Size ({nameFontSize}pt)
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="36"
                      value={nameFontSize}
                      onChange={(e) => setNameFontSize(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Base Font Size ({bodyFontSize}pt)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="9"
                      max="14"
                      value={bodyFontSize}
                      onChange={(e) => setBodyFontSize(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Line Height Ratio ({lineHeight})
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.1"
                      max="2.0"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Page Margins (Page Budgeting) */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold block">
                  Page Margins &amp; Geometry (mm)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1 font-mono">Top (mm)</label>
                    <input
                      type="number"
                      value={marginTop}
                      onChange={(e) => setMarginTop(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1 font-mono">Bottom (mm)</label>
                    <input
                      type="number"
                      value={marginBottom}
                      onChange={(e) => setMarginBottom(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1 font-mono">Left (mm)</label>
                    <input
                      type="number"
                      value={marginLeft}
                      onChange={(e) => setMarginLeft(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1 font-mono">Right (mm)</label>
                    <input
                      type="number"
                      value={marginRight}
                      onChange={(e) => setMarginRight(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Layout & Header Alignment */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block">
                  Layout Structure &amp; Divider Rules
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Candidate Header Alignment
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setHeaderAlign('left')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          headerAlign === 'left'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>Left-Aligned</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeaderAlign('center')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          headerAlign === 'center'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                        <span>Centered</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                      Section Title Divider Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSectionShowDivider(!sectionShowDivider)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          sectionShowDivider
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {sectionShowDivider ? 'Rule / Divider On' : 'No Divider'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionHeadingUppercase(!sectionHeadingUppercase)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          sectionHeadingUppercase
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {sectionHeadingUppercase ? 'UPPERCASE HEADINGS' : 'Title Case'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECTION FORMATS & STRUCTURE */}
          {activeTab === 'sections' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Architecture Banner */}
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <span className="font-bold text-white block mb-0.5">
                    Template &amp; Section Architecture:
                  </span>
                  Templates hold the sections where sections hold their structure, but template holds the visual styling and formatting. Configure which section formats are bundled into this template.
                </div>
              </div>

              {/* Presets Quick-Load */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Load Section Structure Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('standard')}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer"
                  >
                    Standard Professional (Summary, Exp, Edu, Skills)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('tech')}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer"
                  >
                    Modern Tech (Summary, Exp, Projects, Skills, Edu, Certs)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('executive')}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer"
                  >
                    Executive Leadership (Narrative, Leadership, Initiatives, Edu)
                  </button>
                </div>
              </div>

              {/* Configured Section Formats in Template */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                    Sections in this Template ({templateSections.length})
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Reorder to change default layout
                  </span>
                </div>

                <div className="space-y-2">
                  {templateSections.map((sec, idx) => (
                    <div
                      key={sec.id || idx}
                      className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="text-zinc-500 font-mono text-[10px] w-4 text-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={sec.label || ''}
                          onChange={(e) => handleUpdateTemplateSection(idx, { label: e.target.value })}
                          className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-amber-500 w-full max-w-[200px]"
                          placeholder="Section Title"
                        />
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 shrink-0">
                          {sec.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={sec.enabled !== false}
                            onChange={(e) => handleUpdateTemplateSection(idx, { enabled: e.target.checked })}
                            className="rounded border-zinc-700 text-amber-600 focus:ring-0"
                          />
                          <span>Enabled</span>
                        </label>

                        <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(sec.required)}
                            onChange={(e) => handleUpdateTemplateSection(idx, { required: e.target.checked })}
                            className="rounded border-zinc-700 text-amber-600 focus:ring-0"
                          />
                          <span>Required</span>
                        </label>

                        <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorderTemplateSections(idx, idx - 1)}
                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === templateSections.length - 1}
                            onClick={() => handleReorderTemplateSections(idx, idx + 1)}
                            className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSectionFromTemplate(idx)}
                            className="p-1 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                            title="Delete Section from Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Creator Form */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold block">
                  Add New Section Format to Template
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Section Type
                    </label>
                    <select
                      value={newSecType}
                      onChange={(e) => {
                        setNewSecType(e.target.value);
                        if (!newSecLabel) {
                          setNewSecLabel(CANONICAL_SECTION_SCHEMAS[e.target.value]?.label || '');
                        }
                      }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="experience">Work Experience (Structured Form)</option>
                      <option value="education">Education (Structured Form)</option>
                      <option value="projects">Projects (Structured Form)</option>
                      <option value="skills">Skills &amp; Technologies (Structured Form)</option>
                      <option value="certifications">Certifications (Structured Form)</option>
                      <option value="summary">Professional Summary (Rich Text)</option>
                      <option value="custom">Custom Section (Rich Text)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Display Label in Template
                    </label>
                    <input
                      type="text"
                      value={newSecLabel}
                      onChange={(e) => setNewSecLabel(e.target.value)}
                      placeholder="e.g. Work History"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddSectionToTemplate}
                      className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Section</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: METADATA & ACCESS TIER */}
          {activeTab === 'meta' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                    placeholder="e.g. Ivy League Classic"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                    Template Key (Slug)
                  </label>
                  <input
                    type="text"
                    value={templateKey}
                    onChange={(e) => setTemplateKey(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="ivy-league"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                    Industry Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Finance & Consulting"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                    Minimum Required Plan Tier
                  </label>
                  <select
                    value={minPlanTier}
                    onChange={(e) => setMinPlanTier(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
                  >
                    <option value="free">Pagewise Free (All Users)</option>
                    <option value="day_pass">Wiser Day Pass &amp; Pro</option>
                    <option value="pro_monthly">Pagewise Pro Only (Exclusive)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 font-semibold mb-1 uppercase font-mono text-[10px]">
                    Marketing Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                    placeholder="Recommended format for traditional corporate roles..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <span className="text-xs text-zinc-300 font-semibold">
                    {isActive ? 'Published & Active in Studio' : 'Draft / Hidden from Studio'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RAW JSON INSPECTOR */}
          {activeTab === 'json' && (
            <div className="space-y-4 animate-in fade-in duration-150 font-mono">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">
                  settings_json (Page Margins, Font Families, Line Heights)
                </label>
                <textarea
                  rows={6}
                  value={settingsJsonStr}
                  onChange={(e) => setSettingsJsonStr(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">
                  header_style_json (Alignment, Font Weights, Header Dividers)
                </label>
                <textarea
                  rows={5}
                  value={headerStyleJsonStr}
                  onChange={(e) => setHeaderStyleJsonStr(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-sky-400 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">
                  section_defaults_json (Title Capitalization, Underlines)
                </label>
                <textarea
                  rows={5}
                  value={sectionDefaultsJsonStr}
                  onChange={(e) => setSectionDefaultsJsonStr(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-purple-400 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">
                  section_schema_json (Template Section Structure &amp; Format Specifications)
                </label>
                <textarea
                  rows={6}
                  value={sectionSchemaJsonStr}
                  onChange={(e) => setSectionSchemaJsonStr(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-[#0e1018] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Template ID: #{template.id}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-zinc-400 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save Template &amp; Styles</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
