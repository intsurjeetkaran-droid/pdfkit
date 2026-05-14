'use client';

import { useState } from 'react';
import { Merge } from 'lucide-react';
import type { Metadata } from 'next';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import FileList from '@/components/FileList';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { mergePDFs, downloadBlob } from '@/lib/api';

export default function MergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function addFiles(incoming: File[]) {
    setFiles((prev) => [...prev, ...incoming].slice(0, 20));
    setError(null);
    setDone(false);
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function reset() {
    setFiles([]);
    setDone(false);
    setError(null);
  }

  async function handleMerge() {
    if (files.length < 2) { setError('Select at least 2 PDF files.'); return; }
    setLoading(true);
    setError(null);
    try {
      const blob = await mergePDFs(files);
      downloadBlob(blob, 'merged.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine 2–20 PDFs into one document. Files are merged in the order shown."
      icon={<Merge className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename="merged.pdf" onReset={reset} stats={`${files.length} files merged`} />
      ) : (
        <>
          <FileDropzone
            multiple
            label="Drop PDFs here"
            sublabel="Up to 20 files · tap to browse"
            files={files}
            onFiles={addFiles}
          />

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </p>
                <button onClick={() => setFiles([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  Clear all
                </button>
              </div>
              <FileList files={files} onRemove={removeFile} />
            </div>
          )}

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button
            fullWidth
            size="lg"
            loading={loading}
            disabled={files.length < 2}
            onClick={handleMerge}
          >
            {loading ? 'Merging…' : `Merge ${files.length > 0 ? files.length + ' files' : 'PDFs'}`}
          </Button>

          {files.length < 2 && files.length > 0 && (
            <p className="text-center text-xs text-slate-400">Add at least one more file to merge</p>
          )}
        </>
      )}
    </ToolLayout>
  );
}
