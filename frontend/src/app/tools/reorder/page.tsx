'use client';

import { useState } from 'react';
import { AlignJustify } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { reorderPages, downloadBlob } from '@/lib/api';

export default function ReorderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [orderInput, setOrderInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setOrderInput(''); setDone(false); setError(null); }

  async function handleReorder() {
    if (!file) { setError('Select a PDF file.'); return; }
    const order = orderInput.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
    if (!order.length) { setError('Enter a valid page order, e.g. 3, 1, 2'); return; }
    setLoading(true); setError(null);
    try {
      const blob = await reorderPages(file, order);
      downloadBlob(blob, 'reordered.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Reorder Pages"
      description="Rearrange pages in any order. You can also omit pages to remove them, or repeat a page number to duplicate it."
      icon={<AlignJustify className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename="reordered.pdf" onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }} />

          <Input
            label="New page order"
            placeholder="e.g. 3, 1, 2"
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            hint="Enter page numbers in the desired order, comma-separated"
          />

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Examples:</p>
            <p>• <code className="bg-blue-100 px-1 rounded">3, 1, 2</code> — put page 3 first, then 1, then 2</p>
            <p>• <code className="bg-blue-100 px-1 rounded">1, 1, 2</code> — duplicate page 1</p>
            <p>• <code className="bg-blue-100 px-1 rounded">1, 3</code> — keep only pages 1 and 3</p>
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file || !orderInput.trim()} onClick={handleReorder}>
            {loading ? 'Reordering…' : 'Reorder Pages'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
