'use client';

import { useState } from 'react';
import { FileType } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import DownloadSuccess from '@/components/DownloadSuccess';
import { pdfToWord } from '@/lib/api';

export default function PDFToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function reset() { setFile(null); setResult(null); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select a PDF file.'); return; }
    setLoading(true); setError(null);
    try {
      setResult(await pdfToWord(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  const outName = file?.name.replace(/\.pdf$/i, '.docx') ?? 'converted.docx';

  return (
    <ToolLayout title="PDF to Word" description="Convert PDF to editable DOCX. Text-layer based — scanned PDFs produce a DOCX with embedded images. May take 5–30 seconds." icon={<FileType className="h-6 w-6" />} badge={<Badge variant="orange">Slow</Badge>}>
      {result ? (
        <DownloadSuccess blob={result} filename={outName} onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setResult(null); }} />
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 space-y-1">
            <p><strong>Rate limited:</strong> 20 requests per hour (heavy operation).</p>
            <p><strong>Scanned PDFs:</strong> Text extraction may not work — images will be embedded in the DOCX.</p>
          </div>
          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
          <Button fullWidth size="lg" sticky loading={loading} disabled={!file} onClick={handleConvert}>
            {loading ? 'Converting… this may take a while' : 'Convert to Word'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}

