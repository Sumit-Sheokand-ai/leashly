/**
 * lib/use-dashboard-data.ts
 *
 * Optimistic UI + Smart caching — same pattern as Notion, Linear, Google.
 *
 * Rules:
 * - Page navigate → ZERO api call (serve from cache)
 * - Auto background refresh → every 15 minutes
 * - User changes something → UI updates INSTANTLY (optimistic)
 * - Actual API call → 2 minutes after last change (silent, background)
 * - If API fails → UI reverts to last good state silently
 * - Hard rate limit → max 30 Supabase calls per user per minute
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const CALL_LOG = new Map<string, number[]>();

const AUTO_REFRESH_MS   = 15 * 60 * 1000;
const MUTATION_DELAY_MS =  2 * 60 * 1000;
const RATE_LIMIT        = 30;
const RATE_WINDOW_MS    = 60 * 1000;

type Status = "idle" | "loading" | "error";

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const calls = (CALL_LOG.get(key) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  CALL_LOG.set(key, calls);
  if (calls.length >= RATE_LIMIT) return true;
  calls.push(now);
  CALL_LOG.set(key, calls);
  return false;
}

export function useDashboardData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { deps?: unknown[] }
) {
  const [data, setData]     = useState<T | null>(() => {
    const c = CACHE.get(key);
    return c ? (c.data as T) : null;
  });
  const [status, setStatus] = useState<Status>(data ? "idle" : "loading");

  const mountedRef          = useRef(true);
  const mutationTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRefreshTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastGoodData        = useRef<T | null>(data);

  const doFetch = useCallback(async (silent = false) => {
    if (isRateLimited(key)) return;
    if (!silent) setStatus("loading");
    try {
      const result = await fetcher();
      if (!mountedRef.current) return;
      CACHE.set(key, { data: result, fetchedAt: Date.now() });
      lastGoodData.current = result;
      setData(result);
      setStatus("idle");
    } catch {
      if (!mountedRef.current) return;
      if (!silent) setStatus("error");
    }
  }, [key, fetcher]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    const cached = CACHE.get(key);
    if (cached) {
      setData(cached.data as T);
      lastGoodData.current = cached.data as T;
      setStatus("idle");
      if (Date.now() - cached.fetchedAt >= AUTO_REFRESH_MS) doFetch(true);
    } else {
      doFetch(false);
    }
    autoRefreshTimer.current = setInterval(() => doFetch(true), AUTO_REFRESH_MS);
    return () => {
      mountedRef.current = false;
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
      if (mutationTimer.current) clearTimeout(mutationTimer.current);
    };
  }, [key, ...(options?.deps ?? [])]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * optimisticUpdate — UI updates instantly, API fires silently in background after 2 min
   */
  const optimisticUpdate = useCallback((
    newData: T,
    apiCall: () => Promise<unknown>
  ) => {
    const previousData = data;
    setData(newData);
    CACHE.set(key, { data: newData, fetchedAt: Date.now() });
    // No status change — completely silent to user

    if (mutationTimer.current) clearTimeout(mutationTimer.current);
    mutationTimer.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      try {
        await apiCall();
        lastGoodData.current = newData;
        setTimeout(() => doFetch(true), 1000);
      } catch {
        // Silent rollback — user doesn't see any error message
        if (mountedRef.current) {
          setData(previousData);
          CACHE.set(key, { data: previousData, fetchedAt: Date.now() });
        }
      }
    }, MUTATION_DELAY_MS);
  }, [key, data, doFetch]);

  const invalidate = useCallback(() => {
    if (mutationTimer.current) clearTimeout(mutationTimer.current);
    mutationTimer.current = setTimeout(() => {
      CACHE.delete(key);
      doFetch(false);
    }, MUTATION_DELAY_MS);
  }, [key, doFetch]);

  const refresh = useCallback(() => {
    if (mutationTimer.current) clearTimeout(mutationTimer.current);
    CACHE.delete(key);
    doFetch(false);
  }, [key, doFetch]);

  return {
    data,
    status,
    loading: status === "loading",
    invalidate,
    optimisticUpdate,
    refresh,
  };
}
