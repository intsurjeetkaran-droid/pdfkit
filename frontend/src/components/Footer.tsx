import Link from 'next/link';
import { FileText, Shield, Clock, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Trust strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
          {[
            { icon: Shield, text: 'No signup required' },
            { icon: Clock, text: 'Files deleted in 1 hour' },
            { icon: Zap, text: 'Instant processing' },
            { icon: FileText, text: '100 MB max file size' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
              <Icon className="h-3.5 w-3.5 text-blue-500 shrink-0" aria-hidden="true" />
              {text}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            PDFKit
          </Link>
          <p className="text-xs text-slate-400">
            Free PDF tools. No account needed. Files auto-delete after 1 hour.
          </p>
        </div>
      </div>
    </footer>
  );
}
