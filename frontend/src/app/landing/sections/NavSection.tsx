'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from '@/components/Logo';

const navLinks = [
  { href: '#why',          label: 'Why PDFKit'   },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#tools',        label: 'Tools'        },
  { href: '#compare',      label: 'Compare'      },
  { href: '#trust',        label: 'Privacy'      },
];

export default function NavSection() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" aria-label="PDFKit home">
          <Logo size="md" />
        </Link>

        {/* Desktop section links */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="relative px-3 py-1.5 text-sm font-medium text-slate-600 rounded-lg hover:text-blue-600 transition-colors duration-150 group"
            >
              {label}
              {/* Underline slide on hover */}
              <span className="absolute bottom-0.5 left-3 right-3 h-px bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/tools"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-95"
          >
            All tools
          </Link>
          <Link
            href="/tools"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-200"
          >
            Try free <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {label}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/tools"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white"
            >
              Open all tools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
