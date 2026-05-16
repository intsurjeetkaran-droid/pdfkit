'use client';

import { useState } from 'react';
import { Image } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { imageToPDF } from '@/lib/api';

export default function ImageToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function reset() { setFile(null); setResult(null); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select an image file.'); return; }
    setLoading(true); setError(null);
    try {
      setResult(await imageToPDF(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  const outName = file?.name.replace(/\.(png|jpe?g|webp|tiff?|bmp)$/i, '.pdf') ?? 'converted.pdf';

  return (
    <ToolLayout title="Image to PDF" description="Convert PNG, JPEG, WebP, TIFF, or BMP to a PDF document. Fast — no external tools needed." icon={<Image className="h-6 w-6" />}>
      {result ? (
        <DownloadSuccess blob={result} filename={outName} onReset={reset} />
      ) : (
        <>
          <FileDropzone accept="image/png,image/jpeg,image/webp,image/tiff,image/bmp" file={file} onFiles={(f) => { setFile(f[0]); setError(null); setResult(null); }} label="Drop an image here" sublabel="PNG, JPEG, WebP, TIFF, BMP · tap to browse" />
          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleConvert}>
            {loading ? 'Converting…' : 'Convert to PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
