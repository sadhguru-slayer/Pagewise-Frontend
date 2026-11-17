export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pagewise.sadguruchenu.in';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const lastModified = new Date();

  // Core static crawlable routes
  const staticRoutes = [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamically fetch published blog post slugs to include in sitemap
  let blogRoutes = [];
  try {
    const res = await fetch(`${apiBase}/api/blogs?page=1&limit=100`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items)) {
        blogRoutes = data.items.map((item) => ({
          url: `${baseUrl}/blog/${item.slug}`,
          lastModified: item.updated_at ? new Date(item.updated_at) : lastModified,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
      }
    }
  } catch (err) {
    // If backend is unreachable during build, fallback gracefully with starter slugs
    const fallbackSlugs = [
      'engineering-resume-benchmark-ats-vs-humans',
      'single-page-vs-multi-page-resume-rules',
      'why-pdf-exporters-break-ats-and-how-to-fix-it',
    ];
    blogRoutes = fallbackSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...blogRoutes];
}
