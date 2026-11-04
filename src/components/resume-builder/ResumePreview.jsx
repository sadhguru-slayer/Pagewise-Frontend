'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useResumeStore } from '@/lib/resume/store';
import { renderTiptapJson } from '@/lib/resume/renderTiptap';
import { renderStructuredSectionHtml } from '@/lib/resume/sectionSchemas';
import {
  A4_PX_WIDTH,
  A4_PX_HEIGHT,
  MM_TO_PX,
  buildResumeCss,
  getContactLineHtml,
  renderResumeInnerHtml,
  normalizeFontFamily,
  isPortfolioSection,
} from '@/lib/resume/renderDocument';
import { Minimize2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResumePreview({ onSelectSection, onSelectHeader }) {
  const { header, sections, settings, updateSettings, activeSectionId, setActiveSectionId } = useResumeStore();

  const containerRef = useRef(null);
  const measureSandboxRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [measuredTotalHeight, setMeasuredTotalHeight] = useState(0);

  // ── Compute scale factor for responsive preview viewport ───────────────────
  const computeScale = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth - 32;
    setScale(Math.min(1, Math.max(0.35, containerWidth / A4_PX_WIDTH)));
  }, []);

  useEffect(() => {
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [computeScale]);

  // ── Measure unscaled off-screen sandbox element (Zoom-Proof) ──────────────
  const measureHeight = useCallback(() => {
    if (!measureSandboxRef.current) return;
    // Use getBoundingClientRect for subpixel precision
    const rect = measureSandboxRef.current.getBoundingClientRect();
    const h = rect.height || measureSandboxRef.current.offsetHeight;
    if (h > 0) {
      setMeasuredTotalHeight(h);
    }
  }, []);

  // Measure on changes and when fonts are fully loaded
  useEffect(() => {
    measureHeight();

    // Re-measure when web fonts finish downloading
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        measureHeight();
      });
    }

    // Attach ResizeObserver to the offscreen unscaled container
    if (measureSandboxRef.current) {
      const observer = new ResizeObserver(() => {
        measureHeight();
      });
      observer.observe(measureSandboxRef.current);
      return () => observer.disconnect();
    }
  }, [header, sections, settings, measureHeight]);

  // ── Precise A4 Boundary Calculations ───────────────────────────────────────
  // A4_PX_HEIGHT is exact 1122.52px (297mm @ 96 DPI)
  const isOverOnePage = measuredTotalHeight > A4_PX_HEIGHT + 0.5;
  const overflowPx = Math.max(0, Math.ceil(measuredTotalHeight - A4_PX_HEIGHT));
  const remainingPx = Math.max(0, Math.floor(A4_PX_HEIGHT - measuredTotalHeight));

  // ── One-click auto-compression to fit cleanly onto 1 Page ──────────────────
  const handleAutoFitOnePage = () => {
    const currentSpacing = settings?.sectionSpacing ?? 2;
    const currentFont = settings?.bodyFontSize ?? 8.5;
    const currentTop = settings?.marginTop ?? 15;
    const currentBottom = settings?.marginBottom ?? 15;
    const currentLeft = settings?.marginLeft ?? 15;
    const currentRight = settings?.marginRight ?? 15;

    // Smart compression based on overflow magnitude
    if (overflowPx <= 15) {
      // Minor overflow: compress vertical section spacing and 1mm margin
      updateSettings({
        sectionSpacing: Math.max(0, currentSpacing - 1),
        marginTop: Math.max(10, currentTop - 1),
        marginBottom: Math.max(10, currentBottom - 1),
      });
    } else if (overflowPx <= 40) {
      // Moderate overflow: slight font size and spacing reduction
      updateSettings({
        sectionSpacing: Math.max(0, currentSpacing - 1.5),
        bodyFontSize: Math.max(8.0, Number((currentFont - 0.2).toFixed(1))),
        marginTop: Math.max(10, currentTop - 1),
        marginBottom: Math.max(10, currentBottom - 1),
      });
    } else {
      // Larger overflow: compress font, line height, margins, spacing
      updateSettings({
        sectionSpacing: Math.max(0, currentSpacing - 2),
        bodyFontSize: Math.max(7.8, Number((currentFont - 0.4).toFixed(1))),
        marginTop: Math.max(9, currentTop - 2),
        marginBottom: Math.max(9, currentBottom - 2),
        marginLeft: Math.max(10, currentLeft - 1),
        marginRight: Math.max(10, currentRight - 1),
        lineHeight: 1.25,
      });
    }
    toast.success('Optimized layout parameters to fit cleanly on 1 page!');
  };

  // ── Visible sections in order ──────────────────────────────────────────────
  const visibleSections = [...(sections ?? [])]
    .filter((s) => {
      if (s.visible === false) return false;
      if (isPortfolioSection(s)) {
        const linkCount = s.links?.length || 0;
        if (linkCount > 0 && linkCount <= 3) return false;
      }
      return true;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // ── Interactive Resume Content Block (Canva-style click-to-edit) ───────────
  const renderInteractiveResumeContent = () => (
    <div
      className="resume-preview-interactive"
      style={{
        fontFamily: normalizeFontFamily(settings?.bodyFont ?? 'Georgia, serif'),
        fontSize: `${settings?.bodyFontSize ?? 8.5}pt`,
        lineHeight: settings?.lineHeight ?? 1.2,
        color: '#111111',
      }}
    >
      {/* ── Resume Header (Clickable like in Canva) ──────────────────── */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (activeSectionId === 'header') {
            setActiveSectionId(null);
          } else {
            setActiveSectionId('header');
            if (onSelectHeader) onSelectHeader();
          }
        }}
        id="preview-header"
        className={`resume-header group relative rounded-sm ${
          activeSectionId === 'header' ? 'active-section ring-2 ring-blue-500 bg-blue-50/15' : ''
        }`}
        style={{
          textAlign: header?.alignment ?? 'center',
          marginBottom: '4pt',
        }}
        title="Click to edit Resume Header (click again to unselect)"
      >
        {activeSectionId === 'header' ? (
          <span className="absolute -top-3 right-1 z-20 flex items-center gap-1.5 bg-[#181B26] border border-[#D49A6A]/60 shadow-lg px-2 py-0.5 rounded-full text-[9px] font-sans font-semibold text-[#D49A6A] select-none pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D49A6A] animate-pulse" />
            <span>Editing Header</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSectionId(null);
              }}
              className="ml-1 text-zinc-400 hover:text-white cursor-pointer px-0.5"
              title="Deselect header"
            >
              ✕
            </span>
          </span>
        ) : (
          <span className="absolute top-0 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/90 border border-white/10 text-zinc-300 text-[9px] px-2 py-0.5 rounded shadow pointer-events-none font-sans font-medium z-10">
            Edit Header ✎
          </span>
        )}
        <h1
          className="header-name"
          style={{
            fontFamily: normalizeFontFamily(header?.nameFont ?? settings?.bodyFont ?? 'Georgia, serif'),
            fontSize: `${header?.nameFontSize ?? 22}pt`,
            fontWeight: header?.nameFontWeight ?? 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            lineHeight: 1.1,
            color: '#111',
            margin: 0,
          }}
        >
          {header?.name ?? ''}
        </h1>
        <div
          className="header-contact-line"
          style={{
            fontSize: `${header?.contactFontSize ?? 9.5}pt`,
            color: header?.contactColor ?? '#4b5563',
            marginTop: '2pt',
            marginBottom: 0,
            lineHeight: 1.2,
          }}
          dangerouslySetInnerHTML={{ __html: getContactLineHtml(header, sections) }}
        />
        {header?.showDivider && header?.divider && (
          <hr
            className="header-divider-line"
            style={{
              marginTop: `${header.divider.marginTop ?? 5}px`,
              marginBottom: `${header.divider.marginBottom ?? 5}px`,
              border: 'none',
              borderTopWidth: `${header.divider.thickness ?? 1}px`,
              borderTopStyle: header.divider.style ?? 'solid',
              borderTopColor: header.divider.color ?? '#d1d5db',
            }}
          />
        )}
      </div>

      {/* ── Sections (Clickable like in Canva) ────────────────────────── */}
      {(() => {
        const layoutStyle = settings?.layoutStyle || 'single-column';

        const renderSectionNode = (section) => {
          const isCurrentActive = activeSectionId === section.id;
          const headingColor = section.headingColor || settings?.headingColor || '#111827';
          const headingWeight = section.headingBold !== false ? 'bold' : 'normal';
          const headingUnderline = section.headingUnderline ? 'underline' : 'none';
          const headingTransform = section.headingUppercase !== false ? 'uppercase' : 'none';
          const headingFontSize =
            section.headingFontSize != null
              ? section.headingFontSize
              : Number(((settings?.bodyFontSize ?? 8.5) * 1.18).toFixed(1));

          return (
            <div
              key={section.id}
              data-section-id={section.id}
              onClick={(e) => {
                e.stopPropagation();
                if (isCurrentActive) {
                  setActiveSectionId(null);
                  if (onSelectSection) onSelectSection(null);
                } else {
                  setActiveSectionId(section.id);
                  if (onSelectSection) onSelectSection(section.id);
                }
              }}
              id={`preview-section-${section.id}`}
              className={`section-container group relative rounded-sm ${
                isCurrentActive ? 'active-section ring-2 ring-blue-500 bg-blue-50/15' : ''
              }`}
              style={{
                marginBottom: `${settings?.sectionSpacing ?? 1}pt`,
              }}
              title={isCurrentActive ? "Selected (click again to unselect)" : "Click to edit this section"}
            >
              {isCurrentActive ? (
                <span className="absolute -top-3 right-1 z-20 flex items-center gap-1.5 bg-[#181B26] border border-[#D49A6A]/60 shadow-lg px-2 py-0.5 rounded-full text-[9px] font-sans font-semibold text-[#D49A6A] select-none pointer-events-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D49A6A] animate-pulse" />
                  <span>Selected</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSectionId(null);
                      if (onSelectSection) onSelectSection(null);
                    }}
                    className="ml-1 text-zinc-400 hover:text-white cursor-pointer px-0.5"
                    title="Deselect section"
                  >
                    ✕
                  </span>
                </span>
              ) : (
                <span className="absolute top-0 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/90 border border-white/10 text-zinc-300 text-[9px] px-2 py-0.5 rounded shadow pointer-events-none font-sans font-medium z-10">
                  Click to Edit ✎
                </span>
              )}

              {/* Section heading */}
              <div style={{ textAlign: section.headingAlign ?? 'left' }}>
                <h2
                  className="section-title"
                  style={{
                    fontSize: `${headingFontSize}pt`,
                    fontWeight: headingWeight,
                    color: headingColor,
                    textTransform: headingTransform,
                    textDecoration: headingUnderline,
                    letterSpacing: '0.08em',
                    lineHeight: 1.2,
                    marginTop: 0,
                    marginBottom: '1pt',
                  }}
                >
                  {section.title}
                </h2>
                {section.showDividerAfterHeading && (
                  <hr
                    className="section-heading-divider"
                    style={{
                      border: 'none',
                      borderTopWidth: `${section.headingDividerThickness ?? 1}px`,
                      borderTopStyle: section.headingDividerStyle ?? 'solid',
                      borderTopColor: section.headingDividerColor ?? `${headingColor}44`,
                      marginTop: `${section.headingDividerMarginTop ?? 1}px`,
                      marginBottom: `${section.headingDividerMarginBottom ?? 2}px`,
                    }}
                  />
                )}
              </div>

              {/* Section links */}
              {section.links?.length > 0 && (
                <div className="links-bar">
                  {section.links.map((link) => {
                    const url = link.url?.startsWith('http://') || link.url?.startsWith('https://') || link.url?.startsWith('mailto:')
                      ? link.url
                      : `https://${link.url}`;
                    return (
                      <a
                        key={link.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label || link.url}
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Structured or Tiptap content */}
              <div
                className="section-content"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html:
                    section.items && section.items.length > 0
                      ? renderStructuredSectionHtml(section, settings)
                      : renderTiptapJson(section.content),
                }}
              />

              {/* Divider after section */}
              {section.dividerAfter && (
                <hr
                  className="section-divider-line"
                  style={{
                    border: 'none',
                    borderTopWidth: `${section.dividerAfter.thickness ?? 1}px`,
                    borderTopStyle: section.dividerAfter.style ?? 'solid',
                    borderTopColor: section.dividerAfter.color ?? '#e5e7eb',
                    marginTop: `${section.dividerAfter.marginTop ?? 2}px`,
                    marginBottom: `${section.dividerAfter.marginBottom ?? 2}px`,
                  }}
                />
              )}
            </div>
          );
        };

        if (layoutStyle === 'two-column-left' || layoutStyle === 'two-column-right' || layoutStyle === 'two-column-equal') {
          const isSidebarLeft = layoutStyle !== 'two-column-right';
          const isEqualSplit = layoutStyle === 'two-column-equal';

          // Width styles for clean, non-cramped reading
          const leftWidthClass = isEqualSplit ? 'w-1/2' : (isSidebarLeft ? 'w-[38%]' : 'w-[62%]');
          const rightWidthClass = isEqualSplit ? 'w-1/2' : (isSidebarLeft ? 'w-[62%]' : 'w-[38%]');

          const getSectionWeight = (sec) => {
            let weight = 35;
            if (sec.items && Array.isArray(sec.items)) {
              sec.items.forEach((it) => {
                weight += 20;
                if (it.summary) weight += 24;
                if (Array.isArray(it.tech_stack) && it.tech_stack.length > 0) weight += 18;
                if (Array.isArray(it.points)) weight += it.points.length * 28;
                if (Array.isArray(it.skills)) weight += Math.ceil(it.skills.length / 4) * 20;
              });
            } else if (sec.content) {
              weight += 60;
            }
            return weight;
          };

          const colA = [];
          const colB = [];
          let weightA = 0;
          let weightB = 0;

          const sidebarKeywords = ['skill', 'competenc', 'education', 'certif', 'summary', 'language', 'contact', 'award', 'interest', 'course'];

          if (isEqualSplit) {
            visibleSections.forEach((sec) => {
              const w = getSectionWeight(sec);
              if (weightA <= weightB) {
                colA.push(sec);
                weightA += w;
              } else {
                colB.push(sec);
                weightB += w;
              }
            });
          } else {
            const sideCandidate = [];
            const mainCandidate = [];

            visibleSections.forEach((sec) => {
              const titleLower = (sec.title || '').toLowerCase();
              const isSidebar = sidebarKeywords.some((k) => titleLower.includes(k));
              if (isSidebar) {
                sideCandidate.push(sec);
              } else {
                mainCandidate.push(sec);
              }
            });

            const totalWeight = visibleSections.reduce((acc, s) => acc + getSectionWeight(s), 0);
            const targetSideWeight = totalWeight * 0.40;

            let currentSideWeight = 0;
            sideCandidate.forEach((sec) => {
              const w = getSectionWeight(sec);
              if (currentSideWeight + w <= targetSideWeight || colA.length === 0) {
                colA.push(sec);
                currentSideWeight += w;
              } else {
                colB.push(sec);
              }
            });

            mainCandidate.forEach((sec) => {
              colB.push(sec);
            });

            if (colA.length === 0 && colB.length > 1) {
              colA.push(...colB.splice(0, Math.ceil(colB.length / 2)));
            } else if (colB.length === 0 && colA.length > 1) {
              colB.push(...colA.splice(Math.ceil(colA.length / 2)));
            }
          }

          const leftSections = isSidebarLeft ? colA : colB;
          const rightSections = isSidebarLeft ? colB : colA;

          return (
            <div className="flex gap-4 items-start w-full mt-1">
              <div className={`${leftWidthClass} flex flex-col shrink-0 pr-3 border-r border-zinc-200/80`}>
                {leftSections.map(renderSectionNode)}
              </div>
              <div className={`${rightWidthClass} flex flex-col flex-1 pl-1`}>
                {rightSections.map(renderSectionNode)}
              </div>
            </div>
          );
        }

        return visibleSections.map(renderSectionNode);
      })()}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full h-full min-h-0 overflow-hidden">
      {/* ── 1. Top Accuracy & Page Count Live Metric Bar ────────────────────── */}
      <div className="w-full max-w-[794px] mb-3 px-3 py-2 rounded-xl bg-[#0c0e18] border border-white/10 flex items-center justify-between text-xs flex-wrap gap-2 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          {isOverOnePage ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-mono font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>2 Pages ({overflowPx}px into Page 2)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exact 1 Page ({remainingPx}px headroom)</span>
            </span>
          )}
          <span className="text-zinc-500 font-mono text-[11px] hidden sm:inline">
            Print capacity: {Math.round(measuredTotalHeight)}px / {Math.round(A4_PX_HEIGHT)}px
          </span>
        </div>

        {isOverOnePage && (
          <button
            type="button"
            onClick={handleAutoFitOnePage}
            className="flex items-center gap-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 font-semibold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
            title="Automatically compress section gaps and font size slightly to fit cleanly on 1 page"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Fit to 1 Page</span>
          </button>
        )}
      </div>

      {/* Web fonts for professional resume typography */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&family=Lato:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap"
      />

      {/* Scoped CSS rules matching exact Playwright PDF export styles */}
      <style>{`
        ${buildResumeCss(settings, header)}

        /* Interactive Canvas Canva-like Selection Overlays (0 padding impact) */
        .resume-preview-interactive .resume-header {
          cursor: pointer;
          transition: outline 0.12s ease;
        }
        .resume-preview-interactive .resume-header:hover {
          outline: 1.5px dashed rgba(59, 130, 246, 0.6) !important;
          outline-offset: 2px !important;
        }
        .resume-preview-interactive .section-container {
          cursor: pointer;
          transition: all 0.15s ease;
          border-radius: 3px;
        }
        .resume-preview-interactive .section-container:hover {
          outline: 1.5px solid rgba(212, 154, 106, 0.45) !important;
          outline-offset: 2px !important;
          background-color: rgba(212, 154, 106, 0.02) !important;
        }
        .resume-preview-interactive .section-container.active-section {
          outline: 2px solid #D49A6A !important;
          outline-offset: 3px !important;
          background-color: rgba(212, 154, 106, 0.04) !important;
        }
        .resume-preview-interactive .resume-header {
          cursor: pointer;
          transition: all 0.15s ease;
          border-radius: 3px;
        }
        .resume-preview-interactive .resume-header:hover {
          outline: 1.5px solid rgba(212, 154, 106, 0.45) !important;
          outline-offset: 2px !important;
          background-color: rgba(212, 154, 106, 0.02) !important;
        }
        .resume-preview-interactive .resume-header.active-section {
          outline: 2px solid #D49A6A !important;
          outline-offset: 3px !important;
          background-color: rgba(212, 154, 106, 0.04) !important;
        }
      `}</style>

      {/* ── 2. Offscreen Unscaled Measurement Sandbox (Zoom & Transform Proof) ─ */}
      <div
        ref={measureSandboxRef}
        aria-hidden="true"
        className="pdf-page-container"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: `${A4_PX_WIDTH}px`,
          minWidth: `${A4_PX_WIDTH}px`,
          maxWidth: `${A4_PX_WIDTH}px`,
          visibility: 'hidden',
          pointerEvents: 'none',
          transform: 'none',
          boxSizing: 'border-box',
          padding: `${settings?.marginTop ?? 15}mm ${settings?.marginRight ?? 15}mm ${settings?.marginBottom ?? 15}mm ${settings?.marginLeft ?? 15}mm`,
          fontFamily: settings?.bodyFont || 'Georgia, serif',
          fontSize: `${settings?.bodyFontSize || 8.5}pt`,
          lineHeight: settings?.lineHeight || 1.2,
          color: '#111111',
          background: '#ffffff',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
        dangerouslySetInnerHTML={{
          __html: renderResumeInnerHtml({ header, sections, settings }),
        }}
      />

      {/* ── 3. Visual Responsive Workspace Canvas ────────────────────────────── */}
      <div
        onClick={() => {
          if (activeSectionId) {
            setActiveSectionId(null);
            if (onSelectSection) onSelectSection(null);
          }
        }}
        className="flex flex-col items-center overflow-y-auto w-full flex-1 bg-[#0d0f18] py-6 px-4 cursor-default min-h-0"
      >
        {/* Width-measuring container */}
        <div ref={containerRef} className="w-full flex justify-center">
          {/* Scaled A4 wrapper */}
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: `${A4_PX_WIDTH}px`,
              marginBottom: `${
                (scale - 1) *
                (isOverOnePage ? A4_PX_HEIGHT * 2 + 56 : A4_PX_HEIGHT)
              }px`,
            }}
          >
            {/* ── SHEET 1: A4 PAGE 1 ─────────────────────────────────── */}
            <div
              style={{
                width: `${A4_PX_WIDTH}px`,
                height: `${A4_PX_HEIGHT}px`,
                padding: `${settings?.marginTop ?? 15}mm ${settings?.marginRight ?? 15}mm ${settings?.marginBottom ?? 15}mm ${settings?.marginLeft ?? 15}mm`,
                boxSizing: 'border-box',
                background: '#ffffff',
                overflow: 'hidden',
                position: 'relative',
              }}
              className="pdf-page-container shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 mx-auto rounded-[2px]"
            >
              {/* Page Indicator Tag */}
              <div className="absolute right-4 top-2 text-[10px] font-mono text-zinc-400 select-none pointer-events-none uppercase tracking-wider">
                Page 1 {isOverOnePage ? 'of 2' : 'of 1'} (A4)
              </div>

              {/* Rendered content */}
              <div>
                {renderInteractiveResumeContent()}
              </div>
            </div>

            {/* ── SHEET 2: A4 PAGE 2 (ONLY RENDERED IF OVERFLOW EXISTS) ─ */}
            {isOverOnePage && (
              <>
                {/* Visual Page Break Separator Gap */}
                <div className="my-6 flex items-center justify-center gap-3 w-[794px]">
                  <div className="h-px bg-zinc-400 flex-1 border-b border-dashed border-zinc-500" />
                  <span className="bg-[#121520] text-zinc-200 border border-white/15 text-[11px] font-mono font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-accent" />
                    <span>Page Break (297mm A4 Boundary)</span>
                  </span>
                  <div className="h-px bg-zinc-400 flex-1 border-b border-dashed border-zinc-500" />
                </div>

                <div
                  style={{
                    width: `${A4_PX_WIDTH}px`,
                    height: `${A4_PX_HEIGHT}px`,
                    padding: `${settings?.marginTop ?? 15}mm ${settings?.marginRight ?? 15}mm ${settings?.marginBottom ?? 15}mm ${settings?.marginLeft ?? 15}mm`,
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                  className="pdf-page-container shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 mx-auto rounded-[2px] animate-in fade-in duration-200"
                >
                  {/* Page Indicator Tag */}
                  <div className="absolute right-4 top-2 text-[10px] font-mono text-zinc-400 select-none pointer-events-none uppercase tracking-wider">
                    Page 2 of 2 (A4)
                  </div>

                  {/* Offset container showing content that overflowed Page 1 */}
                  <div style={{ marginTop: `-${A4_PX_HEIGHT}px` }}>
                    {renderInteractiveResumeContent()}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
