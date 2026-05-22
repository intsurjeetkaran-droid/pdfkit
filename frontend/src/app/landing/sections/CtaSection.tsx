import Link from 'next/link';
import { ArrowRight, Zap, Shield, Clock } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white py-28">

      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-20 right-0 h-[350px] w-[450px] rounded-full bg-white/10 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[250px] w-[350px] rounded-full bg-indigo-400/20 blur-[80px]" />

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-100 mb-8 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse" />
          Always free — no credit card required
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
          Ready to get started?
        </h2>
        <p className="mt-5 text-blue-100 text-lg max-w-lg mx-auto leading-relaxed">
          No account. No credit card. No limits. Just pick a tool and go.
        </p>

        {/* CTA button */}
        <div className="mt-10">
          <Link
            href="/tools"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-9 py-4 text-base font-bold text-blue-700 shadow-2xl shadow-blue-900/40 transition hover:bg-blue-50 active:scale-95"
          >
            Open all 20+ tools
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Trust micro-badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {[
            { icon: Zap,    text: '20+ free tools'          },
            { icon: Shield, text: 'No account needed'       },
            { icon: Clock,  text: 'Files deleted in 1 hour' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-blue-200">
              <Icon className="h-3.5 w-3.5 text-blue-300" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

