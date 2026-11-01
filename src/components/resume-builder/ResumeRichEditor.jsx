'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Minus, Type, ChevronRight, SlidersHorizontal, RefreshCw, Sparkles, Check, Plus, ArrowDownToLine, Wand2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResumeStore } from '@/lib/resume/store';

const Icon = ({ d, size = 14 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  bold: 'M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6zM6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z',
  italic: 'M19 4h-9M14 20H5M15 4 9 20',
  underline: 'M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M4 21h16',
  strike: ['M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.1 2.4 3.1 3.1L12 12M3 12h18M6.7 19.1c2.3.6 4.4 1 6.2.9 2.7 0 5.3-.7 5.3-3.6 0-1.5-1.1-2.4-3.1-3.1'],
  alignLeft: 'M21 6H3M15 12H3M17 18H3',
  alignCenter: 'M21 6H3M17 12H7M19 18H5',
  alignRight: 'M21 6H3M21 12H9M21 18H11',
  alignJustify: 'M21 6H3M21 12H3M21 18H3',
  undo: 'M3 7v6h6M3 13C5.6 8.7 10 6 15 6c4.1 0 7.6 2.2 9.4 5.5',
  redo: 'M21 7v6h-6M21 13C18.4 8.7 14 6 9 6 4.9 6 1.4 8.2-.4 11.5',
  h1: 'M4 12h8M4 4v16M12 4v16M17 6.5v11M17 6.5c1.1 0 2.5.5 2.5 2.5s-1.4 2.5-2.5 2.5M17 11.5c1.4 0 3 .6 3 2.5S18.4 17 17 17',
  h2: 'M4 12h8M4 4v16M12 4v16M21 7c-.9 0-2 .6-2 2s1 1.9 2 2.5c1 .6 2 1.4 2 2.5 0 1.5-1.4 2-2 2h-2',
  h3: 'M4 12h8M4 4v16M12 4v16M20 7c-.9 0-2 .6-2 2s1 1.9 2 2.5M20 7h2M20 12c1 0 2 .5 2 2s-1 2-2 2h-2',
  paragraph: 'M13 4v16M17 4H9.5a4.5 4.5 0 0 0 0 9H13',
  bulletList: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  orderedList: 'M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10H6M3 14h2c.5 0 1 .4 1 1v1c0 .6-.4 1-1 1H3M3 19h3',
  hr: 'M5 12h14M3 5l4 7-4 7M21 5l-4 7 4 7',
  link: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  clearFormat: 'M4 7V4h16v3M9 20h6M12 4v16M5 4 19 20',
};

function ToolbarBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      disabled={disabled}
      title={title}
      className={[
        'px-2 py-1.5 rounded text-sm transition-colors',
        'hover:bg-white/10 text-zinc-400 hover:text-white',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        active ? 'bg-white/15 text-white' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-white/10 mx-1 self-center shrink-0" />;
}

function LinkPopover({ editor, open, onClose }) {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      const existing = editor.getAttributes('link').href || '';
      setUrl(existing);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, editor]);

  if (!open) return null;

  const handleSet = () => {
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target: '_blank' })
        .run();
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSet();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10 bg-[#0d0f18]">
      <span className="text-xs text-zinc-500 shrink-0">URL:</span>
      <input
        ref={inputRef}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://"
        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/25"
      />
      <button
        onMouseDown={(e) => { e.preventDefault(); handleSet(); }}
        className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors"
      >
        Set
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onClose(); }}
        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

const TEXT_COLORS = [
  '#ffffff', '#a1a1aa', '#f87171', '#fb923c', '#facc15',
  '#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#000000',
];

const HIGHLIGHT_COLORS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fecaca',
  '#fed7aa', '#ffffff', '#1e1b4b', '#052e16', '#450a0a',
];

function ColorPickerBtn({ colors, onSelect, title, current, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <ToolbarBtn title={title} onClick={() => setOpen((o) => !o)} active={open}>
        <div className="flex flex-col items-center gap-0.5">
          {children}
          <span
            className="h-0.5 w-3 rounded-full"
            style={{ backgroundColor: current || 'transparent' }}
          />
        </div>
      </ToolbarBtn>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1c2a] border border-white/10 rounded-lg p-2 shadow-2xl">
          <div className="grid grid-cols-5 gap-1">
            {colors.map((c) => (
              <button
                key={c}
                title={c}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(c);
                  setOpen(false);
                }}
                className="w-5 h-5 rounded border border-white/10 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(null);
              setOpen(false);
            }}
            className="mt-2 w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

function RichTextToolbar({ editor }) {
  const [linkOpen, setLinkOpen] = useState(false);

  if (!editor) return null;

  const currentColor = editor.getAttributes('textStyle').color || null;
  const currentHighlight = editor.getAttributes('highlight').color || null;

  return (
    <div className="border-b border-white/10">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        <ToolbarBtn
          title="Bold (Ctrl+B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Icon d={ICONS.bold} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic (Ctrl+I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Icon d={ICONS.italic} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline (Ctrl+U)"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Icon d={ICONS.underline} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Icon d={ICONS.strike} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          title="Align left"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <Icon d={ICONS.alignLeft} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Align center"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <Icon d={ICONS.alignCenter} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Align right"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <Icon d={ICONS.alignRight} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Justify"
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <Icon d={ICONS.alignJustify} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          title="Undo (Ctrl+Z)"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Icon d={ICONS.undo} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Redo (Ctrl+Shift+Z)"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Icon d={ICONS.redo} />
        </ToolbarBtn>
      </div>

      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-t border-white/5">
        <ToolbarBtn
          title="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <span className="text-xs font-bold">H1</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Paragraph"
          active={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <span className="text-xs">¶</span>
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Icon d={ICONS.bulletList} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Ordered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <Icon d={ICONS.orderedList} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Icon d={ICONS.hr} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          title="Link"
          active={editor.isActive('link') || linkOpen}
          onClick={() => setLinkOpen((o) => !o)}
        >
          <Icon d={ICONS.link} />
        </ToolbarBtn>

        <Divider />

        <ColorPickerBtn
          title="Text color"
          colors={TEXT_COLORS}
          current={currentColor}
          onSelect={(c) => {
            if (c) editor.chain().focus().setColor(c).run();
            else editor.chain().focus().unsetColor().run();
          }}
        >
          <span className="text-xs font-bold leading-none">A</span>
        </ColorPickerBtn>

        <ColorPickerBtn
          title="Highlight"
          colors={HIGHLIGHT_COLORS}
          current={currentHighlight}
          onSelect={(c) => {
            if (c) editor.chain().focus().setHighlight({ color: c }).run();
            else editor.chain().focus().unsetHighlight().run();
          }}
        >
          <span className="text-xs leading-none">▮</span>
        </ColorPickerBtn>

        <Divider />

        <ToolbarBtn
          title="Clear formatting"
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
        >
          <Icon d={ICONS.clearFormat} />
        </ToolbarBtn>
      </div>

      <LinkPopover
        editor={editor}
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
      />
    </div>
  );
}

export default function ResumeRichEditor({ sectionId: propSectionId, onCollapse }) {
  const sections = useResumeStore((s) => s.sections);
  const settings = useResumeStore((s) => s.settings);
  const storeActiveSectionId = useResumeStore((s) => s.activeSectionId);
  const setActiveSectionId = useResumeStore((s) => s.setActiveSectionId);
  const updateSectionContent = useResumeStore((s) => s.updateSectionContent);
  const updateSectionSettings = useResumeStore((s) => s.updateSectionSettings);
  const renameSection = useResumeStore((s) => s.renameSection);
  const updateSectionDivider = useResumeStore((s) => s.updateSectionDivider);
  const activeJdAnalysis = useResumeStore((s) => s.activeJdAnalysis);

  const resolvedSectionId = propSectionId || storeActiveSectionId || (sections[0]?.id);
  const section = sections.find((s) => s.id === resolvedSectionId);
  const initialContent = section?.content ?? section?.contentHtml ?? '';
  const isInternalUpdateRef = useRef(false);

  const [showJdEnhancePanel, setShowJdEnhancePanel] = useState(false);

  // Retrieve JD recommendations for the active section
  const currentSectionEnhancements = activeJdAnalysis?.section_enhancements?.find(
    (s) =>
      s.section_id === resolvedSectionId ||
      s.section_title?.toLowerCase().trim() === section?.title?.toLowerCase().trim()
  );
  const suggestions = currentSectionEnhancements?.suggestions || [];

  // Helper: Auto-apply a specific recommendation into section with pattern-matching
  const handleAutoApplySuggestion = (sug) => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const orig = (sug.original_text || '').trim();

    // 1. Direct exact HTML string replacement
    if (orig && currentHtml.includes(orig)) {
      const updatedHtml = currentHtml.replace(orig, sug.enhanced_html);
      editor.commands.setContent(updatedHtml);
      toast.success('Auto-applied: Matched and replaced in-place!');
      return;
    }

    // 2. DOM-based intelligent fuzzy matching
    if (typeof window !== 'undefined' && window.DOMParser) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(currentHtml, 'text/html');
        const origClean = orig.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

        if (origClean.length > 8) {
          // Find all candidates (li, p, heading tags)
          const elements = Array.from(doc.body.querySelectorAll('li, p, h1, h2, h3, h4, h5, h6'));
          let bestMatch = null;
          let bestScore = 0;

          for (const el of elements) {
            const elText = el.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
            if (!elText) continue;

            // Direct substring check
            if (elText.includes(origClean) || origClean.includes(elText)) {
              bestMatch = el;
              bestScore = 1.0;
              break;
            }

            // Word overlap check
            const origWords = origClean.split(/\s+/).filter((w) => w.length > 3);
            if (origWords.length > 0) {
              const matchedWords = origWords.filter((w) => elText.includes(w));
              const score = matchedWords.length / origWords.length;
              if (score > 0.4 && score > bestScore) {
                bestScore = score;
                bestMatch = el;
              }
            }
          }

          if (bestMatch && bestScore >= 0.4) {
            // Found node to replace!
            let enhancedClean = sug.enhanced_html.trim();
            const isLi = bestMatch.tagName.toLowerCase() === 'li';

            if (isLi) {
              // Strip outer <li> if present since bestMatch is already <li>
              const tempDoc = parser.parseFromString(enhancedClean, 'text/html');
              const innerLi = tempDoc.body.querySelector('li');
              bestMatch.innerHTML = innerLi ? innerLi.innerHTML : tempDoc.body.innerHTML;
            } else {
              const tempDoc = parser.parseFromString(enhancedClean, 'text/html');
              bestMatch.innerHTML = tempDoc.body.innerHTML;
            }

            editor.commands.setContent(doc.body.innerHTML);
            toast.success('Auto-applied: Targeted weak bullet and replaced in-place!');
            return;
          }
        }

        // 3. If no matching node found, integrate into existing list structure
        const lastUl = doc.body.querySelector('ul:last-of-type') || doc.body.querySelector('ul');
        if (lastUl) {
          const tempDoc = parser.parseFromString(sug.enhanced_html, 'text/html');
          const innerLi = tempDoc.body.querySelector('li');
          const newLi = doc.createElement('li');
          newLi.innerHTML = innerLi ? innerLi.innerHTML : tempDoc.body.innerHTML;
          lastUl.appendChild(newLi);
          editor.commands.setContent(doc.body.innerHTML);
          toast.success('Auto-applied: Integrated as a new bullet point in your list!');
          return;
        }
      } catch (err) {
        console.warn('DOMParser auto-apply fallback:', err);
      }
    }

    // 4. Default clean append at end
    editor.commands.focus('end');
    editor.commands.insertContent(sug.enhanced_html);
    toast.success('Auto-applied: Enhanced accomplishment added!');
  };

  // Helper: Apply recommendation at cursor
  const handleApplyAtCursor = (sug) => {
    if (!editor) return;
    editor.chain().focus().insertContent(sug.enhanced_html).run();
    toast.success('Inserted at cursor position');
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          HTMLAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'text-blue-400 underline hover:text-blue-300',
          },
        },
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      Color,
      Placeholder.configure({ placeholder: 'Start typing content, bullet points, or accomplishments for this section...' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[300px] p-5 text-zinc-200 leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      if (resolvedSectionId) {
        isInternalUpdateRef.current = true;
        updateSectionContent(resolvedSectionId, editor.getJSON());
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    const currentSec = sections.find((s) => s.id === resolvedSectionId);
    const newContent = currentSec?.content ?? currentSec?.contentHtml ?? '';
    editor.commands.setContent(newContent, false);
  }, [resolvedSectionId, section?.content, editor]);

  if (!section) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b0c13] text-zinc-500">
        <p className="text-sm">No section selected.</p>
        <p className="text-xs mt-1 text-zinc-600">Click any section in the resume preview or choose from the left menu to start editing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0f18] overflow-hidden min-h-0">
      <style>{`
        .tiptap-editor-wrap .tiptap ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.35rem 0 !important;
        }
        .tiptap-editor-wrap .tiptap ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.35rem 0 !important;
        }
        .tiptap-editor-wrap .tiptap li {
          display: list-item !important;
          list-style: inherit !important;
          margin-bottom: 0.2rem !important;
        }
        .tiptap-editor-wrap .tiptap li p {
          display: inline !important;
          margin: 0 !important;
        }
        .tiptap-editor-wrap .tiptap a {
          color: #60a5fa !important;
          text-decoration: underline !important;
          cursor: pointer;
        }
        .tiptap-editor-wrap .tiptap strong {
          font-weight: 700 !important;
          color: #ffffff !important;
        }
        .tiptap-editor-wrap .tiptap u {
          text-decoration: underline !important;
        }
        .tiptap-editor-wrap .tiptap em {
          font-style: italic !important;
        }
        .tiptap-editor-wrap .tiptap h1,
        .tiptap-editor-wrap .tiptap h2,
        .tiptap-editor-wrap .tiptap h3,
        .tiptap-editor-wrap .tiptap h4 {
          font-weight: 700 !important;
          color: #ffffff !important;
          margin: 0.5rem 0 0.25rem 0 !important;
        }
        .tiptap-editor-wrap .tiptap p {
          margin: 0.25rem 0 !important;
        }
      `}</style>

      {/* Editor Panel Header with Section Heading & Divider Controls */}
      <div className="px-3 py-2 bg-[#10121b] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Section Title Input */}
        <div className="flex items-center gap-1.5 min-w-[140px] flex-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 shrink-0">
            Section:
          </span>
          <input
            type="text"
            value={section.title || ''}
            onChange={(e) => renameSection(resolvedSectionId, e.target.value)}
            className="bg-zinc-800/60 hover:bg-zinc-800 focus:bg-zinc-900 border border-zinc-700/60 focus:border-blue-500 rounded px-2 py-0.5 text-xs font-bold text-white focus:outline-none transition-colors w-full max-w-[180px]"
            placeholder="Section Title"
            title="Edit Section Heading Name"
          />
        </div>

        {/* Center: Heading Style Quick Controls */}
        <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5 text-xs">
          {/* Heading Font Size */}
          <div className="flex items-center gap-0.5 px-1.5 py-0.5" title="Section Heading Font Size">
            <Type className="w-3 h-3 text-zinc-400 shrink-0" />
            <input
              type="number"
              min={7}
              max={28}
              step={0.5}
              value={section.headingFontSize ?? Number(((settings?.bodyFontSize ?? 8.5) * 1.18).toFixed(1))}
              onChange={(e) => updateSectionSettings(resolvedSectionId, { headingFontSize: Number(e.target.value) })}
              className="w-9 bg-transparent text-[11px] text-zinc-200 font-mono text-center focus:outline-none"
            />
            <span className="text-[9px] text-zinc-500 font-mono">pt</span>
          </div>

          <div className="w-px h-3.5 bg-zinc-800" />

          {/* Heading Bold */}
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingBold: section.headingBold === false })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              section.headingBold !== false ? 'bg-blue-600/30 text-blue-300 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
            title="Bold Section Heading"
          >
            <Bold className="w-3 h-3" />
          </button>

          {/* Heading Underline */}
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingUnderline: !section.headingUnderline })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              section.headingUnderline ? 'bg-blue-600/30 text-blue-300' : 'text-zinc-400 hover:text-white'
            }`}
            title="Underline Section Heading"
          >
            <UnderlineIcon className="w-3 h-3" />
          </button>

          <div className="w-px h-3.5 bg-zinc-800" />

          {/* Heading Alignment */}
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingAlign: 'left' })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              (section.headingAlign || 'left') === 'left' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Align Heading Left"
          >
            <AlignLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingAlign: 'center' })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              section.headingAlign === 'center' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Align Heading Center"
          >
            <AlignCenter className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { headingAlign: 'right' })}
            className={`p-1 rounded transition-colors cursor-pointer ${
              section.headingAlign === 'right' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            title="Align Heading Right"
          >
            <AlignRight className="w-3 h-3" />
          </button>

          <div className="w-px h-3.5 bg-zinc-800" />

          {/* Line below heading toggle */}
          <button
            type="button"
            onClick={() => updateSectionSettings(resolvedSectionId, { showDividerAfterHeading: !section.showDividerAfterHeading })}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              section.showDividerAfterHeading
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Toggle Horizontal Line Below Heading"
          >
            <Minus className="w-2.5 h-2.5" />
            <span>Title Line</span>
          </button>

          {/* Line after section toggle */}
          <button
            type="button"
            onClick={() => {
              if (section.dividerAfter) {
                updateSectionDivider(resolvedSectionId, null);
              } else {
                updateSectionDivider(resolvedSectionId, {
                  color: '#d1d5db',
                  thickness: 1,
                  marginTop: 2,
                  marginBottom: 2,
                  style: 'solid',
                });
              }
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              section.dividerAfter
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Toggle Horizontal Line After Entire Section"
          >
            <Minus className="w-2.5 h-2.5" />
            <span>Bottom Line</span>
          </button>
        </div>

        {/* Right: Collapse button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onCollapse && (
            <button
              onClick={onCollapse}
              title="Collapse Editor"
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <span>Collapse</span>
              <span>›</span>
            </button>
          )}
        </div>
      </div>

      {/* Formatting Toolbar */}
      <RichTextToolbar editor={editor} />

      {/* JD Enhance Active Recommendations Strip */}
      {suggestions.length > 0 && (
        <div className="bg-[#121520] border-b border-amber-500/25 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[#F1F3F9] font-medium text-[11px]">
              <strong className="text-amber-400">{suggestions.length}</strong> JD Enhance suggestion{suggestions.length > 1 ? 's' : ''} available
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowJdEnhancePanel(!showJdEnhancePanel)}
            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>{showJdEnhancePanel ? 'Hide Suggestions' : 'View Suggestions'}</span>
          </button>
        </div>
      )}

      {/* Expandable JD Enhance Panel with Auto Apply and Apply on Cursor */}
      {showJdEnhancePanel && suggestions.length > 0 && (
        <div className="bg-[#0C0E16] border-b border-amber-500/25 p-3.5 max-h-80 overflow-y-auto space-y-3 shrink-0">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              JD Enhance Recommendations
            </span>
            <span className="text-[10px] text-[#7E869B]">
              Role: {activeJdAnalysis?.job_analysis?.title || 'Target Job'}
            </span>
          </div>

          {suggestions.map((sug, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#111420] border border-white/[0.07] hover:border-amber-500/30 transition-all space-y-2.5"
            >
              {sug.original_text && (
                <div className="text-[11px] text-[#7E869B]">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500">
                    Replaces Target Point:
                  </span>
                  <p className="line-through text-zinc-400 mt-0.5 italic">
                    {sug.original_text}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-amber-400">
                  Enhanced Version (Google XYZ Standard):
                </span>
                <div
                  className="text-xs text-[#F1F3F9] mt-1 bg-black/40 p-2.5 rounded-lg border border-white/[0.05] leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: sug.enhanced_html }}
                />
              </div>

              {sug.reasoning && (
                <p className="text-[10px] text-[#7E869B] italic">
                  💡 {sug.reasoning}
                </p>
              )}

              {/* Action Buttons: Auto-apply vs Apply on Cursor */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => handleApplyAtCursor(sug)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                  title="Insert this bullet at your current cursor position"
                >
                  <ArrowDownToLine className="w-3 h-3 text-zinc-400" />
                  <span>Apply on Cursor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutoApplySuggestion(sug)}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-amber-600/20"
                  title="Target and replace the weak statement in-place without overwriting other content"
                >
                  <Check className="w-3 h-3" />
                  <span>Auto Apply</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable Rich Text Editing Canvas */}
      <div className="tiptap-editor-wrap flex-1 overflow-y-auto min-h-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
