'use client';

import { useState } from 'react';
import { FileInput } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { wordToPDF } from '@/lib/api';

export default function WordToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function reset() { setFile(null); setResult(null); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select a Word file.'); return; }
    setLoading(true); setError(null);
    try {
      setResult(await wordToPDF(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  const outName = file?.name.replace(/\.(docx?|odt)$/i, '.pdf') ?? 'converted.pdf';

  return (
    <ToolLayout title="Word to PDF" description="Convert DOCX or DOC to PDF using LibreOffice. Typically takes 3–15 seconds." icon={<FileInput className="h-6 w-6" />}>
      {result ? (
        <DownloadSuccess blob={result} filename={outName} onReset={reset} />
      ) : (
        <>
          <FileDropzone accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" file={file} onFiles={(f) => { setFile(f[0]); setError(null); setResult(null); }} label="Drop a Word file here" sublabel="DOCX or DOC · tap to browse" />
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            <strong>Note:</strong> LibreOffice conversion takes 3–15 seconds. Please wait after clicking convert.
          </div>
          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleConvert}>
            {loading ? 'Converting with LibreOffice…' : 'Convert to PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
