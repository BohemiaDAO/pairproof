import { test } from "node:test";
import assert from "node:assert/strict";
import { BN, BorshAccountsCoder } from "@anchor-lang/core";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  ATTESTATION_OFFSETS,
  ATTESTATION_SIZE,
  IDL,
  PROPOSAL_OFFSETS,
  PROPOSAL_SIZE,
  decodeAttestation,
  decodeProposal,
  findAttestationPda,
  findProposalPda,
  parseProgramError,
  describeError,
  sha256Context,
  sortPair,
} from "../src";

const coder = new BorshAccountsCoder(IDL);
const k = () => Keypair.generate().publicKey;

test("attestation offsets and size match the on-chain layout", async () => {
  const [a, b, payer] = [k(), k(), k()];
  const ctx = Array.from({ length: 32 }, (_, i) => i + 1);
  const buf = await coder.encode("Attestation", {
    version: 1, a, b, method: 2, created_at: new BN(1_700_000_000), context_hash: ctx, payer, bump: 254,
  });
  assert.equal(buf.length, ATTESTATION_SIZE);
  const o = ATTESTATION_OFFSETS;
  assert.equal(buf[o.version], 1);
  assert.deepEqual(buf.subarray(o.a, o.a + 32), a.toBuffer());
  assert.deepEqual(buf.subarray(o.b, o.b + 32), b.toBuffer());
  assert.equal(buf[o.method], 2);
  assert.equal(Number(buf.readBigInt64LE(o.createdAt)), 1_700_000_000);
  assert.deepEqual([...buf.subarray(o.contextHash, o.contextHash + 32)], ctx);
  assert.deepEqual(buf.subarray(o.payer, o.payer + 32), payer.toBuffer());
  assert.equal(buf[o.bump], 254);
  const d = decodeAttestation(k(), buf);
  assert.equal(d.createdAt, 1_700_000_000);
  assert.ok(d.payer.equals(payer));
});

test("proposal offsets and size match the on-chain layout", async () => {
  const [a, b, proposer] = [k(), k(), k()];
  const ctx = Array.from({ length: 32 }, (_, i) => 200 - i);
  const buf = await coder.encode("Proposal", {
    version: 1, a, b, proposer, method: 1, context_hash: ctx,
    created_at: new BN(1_700_000_001), expires_at: new BN(1_700_086_401), bump: 253,
  });
  assert.equal(buf.length, PROPOSAL_SIZE);
  const o = PROPOSAL_OFFSETS;
  assert.deepEqual(buf.subarray(o.a, o.a + 32), a.toBuffer());
  assert.deepEqual(buf.subarray(o.b, o.b + 32), b.toBuffer());
  assert.deepEqual(buf.subarray(o.proposer, o.proposer + 32), proposer.toBuffer());
  assert.equal(buf[o.method], 1);
  assert.deepEqual([...buf.subarray(o.contextHash, o.contextHash + 32)], ctx);
  assert.equal(Number(buf.readBigInt64LE(o.createdAt)), 1_700_000_001);
  assert.equal(Number(buf.readBigInt64LE(o.expiresAt)), 1_700_086_401);
  assert.equal(buf[o.bump], 253);
  const d = decodeProposal(k(), buf);
  assert.equal(d.expiresAt, 1_700_086_401);
  assert.ok(d.proposer.equals(proposer));
});

test("sortPair uses raw byte order and PDAs are order independent", () => {
  for (let i = 0; i < 50; i++) {
    const [x, y] = [k(), k()];
    const [lo, hi] = sortPair(x, y);
    assert.ok(Buffer.compare(lo.toBuffer(), hi.toBuffer()) <= 0);
    assert.ok(findAttestationPda(x, y)[0].equals(findAttestationPda(y, x)[0]));
    assert.ok(findProposalPda(x, y)[0].equals(findProposalPda(y, x)[0]));
    assert.ok(!findProposalPda(x, y)[0].equals(findAttestationPda(x, y)[0]));
  }
});

test("parses program errors from logs and raw codes", () => {
  const logs = ["Program log: AnchorError thrown. Error Code: NotParty. Error Number: 6009. Error Message: x."];
  assert.equal(parseProgramError({ message: "failed", logs })?.name, "NotParty");
  assert.equal(parseProgramError(new Error("custom program error: 0x1771"))?.name, "InvalidMethod");
  assert.equal(parseProgramError(new Error("nothing"))?.name, undefined);
});

test("context hashing", () => {
  assert.deepEqual([...sha256Context("  ")], new Array(32).fill(0));
  assert.equal(sha256Context("met at the conf").length, 32);
  assert.deepEqual(sha256Context("a"), sha256Context(" a "));
  assert.ok(new PublicKey(IDL.address));
});

test("describeError gives readable text for framework and custom errors", () => {
  const fw = { message: "failed", logs: ["Program log: AnchorError caused by account: proposal. Error Code: AccountNotInitialized. Error Number: 3012. Error Message: The program expected this account to be already initialized."] };
  assert.match(describeError(fw), /no longer exists/);
  assert.equal(describeError(new Error("custom program error: 0x1779")), "Only one of the two connected wallets can revoke this connection");
  assert.match(describeError(new Error("User rejected the request.")), /rejected in the wallet/);
});
