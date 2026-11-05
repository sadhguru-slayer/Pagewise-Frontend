export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://resumo.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
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
        allow: '/',
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
