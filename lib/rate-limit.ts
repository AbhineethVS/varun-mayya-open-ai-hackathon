const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const requests = new Map<string, number[]>();

export function allowRequest(key: string) {
  const now = Date.now();
  const recent = (requests.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  requests.set(key, recent);
  return true;
}
