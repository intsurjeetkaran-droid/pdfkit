'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { deletePages, downloadBlob } from '@/lib/api';

export default function DeletePagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pagesInput, setPagesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setPagesInput(''); setDone(false); setError(null); }

  async function handleDelete() {
    if (!file) { setError('Select a PDF file.'); return; }
    const pages = pagesInput.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
    if (!pages.length) { setError('Enter valid page numbers, e.g. 2, 4, 6'); return; }
    setLoading(true); setError(null);
    try {
      const blob = await deletePages(file, pages);
      downloadBlob(blob, 'edited.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete pages failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Delete Pages"
      description="Remove specific pages from a PDF. The remaining pages are saved as a new file."
      icon={<Trash2 className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename="edited.pdf" onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }} />

          <Input
            label="Pages to delete"
            placeholder="e.g. 2, 4, 6"
            value={pagesInput}
            onChange={(e) => setPagesInput(e.target.value)}
            hint="1-indexed page numbers, comma-separated"
          />

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button variant="danger" fullWidth size="lg" loading={loading} disabled={!file || !pagesInput.trim()} onClick={handleDelete}>
            {loading ? 'Removing pages…' : 'Delete Pages'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
