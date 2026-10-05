import { isSolanaAddress } from "../components/ui";

/**
 * Pull a Solana address out of whatever a QR code contains: a bare address, a `solana:` URI
 * (optionally with query params), or a URL whose last path segment is the address.
 */
export function extractAddress(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (isSolanaAddress(s)) return s;
  s = s.replace(/^solana:(\/\/)?/i, "");
  s = s.split(/[?#]/)[0];
  if (isSolanaAddress(s)) return s;
  const last = s.split("/").filter(Boolean).pop();
  return last && isSolanaAddress(last) ? last : null;
}

export const cameraSupported = (): boolean =>
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
