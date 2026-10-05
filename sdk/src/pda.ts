import { PublicKey } from "@solana/web3.js";
import { EDGE_SEED, PROGRAM_ID, PROPOSAL_SEED } from "./constants";

/**
 * Canonical pair ordering: raw byte comparison, smaller key first. Matches the program's
 * `sort_pair` (note: NOT base58 string order).
 */
export function sortPair(x: PublicKey, y: PublicKey): [PublicKey, PublicKey] {
  return Buffer.compare(x.toBuffer(), y.toBuffer()) <= 0 ? [x, y] : [y, x];
}

export function findAttestationPda(
  x: PublicKey,
  y: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  const [a, b] = sortPair(x, y);
  return PublicKey.findProgramAddressSync([EDGE_SEED, a.toBuffer(), b.toBuffer()], programId);
}

export function findProposalPda(
  x: PublicKey,
  y: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  const [a, b] = sortPair(x, y);
  return PublicKey.findProgramAddressSync([PROPOSAL_SEED, a.toBuffer(), b.toBuffer()], programId);
}
