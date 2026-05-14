'use client';

import { useState } from 'react';
import { Scissors } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { splitPDF, downloadBlob } from '@/lib/api';

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pagesInput, setPagesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function parsePages(input: string): number[] | null {
    const parts = input.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return null;
    const nums = parts.map((p) => parseInt(p, 10));
    if (nums.some((n) => isNaN(n) || n < 1)) return null;
    return nums;
  }

  function reset() { setFile(null); setPagesInput(''); setDone(false); setError(null); }

  async function handleSplit() {
    if (!file) { setError('Select a PDF file.'); return; }
    const pages = parsePages(pagesInput);
    if (!pages) { setError('Enter valid page numbers separated by commas, e.g. 1, 3, 5'); return; }
    setLoading(true); setError(null);
    try {
      const blob = await splitPDF(file, pages);
      downloadBlob(blob, 'split.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Split failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Split PDF"
      description="Extract specific pages into a new PDF. Enter the page numbers you want to keep."
      icon={<Scissors className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename="split.pdf" onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }} />

          <Input
            label="Pages to extract"
            placeholder="e.g. 1, 3, 5"
            value={pagesInput}
            onChange={(e) => setPagesInput(e.target.value)}
            hint="1-indexed page numbers, comma-separated"
          />

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file || !pagesInput.trim()} onClick={handleSplit}>
            {loading ? 'Splitting…' : 'Split PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
