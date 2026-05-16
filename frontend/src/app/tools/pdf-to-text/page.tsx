'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { pdfToText } from '@/lib/api';

export default function PDFToTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function reset() { setFile(null); setResult(null); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select a PDF file.'); return; }
    setLoading(true); setError(null);
    try {
      setResult(await pdfToText(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed.');
    } finally { setLoading(false); }
  }

  const outName = file?.name.replace(/\.pdf$/i, '.txt') ?? 'extracted.txt';

  return (
    <ToolLayout
      title="PDF to Text"
      description="Extract all text content from a PDF. Preserves layout using pdftotext. Fast — no external rendering needed."
      icon={<FileText className="h-6 w-6" />}
    >
      {result ? (
        <DownloadSuccess blob={result} filename={outName} onReset={reset} />
      ) : (
        <>
          <FileDropzone
            file={file}
            onFiles={(f) => { setFile(f[0]); setError(null); setResult(null); }}
          />

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">What to expect:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Text-layer PDFs extract perfectly</li>
              <li>Scanned PDFs may produce empty or garbled output</li>
              <li>Layout is preserved as much as possible</li>
            </ul>
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleConvert}>
            {loading ? 'Extracting text…' : 'Extract Text'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
