/**
 * Returns `next` only when it is a same-origin absolute path — it must start
 * with a single "/" and not "//" or "/\" (protocol-relative / browser-normalised
 * forms that `new URL(next, base)` would resolve to an external origin). Anything
 * else falls back to `fallback`. Prevents open-redirect via crafted ?next= values.
 */
export function safeInternalPath(next: unknown, fallback = "/"): string {
  return typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : fallback;
}
