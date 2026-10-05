/**
 * End-to-end demo: propose -> confirm -> read -> revoke, with explorer links.
 *
 *   pnpm demo                         # devnet, keypairs auto-created in .keys/ (gitignored)
 *   CLUSTER=localnet pnpm demo        # local validator, auto-airdrops
 *   KEYPAIR_A=a.json KEYPAIR_B=b.json pnpm demo
 *
 * Env: CLUSTER (devnet | localnet | mainnet-beta is refused), RPC_URL, KEYPAIR_A, KEYPAIR_B,
 *      PROGRAM_ID, METHOD (0|1|2), AIRDROP=1 (try the public devnet airdrop for unfunded keys).
 */
import fs from "node:fs";
import path from "node:path";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import {
  METHOD_LABELS,
  PROGRAM_ID,
  buildConfirmIx,
  buildProposeIx,
  buildRevokeIx,
  describeError,
  findAttestationPda,
  getAttestation,
  getProgram,
  isConnected,
  listIncomingProposals,
  listMyAttestations,
  listOutgoingProposals,
  sha256Context,
} from "@pairproof/sdk";

const cluster = process.env.CLUSTER ?? "devnet";
if (cluster.includes("mainnet")) throw new Error("Pairproof is devnet-only. Refusing to run on mainnet.");
const local = cluster === "localnet";
const rpcUrl = process.env.RPC_URL ?? (local ? "http://127.0.0.1:8899" : "https://api.devnet.solana.com");
const programId = process.env.PROGRAM_ID ? new PublicKey(process.env.PROGRAM_ID) : PROGRAM_ID;
const method = Number(process.env.METHOD ?? 0);
const connection = new Connection(rpcUrl, "confirmed");

const explorerTx = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=${local ? `custom&customUrl=${encodeURIComponent(rpcUrl)}` : "devnet"}`;
const explorerAddr = (a: PublicKey) =>
  `https://explorer.solana.com/address/${a.toBase58()}?cluster=${local ? `custom&customUrl=${encodeURIComponent(rpcUrl)}` : "devnet"}`;

function loadOrCreate(envVar: string, fallbackName: string): Keypair {
  const file = process.env[envVar] ?? path.join(".keys", fallbackName);
  if (fs.existsSync(file)) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8"))));
  if (process.env[envVar]) throw new Error(`${envVar}=${file} does not exist`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const kp = Keypair.generate();
  fs.writeFileSync(file, JSON.stringify(Array.from(kp.secretKey)), { mode: 0o600 });
  console.log(`created throwaway keypair ${file}`);
  return kp;
}

async function ensureFunds(name: string, kp: Keypair) {
  const min = 0.05 * LAMPORTS_PER_SOL;
  if ((await connection.getBalance(kp.publicKey)) >= min) return;
  if (local || process.env.AIRDROP === "1") {
    const sig = await connection.requestAirdrop(kp.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    return;
  }
  console.error(
    `\n${name} (${kp.publicKey.toBase58()}) needs devnet SOL (>= 0.05).\n` +
      `Fund it at https://faucet.solana.com (select devnet), or re-run with AIRDROP=1.`,
  );
  process.exit(1);
}

async function send(label: string, ix: Parameters<Transaction["add"]>[0], signer: Keypair) {
  const tx = new Transaction().add(ix);
  tx.feePayer = signer.publicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(signer);
  try {
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
    console.log(`  ✓ ${label}\n    ${explorerTx(sig)}`);
    return sig;
  } catch (e) {
    console.error(`  ✗ ${label}: ${describeError(e)}`);
    throw e;
  }
}

async function main() {
  const a = loadOrCreate("KEYPAIR_A", "a.json");
  const b = loadOrCreate("KEYPAIR_B", "b.json");
  console.log(`cluster   ${cluster} (${rpcUrl})\nprogram   ${programId.toBase58()}`);
  console.log(`person A  ${a.publicKey.toBase58()}\nperson B  ${b.publicKey.toBase58()}`);
  if (!(await connection.getAccountInfo(programId))) {
    throw new Error(`Program ${programId.toBase58()} is not deployed on this cluster.`);
  }
  await ensureFunds("A", a);
  await ensureFunds("B", b);

  const program = getProgram(connection, programId);
  if (await isConnected(connection, a.publicKey, b.publicKey, programId)) {
    console.log("\nA and B are already connected; revoking first so the demo can run from scratch.");
    const existing = (await getAttestation(connection, a.publicKey, b.publicKey, programId))!;
    await send("revoke (cleanup)", await buildRevokeIx(program, a.publicKey, b.publicKey, existing.payer), a);
  }

  console.log("\n1. A proposes a connection to B");
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 3600;
  const context = sha256Context("pairproof demo");
  await send(
    "propose",
    await buildProposeIx(program, a.publicKey, b.publicKey, method, expiresAt, context),
    a,
  );
  console.log(`  B sees ${(await listIncomingProposals(connection, b.publicKey, programId)).length} incoming, ` +
    `A has ${(await listOutgoingProposals(connection, a.publicKey, programId)).length} outgoing`);

  console.log("\n2. B confirms");
  await send("confirm", await buildConfirmIx(program, b.publicKey, a.publicKey), b);

  console.log("\n3. Read it back (this is all a third-party program or app has to do)");
  const att = await getAttestation(connection, b.publicKey, a.publicKey, programId);
  if (!att) throw new Error("attestation missing after confirm");
  console.log(`  isConnected(A,B) = ${await isConnected(connection, a.publicKey, b.publicKey, programId)}`);
  console.log(`  method=${METHOD_LABELS[att.method]} createdAt=${new Date(att.createdAt * 1000).toISOString()}`);
  console.log(`  payer=${att.payer.toBase58()} (proposer: ${att.payer.equals(a.publicKey)})`);
  console.log(`  account ${explorerAddr(findAttestationPda(a.publicKey, b.publicKey, programId)[0])}`);
  console.log(`  A has ${(await listMyAttestations(connection, a.publicKey, programId)).length} connection(s)`);

  console.log("\n4. B revokes (rent returns to A, the stored payer)");
  await send("revoke", await buildRevokeIx(program, b.publicKey, a.publicKey, att.payer), b);
  console.log(`  isConnected(A,B) = ${await isConnected(connection, a.publicKey, b.publicKey, programId)}`);
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
