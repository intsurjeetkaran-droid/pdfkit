'use client';

import { useState } from 'react';
import { FileImage } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { pdfToImage, downloadBlob, type PDFToImageResult } from '@/lib/api';
import { cn } from '@/lib/cn';

type MultiResult = Exclude<PDFToImageResult, Blob>;

export default function PDFToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [dpi, setDpi] = useState(150);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [singleBlob, setSingleBlob] = useState<Blob | null>(null);
  const [multiResult, setMultiResult] = useState<MultiResult | null>(null);

  function reset() { setFile(null); setSingleBlob(null); setMultiResult(null); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select a PDF file.'); return; }
    setLoading(true); setError(null); setSingleBlob(null); setMultiResult(null);
    try {
      const result = await pdfToImage(file, format, dpi);
      if (result instanceof Blob) {
        setSingleBlob(result);
      } else {
        setMultiResult(result as MultiResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  if (singleBlob) {
    return (
      <ToolLayout title="PDF to Image" description="Convert PDF pages to PNG or JPG." icon={<FileImage className="h-6 w-6" />}>
        <DownloadSuccess blob={singleBlob} filename={`page-1.${format}`} onReset={reset} />
      </ToolLayout>
    );
  }

  if (multiResult) {
    return (
      <ToolLayout title="PDF to Image" description="Convert PDF pages to PNG or JPG." icon={<FileImage className="h-6 w-6" />}>
        <div className="space-y-4 animate-slide-up">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-800">{multiResult.pageCount} pages converted to {multiResult.format.toUpperCase()} at {multiResult.dpi} DPI</p>
            <p className="text-xs text-green-600 mt-1">Images are stored temporarily on the server.</p>
          </div>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {multiResult.files.map((f) => (
              <li key={f.page} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="text-xs font-bold text-slate-400 w-8">P{f.page}</span>
                <span className="text-slate-700 truncate">{f.filename}</span>
              </li>
            ))}
          </ul>
          <Button variant="ghost" fullWidth onClick={reset}>Convert another</Button>
        </div>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout title="PDF to Image" description="Convert PDF pages to PNG or JPG. Single-page PDFs download directly; multi-page PDFs return a list." icon={<FileImage className="h-6 w-6" />}>
      <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); }} />
      <div className="grid grid-cols-2 gap-4">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700 mb-2">Format</legend>
          <div className="flex gap-2">
            {(['png', 'jpg'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFormat(f)}
                className={cn('flex-1 rounded-xl border-2 py-2 text-sm font-semibold uppercase transition-all', format === f ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300')}>
                {f}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">DPI: {dpi}</label>
          <input type="range" min="72" max="300" step="6" value={dpi} onChange={(e) => setDpi(parseInt(e.target.value, 10))} className="w-full" aria-label={`DPI: ${dpi}`} />
          <div className="flex justify-between text-xs text-slate-400"><span>72</span><span>300</span></div>
        </div>
      </div>
      {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
      <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleConvert}>
        {loading ? 'Converting…' : 'Convert to Images'}
      </Button>
    </ToolLayout>
  );
}
