'use client';

import { useState } from 'react';
import { Shapes } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { svgToPDF } from '@/lib/api';
import { cn } from '@/lib/cn';

type PageSize = 'A4' | 'Letter' | 'auto';
type Orientation = 'portrait' | 'landscape';

export default function SVGToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function reset() { setFile(null); setResult(null); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select an SVG file.'); return; }
    setLoading(true); setError(null);
    try {
      setResult(await svgToPDF(file, { pageSize, orientation }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  const outName = file?.name.replace(/\.svg$/i, '.pdf') ?? 'converted.pdf';

  return (
    <ToolLayout
      title="SVG to PDF"
      description="Convert SVG vector graphics to PDF. Rasterized at high quality and centered on the page."
      icon={<Shapes className="h-6 w-6" />}
    >
      {result ? (
        <DownloadSuccess blob={result} filename={outName} onReset={reset} />
      ) : (
        <>
          <FileDropzone
            accept="image/svg+xml,.svg"
            file={file}
            onFiles={(f) => { setFile(f[0]); setError(null); setResult(null); }}
            label="Drop an SVG file here"
            sublabel="SVG · tap to browse"
          />

          {/* Page size */}
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 mb-2">Page size</legend>
            <div className="grid grid-cols-3 gap-2">
              {(['A4', 'Letter', 'auto'] as PageSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPageSize(s)}
                  className={cn(
                    'rounded-xl border-2 py-2.5 text-sm font-semibold transition-all',
                    pageSize === s
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  )}
                >
                  {s === 'auto' ? 'Auto (SVG size)' : s}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Orientation — only relevant for A4/Letter */}
          {pageSize !== 'auto' && (
            <fieldset>
              <legend className="text-sm font-medium text-slate-700 mb-2">Orientation</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['portrait', 'landscape'] as Orientation[]).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOrientation(o)}
                    className={cn(
                      'rounded-xl border-2 py-2.5 text-sm font-semibold capitalize transition-all',
                      orientation === o
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleConvert}>
            {loading ? 'Converting…' : 'Convert to PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
