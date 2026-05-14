'use client';

import { X, GripVertical, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  className?: string;
}

export default function FileList({ files, onRemove, className }: FileListProps) {
  if (!files.length) return null;

  return (
    <ul className={cn('space-y-2', className)} aria-label="Selected files">
      {files.map((f, i) => (
        <li
          key={`${f.name}-${i}`}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm animate-fade-in"
        >
          <GripVertical className="h-4 w-4 text-slate-300 shrink-0" aria-hidden="true" />
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
            <FileText className="h-4 w-4 text-red-500" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
            <p className="text-xs text-slate-400">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button
            onClick={() => onRemove(i)}
            aria-label={`Remove ${f.name}`}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
