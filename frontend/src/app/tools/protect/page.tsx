'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import DownloadSuccess from '@/components/DownloadSuccess';
import { protectPDF } from '@/lib/api';

export default function ProtectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function reset() { setFile(null); setPassword(''); setOwnerPassword(''); setResult(null); setError(null); }

  async function handleProtect() {
    if (!file) { setError('Select a PDF file.'); return; }
    if (!password.trim()) { setError('Enter a password.'); return; }
    setLoading(true); setError(null);
    try {
      setResult(await protectPDF(file, password, ownerPassword || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Protection failed.');
    } finally { setLoading(false); }
  }

  return (
    <ToolLayout title="Protect PDF" description="Add AES-256 password protection to a PDF." icon={<Lock className="h-6 w-6" />}>
      {result ? (
        <DownloadSuccess blob={result} filename="protected.pdf" onReset={reset} />
      ) : (
        <>
          <FileDropzone file={file} onFiles={(f) => { setFile(f[0]); setError(null); setResult(null); }} />
          <Input label="User password" type="password" placeholder="Password to open the PDF" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" hint="Required — anyone opening the PDF needs this" />
          <Input label="Owner password (optional)" type="password" placeholder="Password to change permissions" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} autoComplete="new-password" hint="Optional — defaults to user password if not set" />
          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
          <Button fullWidth size="lg" loading={loading} disabled={!file || !password.trim()} onClick={handleProtect}>
            {loading ? 'Encrypting…' : 'Protect PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}
