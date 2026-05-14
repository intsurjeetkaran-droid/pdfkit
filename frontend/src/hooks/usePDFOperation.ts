'use client';

import { useState, useCallback } from 'react';
import { downloadBlob } from '@/lib/api';

interface UsePDFOperationReturn {
  loading: boolean;
  error: string | null;
  run: (
    operation: () => Promise<Blob>,
    outputFilename: string
  ) => Promise<void>;
  reset: () => void;
}

/**
 * Generic hook for any PDF operation that returns a Blob.
 * Handles loading state, error state, and triggers a browser download.
 */
export function usePDFOperation(): UsePDFOperationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (operation: () => Promise<Blob>, outputFilename: string) => {
      setLoading(true);
      setError(null);
      try {
        const blob = await operation();
        downloadBlob(blob, outputFilename);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { loading, error, run, reset };
}
