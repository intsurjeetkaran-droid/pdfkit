'use client';

import { useState } from 'react';
import { Info, FileText } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { getPDFInfo, type PDFMetadata } from '@/lib/api';

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 shrink-0 w-32">{label}</span>
      <span className="text-xs text-slate-800 text-right break-all">{String(value)}</span>
    </div>
  );
}

export default function PDFInfoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<PDFMetadata | null>(null);

  async function handleAnalyze() {
    if (!file) { setError('Select a PDF file.'); return; }
    setLoading(true); setError(null); setInfo(null);
    try {
      const data = await getPDFInfo(file);
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read PDF info.');
    } finally { setLoading(false); }
  }

  function reset() { setFile(null); setInfo(null); setError(null); }

  return (
    <ToolLayout
      title="PDF Info"
      description="View full metadata, page dimensions, and document properties of any PDF."
      icon={<Info className="h-6 w-6" />}
    >
      <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setInfo(null); }} />

      {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <Spinner label="Reading PDF metadata…" />
      ) : !info ? (
        <Button fullWidth size="lg" sticky disabled={!file} onClick={handleAnalyze}>
          Analyze PDF
        </Button>
      ) : (
        <div className="space-y-4 animate-slide-up">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pages', value: info.pageCount },
              { label: 'Size', value: `${info.fileSizeMB} MB` },
              { label: 'PDF v', value: info.pdfVersion },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <p className="text-lg font-extrabold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Document info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Document</h3>
            <InfoRow label="Title" value={info.title} />
            <InfoRow label="Author" value={info.author} />
            <InfoRow label="Subject" value={info.subject} />
            <InfoRow label="Keywords" value={info.keywords} />
            <InfoRow label="Creator" value={info.creator} />
            <InfoRow label="Producer" value={info.producer} />
            <InfoRow label="Created" value={info.creationDate ? new Date(info.creationDate).toLocaleString() : null} />
            <InfoRow label="Modified" value={info.modDate ? new Date(info.modDate).toLocaleString() : null} />
            <InfoRow label="Encrypted" value={info.isEncrypted ? 'Yes' : 'No'} />
          </div>

          {/* Page dimensions */}
          {info.pages.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Pages ({info.pages.length})
              </h3>
              <div className="space-y-0 max-h-48 overflow-y-auto">
                {info.pages.map((p) => (
                  <div key={p.page} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
                    <span className="font-medium text-slate-500">Page {p.page}</span>
                    <span className="text-slate-700">
                      {p.widthMm} × {p.heightMm} mm
                      {p.rotation ? ` · ${p.rotation}° rotated` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="ghost" fullWidth onClick={reset}>
            <FileText className="h-4 w-4" />
            Analyze another PDF
          </Button>
        </div>
      )}
    </ToolLayout>
  );
}

