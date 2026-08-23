import { describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "../lib/rate-limit";

describe("rate limiter", () => {
  it("blocks requests over the configured window limit, then permits a new window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T10:00:00Z"));
    const key = "test:ai:user-1";
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    const rejected = checkRateLimit(key, { limit: 2, windowMs: 60_000 });
    expect(rejected.allowed).toBe(false);
    expect(rejected.retryAfterSeconds).toBe(60);
    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    vi.useRealTimers();
  });
});
