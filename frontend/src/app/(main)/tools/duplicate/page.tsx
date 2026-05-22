'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import PdfPageGrid, { PageItem } from '@/components/PdfPageGrid';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { organizeDuplicate, getPageCount, getPagePreview } from '@/lib/api';

export default function DuplicatePage() {
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

  function reset() {
    pages.forEach((p) => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    setFile(null); setPages([]); setSelected(new Set());
    setResult(null); setError(null);
  }

  async function handleDuplicate() {
    if (!file || selected.size === 0) return;
    const pageNums = [...selected].map((id) => parseInt(id.replace('page-', ''), 10));
    setProcessing(true); setError(null);
    try {
      setResult(await organizeDuplicate(file, pageNums));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duplicate failed.');
    } finally { setProcessing(false); }
  }

  const selectedCount = selected.size;

  return (
    <ToolLayout
      title="Duplicate Pages"
      description="Click pages to select them for duplication. Each copy is inserted right after the original."
      icon={<Copy className="h-6 w-6" />}
      className="max-w-4xl"
    >
      {result ? (
        <DownloadSuccess blob={result} filename="duplicated.pdf" onReset={reset}
          stats={`${selectedCount} page${selectedCount > 1 ? 's' : ''} duplicated`} />
      ) : (
        <>
          {!file && (
            <FileDropzone
              onFiles={(f) => { setFile(f[0]); setError(null); }}
              label="Drop your PDF here"
              sublabel="Click pages to select them for duplication"
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
                  {selectedCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                      {selectedCount} selected
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
                Click any page to select it. Selected pages will be duplicated and inserted after the original.
              </p>

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
              onClick={handleDuplicate}
            >
              {processing
                ? 'Duplicating…'
                : selectedCount > 0
                ? `Duplicate ${selectedCount} page${selectedCount > 1 ? 's' : ''}`
                : 'Select pages to duplicate'}
            </Button>
          )}
        </>
      )}
    </ToolLayout>
  );
}
