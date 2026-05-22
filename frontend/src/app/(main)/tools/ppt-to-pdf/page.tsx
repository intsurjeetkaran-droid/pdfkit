'use client';

import { useState } from 'react';
import { Presentation } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { pptToPDF } from '@/lib/api';

export default function PPTToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function reset() { setFile(null); setResult(null); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select a PowerPoint file.'); return; }
    setLoading(true); setError(null);
    try {
      setResult(await pptToPDF(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  const outName = file?.name.replace(/\.(pptx?|odp)$/i, '.pdf') ?? 'converted.pdf';

  return (
    <ToolLayout title="PowerPoint to PDF" description="Convert PPTX or PPT presentations to PDF using LibreOffice." icon={<Presentation className="h-6 w-6" />}>
      {result ? (
        <DownloadSuccess blob={result} filename={outName} onReset={reset} />
      ) : (
        <>
          <FileDropzone accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint" file={file} onFiles={(f) => { setFile(f[0]); setError(null); setResult(null); }} label="Drop a PowerPoint file here" sublabel="PPTX or PPT · tap to browse" />
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            <strong>Note:</strong> LibreOffice conversion takes 3–15 seconds.
          </div>
          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
          <Button fullWidth size="lg" sticky loading={loading} disabled={!file} onClick={handleConvert}>
            {loading ? 'Converting…' : 'Convert to PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}

