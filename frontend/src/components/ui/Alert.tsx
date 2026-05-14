'use client';

import { cn } from '@/lib/cn';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const config = {
  error: {
    icon: AlertCircle,
    classes: 'bg-red-50 border-red-200 text-red-800',
    iconClass: 'text-red-500',
  },
  success: {
    icon: CheckCircle2,
    classes: 'bg-green-50 border-green-200 text-green-800',
    iconClass: 'text-green-500',
  },
  info: {
    icon: Info,
    classes: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClass: 'text-blue-500',
  },
};

export default function Alert({ type, message, onDismiss, className }: AlertProps) {
  const { icon: Icon, classes, iconClass } = config[type];
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-fade-in',
        classes,
        className
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconClass)} aria-hidden="true" />
      <span className="flex-1 leading-relaxed">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
