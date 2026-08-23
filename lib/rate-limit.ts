import { createHash } from "crypto";

type RateLimitOptions = { limit: number; windowMs: number };
type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

const requests = new Map<string, number[]>();

export function rateLimitKey(scope: string, request: Request, userId: string | null) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const subject = userId ?? forwarded ?? request.headers.get("x-real-ip") ?? "unknown-visitor";
  const fingerprint = createHash("sha256").update(subject).digest("hex").slice(0, 24);
  return `${scope}:${fingerprint}`;
}

export function checkRateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const earliest = now - windowMs;
  const recent = (requests.get(key) ?? []).filter((time) => time > earliest);
  if (recent.length >= limit) {
    const retryAfterMs = recent[0] + windowMs - now;
    requests.set(key, recent);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  recent.push(now);
  requests.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}
