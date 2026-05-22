'use client';

import { useState, useEffect, useCallback } from 'react';
import { Scissors } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import PdfPageGrid, { PageItem } from '@/components/PdfPageGrid';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { splitPDF, getPageCount, getPagePreview } from '@/lib/api';

export default function SplitPage() {
  const [file, setFile]             = useState<File | null>(null);
  const [pages, setPages]           = useState<PageItem[]>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<Blob | null>(null);

  const loadPreviews = useCallback(async (f: File) => {
    setLoadingPreviews(true);
    setError(null);
    setSelected(new Set());
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
    else { setPages([]); setSelected(new Set()); }
  }, [file, loadPreviews]);

  useEffect(() => {
    return () => { pages.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); }); };
  }, [pages]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(pages.map((p) => p.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function reset() {
    pages.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    setFile(null); setPages([]); setSelected(new Set());
    setResult(null); setError(null);
  }

  async function handleSplit() {
    if (!file || selected.size === 0) return;
    const pageNums = [...selected]
      .map((id) => parseInt(id.replace('page-', ''), 10))
      .sort((a, b) => a - b);
    setProcessing(true); setError(null);
    try {
      setResult(await splitPDF(file, pageNums));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Split failed.');
    } finally { setProcessing(false); }
  }

  const selectedCount = selected.size;
  const totalPages    = pages.length;

  return (
    <ToolLayout
      title="Split PDF"
      description="Click pages to select which ones to extract into a new PDF."
      icon={<Scissors className="h-6 w-6" />}
      className="max-w-4xl"
    >
      {result ? (
        <DownloadSuccess blob={result} filename="split.pdf" onReset={reset}
          stats={`${selectedCount} page${selectedCount > 1 ? 's' : ''} extracted`} />
      ) : (
        <>
          {!file && (
            <FileDropzone
              onFiles={(f) => { setFile(f[0]); setError(null); }}
              label="Drop your PDF here"
              sublabel="Click pages to select which ones to keep"
            />
          )}

          {file && (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">
                    {file.name}
                  </span>
                  {totalPages > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      {totalPages} pages
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!loadingPreviews && totalPages > 0 && (
                    <>
                      <button
                        onClick={selectAll}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Select all
                      </button>
                      {selectedCount > 0 && (
                        <button
                          onClick={clearAll}
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={reset}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Change file
                  </button>
                </div>
              </div>

              {selectedCount > 0 && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5">
                  <span className="text-sm font-semibold text-blue-700">
                    {selectedCount} page{selectedCount > 1 ? 's' : ''} selected
                  </span>
                  <span className="text-xs text-blue-500">
                    — these will be extracted into a new PDF
                  </span>
                </div>
              )}

              {!selectedCount && !loadingPreviews && (
                <p className="text-xs text-slate-500 text-center">
                  Click any page to select it for extraction. Click again to deselect.
                </p>
              )}

              <PdfPageGrid
                pages={pages}
                mode="duplicate"
                markedPages={selected}
                onMark={toggleSelect}
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
              disabled={selectedCount === 0 || loadingPreviews}
              onClick={handleSplit}
            >
              {processing
                ? 'Extracting pages…'
                : selectedCount > 0
                ? `Extract ${selectedCount} page${selectedCount > 1 ? 's' : ''} to new PDF`
                : 'Select pages to extract'}
            </Button>
          )}
        </>
      )}
    </ToolLayout>
  );
}
