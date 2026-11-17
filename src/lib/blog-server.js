const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function fetchServerBlog(slug) {
  try {
    const res = await fetch(`${API_BASE}/blogs/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[fetchServerBlog] Failed to fetch blog ${slug}:`, err);
    return null;
  }
}

export async function fetchServerBlogsList({ page = 1, limit = 9, tag = null, q = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    if (tag) params.set('tag', tag);
    if (q) params.set('q', q);

    const res = await fetch(`${API_BASE}/blogs?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { items: [], total: 0 };
    return await res.json();
  } catch (err) {
    console.error('[fetchServerBlogsList] Failed to fetch blogs:', err);
    return { items: [], total: 0 };
  }
}
