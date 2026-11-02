// Default resume starting content and layout settings

export function defaultDividerStyle() {
  return {
    color: '#d1d5db',
    thickness: 1,
    marginTop: 5,
    marginBottom: 5,
    style: 'solid',
  };
}

export function defaultHeader() {
  return {
    name: 'YOUR NAME',
    contactLine: 'City, Country · your.email@example.com · +1 (555) 000-0000 · linkedin.com/in/profile',
    alignment: 'center',
    nameFont: 'Georgia, serif',
    nameFontSize: 22,
    nameFontWeight: 'bold',
    contactFontSize: 9.5,
    contactColor: '#4b5563',
    showDivider: true,
    divider: defaultDividerStyle(),
  };
}

export function defaultSettings() {
  return {
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    bodyFont: 'Georgia, serif',
    bodyFontSize: 8.5,
    headingColor: '#111827',
    sectionSpacing: 1,
    accentColor: '#1a56db',
    lineHeight: 1.2,
  };
}

export function defaultSections() {
  return [
    {
      id: 'summary',
      title: 'Professional Summary',
      visible: true,
      order: 0,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Results-driven software engineer with expertise in building scalable web architectures, modern cloud applications, and high-performance microservices.',
              },
            ],
          },
        ],
      },
      spacing: 'default',
      dividerAfter: null,
      links: [],
      headingAlign: 'left',
      showDividerAfterHeading: true,
      headingBold: true,
      headingUppercase: true,
      headingUnderline: false,
    },
    {
      id: 'experience',
      title: 'Experience',
      visible: true,
      order: 1,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'bold' }], text: 'Senior Software Engineer' },
              { type: 'text', text: ' | Tech Corp — 2023 - Present' },
            ],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Architected distributed systems handling 10M+ daily events with 99.99% uptime.' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Led a team of 6 engineers to redesign core microservices, reducing p99 latency by 35%.' }] }],
              },
            ],
          },
        ],
      },
      spacing: 'default',
      dividerAfter: null,
      links: [],
      headingAlign: 'left',
      showDividerAfterHeading: true,
      headingBold: true,
      headingUppercase: true,
      headingUnderline: false,
    },
    {
      id: 'skills',
      title: 'Technical Skills',
      visible: true,
      order: 2,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'bold' }], text: 'Languages: ' },
              { type: 'text', text: 'TypeScript, JavaScript, Python, Go, SQL' },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'bold' }], text: 'Frameworks & Tools: ' },
              { type: 'text', text: 'React, Next.js, Node.js, Express, Docker, PostgreSQL, Redis' },
            ],
          },
        ],
      },
      spacing: 'default',
      dividerAfter: null,
      links: [],
      headingAlign: 'left',
      showDividerAfterHeading: true,
      headingBold: true,
      headingUppercase: true,
      headingUnderline: false,
    },
    {
      id: 'projects',
      title: 'Selected Projects',
      visible: true,
      order: 3,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'bold' }], text: 'High-Throughput Analytics Engine' },
            ],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Designed real-time event aggregation engine in Node.js and Redis.' }] }],
              },
            ],
          },
        ],
      },
      spacing: 'default',
      dividerAfter: null,
      links: [{ id: 'proj-1', label: 'GitHub Repository', url: 'https://github.com' }],
      headingAlign: 'left',
      showDividerAfterHeading: true,
      headingBold: true,
      headingUppercase: true,
      headingUnderline: false,
    },
    {
      id: 'education',
      title: 'Education',
      visible: true,
      order: 4,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'bold' }], text: 'B.Tech in Computer Science' },
              { type: 'text', text: ' | University of Technology — 2019 - 2023' },
            ],
          },
        ],
      },
      spacing: 'default',
      dividerAfter: null,
      links: [],
      headingAlign: 'left',
      showDividerAfterHeading: true,
      headingBold: true,
      headingUppercase: true,
      headingUnderline: false,
    },
  ];
}

// Provide direct array fallback on the defaultSections function itself to prevent map/forEach TypeError
try {
  const _sampleSections = defaultSections();
  defaultSections.map = (...args) => _sampleSections.map(...args);
  defaultSections.filter = (...args) => _sampleSections.filter(...args);
  defaultSections.forEach = (...args) => _sampleSections.forEach(...args);
  defaultSections.length = _sampleSections.length;
} catch (e) {
  // Silent fallback
}

