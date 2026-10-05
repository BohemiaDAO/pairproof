import { Program, AnchorProvider, BN } from "@anchor-lang/core";
import { Connection, Keypair, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { IDL, PROGRAM_ID, NO_CONTEXT } from "./constants";
import { findAttestationPda, findProposalPda, sortPair } from "./pda";

/**
 * A read-only Program handle. Instruction builders never sign or send, so a throwaway
 * wallet is enough; callers sign and submit the returned instructions themselves.
 */
export function getProgram(connection: Connection, programId: PublicKey = PROGRAM_ID): Program {
  const dummy = Keypair.generate().publicKey;
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: dummy,
      signTransaction: () => Promise.reject(new Error("read-only")),
      signAllTransactions: () => Promise.reject(new Error("read-only")),
    },
    {},
  );
  return new Program({ ...IDL, address: programId.toBase58() }, provider);
}

/** Open a request to connect with `counterparty`. `expiresAt` is unix seconds. */
export function buildProposeIx(
  program: Program,
  proposer: PublicKey,
  counterparty: PublicKey,
  method: number,
  expiresAt: number,
  contextHash: Uint8Array = NO_CONTEXT,
): Promise<TransactionInstruction> {
  const programId = program.programId;
  return program.methods
    .propose(counterparty, method, Array.from(contextHash), new BN(expiresAt))
    .accountsPartial({
      proposer,
      proposal: findProposalPda(proposer, counterparty, programId)[0],
      attestation: findAttestationPda(proposer, counterparty, programId)[0],
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

/** `confirmer` accepts the proposal that `proposer` opened. */
export function buildConfirmIx(
  program: Program,
  confirmer: PublicKey,
  proposer: PublicKey,
): Promise<TransactionInstruction> {
  const id = program.programId;
  return program.methods
    .confirm()
    .accountsPartial({
      confirmer,
      proposal: findProposalPda(confirmer, proposer, id)[0],
      attestation: findAttestationPda(confirmer, proposer, id)[0],
      systemProgram: SystemProgram.programId,
    })
    .instruction();
}

export function buildCancelProposalIx(
  program: Program,
  proposer: PublicKey,
  counterparty: PublicKey,
): Promise<TransactionInstruction> {
  return program.methods
    .cancelProposal()
    .accountsPartial({
      proposer,
      proposal: findProposalPda(proposer, counterparty, program.programId)[0],
    })
    .instruction();
}

/**
 * Revoke a connection. `payer` must be the attestation's stored payer (it receives the
 * rent back); fetch it with `getAttestation` first.
 */
export function buildRevokeIx(
  program: Program,
  signer: PublicKey,
  counterparty: PublicKey,
  payer: PublicKey,
): Promise<TransactionInstruction> {
  return program.methods
    .revoke()
    .accountsPartial({
      signer,
      attestation: findAttestationPda(signer, counterparty, program.programId)[0],
      payer,
    })
    .instruction();
}

export { sortPair };
