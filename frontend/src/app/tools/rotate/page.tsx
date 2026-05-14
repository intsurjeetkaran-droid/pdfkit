'use client';

import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { rotatePDF, downloadBlob } from '@/lib/api';
import { cn } from '@/lib/cn';

const ANGLES = [90, 180, 270] as const;

export default function RotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [pagesInput, setPagesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setPagesInput(''); setDone(false); setError(null); }

  async function handleRotate() {
    if (!file) { setError('Select a PDF file.'); return; }
    const pages = pagesInput.trim()
      ? pagesInput.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0)
      : [];
    setLoading(true); setError(null);
    try {
      const blob = await rotatePDF(file, angle, pages);
      downloadBlob(blob, 'rotated.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rotate failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate all pages or specific pages by 90, 180, or 270 degrees."
      icon={<RotateCw className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename="rotated.pdf" onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }} />

          {/* Angle picker */}
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 mb-2">Rotation angle</legend>
            <div className="grid grid-cols-3 gap-2">
              {ANGLES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAngle(a)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-semibold transition-all',
                    angle === a
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                  )}
                >
                  <RotateCw className={cn('h-5 w-5', a === 180 && 'rotate-90', a === 270 && 'rotate-180')} aria-hidden="true" />
                  {a}°
                </button>
              ))}
            </div>
          </fieldset>

          <Input
            label="Pages (optional)"
            placeholder="e.g. 1, 3 — leave blank for all pages"
            value={pagesInput}
            onChange={(e) => setPagesInput(e.target.value)}
            hint="Leave blank to rotate all pages"
          />

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleRotate}>
            {loading ? 'Rotating…' : 'Rotate PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
