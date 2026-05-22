'use client';

import Link from 'next/link';
import { ArrowRight, Upload, Cpu, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

const steps = [
  {
    n: '01',
    icon: Cpu,
    color: 'bg-blue-600',
    ring: 'ring-blue-200',
    accent: 'from-blue-600 to-indigo-600',
    title: 'Pick a tool',
    body: 'Choose from 20+ operations — merge, convert, compress, secure, and more. No account needed.',
  },
  {
    n: '02',
    icon: Upload,
    color: 'bg-violet-600',
    ring: 'ring-violet-200',
    accent: 'from-violet-600 to-purple-600',
    title: 'Upload your file',
    body: 'Drag and drop or click to upload. Up to 100 MB. PDF, Word, Excel, images, HTML — all supported.',
  },
  {
    n: '03',
    icon: Download,
    color: 'bg-emerald-600',
    ring: 'ring-emerald-200',
    accent: 'from-emerald-600 to-teal-600',
    title: 'Download the result',
    body: 'Your file is ready in seconds. Download it — then it auto-deletes in 1 hour. Nothing stored.',
  },
];

export default function HowItWorksSection() {
  const [active, setActive] = useState(0);

  // Auto-advance every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const step = steps[active];

  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">How it works</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Three steps. That&apos;s it.
          </h2>
          <p className="mt-4 text-slate-500 max-w-md mx-auto">
            No setup, no learning curve. Just upload and go.
          </p>
        </div>

        {/* ── Desktop: side-by-side tabs + detail panel ── */}
        <div className="hidden sm:grid sm:grid-cols-5 gap-6 items-stretch">

          {/* Step tabs — left column */}
          <div className="col-span-2 flex flex-col gap-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === active;
              return (
                <button
                  key={s.n}
                  onClick={() => setActive(i)}
                  className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-blue-200 bg-blue-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-blue-100 hover:bg-slate-50'
                  }`}
                >
                  {/* Icon */}
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-all duration-300 ${isActive ? s.color : 'bg-slate-200'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                      Step {s.n}
                    </p>
                    <p className={`text-sm font-bold leading-snug transition-colors ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                      {s.title}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Progress dots */}
            <div className="flex items-center gap-2 px-1 pt-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === active ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
              <span className="ml-auto text-[10px] text-slate-400 font-medium">
                {active + 1} / {steps.length}
              </span>
            </div>
          </div>

          {/* Detail panel — right column */}
          <div
            key={active}
            className={`col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-br ${step.accent} p-8 text-white shadow-xl flex flex-col justify-between min-h-[220px]`}
            style={{ animation: 'fadeSlideIn 0.4s ease both' }}
          >
            {/* Grid texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            {/* Glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-[50px]" />

            <div className="relative">
              <span className="text-7xl font-black text-white/10 select-none leading-none block mb-4">
                {step.n}
              </span>
              <h3 className="text-2xl font-extrabold mb-3">{step.title}</h3>
              <p className="text-white/80 leading-relaxed text-sm max-w-sm">{step.body}</p>
            </div>

            {/* Auto-progress bar */}
            <div className="relative mt-8 h-1 rounded-full bg-white/20 overflow-hidden">
              <div
                key={active}
                className="absolute left-0 top-0 h-full rounded-full bg-white/70"
                style={{ animation: 'progressBar 3s linear forwards' }}
              />
            </div>
          </div>
        </div>

        {/* ── Mobile: stacked cards ── */}
        <div className="sm:hidden space-y-4">
          {steps.map(({ n, icon: Icon, color, title, body }) => (
            <div key={n} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Step {n}</p>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/tools"
            className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
          >
            Start using PDFKit
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
}
