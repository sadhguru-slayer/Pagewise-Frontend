function htmlToText(value) {
  if (!value) return '';
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function applyOneSuggestion(currentHtml, sug) {
  const orig = (sug.original_text || '').trim();
  const enhanced = (sug.enhanced_html || '').trim();
  if (!enhanced) return currentHtml;

  let html = currentHtml || '';

  if (orig && html.includes(orig)) {
    return html.replace(orig, enhanced);
  }

  if (typeof window === 'undefined' || !window.DOMParser) {
    return html ? `${html}${enhanced}` : enhanced;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '<div></div>', 'text/html');
    const origClean = htmlToText(orig).toLowerCase();

    if (origClean.length > 8) {
      const elements = Array.from(doc.body.querySelectorAll('li, p, h1, h2, h3, h4, h5, h6'));
      let bestMatch = null;
      let bestScore = 0;

      for (const el of elements) {
        const elText = htmlToText(el.textContent).toLowerCase();
        if (!elText) continue;
        if (elText.includes(origClean) || origClean.includes(elText)) {
          bestMatch = el;
          bestScore = 1;
          break;
        }
        const origWords = origClean.split(/\s+/).filter((w) => w.length > 3);
        if (origWords.length > 0) {
          const matchedWords = origWords.filter((w) => elText.includes(w));
          const score = matchedWords.length / origWords.length;
          if (score > 0.45 && score > bestScore) {
            bestScore = score;
            bestMatch = el;
          }
        }
      }

      if (bestMatch && bestScore >= 0.45) {
        const tempDoc = parser.parseFromString(enhanced, 'text/html');
        if (bestMatch.tagName.toLowerCase() === 'li') {
          const innerLi = tempDoc.body.querySelector('li');
          bestMatch.innerHTML = innerLi ? innerLi.innerHTML : tempDoc.body.innerHTML;
        } else {
          bestMatch.innerHTML = tempDoc.body.innerHTML;
        }
        return doc.body.innerHTML;
      }
    }

    const lastUl = doc.body.querySelector('ul:last-of-type') || doc.body.querySelector('ul');
    if (lastUl) {
      const tempDoc = parser.parseFromString(enhanced, 'text/html');
      const innerLi = tempDoc.body.querySelector('li');
      const newLi = doc.createElement('li');
      newLi.innerHTML = innerLi ? innerLi.innerHTML : tempDoc.body.innerHTML;
      lastUl.appendChild(newLi);
      return doc.body.innerHTML;
    }

    return `${html}${enhanced}`;
  } catch {
    return html ? `${html}${enhanced}` : enhanced;
  }
}

export function applyWiserEnhancementsToSections(sections, analysis) {
  const enhancements = analysis?.section_enhancements || [];
  if (!Array.isArray(sections) || enhancements.length === 0) {
    return { sections, appliedCount: 0 };
  }

  let appliedCount = 0;
  const next = sections.map((sec) => {
    const match = enhancements.find(
      (s) =>
        s.section_id === sec.id ||
        s.section_title?.toLowerCase().trim() === sec.title?.toLowerCase().trim()
    );
    if (!match?.suggestions?.length) return sec;

    let html = sec.content ?? sec.contentHtml ?? '';
    if (typeof html !== 'string') html = '';
    for (const sug of match.suggestions) {
      html = applyOneSuggestion(html, sug);
      appliedCount += 1;
    }
    return { ...sec, content: html, contentHtml: html };
  });

  return { sections: next, appliedCount };
}
