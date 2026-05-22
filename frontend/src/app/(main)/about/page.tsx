import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Zap, Shield, Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About PDFKit',
  description: 'Learn about PDFKit — a free PDF utility platform built for everyone. No signup, no watermarks, no nonsense.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl w-full py-4">

      {/* Header */}
      <div className="mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-5">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">About PDFKit</h1>
        <p className="mt-3 text-slate-500 text-lg leading-relaxed">
          Free PDF tools for everyone. No account. No watermarks. No nonsense.
        </p>
      </div>

      <div className="space-y-10 text-slate-700">

        {/* What is PDFKit */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">What is PDFKit?</h2>
          <p className="leading-relaxed">
            PDFKit is a free PDF utility platform that gives you professional-grade tools — merge,
            split, compress, convert, watermark, encrypt, and more — without asking you to create
            an account, pay a subscription, or sit through ads.
          </p>
          <p className="mt-3 leading-relaxed">
            The workflow is simple: upload a file, process it, download the result. Every uploaded
            and processed file is permanently deleted after one hour. We never store your documents
            longer than necessary.
          </p>
        </section>

        {/* Why we built it */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Why we built it</h2>
          <p className="leading-relaxed">
            Most PDF tools on the internet make you sign up before you can do anything useful. Then
            they watermark your output, limit your file size to 5 MB, or charge a monthly fee for
            features that should be free. We built PDFKit because we were tired of that experience.
          </p>
          <p className="mt-3 leading-relaxed">
            PDFKit uses proven, industry-standard processing engines under the hood — not janky
            browser-side workarounds. Every operation runs server-side, producing accurate,
            high-quality results regardless of your device.
          </p>
        </section>

        {/* Key facts */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Key facts</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Zap,    color: 'bg-amber-50 text-amber-600',    title: '20+ free tools',      body: 'Merge, split, compress, convert, watermark, encrypt, and more.' },
              { icon: Shield, color: 'bg-blue-50 text-blue-600',      title: 'No account required', body: 'We never ask for your email, name, or any personal information.' },
              { icon: Clock,  color: 'bg-emerald-50 text-emerald-600',title: '1-hour auto-delete',  body: 'All files are permanently deleted 60 minutes after upload.' },
            ].map(({ icon: Icon, color, title, body }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What we support */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">What we support</h2>
          <p className="leading-relaxed mb-4">
            PDFKit handles a wide range of file formats and operations across all major categories:
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              {[
                ['PDF operations',    'Merge, split, rotate, compress, watermark, extract, delete, reorder'],
                ['Office formats',    'Word, Excel, PowerPoint — convert to and from PDF'],
                ['Images',            'PNG, JPEG, WebP, TIFF, BMP, SVG — convert to and from PDF'],
                ['HTML & web pages',  'Convert any URL or HTML content to PDF'],
                ['PDF security',      'Password protect, unlock, and strip metadata'],
                ['PDF inspection',    'View metadata, page count, and page previews'],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-800">{label}</span>
                  <span className="text-slate-500 text-xs leading-relaxed">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy commitment */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Our privacy commitment</h2>
          <p className="leading-relaxed">
            We take your privacy seriously. Files are processed in isolated environments and
            permanently deleted after one hour. We do not read, analyse, or share the contents
            of your files. No account means no profile — we hold no personal data about you.
          </p>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-blue-600 p-7 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Ready to try it?</h2>
          <p className="text-blue-100 text-sm mb-5">No account needed. Just pick a tool and go.</p>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 active:scale-95"
          >
            Open all tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
