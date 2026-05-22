'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import PdfPageGrid, { PageItem } from '@/components/PdfPageGrid';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { deletePages, getPageCount, getPagePreview } from '@/lib/api';

export default function DeletePagesPage() {
  const [file, setFile]           = useState<File | null>(null);
  const [pages, setPages]         = useState<PageItem[]>([]);
  const [marked, setMarked]       = useState<Set<string>>(new Set());
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<Blob | null>(null);

  // ── Load page previews when file is selected ──────────────────────────────
  const loadPreviews = useCallback(async (f: File) => {
    setLoadingPreviews(true);
    setError(null);
    setMarked(new Set());
    try {
      const count = await getPageCount(f);
      // Initialise pages with null previews so grid shows skeletons immediately
      const initial: PageItem[] = Array.from({ length: count }, (_, i) => ({
        id: `page-${i + 1}`,
        pageNum: i + 1,
        previewUrl: null,
      }));
      setPages(initial);
      setLoadingPreviews(false);

      // Load previews one by one and update as they arrive
      for (let i = 0; i < count; i++) {
        try {
          const blob = await getPagePreview(f, i + 1, 72);
          const url  = URL.createObjectURL(blob);
          setPages((prev) =>
            prev.map((p) => (p.pageNum === i + 1 ? { ...p, previewUrl: url } : p))
          );
        } catch {
          // Preview failed for this page — leave null (shows placeholder)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read PDF.');
      setLoadingPreviews(false);
    }
  }, []);

  useEffect(() => {
    if (file) loadPreviews(file);
    else { setPages([]); setMarked(new Set()); }
  }, [file, loadPreviews]);

  // Revoke object URLs on unmount / file change
  useEffect(() => {
    return () => { pages.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); }); };
  }, [pages]);

  function toggleMark(id: string) {
    setMarked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function reset() {
    pages.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    setFile(null); setPages([]); setMarked(new Set());
    setResult(null); setError(null);
  }

  async function handleDelete() {
    if (!file || marked.size === 0) return;
    const pageNums = [...marked].map((id) => parseInt(id.replace('page-', ''), 10));
    setProcessing(true); setError(null);
    try {
      setResult(await deletePages(file, pageNums));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete pages failed.');
    } finally { setProcessing(false); }
  }

  const markedCount = marked.size;
  const totalPages  = pages.length;

  return (
    <ToolLayout
      title="Delete Pages"
      description="Click the × on any page to mark it for deletion, then apply."
      icon={<Trash2 className="h-6 w-6" />}
      className="max-w-4xl"
    >
      {result ? (
        <DownloadSuccess blob={result} filename="edited.pdf" onReset={reset}
          stats={`${markedCount} page${markedCount > 1 ? 's' : ''} removed`} />
      ) : (
        <>
          {/* Upload */}
          {!file && (
            <FileDropzone
              onFiles={(f) => { setFile(f[0]); setError(null); }}
              label="Drop your PDF here"
              sublabel="Click pages to mark them for deletion"
            />
          )}

          {/* Page grid */}
          {file && (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                    {file.name}
                  </span>
                  {totalPages > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      {totalPages} pages
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {markedCount > 0 && (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
                      {markedCount} marked
                    </span>
                  )}
                  <button
                    onClick={reset}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Change file
                  </button>
                </div>
              </div>

              {/* Instruction */}
              <p className="text-xs text-slate-500 text-center">
                Click any page to mark it for deletion. Click again to unmark.
              </p>

              <PdfPageGrid
                pages={pages}
                mode="delete"
                markedPages={marked}
                onMark={toggleMark}
                loading={loadingPreviews}
              />
            </>
          )}

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          {file && (
            <Button
              variant="danger"
              fullWidth
              size="lg"
              loading={processing}
              disabled={markedCount === 0 || loadingPreviews}
              onClick={handleDelete}
            >
              {processing
                ? 'Removing pages…'
                : markedCount > 0
                ? `Delete ${markedCount} page${markedCount > 1 ? 's' : ''}`
                : 'Select pages to delete'}
            </Button>
          )}
        </>
      )}
    </ToolLayout>
  );
}
