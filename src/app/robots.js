export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://resumo.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/builder/', '/dashboard/', '/settings/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
