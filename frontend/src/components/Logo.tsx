/**
 * PDFKit Logo — Option 08 (File + Star)
 *
 * Three size variants:
 *   sm  — icon only (32×32)  — used in mobile header, favicon fallback
 *   md  — icon + wordmark    — used in Header, Footer, landing nav
 *   lg  — icon + wordmark    — used in landing hero / large placements
 *
 * The icon is an inline SVG so it scales perfectly at any DPI and
 * requires no image file or external request.
 */

interface LogoProps {
  /** sm = icon only, md = icon + wordmark (default), lg = larger wordmark */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ── Shared icon SVG (file + gold star) ───────────────────────────────────────
function LogoIcon({ dim }: { dim: number }) {
  // All coordinates are designed for a 52×52 viewBox then scaled via width/height
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      width={dim}
      height={dim}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect x="2" y="2" width="48" height="48" rx="12" fill="url(#logo-grad)" />

      {/* White document body */}
      <rect x="12" y="10" width="20" height="26" rx="3" fill="white" />

      {/* Folded corner — top-right of document */}
      <path d="M26 10 L32 16 L26 16 Z" fill="#bfdbfe" />

      {/* Document lines */}
      <rect x="15" y="21" width="11" height="2"   rx="1" fill="#93c5fd" />
      <rect x="15" y="25" width="14" height="2"   rx="1" fill="#93c5fd" />
      <rect x="15" y="29" width="9"  height="2"   rx="1" fill="#93c5fd" />

      {/* Gold star badge — top-right corner of the square */}
      <circle cx="38" cy="14" r="8" fill="#fbbf24" />
      {/* 5-point star inside the gold circle */}
      <path
        d="M38 8.5 L39.4 12.6 L43.8 12.6 L40.2 15.1 L41.6 19.2 L38 16.7 L34.4 19.2 L35.8 15.1 L32.2 12.6 L36.6 12.6 Z"
        fill="white"
      />
    </svg>
  );
}

// ── Full logo (icon + wordmark) ───────────────────────────────────────────────
export default function Logo({ size = 'md', className = '' }: LogoProps) {
  if (size === 'sm') {
    return (
      <span className={`inline-flex shrink-0 ${className}`} aria-label="PDFKit">
        <LogoIcon dim={32} />
      </span>
    );
  }

  const iconDim  = size === 'lg' ? 44 : 36;
  const textSize = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <span className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      <LogoIcon dim={iconDim} />
      <span className={`${textSize} font-extrabold tracking-tight leading-none`}>
        {/* Two-tone wordmark: PDF in blue, Kit in slate */}
        <span className="text-blue-600">PDF</span>
        <span className="text-slate-900">Kit</span>
      </span>
    </span>
  );
}
