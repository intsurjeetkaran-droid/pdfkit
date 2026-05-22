'use client';

import Link from 'next/link';
import {
  Merge, Minimize2, Lock, Globe, FileImage, Shapes,
  Scissors, RotateCw, FileInput, FileSpreadsheet,
  Presentation, FileType, Images, ChevronRight,
} from 'lucide-react';

// All tools — duplicated for seamless infinite loop
const allTools = [
  { icon: Merge,          color: 'bg-blue-600',    label: 'Merge PDF',     href: '/tools/merge'        },
  { icon: Minimize2,      color: 'bg-violet-600',  label: 'Compress PDF',  href: '/tools/compress'     },
  { icon: FileImage,      color: 'bg-pink-500',    label: 'PDF to Image',  href: '/tools/pdf-to-image' },
  { icon: Globe,          color: 'bg-emerald-600', label: 'URL to PDF',    href: '/tools/html-to-pdf'  },
  { icon: Lock,           color: 'bg-slate-700',   label: 'Protect PDF',   href: '/tools/protect'      },
  { icon: Shapes,         color: 'bg-teal-600',    label: 'SVG to PDF',    href: '/tools/svg-to-pdf'   },
  { icon: Scissors,       color: 'bg-blue-500',    label: 'Split PDF',     href: '/tools/split'        },
  { icon: RotateCw,       color: 'bg-indigo-500',  label: 'Rotate PDF',    href: '/tools/rotate'       },
  { icon: FileInput,      color: 'bg-blue-700',    label: 'Word to PDF',   href: '/tools/word-to-pdf'  },
  { icon: FileSpreadsheet,color: 'bg-emerald-600', label: 'Excel to PDF',  href: '/tools/excel-to-pdf' },
  { icon: Presentation,   color: 'bg-orange-500',  label: 'PPT to PDF',    href: '/tools/ppt-to-pdf'   },
  { icon: FileType,       color: 'bg-blue-600',    label: 'PDF to Word',   href: '/tools/pdf-to-word'  },
  { icon: Images,         color: 'bg-fuchsia-500', label: 'Images to PDF', href: '/tools/images-to-pdf'},
];

// Single marquee card (not a link — clicking handled by wrapper)
function MarqueeCard({
  icon: Icon, color, label,
}: {
  icon: React.ElementType; color: string; label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm w-[120px] shrink-0 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[11px] font-bold text-slate-700 text-center leading-tight">{label}</p>
    </div>
  );
}

export default function ToolsHighlightSection() {
  // Duplicate array for seamless loop
  const track = [...allTools, ...allTools];

  return (
    <section id="tools" className="bg-white border-y border-slate-100 py-24 overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Popular tools</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Start with these
          </h2>
          <p className="mt-4 text-slate-500 max-w-md mx-auto">
            The most-used tools — click any to get started instantly.
          </p>
        </div>
      </div>

      {/* ── Infinite marquee ── */}
      {/* Fade edges */}
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-white to-transparent" />

        {/* Scrolling track */}
        <div
          className="flex gap-4 w-max"
          style={{ animation: 'marquee 30s linear infinite' }}
          onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')}
          onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}
        >
          {track.map(({ icon, color, label, href }, i) => (
            <Link key={`${href}-${i}`} href={href}>
              <MarqueeCard icon={icon} color={color} label={label} />
            </Link>
          ))}
        </div>
      </div>

      {/* View all */}
      <div className="mt-10 text-center">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
        >
          View all 20+ tools <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Marquee keyframe */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
