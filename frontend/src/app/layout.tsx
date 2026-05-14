import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-dvh flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Header />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
