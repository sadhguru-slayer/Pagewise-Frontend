function htmlToText(value) {
  if (!value) return '';
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts discrete points if enhanced_html contains multiple <li> tags or newlines
 */
function extractEnhancedPoints(enhancedHtml) {
  if (!enhancedHtml) return [];
  const text = String(enhancedHtml);

  // If there are multiple <li> tags:
  const liMatches = text.match(/<li[^>]*>(.*?)<\/li>/gi);
  if (liMatches && liMatches.length > 0) {
    return liMatches.map((m) =>
      m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    ).filter(Boolean);
  }

  // If there are <p> tags:
  const pMatches = text.match(/<p[^>]*>(.*?)<\/p>/gi);
  if (pMatches && pMatches.length > 1) {
    return pMatches.map((m) =>
      m.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    ).filter(Boolean);
  }

  // Single point
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean ? [clean] : [];
}

/**
 * Applies suggestions directly to structured section items (preserving 1 point per <li>)
 */
function applySuggestionsToStructuredItems(items, suggestions) {
  if (!Array.isArray(items) || !suggestions?.length) return { items, appliedCount: 0 };
  let appliedCount = 0;

  const nextItems = items.map((item) => {
    if (!Array.isArray(item.points)) return item;
    let nextPoints = [...item.points];

    suggestions.forEach((sug) => {
      const enhancedPoints = extractEnhancedPoints(sug.enhanced_html || sug.enhanced_text);
      if (!enhancedPoints.length) return;

      const origClean = htmlToText(sug.original_text).toLowerCase();

      // Case 1: Direct match by item_id and point_index
      if (
        sug.item_id === item.id &&
        typeof sug.point_index === 'number' &&
        sug.point_index >= 0 &&
        sug.point_index < nextPoints.length
      ) {
        // Replace single point with enhanced points (expanding if multiple)
        nextPoints.splice(sug.point_index, 1, ...enhancedPoints);
        appliedCount += 1;
        return;
      }

      // Case 2: Match by orig text content
      if (origClean && origClean.length > 8) {
        let bestIdx = -1;
        let bestScore = 0;

        nextPoints.forEach((pt, idx) => {
          const ptClean = pt.toLowerCase().trim();
          if (ptClean === origClean || ptClean.includes(origClean) || origClean.includes(ptClean)) {
            bestIdx = idx;
            bestScore = 1.0;
            return;
          }
          const origWords = origClean.split(/\s+/).filter((w) => w.length >= 3);
          if (origWords.length > 0) {
            const matched = origWords.filter((w) => ptClean.includes(w)).length;
            const score = matched / origWords.length;
            if (score > 0.40 && score > bestScore) {
              bestScore = score;
              bestIdx = idx;
            }
          }
        });

        if (bestIdx !== -1 && bestScore >= 0.40) {
          nextPoints.splice(bestIdx, 1, ...enhancedPoints);
          appliedCount += 1;
        }
      }
    });

    return { ...item, points: nextPoints };
  });

  return { items: nextItems, appliedCount };
}

export function applyWiserEnhancementsToSections(sections, analysis) {
  const enhancements = analysis?.section_enhancements || [];
  if (!Array.isArray(sections) || enhancements.length === 0) {
    return { sections, appliedCount: 0 };
  }

  let totalApplied = 0;
  const next = sections.map((sec) => {
    const match = enhancements.find(
      (s) =>
        s.section_id === sec.id ||
        s.section_title?.toLowerCase().trim() === sec.title?.toLowerCase().trim()
    );
    if (!match?.suggestions?.length) return sec;

    // If section has structured items, apply directly to items[].points!
    if (Array.isArray(sec.items) && sec.items.length > 0) {
      const { items: updatedItems, appliedCount } = applySuggestionsToStructuredItems(
        sec.items,
        match.suggestions
      );
      totalApplied += appliedCount;
      return {
        ...sec,
        items: updatedItems,
      };
    }

    // Fallback for legacy rich text
    let html = sec.content ?? sec.contentHtml ?? '';
    if (typeof html !== 'string') html = '';
    for (const sug of match.suggestions) {
      const orig = (sug.original_text || '').trim();
      const enhanced = (sug.enhanced_html || '').trim();
      if (orig && html.includes(orig)) {
        html = html.replace(orig, enhanced);
        totalApplied += 1;
      }
    }
    return { ...sec, content: html, contentHtml: html };
  });

  return { sections: next, appliedCount: totalApplied };
}
