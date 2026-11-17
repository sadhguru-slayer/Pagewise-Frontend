export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pagewise.sadguruchenu.in';
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/features',
          '/pricing',
          '/blog',
          '/blog/*',
          '/about',
          '/contact',
          '/login',
          '/register',
        ],
        disallow: [
          '/api/',
          '/builder/',
          '/dashboard/',
          '/settings/',
          '/admin-290123-7234878/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/features',
          '/pricing',
          '/blog',
          '/blog/*',
          '/about',
          '/contact',
          '/login',
          '/register',
        ],
        disallow: [
          '/api/',
          '/builder/',
          '/dashboard/',
          '/settings/',
          '/admin-290123-7234878/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
