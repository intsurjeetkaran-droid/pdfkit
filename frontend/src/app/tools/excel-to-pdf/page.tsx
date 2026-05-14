'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { excelToPDF, downloadBlob } from '@/lib/api';

export default function ExcelToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setDone(false); setError(null); }

  async function handleConvert() {
    if (!file) { setError('Select an Excel file.'); return; }
    setLoading(true); setError(null);
    try {
      const blob = await excelToPDF(file);
      downloadBlob(blob, file.name.replace(/\.(xlsx?|ods)$/i, '.pdf') || 'converted.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Excel to PDF"
      description="Convert XLSX or XLS spreadsheets to PDF using LibreOffice."
      icon={<FileSpreadsheet className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename={file?.name.replace(/\.(xlsx?|ods)$/i, '.pdf') || 'converted.pdf'} onReset={reset} />
      ) : (
        <>
          <FileDropzone
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            file={file}
            onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }}
            label="Drop an Excel file here"
            sublabel="XLSX or XLS · tap to browse"
          />

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            <strong>Note:</strong> LibreOffice conversion takes 3–15 seconds.
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleConvert}>
            {loading ? 'Converting…' : 'Convert to PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
