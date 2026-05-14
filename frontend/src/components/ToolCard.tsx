import Link from 'next/link';
import { cn } from '@/lib/cn';

interface ToolCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'blue' | 'orange' | 'green' | 'gray';
  color?: string;
}

const badgeColors = {
  blue: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-slate-100 text-slate-600',
};

export default function ToolCard({
  href,
  title,
  description,
  icon,
  badge,
  badgeVariant = 'blue',
  color = 'bg-blue-600',
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
    >
      {badge && (
        <span className={cn('absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', badgeColors[badgeVariant])}>
          {badge}
        </span>
      )}
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm', color)}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
