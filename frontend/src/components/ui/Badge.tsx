import { cn } from '@/lib/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'orange' | 'gray';
  className?: string;
}

export default function Badge({ children, variant = 'blue', className }: BadgeProps) {
  const variants = {
    blue: 'badge-blue',
    green: 'badge-green',
    orange: 'badge-orange',
    gray: 'badge-gray',
  };
  return <span className={cn('badge', variants[variant], className)}>{children}</span>;
}
