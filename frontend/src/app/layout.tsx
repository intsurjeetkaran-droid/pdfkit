import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: { default: 'PDFKit — Free PDF Tools', template: '%s | PDFKit' },
  description: 'Merge, split, compress, convert, watermark and secure PDFs instantly. No signup. No watermarks. Files auto-delete after 1 hour.',
  keywords: ['PDF', 'merge PDF', 'split PDF', 'compress PDF', 'convert PDF', 'free PDF tools'],
  openGraph: {
    title: 'PDFKit — Free PDF Tools',
    description: 'All the PDF tools you need. No signup required.',
    type: 'website',
  },
  // Tab icon — Next.js App Router picks up icon.svg automatically from /app
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      {/*
        Body has no Header/Footer here — those live in (main)/layout.tsx.
        The landing page at /landing gets its own full-screen layout.
      */}
      <body className="min-h-dvh flex flex-col bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
