'use client';

import { useState } from 'react';
import { Droplets } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { addWatermark, downloadBlob } from '@/lib/api';

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(45);
  const [fontSize, setFontSize] = useState(48);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setDone(false); setError(null); }

  async function handleWatermark() {
    if (!file) { setError('Select a PDF file.'); return; }
    if (!text.trim()) { setError('Enter watermark text.'); return; }
    setLoading(true); setError(null);
    try {
      const blob = await addWatermark(file, { text, opacity, rotation, fontSize });
      downloadBlob(blob, 'watermarked.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Watermark failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Watermark PDF"
      description="Add a text watermark to every page of your PDF."
      icon={<Droplets className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename="watermarked.pdf" onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }} />

          <Input
            label="Watermark text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. CONFIDENTIAL"
          />

          {/* Sliders */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: `Opacity: ${opacity}`, min: 0.05, max: 1, step: 0.05, value: opacity, onChange: (v: number) => setOpacity(v) },
              { label: `Rotation: ${rotation}°`, min: 0, max: 360, step: 5, value: rotation, onChange: (v: number) => setRotation(v) },
              { label: `Font size: ${fontSize}`, min: 12, max: 120, step: 4, value: fontSize, onChange: (v: number) => setFontSize(v) },
            ].map(({ label, min, max, step, value, onChange }) => (
              <div key={label} className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">{label}</label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => onChange(parseFloat(e.target.value))}
                  className="w-full"
                  aria-label={label}
                />
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-center min-h-[80px] overflow-hidden">
            <span
              className="font-bold text-slate-400 pointer-events-none select-none"
              style={{
                fontSize: `${Math.min(fontSize * 0.5, 36)}px`,
                opacity,
                transform: `rotate(-${rotation}deg)`,
                display: 'inline-block',
              }}
            >
              {text || 'Preview'}
            </span>
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file} onClick={handleWatermark}>
            {loading ? 'Adding watermark…' : 'Add Watermark'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
