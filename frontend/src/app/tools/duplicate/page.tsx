'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { organizeDuplicate } from '@/lib/api';

export default function DuplicatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [pagesInput, setPagesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function reset() { setFile(null); setPagesInput(''); setResult(null); setError(null); }

  async function handleDuplicate() {
    if (!file) { setError('Select a PDF file.'); return; }
    const pages = pagesInput.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
    if (!pages.length) { setError('Enter valid page numbers, e.g. 2, 3'); return; }
    setLoading(true); setError(null);
    try {
      setResult(await organizeDuplicate(file, pages));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duplicate failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout title="Duplicate Pages" description="Duplicate specific pages. Each duplicate is inserted right after the original page." icon={<Copy className="h-6 w-6" />}>
      {result ? (
        <DownloadSuccess blob={result} filename="duplicated.pdf" onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setResult(null); }} />
          <Input label="Pages to duplicate" placeholder="e.g. 2, 3" value={pagesInput} onChange={(e) => setPagesInput(e.target.value)} hint="1-indexed page numbers, comma-separated. Each duplicate is inserted after the original." />
          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
          <Button fullWidth size="lg" loading={loading} disabled={!file || !pagesInput.trim()} onClick={handleDuplicate}>
            {loading ? 'Duplicating…' : 'Duplicate Pages'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
