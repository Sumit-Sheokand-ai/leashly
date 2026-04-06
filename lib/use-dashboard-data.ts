/**
 * lib/use-dashboard-data.ts
 *
 * Smart data-fetching hook for all dashboard pages.
 *
 * Behavior:
 * - On page visit: serve from memory cache if available (ZERO api call)
 * - Background auto-refresh: every 15 minutes silently
 * - After a mutation (add/edit/delete): wait 2 minutes then re-fetch once
 * - Hard rate limit: max 1 API call per 30 seconds per key (prevents any spam)
 * - Manual refresh button: always works, respects 30s hard limit
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
}

// Global tab-level cache — survives page navigation
const CACHE = new Map<string, CacheEntry>();
const LAST_FETCH = new Map<string, number>();

const AUTO_REFRESH_MS   = 15 * 60 * 1000; // 15 minutes background refresh
const MUTATION_DELAY_MS =  2 * 60 * 1000; // 2 minutes after a mutation
const HARD_LIMIT_MS     =         30_000; // max 1 call per 30s per key

type Status = "idle" | "loading" | "error";

function canFetch(key: string): boolean {
  const last = LAST_FETCH.get(key) ?? 0;
  return Date.now() - last >= HARD_LIMIT_MS;
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
  const [status, setStatus] = useState<Status>(data ? "idle" : "loading");

  const mountedRef      = useRef(true);
  const mutationTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const doFetch = useCallback(async () => {
    if (!canFetch(key)) return; // hard rate limit
    LAST_FETCH.set(key, Date.now());
    setStatus("loading");
    try {
      const result = await fetcher();
      if (!mountedRef.current) return;
      CACHE.set(key, { data: result, fetchedAt: Date.now() });
      setData(result);
      setStatus("idle");
    } catch {
      if (!mountedRef.current) return;
      setStatus("error");
    }
  }, [key, fetcher]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mount: use cache if available, otherwise fetch
  useEffect(() => {
    mountedRef.current = true;

    const cached = CACHE.get(key);
    if (cached) {
      setData(cached.data as T);
      setStatus("idle");
      // Still check if it's stale enough to background-refresh
      const age = Date.now() - cached.fetchedAt;
      if (age >= AUTO_REFRESH_MS) doFetch();
    } else {
      doFetch();
    }

    // 15-minute background auto-refresh
    autoRefreshTimer.current = setInterval(doFetch, AUTO_REFRESH_MS);

    return () => {
      mountedRef.current = false;
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
      if (mutationTimer.current) clearTimeout(mutationTimer.current);
    };
  }, [key, ...(options?.deps ?? [])]); // eslint-disable-line react-hooks/exhaustive-deps

  // Call after add/edit/delete — waits 2 minutes then refetches
  const invalidate = useCallback(() => {
    if (mutationTimer.current) clearTimeout(mutationTimer.current);
    mutationTimer.current = setTimeout(() => {
      CACHE.delete(key);
      LAST_FETCH.delete(key); // bypass hard limit for intentional mutations
      doFetch();
    }, MUTATION_DELAY_MS);
  }, [key, doFetch]);

  // Manual refresh — instant, but still respects 30s hard limit
  const refresh = useCallback(() => {
    if (mutationTimer.current) clearTimeout(mutationTimer.current);
    CACHE.delete(key);
    doFetch();
  }, [key, doFetch]);

  // Force refresh — bypasses hard limit (use only for explicit user action)
  const forceRefresh = useCallback(() => {
    if (mutationTimer.current) clearTimeout(mutationTimer.current);
    CACHE.delete(key);
    LAST_FETCH.delete(key);
    doFetch();
  }, [key, doFetch]);

  return { data, status, loading: status === "loading", invalidate, refresh, forceRefresh };
}
