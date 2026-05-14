'use client';

import { useState } from 'react';
import { Unlock } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { unlockPDF, downloadBlob } from '@/lib/api';

export default function UnlockPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() { setFile(null); setPassword(''); setDone(false); setError(null); }

  async function handleUnlock() {
    if (!file) { setError('Select a PDF file.'); return; }
    if (!password.trim()) { setError('Enter the current password.'); return; }
    setLoading(true); setError(null);
    try {
      const blob = await unlockPDF(file, password);
      downloadBlob(blob, 'unlocked.pdf');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed. Check your password.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove password protection from a PDF. You need the current password to unlock it."
      icon={<Unlock className="h-6 w-6" />}
    >
      {done ? (
        <DownloadSuccess filename="unlocked.pdf" onReset={reset} />
      ) : (
        <>
          <FileDropzone
            file={file}
            onFiles={(f) => { setFile(f[0]); setError(null); setDone(false); }}
            label="Drop a protected PDF here"
          />

          <Input
            label="Current password"
            type="password"
            placeholder="Enter the PDF password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" loading={loading} disabled={!file || !password.trim()} onClick={handleUnlock}>
            {loading ? 'Unlocking…' : 'Unlock PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
