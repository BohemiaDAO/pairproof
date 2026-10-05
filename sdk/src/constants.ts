import { PublicKey } from "@solana/web3.js";
import type { Idl } from "@anchor-lang/core";
import idlJson from "./idl/pairproof.json";

export const IDL = idlJson as unknown as Idl;

/** Program id baked into the IDL (`declare_id!`). Every helper accepts an override. */
export const PROGRAM_ID = new PublicKey((idlJson as { address: string }).address);

export const EDGE_SEED = Buffer.from("edge");
export const PROPOSAL_SEED = Buffer.from("proposal");

export const Method = { InPerson: 0, VideoCall: 1, Vouch: 2 } as const;
export type MethodCode = (typeof Method)[keyof typeof Method];
export const METHOD_LABELS: Record<number, string> = {
  0: "In person",
  1: "Video call",
  2: "Vouch",
};

/** All-zero context hash means "no context". */
export const NO_CONTEXT = new Uint8Array(32);

// ---------------------------------------------------------------------------
// Account layouts (byte offsets). Anchor accounts = 8-byte discriminator, then
// borsh fields in declaration order. These must mirror programs/pairproof/src/state.rs;
// test/layout.test.ts re-checks them by encoding real accounts with the IDL coder.
//
// Attestation: version u8 | a 32 | b 32 | method u8 | created_at i64 | context_hash 32 | payer 32 | bump u8
// Proposal:    version u8 | a 32 | b 32 | proposer 32 | method u8 | context_hash 32 | created_at i64 | expires_at i64 | bump u8
// ---------------------------------------------------------------------------
export const DISCRIMINATOR_SIZE = 8;

export const ATTESTATION_OFFSETS = {
  version: 8,
  a: 9,
  b: 41,
  method: 73,
  createdAt: 74,
  contextHash: 82,
  payer: 114,
  bump: 146,
} as const;
export const ATTESTATION_SIZE = 147;

export const PROPOSAL_OFFSETS = {
  version: 8,
  a: 9,
  b: 41,
  proposer: 73,
  method: 105,
  contextHash: 106,
  createdAt: 138,
  expiresAt: 146,
  bump: 154,
} as const;
export const PROPOSAL_SIZE = 155;
