'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlignJustify } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import PdfPageGrid, { PageItem } from '@/components/PdfPageGrid';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { reorderPages, getPageCount, getPagePreview } from '@/lib/api';

export default function ReorderPage() {
  const [file, setFile]             = useState<File | null>(null);
  const [pages, setPages]           = useState<PageItem[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<Blob | null>(null);
  const [hasReordered, setHasReordered] = useState(false);

  const loadPreviews = useCallback(async (f: File) => {
    setLoadingPreviews(true);
    setError(null);
    setHasReordered(false);
    try {
      const count = await getPageCount(f);
      const initial: PageItem[] = Array.from({ length: count }, (_, i) => ({
        id: `page-${i + 1}`,
        pageNum: i + 1,
        previewUrl: null,
      }));
      setPages(initial);
      setLoadingPreviews(false);

      for (let i = 0; i < count; i++) {
        try {
          const blob = await getPagePreview(f, i + 1, 72);
          const url  = URL.createObjectURL(blob);
          setPages((prev) =>
            prev.map((p) => (p.pageNum === i + 1 ? { ...p, previewUrl: url } : p))
          );
        } catch { /* leave null */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read PDF.');
      setLoadingPreviews(false);
    }
  }, []);

  useEffect(() => {
    if (file) loadPreviews(file);
    else { setPages([]); setHasReordered(false); }
  }, [file, loadPreviews]);

  useEffect(() => {
    return () => { pages.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); }); };
  }, [pages]);

  function handleReorder(newPages: PageItem[]) {
    setPages(newPages);
    setHasReordered(true);
  }

  function reset() {
    pages.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    setFile(null); setPages([]); setHasReordered(false);
    setResult(null); setError(null);
  }

  async function handleApply() {
    if (!file) return;
    // Build the new order from current pages array (pageNum = original 1-indexed number)
    const order = pages.map((p) => p.pageNum);
    setProcessing(true); setError(null);
    try {
      setResult(await reorderPages(file, order));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed.');
    } finally { setProcessing(false); }
  }

  return (
    <ToolLayout
      title="Reorder Pages"
      description="Drag and drop pages into the order you want, then apply."
      icon={<AlignJustify className="h-6 w-6" />}
      className="max-w-4xl"
    >
      {result ? (
        <DownloadSuccess blob={result} filename="reordered.pdf" onReset={reset} />
      ) : (
        <>
          {!file && (
            <FileDropzone
              onFiles={(f) => { setFile(f[0]); setError(null); }}
              label="Drop your PDF here"
              sublabel="Drag pages to rearrange them"
            />
          )}

          {file && (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                    {file.name}
                  </span>
                  {pages.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      {pages.length} pages
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasReordered && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                      Reordered
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

              <p className="text-xs text-slate-500 text-center">
                Drag any page to a new position. The order shown is the order in the output PDF.
              </p>

              <PdfPageGrid
                pages={pages}
                mode="reorder"
                markedPages={new Set()}
                onMark={() => {}}
                onReorder={handleReorder}
                loading={loadingPreviews}
              />
            </>
          )}

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          {file && (
            <Button
              fullWidth
              size="lg"
              loading={processing}
              disabled={!hasReordered || loadingPreviews}
              onClick={handleApply}
            >
              {processing ? 'Applying order…' : hasReordered ? 'Apply new order' : 'Drag pages to reorder'}
            </Button>
          )}
        </>
      )}
    </ToolLayout>
  );
}
