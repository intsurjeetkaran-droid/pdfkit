import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  backHref?: string;
  className?: string;
}

export default function ToolLayout({
  title,
  description,
  icon,
  badge,
  children,
  backHref = '/',
  className,
}: ToolLayoutProps) {
  return (
    <div className={cn('mx-auto max-w-2xl w-full', className)}>
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-5 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        All tools
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-7">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
            {badge}
          </div>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}
