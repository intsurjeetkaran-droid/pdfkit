import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ label, size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-8', className)} role="status" aria-live="polite">
      <Loader2 className={cn('animate-spin text-blue-600', sizes[size])} aria-hidden="true" />
      {label && <p className="text-sm text-slate-500 font-medium">{label}</p>}
      {!label && <span className="sr-only">Loading…</span>}
    </div>
  );
}
