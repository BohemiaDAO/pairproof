import { BorshAccountsCoder } from "@anchor-lang/core";
import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {
  ATTESTATION_OFFSETS,
  ATTESTATION_SIZE,
  IDL,
  PROGRAM_ID,
  PROPOSAL_OFFSETS,
  PROPOSAL_SIZE,
} from "./constants";
import { findAttestationPda } from "./pda";
import type { Attestation, Proposal } from "./types";

const coder = new BorshAccountsCoder(IDL);

function discriminator(name: "Attestation" | "Proposal"): string {
  const d = IDL.accounts?.find((a) => a.name === name)?.discriminator;
  if (!d) throw new Error(`IDL has no account ${name}`);
  return bs58.encode(Uint8Array.from(d));
}

const ATTESTATION_DISC = discriminator("Attestation");
const PROPOSAL_DISC = discriminator("Proposal");

const memcmpKey = (offset: number, key: PublicKey): GetProgramAccountsFilter => ({
  memcmp: { offset, bytes: key.toBase58() },
});

function toNum(v: { toNumber(): number }): number {
  return v.toNumber();
}

export function decodeAttestation(address: PublicKey, data: Buffer): Attestation {
  const r = coder.decode("Attestation", data);
  return {
    address,
    version: r.version,
    a: r.a,
    b: r.b,
    method: r.method,
    createdAt: toNum(r.created_at),
    contextHash: Uint8Array.from(r.context_hash),
    payer: r.payer,
    bump: r.bump,
  };
}

export function decodeProposal(address: PublicKey, data: Buffer): Proposal {
  const r = coder.decode("Proposal", data);
  return {
    address,
    version: r.version,
    a: r.a,
    b: r.b,
    proposer: r.proposer,
    method: r.method,
    contextHash: Uint8Array.from(r.context_hash),
    createdAt: toNum(r.created_at),
    expiresAt: toNum(r.expires_at),
    bump: r.bump,
  };
}

/** The attestation between two wallets (order irrelevant), or null if none exists. */
export async function getAttestation(
  connection: Connection,
  x: PublicKey,
  y: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): Promise<Attestation | null> {
  const [address] = findAttestationPda(x, y, programId);
  const info = await connection.getAccountInfo(address);
  if (!info || !info.owner.equals(programId)) return null;
  return decodeAttestation(address, info.data);
}

export async function isConnected(
  connection: Connection,
  x: PublicKey,
  y: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): Promise<boolean> {
  return (await getAttestation(connection, x, y, programId)) !== null;
}

async function query<T>(
  connection: Connection,
  programId: PublicKey,
  filters: GetProgramAccountsFilter[],
  decode: (address: PublicKey, data: Buffer) => T,
): Promise<T[]> {
  const res = await connection.getProgramAccounts(programId, { commitment: "confirmed", filters });
  return res.map(({ pubkey, account }) => decode(pubkey, account.data));
}

/** All attestations where `me` is party `a` or `b`. */
export async function listMyAttestations(
  connection: Connection,
  me: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): Promise<Attestation[]> {
  const base: GetProgramAccountsFilter[] = [
    { dataSize: ATTESTATION_SIZE },
    { memcmp: { offset: 0, bytes: ATTESTATION_DISC } },
  ];
  const [asA, asB] = await Promise.all([
    query(connection, programId, [...base, memcmpKey(ATTESTATION_OFFSETS.a, me)], decodeAttestation),
    query(connection, programId, [...base, memcmpKey(ATTESTATION_OFFSETS.b, me)], decodeAttestation),
  ]);
  return [...asA, ...asB].sort((p, q) => q.createdAt - p.createdAt);
}

const PROPOSAL_BASE: GetProgramAccountsFilter[] = [
  { dataSize: PROPOSAL_SIZE },
  { memcmp: { offset: 0, bytes: PROPOSAL_DISC } },
];

/** Proposals addressed to `me` (I am a party but not the proposer). Includes expired ones. */
export async function listIncomingProposals(
  connection: Connection,
  me: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): Promise<Proposal[]> {
  const [asA, asB] = await Promise.all([
    query(connection, programId, [...PROPOSAL_BASE, memcmpKey(PROPOSAL_OFFSETS.a, me)], decodeProposal),
    query(connection, programId, [...PROPOSAL_BASE, memcmpKey(PROPOSAL_OFFSETS.b, me)], decodeProposal),
  ]);
  // memcmp cannot express "not equal", so drop my own proposals client-side.
  return [...asA, ...asB]
    .filter((p) => !p.proposer.equals(me))
    .sort((p, q) => q.createdAt - p.createdAt);
}

/** Proposals `me` opened. Includes expired ones (still cancellable for the rent). */
export async function listOutgoingProposals(
  connection: Connection,
  me: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): Promise<Proposal[]> {
  const res = await query(
    connection,
    programId,
    [...PROPOSAL_BASE, memcmpKey(PROPOSAL_OFFSETS.proposer, me)],
    decodeProposal,
  );
  return res.sort((p, q) => q.createdAt - p.createdAt);
}
