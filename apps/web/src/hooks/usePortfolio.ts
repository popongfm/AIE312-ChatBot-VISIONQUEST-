import { useCallback, useEffect, useState } from 'react';
import type { Portfolio } from '@vq/shared';
import { api } from '../lib/api';

export interface UsePortfolio {
  data: Portfolio | null;
  error: Error | null;
  loading: boolean;
  retry(): void;
}

export function usePortfolio(): UsePortfolio {
  const [data, setData] = useState<Portfolio | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .getPortfolio()
      .then((p) => {
        if (!active) return;
        setData(p);
        setError(null);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { data, error, loading, retry };
}
