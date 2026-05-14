import ToolCard from '@/components/ToolCard';
import { Merge, Scissors, RotateCw, Minimize2, Droplets, Trash2, FileOutput, FileInput, Image, FileImage, Lock, Unlock, ShieldOff, Info, Copy, AlignJustify, FileSpreadsheet, Presentation, FileType } from 'lucide-react';

const toolGroups = [
  {
    heading: 'PDF Operations',
    color: 'text-blue-700',
    tools: [
      { href: '/tools/merge', title: 'Merge PDF', description: 'Combine 2–20 PDFs into one document', icon: <Merge className="h-5 w-5" />, color: 'bg-blue-600' },
      { href: '/tools/split', title: 'Split PDF', description: 'Extract specific pages into a new PDF', icon: <Scissors className="h-5 w-5" />, color: 'bg-blue-500' },
      { href: '/tools/rotate', title: 'Rotate PDF', description: 'Rotate pages 90°, 180° or 270°', icon: <RotateCw className="h-5 w-5" />, color: 'bg-indigo-500' },
      { href: '/tools/compress', title: 'Compress PDF', description: 'Reduce file size with Ghostscript', icon: <Minimize2 className="h-5 w-5" />, color: 'bg-violet-500' },
      { href: '/tools/watermark', title: 'Watermark', description: 'Add text or image watermarks', icon: <Droplets className="h-5 w-5" />, color: 'bg-cyan-500' },
      { href: '/tools/extract', title: 'Extract Pages', description: 'Extract a page range from a PDF', icon: <FileOutput className="h-5 w-5" />, color: 'bg-sky-500' },
      { href: '/tools/delete-pages', title: 'Delete Pages', description: 'Remove specific pages from a PDF', icon: <Trash2 className="h-5 w-5" />, color: 'bg-rose-500' },
      { href: '/tools/reorder', title: 'Reorder Pages', description: 'Rearrange pages in any order', icon: <AlignJustify className="h-5 w-5" />, color: 'bg-amber-500' },
    ],
  },
  {
    heading: 'Convert',
    color: 'text-emerald-700',
    tools: [
      { href: '/tools/word-to-pdf', title: 'Word to PDF', description: 'DOCX/DOC → PDF via LibreOffice', icon: <FileInput className="h-5 w-5" />, color: 'bg-blue-700' },
      { href: '/tools/excel-to-pdf', title: 'Excel to PDF', description: 'XLSX/XLS → PDF via LibreOffice', icon: <FileSpreadsheet className="h-5 w-5" />, color: 'bg-emerald-600' },
      { href: '/tools/ppt-to-pdf', title: 'PPT to PDF', description: 'PPTX/PPT → PDF via LibreOffice', icon: <Presentation className="h-5 w-5" />, color: 'bg-orange-500' },
      { href: '/tools/pdf-to-word', title: 'PDF to Word', description: 'Convert PDF to editable DOCX', icon: <FileType className="h-5 w-5" />, color: 'bg-blue-600', badge: 'Slow', badgeVariant: 'orange' as const },
      { href: '/tools/image-to-pdf', title: 'Image to PDF', description: 'PNG/JPEG/WebP/TIFF → PDF', icon: <Image className="h-5 w-5" />, color: 'bg-pink-500' },
      { href: '/tools/pdf-to-image', title: 'PDF to Image', description: 'Convert PDF pages to PNG or JPG', icon: <FileImage className="h-5 w-5" />, color: 'bg-purple-500' },
    ],
  },
  {
    heading: 'Security & Metadata',
    color: 'text-rose-700',
    tools: [
      { href: '/tools/protect', title: 'Protect PDF', description: 'Add AES-256 password protection', icon: <Lock className="h-5 w-5" />, color: 'bg-slate-700' },
      { href: '/tools/unlock', title: 'Unlock PDF', description: 'Remove password from a PDF', icon: <Unlock className="h-5 w-5" />, color: 'bg-slate-600' },
      { href: '/tools/remove-metadata', title: 'Remove Metadata', description: 'Strip all embedded metadata', icon: <ShieldOff className="h-5 w-5" />, color: 'bg-slate-500' },
      { href: '/tools/pdf-info', title: 'PDF Info', description: 'View full metadata and page details', icon: <Info className="h-5 w-5" />, color: 'bg-teal-600' },
      { href: '/tools/duplicate', title: 'Duplicate Pages', description: 'Duplicate specific pages in a PDF', icon: <Copy className="h-5 w-5" />, color: 'bg-amber-600' },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
          No signup · No watermarks · Files deleted in 1 hour
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          All the PDF tools<br className="hidden sm:block" />
          <span className="text-blue-600"> you actually need</span>
        </h1>
        <p className="text-base text-slate-500 max-w-lg mx-auto leading-relaxed sm:text-lg">
          Upload a file, process it, download the result. That&apos;s it.
          No account, no limits, no nonsense.
        </p>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4" aria-label="Platform stats">
        {[
          { value: '100 MB', label: 'Max file size' },
          { value: '1 hour', label: 'Auto-delete' },
          { value: '20+', label: 'Free tools' },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm sm:p-4">
            <p className="text-xl font-extrabold text-slate-900 sm:text-2xl">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </section>

      {/* Tool groups */}
      {toolGroups.map((group) => (
        <section key={group.heading} aria-labelledby={`group-${group.heading}`}>
          <h2
            id={`group-${group.heading}`}
            className={`text-xs font-bold uppercase tracking-widest mb-3 ${group.color}`}
          >
            {group.heading}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.tools.map((tool) => (
              <ToolCard key={tool.href} {...tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
