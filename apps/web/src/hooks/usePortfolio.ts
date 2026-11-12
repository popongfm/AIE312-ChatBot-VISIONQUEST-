import type { Portfolio } from '@vq/shared';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface PortfolioState { data: Portfolio | null; error: Error | null; loading: boolean; retry(): void }

export function usePortfolio(): PortfolioState {
  const [data, setData] = useState<Portfolio | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.getPortfolio().then(
      (p) => { if (!cancelled) { setData(p); setLoading(false); } },
      (e: unknown) => { if (!cancelled) { setError(e instanceof Error ? e : new Error(String(e))); setLoading(false); } },
    );
    return () => { cancelled = true; };
  }, [attempt]);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  }, []);

  return { data, error, loading, retry };
}
