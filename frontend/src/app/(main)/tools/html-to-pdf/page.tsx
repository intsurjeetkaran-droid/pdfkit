'use client';

import { useState } from 'react';
import { Globe, Code2, Link } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import DownloadSuccess from '@/components/DownloadSuccess';
import { htmlStringToPDF, htmlFileToPDF, urlToPDF, type HtmlPdfOptions } from '@/lib/api';
import { cn } from '@/lib/cn';

type Mode = 'url' | 'html' | 'file';
type PageFormat = 'A4' | 'A3' | 'Letter' | 'Legal';

export default function HTMLToPDFPage() {
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<PageFormat>('A4');
  const [landscape, setLandscape] = useState(false);
  const [printBackground, setPrintBackground] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  function reset() {
    setUrl(''); setHtml(''); setFile(null);
    setResult(null); setError(null);
  }

  function getOutputName(): string {
    if (mode === 'url') {
      try { return new URL(url).hostname + '.pdf'; } catch { return 'page.pdf'; }
    }
    if (mode === 'file') return file?.name.replace(/\.html?$/i, '.pdf') ?? 'document.pdf';
    return 'document.pdf';
  }

  async function handleConvert() {
    const opts: HtmlPdfOptions = { format, landscape, printBackground };
    setLoading(true); setError(null);
    try {
      if (mode === 'url') {
        if (!url.trim()) { setError('Enter a URL.'); return; }
        setResult(await urlToPDF(url.trim(), opts));
      } else if (mode === 'html') {
        if (!html.trim()) { setError('Enter some HTML.'); return; }
        setResult(await htmlStringToPDF(html, opts));
      } else {
        if (!file) { setError('Select an HTML file.'); return; }
        setResult(await htmlFileToPDF(file, opts));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.');
    } finally { setLoading(false); }
  }

  const modes: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'url', label: 'URL', icon: <Link className="h-4 w-4" /> },
    { id: 'html', label: 'HTML code', icon: <Code2 className="h-4 w-4" /> },
    { id: 'file', label: 'HTML file', icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <ToolLayout
      title="HTML to PDF"
      description="Convert any URL, HTML code, or HTML file to a PDF using headless Chromium. Full CSS and JavaScript support."
      icon={<Globe className="h-6 w-6" />}
      badge={<Badge variant="orange">Slow</Badge>}
    >
      {result ? (
        <DownloadSuccess blob={result} filename={getOutputName()} onReset={reset} />
      ) : (
        <>
          {/* Mode tabs */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1" role="tablist">
            {modes.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => { setMode(m.id); setError(null); setResult(null); }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all',
                  mode === m.id
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {m.icon}
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Input area */}
          {mode === 'url' && (
            <Input
              label="Website URL"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              hint="Must be a public https:// URL"
            />
          )}

          {mode === 'html' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">HTML code</label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder={'<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>'}
                rows={8}
                className="input font-mono text-xs resize-y"
                aria-label="HTML code input"
              />
              <p className="text-xs text-slate-400">Max 5 MB of HTML content</p>
            </div>
          )}

          {mode === 'file' && (
            <FileDropzone
              accept=".html,.htm,text/html"
              file={file}
              onFiles={(f) => { setFile(f[0]); setError(null); setResult(null); }}
              label="Drop an HTML file here"
              sublabel=".html or .htm · tap to browse"
            />
          )}

          {/* PDF options */}
          <div className="grid grid-cols-2 gap-3">
            <fieldset>
              <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Page format</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {(['A4', 'A3', 'Letter', 'Legal'] as PageFormat[]).map((f) => (
                  <button key={f} type="button" onClick={() => setFormat(f)}
                    className={cn('rounded-lg border-2 py-2 text-xs font-semibold transition-all', format === f ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300')}>
                    {f}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options</p>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={landscape} onChange={(e) => setLandscape(e.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
                <span className="text-sm text-slate-700">Landscape</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={printBackground} onChange={(e) => setPrintBackground(e.target.checked)} className="h-4 w-4 rounded accent-blue-600" />
                <span className="text-sm text-slate-700">Print backgrounds</span>
              </label>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 space-y-1">
            <p><strong>Rate limited:</strong> 20 requests per hour (Chromium rendering is CPU-intensive).</p>
            {mode === 'url' && <p><strong>URL:</strong> Only public https:// URLs. Localhost and internal IPs are blocked.</p>}
          </div>

          {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

          <Button fullWidth size="lg" sticky loading={loading}
            disabled={mode === 'url' ? !url.trim() : mode === 'html' ? !html.trim() : !file}
            onClick={handleConvert}>
            {loading ? 'Rendering with Chromium…' : 'Convert to PDF'}
          </Button>
        </>
      )}
    </ToolLayout>
  );
}

