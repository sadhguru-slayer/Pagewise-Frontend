import { Geist, Geist_Mono, Newsreader } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';
import { ModalProvider } from '@/lib/modal-context';
import MobileBlocker from '@/components/MobileBlocker';

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
    default: 'PageWise Studio — Precision Resume Craft & Deep ATS Intelligence',
    template: '%s | PageWise Studio',
  },
  description:
    'Industrial-grade resume craft with deep ATS analysis, cross-resume intelligence, live A4 multi-sheet visual editing, and dual pixel-accurate PDF & native Word (.docx) export.',
  applicationName: 'PageWise Studio',
  authors: [{ name: 'PageWise Studio', url: APP_URL }],
  generator: 'Next.js',
  keywords: [
    'PageWise',
    'PageWise Studio',
    'resume builder',
    'ATS resume checker',
    'ATS optimization',
    'engineering resume builder',
    'software engineer resume',
    'multi page resume',
    'Word resume export',
    'PDF resume generator',
    'targeted resume branch',
    'job description keyword matcher',
    'free ATS resume',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'PageWise Studio',
  publisher: 'PageWise Studio',
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
    title: 'PageWise Studio — Precision Resume Craft & Deep ATS Intelligence',
    description:
      'Engineered resume craft with real-time ATS optimization, job description keyword matching, millimeter-accurate multi-page A4 canvas, and native PDF & Word export.',
    images: [
      {
        url: '/pagewise_logo.png',
        width: 1254,
        height: 1254,
        alt: 'PageWise Studio Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PageWise Studio — Precision Resume Craft & Deep ATS Intelligence',
    description:
      'Engineered resume builder with real-time ATS optimization, multi-page visual pagination, and dual PDF & Word export.',
    images: ['/pagewise_logo.png'],
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
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/#software`,
      name: 'PageWise Studio',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'WebBrowser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Precision resume builder featuring real-time ATS keyword matching, multi-page A4 pagination, and dual high-fidelity PDF and Word (.docx) exports.',
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
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
            <MobileBlocker />
            {children}
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
