import Link from 'next/link';
import { Shield, Clock, Zap, HardDrive } from 'lucide-react';
import Logo from '@/components/Logo';

// ─── Column data ──────────────────────────────────────────────────────────────

const pdfTools = [
  { href: '/tools/merge',        label: 'Merge PDF'      },
  { href: '/tools/split',        label: 'Split PDF'      },
  { href: '/tools/rotate',       label: 'Rotate PDF'     },
  { href: '/tools/compress',     label: 'Compress PDF'   },
  { href: '/tools/watermark',    label: 'Watermark PDF'  },
  { href: '/tools/extract',      label: 'Extract Pages'  },
  { href: '/tools/delete-pages', label: 'Delete Pages'   },
  { href: '/tools/reorder',      label: 'Reorder Pages'  },
];

const convertTools = [
  { href: '/tools/word-to-pdf',   label: 'Word to PDF'   },
  { href: '/tools/excel-to-pdf',  label: 'Excel to PDF'  },
  { href: '/tools/ppt-to-pdf',    label: 'PPT to PDF'    },
  { href: '/tools/pdf-to-word',   label: 'PDF to Word'   },
  { href: '/tools/pdf-to-text',   label: 'PDF to Text'   },
  { href: '/tools/image-to-pdf',  label: 'Image to PDF'  },
  { href: '/tools/images-to-pdf', label: 'Images to PDF' },
  { href: '/tools/pdf-to-image',  label: 'PDF to Image'  },
  { href: '/tools/svg-to-pdf',    label: 'SVG to PDF'    },
  { href: '/tools/html-to-pdf',   label: 'HTML to PDF'   },
];

const securityTools = [
  { href: '/tools/protect',         label: 'Protect PDF'     },
  { href: '/tools/unlock',          label: 'Unlock PDF'      },
  { href: '/tools/remove-metadata', label: 'Remove Metadata' },
  { href: '/tools/pdf-info',        label: 'PDF Info'        },
  { href: '/tools/duplicate',       label: 'Duplicate Pages' },
];

const companyLinks = [
  { href: '/about',   label: 'About Us'        },
  { href: '/privacy', label: 'Privacy Policy'  },
  { href: '/terms',   label: 'Terms of Service'},
  { href: '/cookies', label: 'Cookie Policy'   },
  { href: '/contact', label: 'Contact Us'      },
  { href: '/dmca',    label: 'DMCA / Copyright'},
];

const trustItems = [
  { icon: Shield,   text: 'No signup required'     },
  { icon: Clock,    text: 'Files deleted in 1 hour' },
  { icon: Zap,      text: 'Instant processing'      },
  { icon: HardDrive,text: '100 MB max file size'    },
];

// ─── Column component ─────────────────────────────────────────────────────────

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-3">
        {heading}
      </h3>
      <ul className="space-y-2">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="group relative inline-block text-sm text-slate-500 hover:text-blue-600 transition-colors duration-200"
            >
              {label}
              {/* Slide-in underline */}
              <span className="absolute bottom-0 left-0 h-px w-0 bg-blue-500 transition-all duration-300 group-hover:w-full" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">

        {/* Top — logo + tagline */}
        <div className="mb-10 flex flex-col gap-2">
          <Link href="/" aria-label="PDFKit home">
            <Logo size="md" />
          </Link>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Free PDF tools. No account needed. Files auto-delete after 1 hour.
          </p>
        </div>

        {/* 4-column link grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 mb-10">
          <FooterColumn heading="PDF Tools"  links={pdfTools}      />
          <FooterColumn heading="Convert"    links={convertTools}  />
          <FooterColumn heading="Security"   links={securityTools} />
          <FooterColumn heading="Company"    links={companyLinks}  />
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-8 mb-8">
          {trustItems.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
              <Icon className="h-3.5 w-3.5 text-blue-500 shrink-0" aria-hidden="true" />
              {text}
            </div>
          ))}
        </div>

        {/* Bottom bar — copyright + policy links */}
        <div className="border-t border-slate-100 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            © {year} PDFKit. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { href: '/privacy', label: 'Privacy Policy'   },
              { href: '/terms',   label: 'Terms of Service' },
              { href: '/cookies', label: 'Cookie Policy'    },
              { href: '/dmca',    label: 'DMCA'             },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="group relative inline-block text-xs text-slate-400 hover:text-blue-600 transition-colors duration-200"
              >
                {label}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-blue-500 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
