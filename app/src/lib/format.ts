/** Relative time like "2 min ago". `nowMs` is injectable for tests. */
export function timeAgo(unixSeconds: number, nowMs: number = Date.now()): string {
  const s = Math.max(0, Math.floor(nowMs / 1000 - unixSeconds));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(s / 3600);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

export function isExpired(expiresAt: number, nowMs: number = Date.now()): boolean {
  return nowMs / 1000 >= expiresAt;
}

/** "Expires in 23 h" / "Expired". */
export function expiresIn(expiresAt: number, nowMs: number = Date.now()): string {
  const s = Math.floor(expiresAt - nowMs / 1000);
  if (s <= 0) return "Expired";
  if (s < 3600) return `Expires in ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `Expires in ${Math.round(s / 3600)} h`;
  const d = Math.round(s / 86400);
  return `Expires in ${d} ${d === 1 ? "day" : "days"}`;
}

export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const EXPIRY_SECONDS: Record<string, number> = { "24h": 86_400, "7d": 7 * 86_400, "30d": 30 * 86_400 };
