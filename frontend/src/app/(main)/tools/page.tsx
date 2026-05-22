import Link from 'next/link';
import {
  Merge, Scissors, RotateCw, Minimize2, Droplets, Trash2, FileOutput,
  FileInput, Image, FileImage, Lock, Unlock, ShieldOff, Info, Copy,
  AlignJustify, FileSpreadsheet, Presentation, FileType, FileText,
  Shapes, Images, Globe, ArrowRight,
} from 'lucide-react';

// ─── Tool data ────────────────────────────────────────────────────────────────

const groups = [
  {
    id: 'pdf',
    heading: 'PDF Operations',
    tagline: 'Merge, split, rotate, compress and organise your PDFs',
    accent: 'from-blue-600 to-indigo-600',
    labelColor: 'text-blue-700',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    tools: [
      { href: '/tools/merge',        title: 'Merge PDF',       description: 'Combine 2–20 PDFs into one document',   icon: Merge,       color: 'bg-blue-600'   },
      { href: '/tools/split',        title: 'Split PDF',       description: 'Extract specific pages into a new PDF', icon: Scissors,    color: 'bg-blue-500'   },
      { href: '/tools/rotate',       title: 'Rotate PDF',      description: 'Rotate pages 90°, 180° or 270°',        icon: RotateCw,    color: 'bg-indigo-500' },
      { href: '/tools/compress',     title: 'Compress PDF',    description: 'Reduce file size without quality loss',  icon: Minimize2,   color: 'bg-violet-500' },
      { href: '/tools/watermark',    title: 'Watermark',       description: 'Add text or image watermarks',           icon: Droplets,    color: 'bg-cyan-500'   },
      { href: '/tools/extract',      title: 'Extract Pages',   description: 'Extract a page range from a PDF',        icon: FileOutput,  color: 'bg-sky-500'    },
      { href: '/tools/delete-pages', title: 'Delete Pages',    description: 'Remove specific pages from a PDF',       icon: Trash2,      color: 'bg-rose-500'   },
      { href: '/tools/reorder',      title: 'Reorder Pages',   description: 'Rearrange pages in any order',           icon: AlignJustify,color: 'bg-amber-500'  },
    ],
  },
  {
    id: 'convert',
    heading: 'Convert',
    tagline: 'Convert between PDF and every major file format',
    accent: 'from-emerald-600 to-teal-600',
    labelColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tools: [
      { href: '/tools/word-to-pdf',   title: 'Word to PDF',   description: 'DOCX / DOC → PDF',                       icon: FileInput,      color: 'bg-blue-700'    },
      { href: '/tools/excel-to-pdf',  title: 'Excel to PDF',  description: 'XLSX / XLS → PDF',                       icon: FileSpreadsheet,color: 'bg-emerald-600' },
      { href: '/tools/ppt-to-pdf',    title: 'PPT to PDF',    description: 'PPTX / PPT → PDF',                       icon: Presentation,   color: 'bg-orange-500'  },
      { href: '/tools/pdf-to-word',   title: 'PDF to Word',   description: 'Convert PDF to editable DOCX',           icon: FileType,       color: 'bg-blue-600'    },
      { href: '/tools/pdf-to-text',   title: 'PDF to Text',   description: 'Extract all text content from a PDF',    icon: FileText,       color: 'bg-slate-600'   },
      { href: '/tools/image-to-pdf',  title: 'Image to PDF',  description: 'PNG / JPEG / WebP / TIFF → PDF',         icon: Image,          color: 'bg-pink-500'    },
      { href: '/tools/images-to-pdf', title: 'Images to PDF', description: 'Combine multiple images into one PDF',   icon: Images,         color: 'bg-fuchsia-500' },
      { href: '/tools/pdf-to-image',  title: 'PDF to Image',  description: 'Convert PDF pages to PNG or JPG',        icon: FileImage,      color: 'bg-purple-500'  },
      { href: '/tools/svg-to-pdf',    title: 'SVG to PDF',    description: 'Convert SVG vector graphics to PDF',     icon: Shapes,         color: 'bg-teal-500'    },
      { href: '/tools/html-to-pdf',   title: 'HTML to PDF',   description: 'URL, HTML file or string → PDF',         icon: Globe,          color: 'bg-green-600'   },
    ],
  },
  {
    id: 'security',
    heading: 'Security & Info',
    tagline: 'Protect, unlock, inspect and clean your PDF files',
    accent: 'from-slate-700 to-slate-900',
    labelColor: 'text-slate-700',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    tools: [
      { href: '/tools/protect',         title: 'Protect PDF',     description: 'Add AES-256 password protection',     icon: Lock,     color: 'bg-slate-700' },
      { href: '/tools/unlock',          title: 'Unlock PDF',      description: 'Remove password from a PDF',          icon: Unlock,   color: 'bg-slate-600' },
      { href: '/tools/remove-metadata', title: 'Remove Metadata', description: 'Strip all embedded metadata',         icon: ShieldOff,color: 'bg-slate-500' },
      { href: '/tools/pdf-info',        title: 'PDF Info',        description: 'View full metadata and page details', icon: Info,     color: 'bg-teal-600'  },
      { href: '/tools/duplicate',       title: 'Duplicate Pages', description: 'Duplicate specific pages in a PDF',   icon: Copy,     color: 'bg-amber-600' },
    ],
  },
];

// ─── Tool card ────────────────────────────────────────────────────────────────

function PremiumToolCard({
  href, title, description, icon: Icon, color, badge,
}: {
  href: string; title: string; description: string;
  icon: React.ElementType; color: string; badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
    >
      {badge && (
        <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge === 'New' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {badge}
        </span>
      )}

      {/* Icon */}
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm ${color}`}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
          {title}
        </h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      {/* Arrow — appears on hover */}
      <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Open tool <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

// ─── Group section ────────────────────────────────────────────────────────────

function ToolGroup({ group }: { group: typeof groups[0] }) {
  return (
    <section aria-labelledby={`group-${group.id}`} className="space-y-5">
      {/* Section header */}
      <div className="flex items-start gap-4">
        {/* Gradient accent bar */}
        <div className={`hidden sm:block w-1 self-stretch rounded-full bg-gradient-to-b ${group.accent} shrink-0`} />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2
              id={`group-${group.id}`}
              className={`text-xs font-bold uppercase tracking-widest ${group.labelColor}`}
            >
              {group.heading}
            </h2>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${group.badgeBg}`}>
              {group.tools.length} tools
            </span>
          </div>
          <p className="text-sm text-slate-500">{group.tagline}</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {group.tools.map((tool) => (
          <PremiumToolCard key={tool.href} {...tool} />
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const totalTools = groups.reduce((sum, g) => sum + g.tools.length, 0);

  return (
    <div className="space-y-12">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-10 sm:px-10 sm:py-14 text-white">
        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] rounded-3xl"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute -top-10 right-0 h-48 w-64 rounded-full bg-white/10 blur-[60px]" />

        <div className="relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 mb-5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse" />
            No signup · No watermarks · Files deleted in 1 hour
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl leading-tight mb-3">
            All the PDF tools<br className="hidden sm:block" /> you actually need
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-lg leading-relaxed mb-7">
            Upload a file, process it, download the result. No account, no limits, no nonsense.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            {[
              { value: '20+',  label: 'Free tools'    },
              { value: '100 MB',         label: 'Max file size' },
              { value: '1 hour',         label: 'Auto-delete'   },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm text-center min-w-[80px]">
                <p className="text-lg font-extrabold leading-none">{value}</p>
                <p className="text-[10px] text-blue-200 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tool groups ─────────────────────────────────────────────────── */}
      {groups.map((group) => (
        <ToolGroup key={group.id} group={group} />
      ))}

    </div>
  );
}
