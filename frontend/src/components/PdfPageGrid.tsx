'use client';

/**
 * PdfPageGrid — shared interactive PDF page viewer
 *
 * Used by:
 *   - Delete Pages  → shows X button on each page, click to mark for deletion
 *   - Reorder Pages → drag-and-drop to rearrange pages
 *   - Duplicate     → click pages to select them for duplication
 *
 * Props:
 *   pages        — array of page objects { id, pageNum, previewUrl }
 *   mode         — 'delete' | 'reorder' | 'duplicate'
 *   markedPages  — set of page IDs currently marked/selected
 *   onMark       — called when a page is clicked (toggle mark)
 *   onReorder    — called with new pages array after drag-drop (reorder mode)
 *   loading      — show skeleton placeholders while previews load
 */

import { useRef, useState } from 'react';
import { X, Copy, GripVertical } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PageItem {
  id: string;       // unique key (e.g. "page-3")
  pageNum: number;  // 1-indexed original page number
  previewUrl: string | null; // object URL from getPagePreview, null while loading
}

interface PdfPageGridProps {
  pages: PageItem[];
  mode: 'delete' | 'reorder' | 'duplicate';
  markedPages: Set<string>;
  onMark: (id: string) => void;
  onReorder?: (newPages: PageItem[]) => void;
  loading?: boolean;
}

export default function PdfPageGrid({
  pages,
  mode,
  markedPages,
  onMark,
  onReorder,
  loading = false,
}: PdfPageGridProps) {
  // ── Drag state (reorder mode) ──────────────────────────────────────────────
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function handleDragStart(i: number) {
    dragIndex.current = i;
  }

  function handleDragEnter(i: number) {
    setDragOver(i);
  }

  function handleDragEnd() {
    if (
      dragIndex.current !== null &&
      dragOver !== null &&
      dragIndex.current !== dragOver &&
      onReorder
    ) {
      const next = [...pages];
      const [moved] = next.splice(dragIndex.current, 1);
      next.splice(dragOver, 0, moved);
      onReorder(next);
    }
    dragIndex.current = null;
    setDragOver(null);
  }

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      {pages.map((page, i) => {
        const isMarked = markedPages.has(page.id);
        const isDragTarget = dragOver === i;

        return (
          <div
            key={page.id}
            draggable={mode === 'reorder'}
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
            className={cn(
              'group relative flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-150 cursor-pointer select-none',
              // Base
              'bg-white shadow-sm',
              // Marked states
              mode === 'delete' && isMarked
                ? 'border-red-400 opacity-60 scale-[0.97]'
                : mode === 'duplicate' && isMarked
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-slate-200 hover:border-blue-300 hover:shadow-md',
              // Drag-over highlight
              isDragTarget && mode === 'reorder'
                ? 'border-blue-500 ring-2 ring-blue-200 scale-[1.03]'
                : '',
            )}
            onClick={() => onMark(page.id)}
            title={
              mode === 'delete'
                ? isMarked ? 'Click to unmark' : 'Click to mark for deletion'
                : mode === 'duplicate'
                ? isMarked ? 'Click to deselect' : 'Click to select for duplication'
                : 'Drag to reorder'
            }
          >
            {/* Page preview */}
            <div className="aspect-[3/4] bg-slate-100 flex items-center justify-center overflow-hidden">
              {page.previewUrl ? (
                <img
                  src={page.previewUrl}
                  alt={`Page ${page.pageNum}`}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full animate-pulse bg-slate-200" />
              )}
            </div>

            {/* Page number label */}
            <div className="px-2 py-1.5 text-center">
              <span className="text-[11px] font-semibold text-slate-500">
                Page {page.pageNum}
              </span>
            </div>

            {/* ── Delete mode: X button ── */}
            {mode === 'delete' && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMark(page.id); }}
                className={cn(
                  'absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white shadow transition-all duration-150',
                  isMarked
                    ? 'bg-red-500 scale-110'
                    : 'bg-slate-400/80 opacity-0 group-hover:opacity-100 hover:bg-red-500'
                )}
                aria-label={isMarked ? 'Unmark page' : 'Mark page for deletion'}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}

            {/* ── Duplicate mode: check badge ── */}
            {mode === 'duplicate' && isMarked && (
              <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow">
                <Copy className="h-3 w-3" />
              </div>
            )}

            {/* ── Reorder mode: drag handle ── */}
            {mode === 'reorder' && (
              <div className="absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-white/80 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            )}

            {/* Delete overlay */}
            {mode === 'delete' && isMarked && (
              <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none">
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide shadow">
                  Delete
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
