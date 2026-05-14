'use client';

import { useState } from 'react';
import { ShieldOff } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { removeMetadata, downloadBlob } from '@/lib/api';

export default function RemoveMetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setDone(false); setError(null); }

  async function handleRemove() {
    if (!file) { setError('Select a PDF file.'); return; }
    setLoading(true); setError(null);
    try {
      const blob = await removeMetadata(file);
      downloadBlob(blob, 'clean.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove metadata.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Remove Metadata"
      description="Strip all embedded metadata from a PDF — title, author, creation date, XMP streams, and more."
      icon={<ShieldOff className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename="clean.pdf" onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }} />

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">What gets removed:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Title, Author, Subject, Keywords</li>
              <li>Creator, Producer, Creation date, Modification date</li>
              <li>XMP metadata streams</li>
            </ul>
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleRemove}>
            {loading ? 'Removing metadata…' : 'Remove Metadata'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
