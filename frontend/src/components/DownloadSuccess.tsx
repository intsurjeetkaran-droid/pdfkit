'use client';

import { CheckCircle2, Download, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { downloadBlob } from '@/lib/api';

interface DownloadSuccessProps {
  blob: Blob;
  filename: string;
  onReset: () => void;
  stats?: string;
}

export default function DownloadSuccess({ blob, filename, onReset, stats }: DownloadSuccessProps) {
  const sizeMB = (blob.size / 1024 / 1024).toFixed(2);

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-green-200 bg-green-50 p-6 text-center animate-slide-up">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="font-bold text-green-800 text-base">Your file is ready!</p>
        <p className="text-sm text-green-700 font-medium truncate max-w-[260px]">{filename}</p>
        <p className="text-xs text-green-500">{sizeMB} MB{stats ? ` · ${stats}` : ''}</p>
      </div>

      {/* Download button — manual, user-triggered */}
      <Button
        size="lg"
        fullWidth
        onClick={() => downloadBlob(blob, filename)}
        className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download {filename}
      </Button>

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-800 transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Process another file
      </button>
    </div>
  );
}
