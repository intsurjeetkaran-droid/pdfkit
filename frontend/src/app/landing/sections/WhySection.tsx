import { Zap, Shield, Cpu, Globe, Lock, Shapes } from 'lucide-react';

const features = [
  {
    icon: Zap,    color: 'bg-amber-500',   glow: 'shadow-amber-200',
    title: 'Instant — no waiting',
    body: 'Every operation runs server-side in milliseconds. No queues, no endless spinners that never resolve.',
  },
  {
    icon: Shield, color: 'bg-blue-600',    glow: 'shadow-blue-200',
    title: 'Privacy by design',
    body: 'Files are stored for exactly 1 hour then permanently deleted. No tracking, no profiling, no data selling.',
  },
  {
    icon: Cpu,    color: 'bg-violet-600',  glow: 'shadow-violet-200',
    title: 'Real tools, not wrappers',
    body: 'Every operation uses proven, server-side processing engines — accurate, high-quality results every time.',
  },
  {
    icon: Globe,  color: 'bg-emerald-600', glow: 'shadow-emerald-200',
    title: 'HTML & URL to PDF',
    body: 'Render any webpage or HTML template to pixel-perfect PDF using a full headless browser engine.',
  },
  {
    icon: Lock,   color: 'bg-slate-700',   glow: 'shadow-slate-300',
    title: 'AES-256 encryption',
    body: 'Protect PDFs with military-grade encryption. Set user and owner passwords independently.',
  },
  {
    icon: Shapes, color: 'bg-teal-600',    glow: 'shadow-teal-200',
    title: 'Every format covered',
    body: 'Word, Excel, PowerPoint, images, SVG, HTML — if it can become a PDF, PDFKit handles it.',
  },
];

export default function WhySection() {
  return (
    <section id="why" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Why PDFKit</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Built different from the rest
          </h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto leading-relaxed">
            Most PDF tools are slow, ad-heavy, and demand an account before you can do anything.
            PDFKit is none of that.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, color, glow, title, body }) => (
            <div
              key={title}
              className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden"
            >
              {/* Subtle top-left gradient accent */}
              <div className="pointer-events-none absolute -top-6 -left-6 h-20 w-20 rounded-full bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

              <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg ${color} ${glow}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
