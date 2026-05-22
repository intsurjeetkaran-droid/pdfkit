import { Check, X } from 'lucide-react';

const comparisons = [
  { feature: 'No account required',       pdfkit: true,  others: false },
  { feature: 'No watermarks on output',   pdfkit: true,  others: false },
  { feature: 'Files auto-deleted (1 hr)', pdfkit: true,  others: false },
  { feature: '100 MB file limit',         pdfkit: true,  others: false },
  { feature: 'HTML / URL → PDF',          pdfkit: true,  others: false },
  { feature: 'SVG → PDF',                 pdfkit: true,  others: false },
  { feature: 'AES-256 PDF encryption',    pdfkit: true,  others: true  },
  { feature: 'Batch images → PDF',        pdfkit: true,  others: false },
  { feature: 'No upsells or paywalls',    pdfkit: true,  others: false },
];

export default function CompareSection() {
  return (
    <section id="compare" className="bg-slate-950 text-white py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">
            Comparison
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            PDFKit vs typical PDF tools
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto leading-relaxed">
            Most online PDF tools ask you to sign up, show ads, add watermarks,
            or hide features behind a paywall. PDFKit does none of that.
          </p>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/40">

          {/* Column headers */}
          <div className="grid grid-cols-3 bg-white/5 px-6 py-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Feature
            </span>
            <span className="text-center text-xs font-bold uppercase tracking-widest text-blue-400">
              PDFKit
            </span>
            <span className="text-center text-xs font-bold uppercase tracking-widest text-slate-500">
              Typical tools
            </span>
          </div>

          {/* Rows */}
          {comparisons.map(({ feature, pdfkit, others }, i) => (
            <div
              key={feature}
              className={`grid grid-cols-3 items-center px-6 py-4 text-sm border-t border-white/5 transition-colors hover:bg-white/[0.03] ${
                i % 2 === 0 ? 'bg-white/[0.015]' : ''
              }`}
            >
              <span className="text-slate-300 pr-4 leading-snug">{feature}</span>

              {/* PDFKit */}
              <span className="flex justify-center">
                {pdfkit ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/25 ring-1 ring-blue-500/30 text-blue-400">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-600">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                )}
              </span>

              {/* Typical tools */}
              <span className="flex justify-center">
                {others ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/50 text-slate-400">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-600">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Based on common limitations found in free-tier online PDF tools.
        </p>

      </div>
    </section>
  );
}
