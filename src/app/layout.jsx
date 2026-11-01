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

export const metadata = {
  title: 'PageWise Studio — Resume Craft with Precision & Deep ATS Intelligence',
  description: 'Industrial-grade resume craft with deep ATS analysis, cross-resume intelligence, live A4 multi-sheet visual editing, and dual PDF & DOCX export.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
