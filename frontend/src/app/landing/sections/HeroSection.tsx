import Link from 'next/link';
import { ArrowRight, Shield, Clock, Zap } from 'lucide-react';

const pills = [
  'Merge PDF', 'Split PDF', 'Compress', 'Word → PDF',
  'HTML → PDF', 'Protect', 'Watermark', 'SVG → PDF', 'PDF → Image', 'Unlock',
];

const trustBadges = [
  { icon: Shield, text: 'No account required' },
  { icon: Clock,  text: 'Files deleted in 1 hr' },
  { icon: Zap,    text: 'Instant processing' },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">

      {/* ── Background layers ─────────────────────────────────────────── */}

      {/* Fine grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial glow — centre top */}
      <div className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 h-[700px] w-[900px] rounded-full bg-blue-600/20 blur-[140px]" />
      {/* Violet glow — bottom right */}
      <div className="pointer-events-none absolute -bottom-20 right-0 h-[400px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
      {/* Cyan glow — left mid */}
      <div className="pointer-events-none absolute top-1/2 -left-20 h-[250px] w-[350px] rounded-full bg-cyan-500/10 blur-[90px]" />

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-20 sm:pt-36 sm:pb-28 text-center">

        {/* Top badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-blue-300 mb-8 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Free · No signup · Files auto-deleted in 1 hour
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.06]">
          PDF tools that{' '}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              actually work
            </span>
            {/* Underline accent */}
            <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 opacity-60" />
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-7 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed sm:text-xl">
          20+ free tools — merge, split, compress, convert, watermark, encrypt.
          Upload a file, get the result.{' '}
          <span className="text-white font-semibold">No account. No nonsense.</span>
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/tools"
            className="group flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-blue-900/50 transition hover:bg-blue-500 active:scale-95"
          >
            Get started — it&apos;s free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-95"
          >
            See how it works
          </a>
        </div>

        {/* Trust micro-badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {trustBadges.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-slate-400">
              <Icon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              {text}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-14 flex items-center justify-center gap-3">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-white/10" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Popular tools
          </span>
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Tool pills */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {pills.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm hover:border-blue-400/50 hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-150 cursor-default"
            >
              {t}
            </span>
          ))}
        </div>

      </div>

      {/* Bottom wave separator */}
      <div className="relative h-12 overflow-hidden">
        <svg
          viewBox="0 0 1440 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 48 C360 0 1080 0 1440 48 L1440 48 L0 48 Z"
            fill="white"
          />
        </svg>
      </div>

    </section>
  );
}
