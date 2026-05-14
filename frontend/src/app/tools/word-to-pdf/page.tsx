'use client';

import { useState } from 'react';
import { FileInput } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { wordToPDF, downloadBlob } from '@/lib/api';

export default function WordToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setDone(false); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select a Word file.'); return; }
    setLoading(true); setError(null);
    try {
      const blob = await wordToPDF(file);
      downloadBlob(blob, file.name.replace(/\.(docx?|odt)$/i, '.pdf') || 'converted.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert DOCX or DOC to PDF using LibreOffice. Typically takes 3–15 seconds."
      icon={<FileInput className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename={file?.name.replace(/\.(docx?|odt)$/i, '.pdf') || 'converted.pdf'} onReset={reset} />
      ) : (
        <>
          <FileDropzone
            accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            file={file}
            onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }}
            label="Drop a Word file here"
            sublabel="DOCX or DOC · tap to browse"
          />

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
