import type { PublicKey } from "@solana/web3.js";

export interface Attestation {
  address: PublicKey;
  version: number;
  a: PublicKey;
  b: PublicKey;
  method: number;
  /** Unix seconds. */
  createdAt: number;
  contextHash: Uint8Array;
  payer: PublicKey;
  bump: number;
}

export interface Proposal {
  address: PublicKey;
  version: number;
  a: PublicKey;
  b: PublicKey;
  proposer: PublicKey;
  method: number;
  contextHash: Uint8Array;
  /** Unix seconds. */
  createdAt: number;
  expiresAt: number;
  bump: number;
}

export function counterpartyOf(item: { a: PublicKey; b: PublicKey }, me: PublicKey): PublicKey {
  return item.a.equals(me) ? item.b : item.a;
}
