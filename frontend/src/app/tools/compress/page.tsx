'use client';

import { useState } from 'react';
import { Minimize2 } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import DownloadSuccess from '@/components/DownloadSuccess';
import { compressPDF, downloadBlob, type CompressQuality } from '@/lib/api';
import { cn } from '@/lib/cn';

const QUALITY_OPTIONS: { value: CompressQuality; label: string; desc: string; dpi: string }[] = [
  { value: 'screen', label: 'Screen', desc: 'Smallest file, web viewing', dpi: '72 DPI' },
  { value: 'ebook', label: 'eBook', desc: 'Good balance — recommended', dpi: '150 DPI' },
  { value: 'printer', label: 'Printer', desc: 'High quality print', dpi: '300 DPI' },
  { value: 'prepress', label: 'Prepress', desc: 'Professional print, color preserved', dpi: '300 DPI' },
];

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<CompressQuality>('ebook');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setDone(false); setError(null); setStats(null); }

  async function handleCompress() {
    if (!file) { setError('Select a PDF file.'); return; }
    setLoading(true); setError(null); setStats(null);
    try {
      const blob = await compressPDF(file, quality);
      const origMB = (file.size / 1024 / 1024).toFixed(2);
      const compMB = (blob.size / 1024 / 1024).toFixed(2);
      const pct = Math.max(0, Math.round((1 - blob.size / file.size) * 100));
      setStats(`${origMB} MB → ${compMB} MB (${pct}% smaller)`);
      downloadBlob(blob, 'compressed.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce PDF file size using Ghostscript. May take up to 30 seconds for large files."
      icon={<Minimize2 className="h-6 w-6" />}
      badge={<Badge variant="orange">Heavy op</Badge>}
    >
      {done ? (
        <DownloadSuccess filename="compressed.pdf" onReset={reset} stats={stats ?? undefined} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }} />

          {file && (
            <p className="text-xs text-slate-400 -mt-2">
              Original: {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}

          {/* Quality selector */}
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 mb-2">Compression quality</legend>
            <div className="grid grid-cols-2 gap-2">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuality(opt.value)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-xl border-2 p-3 text-left transition-all',
                    quality === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn('text-sm font-semibold', quality === opt.value ? 'text-blue-700' : 'text-slate-800')}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{opt.dpi}</span>
                  </div>
                  <span className="text-xs text-slate-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleCompress}>
            {loading ? 'Compressing… please wait' : 'Compress PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
