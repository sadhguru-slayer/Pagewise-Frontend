/**
 * Converts a Tiptap JSON document node to an HTML string.
 * Supports: doc, paragraph, heading, bulletList, orderedList, listItem,
 * horizontalRule, hardBreak, and text nodes with marks (bold, italic,
 * underline, strike, textStyle, link).
 *
 * @param {object|null} node - Tiptap JSON node
 * @returns {string} HTML string
 */
export function renderTiptapJson(node) {
  if (!node) return '';

  // ── String input (already formatted HTML) ──────────────────────────────────
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node !== 'object') {
    return String(node);
  }

  // ── Text node ──────────────────────────────────────────────────────────────
  if (node.type === 'text') {
    let html = escapeHtml(node.text ?? '');

    const marks = node.marks ?? [];
    for (const mark of marks) {
      switch (mark.type) {
        case 'bold':
          html = `<strong>${html}</strong>`;
          break;
        case 'italic':
          html = `<em>${html}</em>`;
          break;
        case 'underline':
          html = `<u>${html}</u>`;
          break;
        case 'strike':
          html = `<s>${html}</s>`;
          break;
        case 'code':
          html = `<code>${html}</code>`;
          break;
        case 'link': {
          const href = mark.attrs?.href ?? '#';
          const target = mark.attrs?.target ?? '_blank';
          html = `<a href="${escapeAttr(href)}" target="${escapeAttr(target)}" rel="noopener noreferrer">${html}</a>`;
          break;
        }
        case 'textStyle': {
          const styles = [];
          if (mark.attrs?.color) styles.push(`color:${escapeAttr(mark.attrs.color)}`);
          if (mark.attrs?.fontFamily) styles.push(`font-family:${escapeAttr(mark.attrs.fontFamily)}`);
          if (mark.attrs?.fontSize) styles.push(`font-size:${escapeAttr(mark.attrs.fontSize)}`);
          if (styles.length > 0) {
            html = `<span style="${styles.join(';')}">${html}</span>`;
          }
          break;
        }
        default:
          break;
      }
    }

    return html;
  }

  // ── Leaf / void nodes ──────────────────────────────────────────────────────
  if (node.type === 'hardBreak') return '<br />';
  if (node.type === 'horizontalRule') return '<hr />';

  // ── Render children recursively ────────────────────────────────────────────
  const inner = (node.content ?? []).map(renderTiptapJson).join('');

  // ── Block / container nodes ────────────────────────────────────────────────
  switch (node.type) {
    case 'doc':
      return inner;

    case 'paragraph': {
      const align = node.attrs?.textAlign;
      const style = align ? ` style="text-align:${align}"` : '';
      return `<p${style}>${inner}</p>`;
    }

    case 'heading': {
      const level = node.attrs?.level ?? 2;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      const align = node.attrs?.textAlign;
      const style = align ? ` style="text-align:${align}"` : '';
      return `<${tag}${style}>${inner}</${tag}>`;
    }

    case 'bulletList':
      return `<ul>${inner}</ul>`;

    case 'orderedList': {
      const start = node.attrs?.start ?? 1;
      return `<ol start="${start}">${inner}</ol>`;
    }

    case 'listItem':
      return `<li>${inner}</li>`;

    case 'blockquote':
      return `<blockquote>${inner}</blockquote>`;

    case 'codeBlock': {
      const lang = node.attrs?.language ? ` class="language-${escapeAttr(node.attrs.language)}"` : '';
      return `<pre><code${lang}>${inner}</code></pre>`;
    }

    default:
      return inner;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
