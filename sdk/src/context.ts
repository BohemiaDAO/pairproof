import { sha256 } from "@noble/hashes/sha256";

/**
 * Hash optional free-text context into the 32-byte `context_hash`. Empty/blank text maps
 * to the all-zero "no context" value. The plaintext never leaves the client.
 */
export function sha256Context(text: string): Uint8Array {
  const t = text.trim();
  return t ? sha256(new TextEncoder().encode(t)) : new Uint8Array(32);
}
