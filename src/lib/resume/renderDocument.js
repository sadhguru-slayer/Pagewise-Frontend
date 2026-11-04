import { renderTiptapJson } from './renderTiptap.js';
import { renderStructuredSectionHtml } from './sectionSchemas.js';

// Exact A4 Dimensions at standard 96 DPI: 210mm x 297mm
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MM_TO_PX = 96 / 25.4; // 3.779527559055118
export const A4_PX_WIDTH = Number((A4_WIDTH_MM * MM_TO_PX).toFixed(2)); // 793.70
export const A4_PX_HEIGHT = Number((A4_HEIGHT_MM * MM_TO_PX).toFixed(2)); // 1122.52

/**
 * Standardize and normalize font-family strings to ensure matching rendering
 * between browser canvas and WeasyPrint / server export engines.
 */
export function normalizeFontFamily(font) {
  if (!font) return "'Lora', Georgia, 'Liberation Serif', serif";
  const f = font.toLowerCase();
  if (f.includes('georgia')) return "'Lora', Georgia, 'Liberation Serif', serif";
  if (f.includes('garamond')) return "'EB Garamond', Garamond, 'Liberation Serif', serif";
  if (f.includes('times')) return "'Tinos', 'Times New Roman', 'Liberation Serif', serif";
  if (f.includes('merriweather')) return "'Merriweather', Georgia, serif";
  if (f.includes('inter')) return "'Inter', -apple-system, sans-serif";
  if (f.includes('roboto')) return "'Roboto', sans-serif";
  if (f.includes('lato')) return "'Lato', sans-serif";
  if (f.includes('arial') || f.includes('helvetica')) return "'Arimo', Arial, Helvetica, sans-serif";
  if (f.includes('calibri')) return "'Carlito', 'Lato', Calibri, sans-serif";
  if (f.includes('trebuchet')) return "'Trebuchet MS', 'Inter', sans-serif";
  return font;
}

/**
 * Helper to normalize URLs for deduplication.
 */
export function normalizeUrl(url) {
  if (!url) return '';
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

/**
 * Check if a section is dedicated to portfolio/profile links.
 */
export function isPortfolioSection(sec) {
  if (!sec) return false;
  const title = (sec.title || '').trim().toLowerCase();
  return /^(portfolio|links|portfolio links|websites|profiles|social links|online presence)$/i.test(title);
}

/**
 * Format contact line with proper hyperlinking for email, phone, websites, GitHub, LinkedIn.
 * Deduplicates any repeating URLs and reconciles portfolio links against sections:
 * - If there are <= 3 portfolio links, they belong in the header contact line (not as a redundant section).
 * - If there are >= 4 portfolio links, they are kept in the dedicated section and omitted from the header.
 */
export function getContactLineHtml(header, sections = []) {
  if (!header) return '';

  // Check if a dedicated portfolio section exists in sections
  const portfolioSec = Array.isArray(sections) ? sections.find(isPortfolioSection) : null;
  const secLinks = portfolioSec?.links || [];
  const hasDedicatedPortfolioSection = Boolean(portfolioSec && secLinks.length >= 4);

  // If a portfolio section has >= 4 links, collect normalized URLs to exclude from header
  const excludedSectionUrls = new Set();
  if (hasDedicatedPortfolioSection) {
    for (const l of secLinks) {
      if (l?.url) excludedSectionUrls.add(normalizeUrl(l.url));
    }
  }

  const seenKeys = new Set();
  const parts = [];

  const addPart = (html, rawKey) => {
    if (!html || !html.trim()) return;
    const cleanKey = normalizeUrl(rawKey || html);
    if (cleanKey && seenKeys.has(cleanKey)) return;
    if (cleanKey && hasDedicatedPortfolioSection && excludedSectionUrls.has(cleanKey)) return;
    if (cleanKey) seenKeys.add(cleanKey);
    parts.push(html.trim());
  };

  // If contactLine is already provided (e.g., from DB or AI parser), clean and deduplicate it
  if (header.contactLine && typeof header.contactLine === 'string' && header.contactLine.trim()) {
    const rawParts = header.contactLine.split(/\s*[·•|]\s*/);
    for (const rawPart of rawParts) {
      if (!rawPart || !rawPart.trim()) continue;
      const match = rawPart.match(/href=["']([^"']+)["']/i);
      if (match) {
        addPart(rawPart, match[1]);
      } else if (rawPart.includes('@')) {
        addPart(`<a href="mailto:${rawPart}" target="_blank" rel="noopener noreferrer">${rawPart}</a>`, rawPart);
      } else {
        addPart(rawPart, rawPart.toLowerCase());
      }
    }
    return parts.join(' · ');
  }

  // Otherwise, construct from structured fields
  if (header.location) {
    addPart(header.location, header.location.toLowerCase());
  }

  if (header.email) {
    const email = header.email.trim();
    addPart(`<a href="mailto:${email}" target="_blank" rel="noopener noreferrer">${email}</a>`, email);
  }

  if (header.phone) {
    addPart(header.phone, header.phone);
  }

  // Portfolio / Website link
  if (header.website) {
    const url = header.website.startsWith('http') ? header.website : 'https://' + header.website;
    addPart(`<a href="${url}" target="_blank" rel="noopener noreferrer">Portfolio</a>`, url);
  }

  // LinkedIn
  if (header.linkedin) {
    const li = header.linkedin.startsWith('http') ? header.linkedin : 'https://linkedin.com/in/' + header.linkedin.replace(/^linkedin\.com\/in\//i, '');
    addPart(`<a href="${li}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`, li);
  }

  // GitHub
  if (header.github) {
    const gh = header.github.startsWith('http') ? header.github : 'https://github.com/' + header.github.replace(/^github\.com\//i, '');
    addPart(`<a href="${gh}" target="_blank" rel="noopener noreferrer">GitHub</a>`, gh);
  }

  // Custom Links
  if (Array.isArray(header.customLinks)) {
    for (const link of header.customLinks) {
      if (link?.url) {
        const url = link.url.startsWith('http') || link.url.startsWith('mailto:') ? link.url : 'https://' + link.url;
        const label = link.label || link.url;
        addPart(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`, url);
      }
    }
  }

  // If a portfolio section has <= 3 links and isn't a dedicated section, fold them cleanly into header
  if (portfolioSec && !hasDedicatedPortfolioSection && Array.isArray(secLinks)) {
    for (const link of secLinks) {
      if (link?.url) {
        const url = link.url.startsWith('http') || link.url.startsWith('mailto:') ? link.url : 'https://' + link.url;
        const label = link.label || link.url;
        addPart(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`, url);
      }
    }
  }

  return parts.join(' · ');
}

/**
 * Scoped CSS rules strictly limited to .pdf-page-container.
 * NEVER affects html, body, or the outer application DOM.
 */
export function buildResumeScopedCss(settings = {}, header = {}) {
  const bodyFont = normalizeFontFamily(settings.bodyFont || 'Georgia, serif');
  const nameFont = normalizeFontFamily(header.nameFont || settings.bodyFont || 'Georgia, serif');
  const bodyFontSize = settings.bodyFontSize || 8.5;
  const lineHeight = settings.lineHeight || 1.2;
  const sectionSpacing = settings.sectionSpacing ?? 1;
  const accentColor = settings.accentColor || '#1a56db';
  const marginTop = settings.marginTop ?? 15;
  const marginRight = settings.marginRight ?? 15;
  const marginBottom = settings.marginBottom ?? 15;
  const marginLeft = settings.marginLeft ?? 15;

  return `
    .pdf-page-container {
      width: 210mm;
      box-sizing: border-box;
      padding: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
      background: #ffffff;
      font-family: ${bodyFont};
      font-size: ${bodyFontSize}pt;
      line-height: ${lineHeight};
      color: #111111;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      text-rendering: geometricPrecision;
      -webkit-font-smoothing: antialiased;
    }
    .pdf-page-container * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .pdf-page-container .resume-header {
      margin-bottom: 4pt;
    }
    .pdf-page-container .header-name {
      font-family: ${nameFont};
      font-size: ${header.nameFontSize || 22}pt;
      font-weight: ${header.nameFontWeight || 'bold'};
      letter-spacing: 0.05em;
      text-transform: uppercase;
      line-height: 1.1;
      margin: 0;
      color: #111111;
    }
    .pdf-page-container .header-contact-text,
    .pdf-page-container .header-contact-line {
      font-size: ${header.contactFontSize || 9.5}pt;
      color: ${header.contactColor || '#4b5563'};
      margin-top: 2pt;
      margin-bottom: 0;
      line-height: 1.2;
    }
    .pdf-page-container .header-contact-text a,
    .pdf-page-container .header-contact-line a {
      color: inherit;
      text-decoration: underline;
    }
    .pdf-page-container .header-divider-line {
      border: none;
      border-top: ${header.divider?.thickness || 1}px ${header.divider?.style || 'solid'} ${header.divider?.color || '#d1d5db'};
      margin-top: ${header.divider?.marginTop ?? 5}px;
      margin-bottom: ${header.divider?.marginBottom ?? 5}px;
    }
    .pdf-page-container .section-container {
      margin-bottom: ${sectionSpacing}pt;
      padding: 0;
      break-inside: auto !important;
      page-break-inside: auto !important;
    }
    .pdf-page-container .section-container:last-child {
      margin-bottom: 0 !important;
    }
    .pdf-page-container .section-title {
      font-size: ${(bodyFontSize * 1.18).toFixed(1)}pt;
      letter-spacing: 0.08em;
      line-height: 1.2;
      margin-top: 0;
      margin-bottom: 1pt;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .pdf-page-container .section-heading-divider {
      border: none;
      margin-top: 1px;
      margin-bottom: 2px;
    }
    .pdf-page-container .section-content {
      color: #1f2937;
      line-height: inherit;
    }
    .pdf-page-container .section-content > *:last-child,
    .pdf-page-container .section-content p:last-child,
    .pdf-page-container .section-content ul:last-child,
    .pdf-page-container .section-content ol:last-child {
      margin-bottom: 0 !important;
    }
    .pdf-page-container .section-content p {
      margin-bottom: 2pt;
      line-height: inherit;
    }
    .pdf-page-container .section-content h1,
    .pdf-page-container .section-content h2,
    .pdf-page-container .section-content h3,
    .pdf-page-container .section-content h4 {
      font-weight: 700;
      color: #111827;
      margin-top: 2pt;
      margin-bottom: 1.5pt;
      line-height: 1.2;
    }
    .pdf-page-container .section-content h1 { font-size: 1.3em; }
    .pdf-page-container .section-content h2 { font-size: 1.15em; }
    .pdf-page-container .section-content h3 { font-size: 1.05em; }
    .pdf-page-container .section-content h4 { font-size: 0.95em; }
    .pdf-page-container .section-content ul {
      list-style-type: disc !important;
      padding-left: 14pt !important;
      margin-top: 1pt !important;
      margin-bottom: 2pt !important;
    }
    .pdf-page-container .section-content ol {
      list-style-type: decimal !important;
      padding-left: 14pt !important;
      margin-top: 1pt !important;
      margin-bottom: 2pt !important;
    }
    .pdf-page-container .section-content li {
      display: list-item !important;
      list-style: inherit !important;
      margin-bottom: 1pt !important;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .pdf-page-container .section-content li p {
      display: inline !important;
      margin-bottom: 0 !important;
    }
    .pdf-page-container .section-content strong,
    .pdf-page-container .section-content b {
      font-weight: 700 !important;
      color: #111827 !important;
    }
    .pdf-page-container .section-content em,
    .pdf-page-container .section-content i {
      font-style: italic !important;
    }
    .pdf-page-container .section-content u {
      text-decoration: underline !important;
    }
    .pdf-page-container .section-content s {
      text-decoration: line-through !important;
    }
    .pdf-page-container .section-content a {
      color: ${accentColor} !important;
      text-decoration: underline !important;
    }
    .pdf-page-container .links-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8pt;
      margin-bottom: 2pt;
    }
    .pdf-page-container .links-bar a {
      color: ${accentColor};
      font-size: ${Math.max(7, bodyFontSize - 0.5)}pt;
      text-decoration: underline;
      display: inline-block;
      margin-right: 8pt;
    }
    .pdf-page-container .section-divider-line {
      border: none;
      margin-top: 2px;
      margin-bottom: 2px;
    }
  `;
}

/**
 * Full CSS for standalone HTML document rendered by WeasyPrint in export worker.
 */
export function buildResumeStandalonePdfCss(settings = {}, header = {}) {
  const marginTop = settings.marginTop ?? 15;
  const marginRight = settings.marginRight ?? 15;
  const marginBottom = settings.marginBottom ?? 15;
  const marginLeft = settings.marginLeft ?? 15;

  return `
    @page {
      size: 210mm 297mm;
      margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
    }
    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    ${buildResumeScopedCss(settings, header)}
    .pdf-page-container {
      width: 100% !important;
      padding: 0 !important;
    }
  `;
}

/**
 * Alias to scoped CSS for preview use.
 */
export function buildResumeCss(settings = {}, header = {}) {
  return buildResumeScopedCss(settings, header);
}

/**
 * Helper to render an individual section block
 */
function renderSingleSectionHtml(section, settings, bodyFontSize, sectionSpacing) {
  const headingColor = section.headingColor || settings?.headingColor || '#111827';
  const headingWeight = section.headingBold !== false ? 'bold' : 'normal';
  const headingUnderline = section.headingUnderline ? 'underline' : 'none';
  const headingTransform = section.headingUppercase !== false ? 'uppercase' : 'none';
  const headingFontSize =
    section.headingFontSize != null
      ? section.headingFontSize
      : Number((bodyFontSize * 1.18).toFixed(1));

  const linksHtml =
    section.links && section.links.length > 0
      ? `<div class="links-bar">
          ${section.links
            .filter((l) => l.url)
            .map((l) => {
              const url =
                l.url.startsWith('http://') ||
                l.url.startsWith('https://') ||
                l.url.startsWith('mailto:')
                  ? l.url
                  : `https://${l.url}`;
              return `<a href="${url}" target="_blank" rel="noopener noreferrer">${l.label || l.url}</a>`;
            })
            .join('')}
        </div>`
      : '';

  const contentHtml =
    section.items && section.items.length > 0
      ? renderStructuredSectionHtml(section, settings)
      : section.content
      ? `<div class="section-content">${renderTiptapJson(section.content)}</div>`
      : '';

  const headingDividerHtml = section.showDividerAfterHeading
    ? `<hr class="section-heading-divider" style="border: none; border-top-width: ${section.headingDividerThickness ?? 1}px; border-top-style: ${section.headingDividerStyle ?? 'solid'}; border-top-color: ${section.headingDividerColor || headingColor + '44'}; margin-top: ${section.headingDividerMarginTop ?? 1}px; margin-bottom: ${section.headingDividerMarginBottom ?? 2}px;" />`
    : '';

  const sectionDividerHtml = section.dividerAfter
    ? `<hr class="section-divider-line" style="border: none; border-top-width: ${section.dividerAfter.thickness ?? 1}px; border-top-style: ${section.dividerAfter.style ?? 'solid'}; border-top-color: ${section.dividerAfter.color ?? '#d1d5db'}; margin-top: ${section.dividerAfter.marginTop ?? 2}px; margin-bottom: ${section.dividerAfter.marginBottom ?? 2}px;" />`
    : '';

  return `
    <div class="section-container" data-section-id="${section.id}" style="margin-bottom: ${sectionSpacing}pt;">
      <div style="text-align: ${section.headingAlign || 'left'};">
        <h2 class="section-title" style="font-size: ${headingFontSize}pt; font-weight: ${headingWeight}; color: ${headingColor}; text-transform: ${headingTransform}; text-decoration: ${headingUnderline}; letter-spacing: 0.08em; line-height: 1.2; margin-top: 0; margin-bottom: 1pt;">${section.title || ''}</h2>
        ${headingDividerHtml}
      </div>
      ${linksHtml}
      ${contentHtml}
      ${sectionDividerHtml}
    </div>
  `;
}

/**
 * Render the inner HTML content of the resume (header + sections).
 * Automatically supports classic single-column, two-column-left, and two-column-right layouts.
 */
export function renderResumeInnerHtml({ header, sections, settings = {} }) {
  // If a portfolio section has <= 3 links, it is placed into the header and excluded here
  const visibleSections = [...(sections || [])]
    .filter((s) => {
      if (s.visible === false) return false;
      if (isPortfolioSection(s)) {
        const linkCount = s.links?.length || 0;
        if (linkCount > 0 && linkCount <= 3) return false;
      }
      return true;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const nameFont = normalizeFontFamily(header?.nameFont || settings?.bodyFont || 'Georgia, serif');
  const bodyFontSize = settings?.bodyFontSize || 8.5;
  const sectionSpacing = settings?.sectionSpacing ?? 1;

  const headerHtml = `
    <div class="resume-header" style="text-align: ${header?.alignment || 'center'}; margin-bottom: 6pt;">
      <h1 class="header-name" style="font-family: ${nameFont}; font-size: ${header?.nameFontSize || 22}pt; font-weight: ${header?.nameFontWeight || 'bold'}; letter-spacing: 0.05em; text-transform: uppercase; line-height: 1.1; margin: 0; color: #111;">${header?.name || 'YOUR NAME'}</h1>
      <div class="header-contact-line" style="font-size: ${header?.contactFontSize || 9.5}pt; color: ${header?.contactColor || '#4b5563'}; margin-top: 2.5pt; margin-bottom: 0; line-height: 1.2;">${getContactLineHtml(header, sections)}</div>
      ${
        header?.showDivider && header?.divider
          ? `<hr class="header-divider-line" style="border: none; border-top-width: ${header.divider.thickness || 1}px; border-top-style: ${header.divider.style || 'solid'}; border-top-color: ${header.divider.color || '#d1d5db'}; margin-top: ${header.divider.marginTop ?? 5}px; margin-bottom: ${header.divider.marginBottom ?? 5}px;" />`
          : ''
      }
    </div>
  `;

  const layoutStyle = settings.layoutStyle || 'single-column';

  // ── Two Column Balanced Layouts ──────────────────────────────────────────
  if (layoutStyle === 'two-column-left' || layoutStyle === 'two-column-right' || layoutStyle === 'two-column-equal') {
    const isSidebarLeft = layoutStyle !== 'two-column-right';
    const isEqualSplit = layoutStyle === 'two-column-equal';

    // Width ratios: 50/50 for equal split, or 40/60 for professional readable split
    const leftWidth = isEqualSplit ? '50%' : (isSidebarLeft ? '38%' : '62%');
    const rightWidth = isEqualSplit ? '50%' : (isSidebarLeft ? '62%' : '38%');

    // Intelligent Height Balancing:
    // Estimate vertical weight for each section so neither column is empty or bloated
    const getSectionWeight = (sec) => {
      let weight = 35; // base heading and margin weight
      if (sec.items && Array.isArray(sec.items)) {
        sec.items.forEach((it) => {
          weight += 20; // item title line
          if (it.summary) weight += 24;
          if (Array.isArray(it.tech_stack) && it.tech_stack.length > 0) weight += 18;
          if (Array.isArray(it.points)) {
            weight += it.points.length * 28; // ~28pt per bullet line
          }
          if (Array.isArray(it.skills)) {
            weight += Math.ceil(it.skills.length / 4) * 20;
          }
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

    // Categorize sections by preference
    const sidebarKeywords = ['skill', 'competenc', 'education', 'certif', 'summary', 'language', 'contact', 'award', 'interest', 'course'];

    if (isEqualSplit) {
      // For 50/50 equal layout: greedily balance weights across both columns
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
      // For sidebar split: sort into side rail vs main area, then balance if lopsided
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

      // Target ratio: sidebar takes ~38%, main takes ~62% of total weight
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

      // Add main candidate sections
      mainCandidate.forEach((sec) => {
        colB.push(sec);
      });

      // Fallback: If one column is completely empty, distribute evenly
      if (colA.length === 0 && colB.length > 1) {
        colA.push(...colB.splice(0, Math.ceil(colB.length / 2)));
      } else if (colB.length === 0 && colA.length > 1) {
        colB.push(...colA.splice(Math.ceil(colA.length / 2)));
      }
    }

    const colAHtml = colA
      .map((s) => renderSingleSectionHtml(s, settings, bodyFontSize, sectionSpacing))
      .join('');
    
    const colBHtml = colB
      .map((s) => renderSingleSectionHtml(s, settings, bodyFontSize, sectionSpacing))
      .join('');

    const leftColHtml = isSidebarLeft ? colAHtml : colBHtml;
    const rightColHtml = isSidebarLeft ? colBHtml : colAHtml;

    return `
      ${headerHtml}
      <table class="two-column-table" style="width: 100%; border-collapse: collapse; margin-top: 3pt; table-layout: fixed;">
        <tbody>
          <tr>
            <td class="col-left" style="width: ${leftWidth}; vertical-align: top; padding-right: 12pt; padding-left: 0; box-sizing: border-box; border-right: 1px solid #e2e8f0;">
              ${leftColHtml}
            </td>
            <td class="col-right" style="width: ${rightWidth}; vertical-align: top; padding-left: 12pt; padding-right: 0; box-sizing: border-box;">
              ${rightColHtml}
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // ── Standard Single Column Layout ────────────────────────────────────────
  const sectionsHtml = visibleSections
    .map((section) => renderSingleSectionHtml(section, settings, bodyFontSize, sectionSpacing))
    .join('');

  return `${headerHtml}${sectionsHtml}`;
}

/**
 * Generate full HTML document for WeasyPrint PDF export.
 */
export function generateResumeDocumentHtml({ header, sections, settings = {} }) {
  const css = buildResumeStandalonePdfCss(settings, header);
  const innerHtml = renderResumeInnerHtml({ header, sections, settings });
  const bodyFont = normalizeFontFamily(settings.bodyFont || 'Georgia, serif');
  const bodyFontSize = settings.bodyFontSize || 8.5;
  const lineHeight = settings.lineHeight || 1.2;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${header?.name || 'Resume'} - CV</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&family=Lato:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap">
  <style>
    ${css}
  </style>
</head>
<body>
  <div class="pdf-page-container" style="font-family: ${bodyFont}; font-size: ${bodyFontSize}pt; line-height: ${lineHeight}; color: #111111;">
    ${innerHtml}
  </div>
</body>
</html>`;
}
