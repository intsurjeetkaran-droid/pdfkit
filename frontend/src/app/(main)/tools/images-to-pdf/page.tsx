'use client';

import { useState } from 'react';
import { Images } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import FileList from '@/components/FileList';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { imagesToPDF } from '@/lib/api';
import { cn } from '@/lib/cn';

type PageSize = 'A4' | 'Letter' | 'auto';
type Orientation = 'portrait' | 'landscape';
type FitMode = 'contain' | 'cover' | 'stretch';

export default function ImagesToPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [fit, setFit] = useState<FitMode>('contain');
  const [margin, setMargin] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function addFiles(incoming: File[]) {
    setFiles((prev) => [...prev, ...incoming].slice(0, 50));
    setError(null); setResult(null);
  }

  function reset() { setFiles([]); setResult(null); setError(null); }

  async function handleConvert() {
    if (files.length === 0) { setError('Select at least one image.'); return; }
    setLoading(true); setError(null);
    try {
      setResult(await imagesToPDF(files, { pageSize, orientation, fit, margin }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Images to PDF"
      description="Combine multiple images into a single PDF. Each image gets its own page. Supports PNG, JPEG, WebP, TIFF, BMP — up to 50 images."
      icon={<Images className="h-6 w-6" />}
    >
      {result ? (
        <DownloadSuccess blob={result} filename="combined.pdf" onReset={reset} stats={`${files.length} image${files.length > 1 ? 's' : ''} combined`} />
      ) : (
        <>
          <FileDropzone
            accept="image/png,image/jpeg,image/webp,image/tiff,image/bmp"
            multiple
            label="Drop images here"
            sublabel="PNG, JPEG, WebP, TIFF, BMP · up to 50 files"
            files={files}
            onFiles={addFiles}
          />

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {files.length} image{files.length > 1 ? 's' : ''} selected
                </p>
                <button onClick={() => setFiles([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  Clear all
                </button>
              </div>
              <FileList files={files} onRemove={(i) => setFiles((p) => p.filter((_, idx) => idx !== i))} />
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {/* Page size */}
            <fieldset>
              <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Page size</legend>
              <div className="flex flex-col gap-1.5">
                {(['A4', 'Letter', 'auto'] as PageSize[]).map((s) => (
                  <label key={s} className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all text-sm', pageSize === s ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-blue-300')}>
                    <input type="radio" name="pageSize" value={s} checked={pageSize === s} onChange={() => setPageSize(s)} className="accent-blue-600" />
                    {s === 'auto' ? 'Image size' : s}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Fit mode */}
            <fieldset>
              <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Image fit</legend>
              <div className="flex flex-col gap-1.5">
                {([
                  { value: 'contain', label: 'Contain', desc: 'Fit inside page' },
                  { value: 'cover', label: 'Cover', desc: 'Fill page, crop' },
                  { value: 'stretch', label: 'Stretch', desc: 'Fill exactly' },
                ] as { value: FitMode; label: string; desc: string }[]).map((f) => (
                  <label key={f.value} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all', fit === f.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300')}>
                    <input type="radio" name="fit" value={f.value} checked={fit === f.value} onChange={() => setFit(f.value)} className="accent-blue-600 mt-0.5" />
                    <div>
                      <p className={cn('text-sm font-medium', fit === f.value ? 'text-blue-700' : 'text-slate-700')}>{f.label}</p>
                      <p className="text-xs text-slate-400">{f.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Orientation + Margin */}
          <div className="grid grid-cols-2 gap-3">
            {pageSize !== 'auto' && (
              <fieldset>
                <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Orientation</legend>
                <div className="flex gap-2">
                  {(['portrait', 'landscape'] as Orientation[]).map((o) => (
                    <button key={o} type="button" onClick={() => setOrientation(o)}
                      className={cn('flex-1 rounded-xl border-2 py-2 text-xs font-semibold capitalize transition-all', orientation === o ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300')}>
                      {o}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Margin: {margin}pt
              </label>
              <input type="range" min="0" max="60" step="5" value={margin} onChange={(e) => setMargin(parseInt(e.target.value, 10))} className="w-full" aria-label={`Margin: ${margin}pt`} />
              <div className="flex justify-between text-xs text-slate-400"><span>None</span><span>60pt</span></div>
            </div>
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" sticky loading={loading} disabled={files.length === 0} onClick={handleConvert}>
            {loading ? 'Combining images…' : `Combine ${files.length > 0 ? files.length + ' image' + (files.length > 1 ? 's' : '') : 'images'} to PDF`}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}

