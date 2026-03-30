// Simple in-memory brute-force protection for auth endpoints
// In production with multiple instances, replace with Redis

interface Attempt {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const attempts = new Map<string, Attempt>();

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;   // 15 minutes
const LOCKOUT_MS = 30 * 60 * 1000;  // 30 minutes

export function checkAuthRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const record = attempts.get(identifier);

  if (record?.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, retryAfterMs: record.lockedUntil - now };
  }

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  record.count += 1;

  if (record.count > MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    attempts.set(identifier, record);
    return { allowed: false, retryAfterMs: LOCKOUT_MS };
  }

  attempts.set(identifier, record);
  return { allowed: true };
}

export function resetAuthRateLimit(identifier: string) {
  attempts.delete(identifier);
}

// Cleanup old entries every 30 minutes to avoid memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of Array.from(attempts.entries())) {
      const expired =
        (!record.lockedUntil && now - record.firstAttempt > WINDOW_MS) ||
        (record.lockedUntil && now > record.lockedUntil + WINDOW_MS);
      if (expired) attempts.delete(key);
    }
  }, 30 * 60 * 1000);
}
