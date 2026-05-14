'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
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
  const displayName = file?.name ?? (files && files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : null);

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
        'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 select-none min-h-[160px]',
        dragging
          ? 'border-blue-500 bg-blue-50 scale-[1.01]'
          : hasFile
          ? 'border-blue-400 bg-blue-50/60'
          : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40',
        className
      )}
    >
      {hasFile ? (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <FileText className="h-6 w-6 text-blue-600" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[240px]">{displayName}</p>
            {file && (
              <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            )}
            <p className="text-xs text-blue-500 mt-1">Click to change file</p>
          </div>
        </>
      ) : (
        <>
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
            dragging ? 'bg-blue-200' : 'bg-slate-200'
          )}>
            <UploadCloud className={cn('h-6 w-6 transition-colors', dragging ? 'text-blue-600' : 'text-slate-500')} aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {label ?? (multiple ? 'Drop files here' : 'Drop file here')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {sublabel ?? 'or tap to browse'}
            </p>
          </div>
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
