'use client';

import { CheckCircle2, Download, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

interface DownloadSuccessProps {
  filename: string;
  onReset: () => void;
  stats?: string;
}

export default function DownloadSuccess({ filename, onReset, stats }: DownloadSuccessProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-6 text-center animate-slide-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-green-800">Download started!</p>
        <p className="text-sm text-green-600 mt-0.5">{filename}</p>
        {stats && <p className="text-xs text-green-500 mt-1">{stats}</p>}
      </div>
      <div className="flex gap-3 w-full">
        <Button variant="ghost" size="sm" onClick={onReset} className="flex-1 gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Process another
        </Button>
      </div>
    </div>
  );
}
