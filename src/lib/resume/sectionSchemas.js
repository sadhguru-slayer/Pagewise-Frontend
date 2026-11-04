/**
 * Canonical Section Schemas & Dynamic Field Configurations for Resumo.
 *
 * Separates template-defined section requirements from user-entered resume data,
 * providing deterministic, ATS-friendly structure while maintaining full backward
 * compatibility with legacy rich text content.
 */

export const SECTION_TYPES = {
  EXPERIENCE: 'experience',
  EDUCATION: 'education',
  PROJECTS: 'projects',
  SKILLS: 'skills',
  CERTIFICATIONS: 'certifications',
  SUMMARY: 'summary',
  CUSTOM: 'custom',
};

export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  MONTH: 'month',
  DATE: 'date',
  CHECKBOX: 'checkbox',
  BULLET_LIST: 'bullet_list',
  TAGS: 'tags',
  URL: 'url',
  REPEATER: 'repeater',
  RICH_TEXT: 'rich_text',
};

/**
 * Canonical schema definitions for each structured section type.
 */
export const CANONICAL_SECTION_SCHEMAS = {
  [SECTION_TYPES.EXPERIENCE]: {
    type: SECTION_TYPES.EXPERIENCE,
    label: 'Work Experience',
    itemName: 'Position',
    itemPlural: 'Work Experience',
    isRepeatable: true,
    fields: [
      { key: 'title', label: 'Job Title', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. Senior Software Engineer', gridSpan: 6 },
      { key: 'company', label: 'Company / Organization', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. Google, Stripe', gridSpan: 6 },
      { key: 'location', label: 'Location', type: FIELD_TYPES.TEXT, required: false, placeholder: 'e.g. San Francisco, CA or Remote', gridSpan: 4 },
      { key: 'start_date', label: 'Start Date', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. 2022-03 or Mar 2022', gridSpan: 3 },
      { key: 'end_date', label: 'End Date', type: FIELD_TYPES.TEXT, required: false, placeholder: 'e.g. 2024-06 or Present', gridSpan: 3 },
      { key: 'current', label: 'Currently working here', type: FIELD_TYPES.CHECKBOX, required: false, gridSpan: 2 },
      { key: 'summary', label: 'Role Summary (Optional)', type: FIELD_TYPES.TEXTAREA, required: false, placeholder: 'High-level scope of responsibilities...', rows: 2, gridSpan: 12 },
      { key: 'points', label: 'Achievements & Responsibilities', type: FIELD_TYPES.BULLET_LIST, required: true, placeholder: 'Describe measurable impact or key accomplishment...', gridSpan: 12 },
      {
        key: 'links',
        label: 'Project or Company Links',
        type: FIELD_TYPES.REPEATER,
        required: false,
        gridSpan: 12,
        fields: [
          { key: 'label', label: 'Label', type: FIELD_TYPES.TEXT, placeholder: 'e.g. Live Demo, Case Study' },
          { key: 'url', label: 'URL', type: FIELD_TYPES.URL, placeholder: 'https://...' },
        ],
      },
    ],
  },

  [SECTION_TYPES.EDUCATION]: {
    type: SECTION_TYPES.EDUCATION,
    label: 'Education',
    itemName: 'Degree',
    itemPlural: 'Education',
    isRepeatable: true,
    fields: [
      { key: 'institution', label: 'School / University', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. Stanford University', gridSpan: 6 },
      { key: 'degree', label: 'Degree & Major', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. B.S. in Computer Science', gridSpan: 6 },
      { key: 'location', label: 'Location', type: FIELD_TYPES.TEXT, required: false, placeholder: 'e.g. Stanford, CA', gridSpan: 4 },
      { key: 'start_date', label: 'Start Year', type: FIELD_TYPES.TEXT, required: false, placeholder: 'e.g. 2018', gridSpan: 3 },
      { key: 'end_date', label: 'Graduation Year', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. 2022', gridSpan: 3 },
      { key: 'gpa', label: 'GPA / Honors (Optional)', type: FIELD_TYPES.TEXT, required: false, placeholder: 'e.g. 3.9 / 4.0 or Dean\'s List', gridSpan: 2 },
      { key: 'points', label: 'Relevant Coursework & Achievements', type: FIELD_TYPES.BULLET_LIST, required: false, placeholder: 'Relevant coursework, leadership, or honors...', gridSpan: 12 },
    ],
  },

  [SECTION_TYPES.PROJECTS]: {
    type: SECTION_TYPES.PROJECTS,
    label: 'Projects',
    itemName: 'Project',
    itemPlural: 'Projects',
    isRepeatable: true,
    fields: [
      { key: 'project_title', label: 'Project Name', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. Resumo AI Builder', gridSpan: 6 },
      { key: 'role', label: 'Role / Contribution', type: FIELD_TYPES.TEXT, required: false, placeholder: 'e.g. Creator & Full-Stack Lead', gridSpan: 6 },
      { key: 'tech_stack', label: 'Tech Stack', type: FIELD_TYPES.TAGS, required: false, placeholder: 'Type tech (e.g. Next.js, FastAPI, PostgreSQL) and press Enter', gridSpan: 12 },
      { key: 'summary', label: 'Brief Summary', type: FIELD_TYPES.TEXTAREA, required: false, placeholder: 'One-sentence overview of the application or system...', rows: 2, gridSpan: 12 },
      { key: 'points', label: 'Key Features & Impact', type: FIELD_TYPES.BULLET_LIST, required: true, placeholder: 'Architected distributed queue handling 50k req/s...', gridSpan: 12 },
      {
        key: 'links',
        label: 'Project Links',
        type: FIELD_TYPES.REPEATER,
        required: false,
        gridSpan: 12,
        fields: [
          { key: 'label', label: 'Label', type: FIELD_TYPES.TEXT, placeholder: 'e.g. GitHub, Live Demo' },
          { key: 'url', label: 'URL', type: FIELD_TYPES.URL, placeholder: 'https://...' },
        ],
      },
    ],
  },

  [SECTION_TYPES.SKILLS]: {
    type: SECTION_TYPES.SKILLS,
    label: 'Skills & Technologies',
    itemName: 'Skill Group',
    itemPlural: 'Skills',
    isRepeatable: true,
    fields: [
      { key: 'category', label: 'Skill Category', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. Languages, Frameworks, Cloud & DevOps', gridSpan: 4 },
      { key: 'skills', label: 'Skills List', type: FIELD_TYPES.TAGS, required: true, placeholder: 'Type skill name and press Enter (e.g. Python, Docker, React)', gridSpan: 8 },
    ],
  },

  [SECTION_TYPES.CERTIFICATIONS]: {
    type: SECTION_TYPES.CERTIFICATIONS,
    label: 'Certifications',
    itemName: 'Certification',
    itemPlural: 'Certifications',
    isRepeatable: true,
    fields: [
      { key: 'name', label: 'Certification Title', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. AWS Certified Solutions Architect', gridSpan: 6 },
      { key: 'issuer', label: 'Issuing Organization', type: FIELD_TYPES.TEXT, required: true, placeholder: 'e.g. Amazon Web Services', gridSpan: 6 },
      { key: 'date', label: 'Date Issued', type: FIELD_TYPES.TEXT, required: false, placeholder: 'e.g. 2024-02', gridSpan: 4 },
      { key: 'url', label: 'Credential URL', type: FIELD_TYPES.URL, required: false, placeholder: 'https://...', gridSpan: 8 },
    ],
  },

  [SECTION_TYPES.SUMMARY]: {
    type: SECTION_TYPES.SUMMARY,
    label: 'Professional Summary',
    itemName: 'Summary',
    isRepeatable: false,
    fields: [
      { key: 'content', label: 'Summary Text', type: FIELD_TYPES.RICH_TEXT, required: true, gridSpan: 12 },
    ],
  },

  [SECTION_TYPES.CUSTOM]: {
    type: SECTION_TYPES.CUSTOM,
    label: 'Custom Section',
    itemName: 'Content',
    isRepeatable: false,
    fields: [
      { key: 'content', label: 'Content', type: FIELD_TYPES.RICH_TEXT, required: true, gridSpan: 12 },
    ],
  },
};

/**
 * Infers the canonical section type from a section object.
 */
export function getSectionType(section) {
  if (!section) return SECTION_TYPES.CUSTOM;
  if (section.type && CANONICAL_SECTION_SCHEMAS[section.type]) {
    return section.type;
  }

  const id = (section.id || '').toLowerCase();
  const title = (section.title || '').toLowerCase();
  const combined = `${id} ${title}`;

  // Word boundary regex to avoid substring collisions (e.g. "Users" must NOT match "experience" or others)
  if (/\b(work|experience|employment|career|jobs?)\b/i.test(combined)) {
    return SECTION_TYPES.EXPERIENCE;
  }
  if (/\b(education|academic|degree|university|college|schools?)\b/i.test(combined)) {
    return SECTION_TYPES.EDUCATION;
  }
  if (/\b(projects?|portfolio|built)\b/i.test(combined)) {
    return SECTION_TYPES.PROJECTS;
  }
  if (/\b(skills?|technical|technolog(?:y|ies)|competenc(?:y|ies)|stacks?)\b/i.test(combined)) {
    return SECTION_TYPES.SKILLS;
  }
  if (/\b(certif(?:ications?|icates?)|licenses?|credentials?)\b/i.test(combined)) {
    return SECTION_TYPES.CERTIFICATIONS;
  }
  if (/\b(summary|objective|about(?:\s+me)?|profile|statement)\b/i.test(combined)) {
    return SECTION_TYPES.SUMMARY;
  }

  return SECTION_TYPES.CUSTOM;
}

/**
 * Returns true if the section uses structured form inputs rather than rich text.
 */
export function isStructuredSection(section) {
  const type = getSectionType(section);
  return (
    type === SECTION_TYPES.EXPERIENCE ||
    type === SECTION_TYPES.EDUCATION ||
    type === SECTION_TYPES.PROJECTS ||
    type === SECTION_TYPES.SKILLS ||
    type === SECTION_TYPES.CERTIFICATIONS
  );
}

/**
 * Generates an empty default item for a structured section.
 */
export function createDefaultSectionItem(sectionType) {
  const genId = () => 'item_' + Math.random().toString(36).substring(2, 9);

  switch (sectionType) {
    case SECTION_TYPES.EXPERIENCE:
      return {
        id: genId(),
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        current: false,
        summary: '',
        tech_stack: [],
        points: [''],
        links: [],
      };
    case SECTION_TYPES.EDUCATION:
      return {
        id: genId(),
        institution: '',
        degree: '',
        location: '',
        start_date: '',
        end_date: '',
        gpa: '',
        points: [],
      };
    case SECTION_TYPES.PROJECTS:
      return {
        id: genId(),
        project_title: '',
        role: '',
        tech_stack: [],
        summary: '',
        points: [''],
        links: [],
      };
    case SECTION_TYPES.SKILLS:
      return {
        id: genId(),
        category: 'Technical Skills',
        skills: [],
      };
    case SECTION_TYPES.CERTIFICATIONS:
      return {
        id: genId(),
        name: '',
        issuer: '',
        date: '',
        url: '',
      };
    default:
      return { id: genId() };
  }
}

/**
 * Converts a legacy TipTap JSON/HTML section into normalized structured items.
 * Guarantees zero data loss when transitioning from raw rich text to structured forms.
 */
export function convertLegacySectionToStructured(section) {
  const type = getSectionType(section);
  if (!isStructuredSection(section)) {
    return section;
  }

  // If already structured and has items, return as-is
  if (Array.isArray(section.items) && section.items.length > 0) {
    return { ...section, type };
  }

  // Extract raw text or html from section
  let html = '';
  if (typeof section.content === 'string') {
    html = section.content;
  } else if (section.contentHtml && typeof section.contentHtml === 'string') {
    html = section.contentHtml;
  }

  // Parse HTML blocks
  const items = [];
  const genId = () => 'item_' + Math.random().toString(36).substring(2, 9);

  if (typeof window !== 'undefined' && window.DOMParser && html.trim()) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      if (type === SECTION_TYPES.SKILLS) {
        // Look for paragraphs or lists with categories
        const paragraphs = Array.from(doc.body.querySelectorAll('p, li'));
        paragraphs.forEach((p) => {
          const text = p.textContent.trim();
          if (!text) return;
          if (text.includes(':')) {
            const parts = text.split(':');
            const category = parts[0].trim();
            const skills = parts[1]
              .split(/[,•|/]/)
              .map((s) => s.trim())
              .filter(Boolean);
            items.push({ id: genId(), category, skills });
          } else {
            const skills = text.split(/[,•|/]/).map((s) => s.trim()).filter(Boolean);
            if (skills.length > 0) {
              items.push({ id: genId(), category: 'Skills', skills });
            }
          }
        });
      } else {
        // Experience, Education, Projects
        // Group by headings or bold title lines followed by bullet lists
        const elements = Array.from(doc.body.children);
        let currentItem = null;

        elements.forEach((el) => {
          const tag = el.tagName.toLowerCase();
          const text = el.textContent.trim();
          if (!text) return;

          if (tag === 'ul' || tag === 'ol') {
            const points = Array.from(el.querySelectorAll('li'))
              .map((li) => li.textContent.trim())
              .filter(Boolean);

            if (currentItem) {
              currentItem.points = [...(currentItem.points || []), ...points];
            } else {
              // Create a default item to attach bullets to
              currentItem = createDefaultSectionItem(type);
              currentItem.points = points;
              items.push(currentItem);
            }
          } else {
            // Check for headline or role separator (e.g. Title | Company — Date)
            const isBoldOrHeader = tag.startsWith('h') || el.querySelector('strong, b');
            if (isBoldOrHeader || !currentItem) {
              currentItem = createDefaultSectionItem(type);
              items.push(currentItem);

              // Attempt smart extraction of Title | Company - Date
              const cleanText = text.replace(/\s+/g, ' ');
              const sepParts = cleanText.split(/[|—–-]/).map((s) => s.trim());

              if (type === SECTION_TYPES.EXPERIENCE) {
                if (sepParts.length >= 2) {
                  currentItem.title = sepParts[0];
                  currentItem.company = sepParts[1];
                  if (sepParts.length >= 3) {
                    currentItem.end_date = sepParts[2];
                  }
                } else {
                  currentItem.title = cleanText;
                }
              } else if (type === SECTION_TYPES.EDUCATION) {
                if (sepParts.length >= 2) {
                  currentItem.institution = sepParts[0];
                  currentItem.degree = sepParts[1];
                  if (sepParts.length >= 3) {
                    currentItem.end_date = sepParts[2];
                  }
                } else {
                  currentItem.institution = cleanText;
                }
              } else if (type === SECTION_TYPES.PROJECTS) {
                currentItem.project_title = sepParts[0] || cleanText;
                if (sepParts.length >= 2) {
                  currentItem.role = sepParts[1];
                }
              }
            } else if (currentItem) {
              // Descriptive summary line
              if (!currentItem.summary) {
                currentItem.summary = text;
              } else {
                currentItem.points = [...(currentItem.points || []), text];
              }
            }
          }
        });
      }
    } catch (e) {
      console.warn('[convertLegacySectionToStructured error]:', e);
    }
  }

  // Fallback to one default item if extraction produced nothing
  if (items.length === 0) {
    items.push(createDefaultSectionItem(type));
  }

  return {
    ...section,
    type,
    items,
  };
}

/**
 * Renders normalized structured items into clean, ATS-compliant HTML for preview and PDF export.
 */
export function renderStructuredSectionHtml(section, settings = {}) {
  const type = getSectionType(section);
  const items = section.items;
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  const accentColor = settings.accentColor || '#1a56db';
  const headingColor = settings.headingColor || '#111827';
  const bodyFontSize = settings.bodyFontSize || 8.5;

  let html = '';

  switch (type) {
    case SECTION_TYPES.EXPERIENCE: {
      html = items
        .map((item) => {
          if (!item.title && !item.company && (!item.points || item.points.length === 0)) {
            return '';
          }
          const dateRange = [
            item.start_date,
            item.current ? 'Present' : item.end_date,
          ].filter(Boolean).join(' – ');

          const headerRight = [item.location, dateRange].filter(Boolean).join(' | ');

          const linksHtml = Array.isArray(item.links) && item.links.length > 0
            ? `<span class="item-links" style="margin-left: 6px;">${item.links
                .filter((l) => l.url)
                .map((l) => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" style="color: ${accentColor}; text-decoration: underline; margin-right: 6px;">${l.label || l.url}</a>`)
                .join('')}</span>`
            : '';

          const bulletsHtml = Array.isArray(item.points) && item.points.length > 0
            ? `<ul style="margin: 2pt 0 4pt 0; padding-left: 14pt; list-style-type: disc;">
                ${item.points
                  .filter((p) => typeof p === 'string' && p.trim())
                  .map((p) => `<li style="margin-bottom: 1.5pt; line-height: 1.25;">${p}</li>`)
                  .join('')}
              </ul>`
            : '';

          const summaryHtml = item.summary && item.summary.trim()
            ? `<p style="margin: 1.5pt 0 2pt 0; line-height: 1.25;">${item.summary.trim()}</p>`
            : '';

          const techStackHtml = Array.isArray(item.tech_stack) && item.tech_stack.length > 0
            ? `<div style="font-size: ${bodyFontSize * 0.9}pt; color: #4b5563; margin-top: 1pt; margin-bottom: 2pt;"><strong>Tech Stack:</strong> ${item.tech_stack.join(', ')}</div>`
            : '';

          return `
            <div class="resume-item" style="margin-bottom: 5pt;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <div style="font-weight: 700; color: ${headingColor}; font-size: ${bodyFontSize * 1.05}pt;">
                  <span>${item.title || ''}</span>
                  ${item.company ? `<span style="font-weight: 500; color: #4b5563;"> | ${item.company}</span>` : ''}
                  ${linksHtml}
                </div>
                ${headerRight ? `<div style="font-size: ${bodyFontSize * 0.95}pt; color: #4b5563; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums;">${headerRight}</div>` : ''}
              </div>
              ${summaryHtml}
              ${techStackHtml}
              ${bulletsHtml}
            </div>
          `;
        })
        .join('');
      break;
    }

    case SECTION_TYPES.EDUCATION: {
      html = items
        .map((item) => {
          if (!item.institution && !item.degree) return '';
          const dateRange = [item.start_date, item.end_date].filter(Boolean).join(' – ');
          const headerRight = [item.location, dateRange].filter(Boolean).join(' | ');

          const gpaHtml = item.gpa
            ? `<span style="font-size: ${bodyFontSize * 0.92}pt; color: #4b5563; margin-left: 8px;">(GPA: ${item.gpa})</span>`
            : '';

          const bulletsHtml = Array.isArray(item.points) && item.points.length > 0
            ? `<ul style="margin: 2pt 0 4pt 0; padding-left: 14pt; list-style-type: disc;">
                ${item.points
                  .filter((p) => typeof p === 'string' && p.trim())
                  .map((p) => `<li style="margin-bottom: 1.5pt; line-height: 1.25;">${p}</li>`)
                  .join('')}
              </ul>`
            : '';

          return `
            <div class="resume-item" style="margin-bottom: 5pt;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <div style="font-weight: 700; color: ${headingColor}; font-size: ${bodyFontSize * 1.05}pt;">
                  <span>${item.institution || ''}</span>
                  ${gpaHtml}
                </div>
                ${headerRight ? `<div style="font-size: ${bodyFontSize * 0.95}pt; color: #4b5563; text-align: right; white-space: nowrap;">${headerRight}</div>` : ''}
              </div>
              <div style="font-style: italic; color: #374151; font-size: ${bodyFontSize}pt; margin-top: 1pt;">
                ${item.degree || ''}
              </div>
              ${bulletsHtml}
            </div>
          `;
        })
        .join('');
      break;
    }

    case SECTION_TYPES.PROJECTS: {
      html = items
        .map((item) => {
          if (!item.project_title && (!item.points || item.points.length === 0)) return '';

          const techStackHtml = Array.isArray(item.tech_stack) && item.tech_stack.length > 0
            ? `<div style="font-size: ${bodyFontSize * 0.9}pt; color: #4b5563; margin-top: 1.5pt; margin-bottom: 2pt;"><strong>Tech Stack:</strong> ${item.tech_stack.join(', ')}</div>`
            : '';

          const linksHtml = Array.isArray(item.links) && item.links.length > 0
            ? item.links
                .filter((l) => l.url)
                .map((l) => `<a href="${l.url}" target="_blank" rel="noopener noreferrer" style="color: ${accentColor}; text-decoration: underline; margin-left: 6px; font-size: ${bodyFontSize * 0.9}pt;">[${l.label || 'Link'}]</a>`)
                .join('')
            : '';

          const bulletsHtml = Array.isArray(item.points) && item.points.length > 0
            ? `<ul style="margin: 2pt 0 4pt 0; padding-left: 14pt; list-style-type: disc;">
                ${item.points
                  .filter((p) => typeof p === 'string' && p.trim())
                  .map((p) => `<li style="margin-bottom: 1.5pt; line-height: 1.25;">${p}</li>`)
                  .join('')}
              </ul>`
            : '';

          const summaryHtml = item.summary && item.summary.trim()
            ? `<p style="margin: 1.5pt 0 2pt 0; line-height: 1.25;">${item.summary.trim()}</p>`
            : '';

          return `
            <div class="resume-item" style="margin-bottom: 5pt;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <div style="font-weight: 700; color: ${headingColor}; font-size: ${bodyFontSize * 1.05}pt;">
                  <span>${item.project_title || ''}</span>
                  ${item.role ? `<span style="font-weight: 500; color: #4b5563;"> | ${item.role}</span>` : ''}
                </div>
                ${linksHtml ? `<div>${linksHtml}</div>` : ''}
              </div>
              ${techStackHtml}
              ${summaryHtml}
              ${bulletsHtml}
            </div>
          `;
        })
        .join('');
      break;
    }

    case SECTION_TYPES.SKILLS: {
      html = `
        <div class="skills-block" style="margin-bottom: 4pt; line-height: 1.35;">
          ${items
            .filter((item) => item.category || (Array.isArray(item.skills) && item.skills.length > 0))
            .map((item) => {
              const skillsList = Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '';
              return `
                <div style="margin-bottom: 2pt;">
                  <strong style="color: ${headingColor};">${item.category}:</strong>
                  <span style="color: #374151; margin-left: 4px;">${skillsList}</span>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
      break;
    }

    case SECTION_TYPES.CERTIFICATIONS: {
      html = items
        .map((item) => {
          if (!item.name) return '';
          const urlLink = item.url
            ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: ${accentColor}; text-decoration: underline; margin-left: 6px; font-size: ${bodyFontSize * 0.9}pt;">[Credential]</a>`
            : '';
          return `
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2.5pt; line-height: 1.25;">
              <div>
                <strong style="color: ${headingColor};">${item.name}</strong>
                ${item.issuer ? `<span style="color: #4b5563;"> — ${item.issuer}</span>` : ''}
                ${urlLink}
              </div>
              ${item.date ? `<div style="font-size: ${bodyFontSize * 0.92}pt; color: #4b5563;">${item.date}</div>` : ''}
            </div>
          `;
        })
        .join('');
      break;
    }

    default:
      html = '';
  }

  return `<div class="structured-section-content">${html}</div>`;
}
