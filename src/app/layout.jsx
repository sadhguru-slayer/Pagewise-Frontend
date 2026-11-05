import { Geist, Geist_Mono, Newsreader } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';
import { ModalProvider } from '@/lib/modal-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://resumo.app';

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'PageWise Studio — Precision Resume Builder & Deep ATS Intelligence',
    template: '%s | PageWise Studio',
  },
  description:
    'Free industrial-grade resume craft with deep ATS analysis, cross-resume intelligence, real-time multi-page A4 canvas, and dual pixel-accurate PDF & native Word (.docx) export.',
  applicationName: 'PageWise Studio',
  authors: [{ name: 'PageWise Studio', url: APP_URL }],
  generator: 'Next.js',
  keywords: [
    'PageWise',
    'PageWise Studio',
    'free ATS resume builder',
    'ATS resume checker',
    'ATS optimization',
    'engineering resume builder',
    'software engineer resume',
    'multi page resume',
    'Word resume export docx',
    'PDF resume generator vector',
    'targeted resume branch',
    'job description keyword matcher',
    'free resume maker no watermark',
    'technical resume builder',
    'executive resume format',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'PageWise Studio',
  publisher: 'PageWise Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/pagewise_logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/pagewise_logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/pagewise_logo.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/pagewise_logo.png',
    apple: [
      { url: '/pagewise_logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'PageWise Studio',
    title: 'PageWise Studio — Precision Resume Builder & Deep ATS Intelligence',
    description:
      'Engineered resume craft with real-time ATS optimization, job description keyword matching, millimeter-accurate multi-page A4 canvas, and native PDF & Word export.',
    images: [
      {
        url: '/pagewise_logo.png',
        width: 1254,
        height: 1254,
        alt: 'PageWise Studio — Engineering-Grade Resume Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PageWise Studio — Precision Resume Builder & Deep ATS Intelligence',
    description:
      'Engineered resume builder with real-time ATS optimization, multi-page visual pagination, and dual PDF & Word export.',
    images: ['/pagewise_logo.png'],
    creator: '@pagewisestudio',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  category: 'Productivity',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'PageWise Studio',
      description: 'Industrial-grade resume craft with deep ATS analysis and cross-resume intelligence.',
      inLanguage: 'en-US',
      publisher: {
        '@type': 'Organization',
        name: 'PageWise Studio',
        url: APP_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${APP_URL}/pagewise_logo.png`,
        },
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/#software`,
      name: 'PageWise Studio',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'WebBrowser',
      url: APP_URL,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'Real-time millimeter-accurate A4 multi-page pagination',
        'Deep ATS keyword matching against job descriptions',
        'Factual evidence-checked AI bullet point polisher',
        'Vector print-calibrated PDF download with zero watermarks',
        'Native editable Microsoft Word (.docx) export',
        'Targeted job resume branching from single master career profile',
      ],
      description:
        'Precision resume builder featuring real-time ATS keyword matching, multi-page A4 pagination, and dual high-fidelity PDF and Word (.docx) exports without hidden paywalls.',
    },
    {
      '@type': 'FAQPage',
      '@id': `${APP_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Does PageWise charge a subscription fee when I click Download?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Both print-calibrated A4 PDF export and native Microsoft Word (.docx) export are fully available in your workspace without surprise paywalls, watermark traps, or hidden checkout screens.',
          },
        },
        {
          '@type': 'Question',
          name: 'Will my exported PDF look exactly like the preview on my screen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. PageWise renders exported PDFs using an isolated, print-calibrated A4 layout engine. Your typography, millimeter margins, rules, and line wraps match pixel-for-pixel between the visual editor and your downloaded document.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Wiser AI improve my resume without fabricating facts?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Wiser operates under a strict factual reliability policy. It never manufactures unearned achievements, company names, or quantitative metrics. Instead, it strengthens active phrasing, clarifies engineering scope, and highlights missing industry competencies for you to verify.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I maintain different resumes for different job applications?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. PageWise supports career asset branching. You maintain a single canonical Master Resume with your complete career history, and branch customized copies tailored to specific job listings without losing or overwriting your original accomplishments.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#08080a" />
        <meta name="color-scheme" content="dark" />
        <link rel="canonical" href={APP_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} w-full ${geistMono.variable} ${newsreader.variable} antialiased bg-[#08080a] text-zinc-100 min-h-screen`}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#121520',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '13px',
              fontFamily: 'var(--font-geist-sans), sans-serif',
            },
          }}
        />
        <AuthProvider>
          <ModalProvider>
            {children}
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
