/**
 * lib/use-dashboard-data.ts
 *
 * Optimistic UI + Smart caching — same pattern as Notion, Linear, Google.
 *
 * Rules:
 * - Page navigate → ZERO api call (serve from cache)
 * - Auto background refresh → every 15 minutes
 * - User changes something → UI updates INSTANTLY (optimistic)
 * - Actual API call → 2 minutes after last change (debounced batch)
 * - If API fails → UI reverts to last good state + shows error
 * - Hard rate limit → max 30 Supabase calls per user per minute
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
}

// Global tab-level cache — survives page navigation
const CACHE = new Map<string, CacheEntry>();

// Rate limiter — max 30 calls per 60 seconds per key
const CALL_LOG = new Map<string, number[]>();

const AUTO_REFRESH_MS   = 15 * 60 * 1000; // 15 minutes
const MUTATION_DELAY_MS =  2 * 60 * 1000; // 2 minutes after last change
const RATE_LIMIT        = 30;             // max calls per window
const RATE_WINDOW_MS    = 60 * 1000;      // 1 minute window

type Status = "idle" | "loading" | "error" | "saving";

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
  const [data, setData] = useState<T | null>(() => {
    const c = CACHE.get(key);
    return c ? (c.data as T) : null;
  });
  const [status, setStatus]   = useState<Status>(data ? "idle" : "loading");
  const [error, setError]     = useState<string | null>(null);

  const mountedRef            = useRef(true);
  const mutationTimer         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRefreshTimer      = useRef<ReturnType<typeof setInterval> | null>(null);
  // Store last known good state for rollback
  const lastGoodData          = useRef<T | null>(data);

  const doFetch = useCallback(async (silent = false) => {
    if (isRateLimited(key)) return; // hard rate limit — skip silently

    if (!silent) setStatus("loading");
    setError(null);

    try {
      const result = await fetcher();
      if (!mountedRef.current) return;
      CACHE.set(key, { data: result, fetchedAt: Date.now() });
      lastGoodData.current = result;
      setData(result);
      setStatus("idle");
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [key, fetcher]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mount: serve from cache immediately, background refresh if stale
  useEffect(() => {
    mountedRef.current = true;

    const cached = CACHE.get(key);
    if (cached) {
      setData(cached.data as T);
      lastGoodData.current = cached.data as T;
      setStatus("idle");
      // Background refresh if stale
      const age = Date.now() - cached.fetchedAt;
      if (age >= AUTO_REFRESH_MS) doFetch(true);
    } else {
      doFetch(false);
    }

    // 15-minute silent background refresh
    autoRefreshTimer.current = setInterval(() => doFetch(true), AUTO_REFRESH_MS);

    return () => {
      mountedRef.current = false;
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
      if (mutationTimer.current) clearTimeout(mutationTimer.current);
    };
  }, [key, ...(options?.deps ?? [])]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * optimisticUpdate — call this when user changes something
   *
   * Usage:
   *   optimisticUpdate(
   *     newData,                    // what to show immediately
   *     () => fetch('/api/rules', { method: 'POST', ... })  // actual API call
   *   )
   *
   * UI updates instantly. API call happens 2 minutes later.
   * If API fails, UI reverts to previous state.
   */
  const optimisticUpdate = useCallback((
    newData: T,
    apiCall: () => Promise<unknown>
  ) => {
    // 1. Update UI instantly
    const previousData = data;
    setData(newData);
    CACHE.set(key, { data: newData, fetchedAt: Date.now() });
    setStatus("saving");

    // 2. Debounce the actual API call — 2 minutes after last change
    if (mutationTimer.current) clearTimeout(mutationTimer.current);
    mutationTimer.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      try {
        await apiCall();
        lastGoodData.current = newData;
        setStatus("idle");
        // After save, re-fetch to sync with server
        setTimeout(() => doFetch(true), 1000);
      } catch (err) {
        // Rollback to previous state
        if (mountedRef.current) {
          setData(previousData);
          CACHE.set(key, { data: previousData, fetchedAt: Date.now() });
          setStatus("error");
          setError("Failed to save. Changes reverted.");
          setTimeout(() => setError(null), 5000);
        }
      }
    }, MUTATION_DELAY_MS);
  }, [key, data, doFetch]);

  /**
   * invalidate — call after add/delete (not edit)
   * Waits 2 minutes then re-fetches
   */
  const invalidate = useCallback(() => {
    if (mutationTimer.current) clearTimeout(mutationTimer.current);
    mutationTimer.current = setTimeout(() => {
      CACHE.delete(key);
      doFetch(false);
    }, MUTATION_DELAY_MS);
  }, [key, doFetch]);

  /**
   * refresh — manual refresh button
   * Instant, but still respects rate limit (30/min)
   */
  const refresh = useCallback(() => {
    if (mutationTimer.current) clearTimeout(mutationTimer.current);
    CACHE.delete(key);
    doFetch(false);
  }, [key, doFetch]);

  return {
    data,
    status,
    error,
    loading:  status === "loading",
    saving:   status === "saving",
    invalidate,
    optimisticUpdate,
    refresh,
  };
}
