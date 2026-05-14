'use client';

import { useState } from 'react';
import { FileOutput } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { extractPages, downloadBlob } from '@/lib/api';

export default function ExtractPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fromPage, setFromPage] = useState('');
  const [toPage, setToPage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setFromPage(''); setToPage(''); setDone(false); setError(null); }

  async function handleExtract() {
    if (!file) { setError('Select a PDF file.'); return; }
    const from = parseInt(fromPage, 10);
    const to = parseInt(toPage, 10);
    if (isNaN(from) || isNaN(to) || from < 1 || to < from) {
      setError('Enter a valid page range. "From" must be less than or equal to "To".');
      return;
    }
    setLoading(true); setError(null);
    try {
      const blob = await extractPages(file, from, to);
      downloadBlob(blob, `pages-${from}-${to}.pdf`);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extract failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Extract Pages"
      description="Extract a contiguous range of pages from a PDF into a new file."
      icon={<FileOutput className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename={`pages-${fromPage}-${toPage}.pdf`} onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }} />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="From page"
              type="number"
              min="1"
              placeholder="e.g. 2"
              value={fromPage}
              onChange={(e) => setFromPage(e.target.value)}
            />
            <Input
              label="To page"
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={toPage}
              onChange={(e) => setToPage(e.target.value)}
            />
          </div>

          {fromPage && toPage && parseInt(fromPage) <= parseInt(toPage) && (
            <p className="text-xs text-blue-600 font-medium">
              Will extract {parseInt(toPage) - parseInt(fromPage) + 1} page{parseInt(toPage) - parseInt(fromPage) + 1 > 1 ? 's' : ''}
            </p>
          )}

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file || !fromPage || !toPage} onClick={handleExtract}>
            {loading ? 'Extracting…' : 'Extract Pages'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
