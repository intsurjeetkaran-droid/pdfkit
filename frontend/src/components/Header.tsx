'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const navGroups = [
  {
    label: 'PDF Tools',
    items: [
      { href: '/tools/merge', label: 'Merge PDF' },
      { href: '/tools/split', label: 'Split PDF' },
      { href: '/tools/rotate', label: 'Rotate PDF' },
      { href: '/tools/compress', label: 'Compress PDF' },
      { href: '/tools/watermark', label: 'Watermark' },
      { href: '/tools/delete-pages', label: 'Delete Pages' },
      { href: '/tools/extract', label: 'Extract Pages' },
      { href: '/tools/reorder', label: 'Reorder Pages' },
    ],
  },
  {
    label: 'Convert',
    items: [
      { href: '/tools/word-to-pdf', label: 'Word to PDF' },
      { href: '/tools/excel-to-pdf', label: 'Excel to PDF' },
      { href: '/tools/ppt-to-pdf', label: 'PPT to PDF' },
      { href: '/tools/pdf-to-word', label: 'PDF to Word' },
      { href: '/tools/image-to-pdf', label: 'Image to PDF' },
      { href: '/tools/pdf-to-image', label: 'PDF to Image' },
    ],
  },
  {
    label: 'Security',
    items: [
      { href: '/tools/protect', label: 'Protect PDF' },
      { href: '/tools/unlock', label: 'Unlock PDF' },
      { href: '/tools/remove-metadata', label: 'Remove Metadata' },
    ],
  },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-blue-600 text-lg shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <span>PDFKit</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="relative group">
              <button
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-haspopup="true"
              >
                {group.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-200" aria-hidden="true" />
              </button>
              {/* Dropdown */}
              <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 origin-top-left scale-95 group-hover:scale-100 z-50">
                <div className="p-1.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <Link
            href="/tools/pdf-info"
            className="px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            PDF Info
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white animate-slide-up">
          <nav className="px-4 py-3 space-y-1" aria-label="Mobile navigation">
            {navGroups.map((group) => (
              <div key={group.label}>
                <button
                  onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  aria-expanded={openGroup === group.label}
                >
                  {group.label}
                  <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', openGroup === group.label && 'rotate-180')} aria-hidden="true" />
                </button>
                {openGroup === group.label && (
                  <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-blue-100 pl-3 animate-fade-in">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/tools/pdf-info"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              PDF Info
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
