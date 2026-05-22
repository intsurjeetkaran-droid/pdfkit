'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  label?: string;
  sublabel?: string;
  file?: File | null;
  files?: File[];
  onFiles: (files: File[]) => void;
  className?: string;
}

export default function FileDropzone({
  accept = 'application/pdf',
  multiple = false,
  label,
  sublabel,
  file,
  files,
  onFiles,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const hasFile = file || (files && files.length > 0);
  const displayName =
    file?.name ??
    (files && files.length > 0
      ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
      : null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) onFiles(dropped);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length) onFiles(selected);
    e.target.value = '';
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label ?? 'Upload file'}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none',
        /* Taller — fills more of the viewport */
        'min-h-[260px] px-8 py-12',
        dragging
          ? 'border-blue-500 bg-blue-50 scale-[1.01] shadow-lg shadow-blue-100'
          : hasFile
          ? 'border-blue-400 bg-blue-50/60'
          : 'border-slate-300 bg-slate-50/80 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md',
        className
      )}
    >
      {hasFile ? (
        /* ── File selected state ── */
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 shadow-sm">
            <FileText className="h-8 w-8 text-blue-600" aria-hidden="true" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-slate-800 truncate max-w-[280px]">
              {displayName}
            </p>
            {file && (
              <p className="text-sm text-slate-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            <p className="text-sm font-medium text-blue-500 mt-1">
              Click to change file
            </p>
          </div>
        </>
      ) : (
        /* ── Empty / drag state ── */
        <>
          {/* Large upload icon */}
          <div className={cn(
            'flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-200 shadow-sm',
            dragging
              ? 'bg-blue-200 scale-110'
              : 'bg-white border border-slate-200 group-hover:border-blue-300'
          )}>
            {dragging ? (
              <CloudUpload className="h-10 w-10 text-blue-600" aria-hidden="true" />
            ) : (
              <Upload className="h-10 w-10 text-blue-500" aria-hidden="true" />
            )}
          </div>

          {/* Text */}
          <div className="text-center space-y-1.5">
            <p className="text-base font-bold text-slate-800">
              {label ?? (multiple ? 'Drop files here' : 'Drop your file here')}
            </p>
            <p className="text-sm text-slate-400">
              {sublabel ?? 'or click to browse from your device'}
            </p>
          </div>

          {/* Browse button hint */}
          <div className={cn(
            'rounded-xl border px-5 py-2 text-sm font-semibold transition-all duration-150',
            dragging
              ? 'border-blue-400 bg-blue-100 text-blue-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
          )}>
            Choose file{multiple ? 's' : ''}
          </div>

          {/* Max size note */}
          <p className="text-xs text-slate-400">Maximum file size: 100 MB</p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        aria-hidden="true"
        onChange={handleChange}
      />
    </div>
  );
}
