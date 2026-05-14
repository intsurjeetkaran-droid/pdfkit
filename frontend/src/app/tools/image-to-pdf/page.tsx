'use client';

import { useState } from 'react';
import { Image } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { imageToPDF, downloadBlob } from '@/lib/api';

export default function ImageToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setDone(false); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select an image file.'); return; }
    setLoading(true); setError(null);
    try {
      const blob = await imageToPDF(file);
      downloadBlob(blob, file.name.replace(/\.(png|jpe?g|webp|tiff?|bmp)$/i, '.pdf') || 'converted.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Image to PDF"
      description="Convert PNG, JPEG, WebP, TIFF, or BMP to a PDF document. Fast — no external tools needed."
      icon={<Image className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename={file?.name.replace(/\.(png|jpe?g|webp|tiff?|bmp)$/i, '.pdf') || 'converted.pdf'} onReset={reset} />
      ) : (
        <>
          <FileDropzone
            accept="image/png,image/jpeg,image/webp,image/tiff,image/bmp"
            file={file}
            onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }}
            label="Drop an image here"
            sublabel="PNG, JPEG, WebP, TIFF, BMP · tap to browse"
          />

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleConvert}>
            {loading ? 'Converting…' : 'Convert to PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
