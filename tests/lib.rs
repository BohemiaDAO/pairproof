//! Shared LiteSVM helpers. Tests load the *built* program: run `anchor build` first.
use anchor_lang::{
    prelude::{Clock, Pubkey},
    solana_program::{instruction::Instruction, system_program},
    AccountDeserialize, InstructionData, ToAccountMetas,
};
use litesvm::{types::TransactionMetadata, LiteSVM};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;

pub use pairproof::{error::PairproofError, state::*};
pub use solana_keypair::Keypair as Kp;
pub use solana_signer::Signer as _Signer;

pub const SOL: u64 = 1_000_000_000;
pub const T0: i64 = 1_800_000_000;

pub struct Env {
    pub svm: LiteSVM,
}

pub fn pid() -> Pubkey {
    pairproof::ID
}

pub fn setup() -> Env {
    let mut svm = LiteSVM::new();
    let so = concat!(env!("CARGO_MANIFEST_DIR"), "/../target/deploy/pairproof.so");
    let bytes = std::fs::read(so).expect("run `anchor build` first");
    svm.add_program(pid(), &bytes).unwrap();
    let mut clock = svm.get_sysvar::<Clock>();
    clock.unix_timestamp = T0;
    svm.set_sysvar::<Clock>(&clock);
    Env { svm }
}

pub fn funded(env: &mut Env) -> Keypair {
    let k = Keypair::new();
    env.svm.airdrop(&k.pubkey(), 10 * SOL).unwrap();
    k
}

pub fn sorted(x: &Pubkey, y: &Pubkey) -> (Pubkey, Pubkey) {
    sort_pair(x, y)
}

pub fn proposal_pda(x: &Pubkey, y: &Pubkey) -> Pubkey {
    let (a, b) = sorted(x, y);
    Pubkey::find_program_address(&[b"proposal", a.as_ref(), b.as_ref()], &pid()).0
}

pub fn edge_pda(x: &Pubkey, y: &Pubkey) -> Pubkey {
    let (a, b) = sorted(x, y);
    Pubkey::find_program_address(&[b"edge", a.as_ref(), b.as_ref()], &pid()).0
}

pub fn ix_propose(
    proposer: &Pubkey,
    counterparty: &Pubkey,
    method: u8,
    ctx_hash: [u8; 32],
    expires_at: i64,
) -> Instruction {
    ix_propose_with(
        proposer,
        counterparty,
        method,
        ctx_hash,
        expires_at,
        proposal_pda(proposer, counterparty),
        edge_pda(proposer, counterparty),
    )
}

/// Lets tests pass arbitrary (e.g. unsorted / wrong) PDAs.
pub fn ix_propose_with(
    proposer: &Pubkey,
    counterparty: &Pubkey,
    method: u8,
    ctx_hash: [u8; 32],
    expires_at: i64,
    proposal: Pubkey,
    attestation: Pubkey,
) -> Instruction {
    Instruction::new_with_bytes(
        pid(),
        &pairproof::instruction::Propose {
            counterparty: *counterparty,
            method,
            context_hash: ctx_hash,
            expires_at,
        }
        .data(),
        pairproof::accounts::Propose {
            proposer: *proposer,
            proposal,
            attestation,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    )
}

/// `signer` may be anyone; the pair `(x, y)` identifies the proposal.
pub fn ix_confirm(confirmer: &Pubkey, x: &Pubkey, y: &Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        pid(),
        &pairproof::instruction::Confirm {}.data(),
        pairproof::accounts::Confirm {
            confirmer: *confirmer,
            proposal: proposal_pda(x, y),
            attestation: edge_pda(x, y),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    )
}

pub fn ix_cancel(proposer: &Pubkey, x: &Pubkey, y: &Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        pid(),
        &pairproof::instruction::CancelProposal {}.data(),
        pairproof::accounts::CancelProposal {
            proposer: *proposer,
            proposal: proposal_pda(x, y),
        }
        .to_account_metas(None),
    )
}

pub fn ix_revoke(signer: &Pubkey, x: &Pubkey, y: &Pubkey, payer: &Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        pid(),
        &pairproof::instruction::Revoke {}.data(),
        pairproof::accounts::Revoke {
            signer: *signer,
            attestation: edge_pda(x, y),
            payer: *payer,
        }
        .to_account_metas(None),
    )
}

pub type TxResult = Result<TransactionMetadata, String>;

/// Sends `ix` signed (and paid for) by `signer`. Returns the program log on failure.
pub fn send(env: &mut Env, ix: Instruction, signer: &Keypair) -> TxResult {
    env.svm.expire_blockhash();
    let bh = env.svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&signer.pubkey()), &bh);
    let tx = Transaction::new(&[signer], msg, bh);
    env.svm
        .send_transaction(tx)
        .map_err(|e| format!("{:?}\n{}", e.err, e.meta.logs.join("\n")))
}

pub fn set_time(env: &mut Env, t: i64) {
    let mut c = env.svm.get_sysvar::<Clock>();
    c.unix_timestamp = t;
    env.svm.set_sysvar::<Clock>(&c);
}

pub fn read<T: AccountDeserialize>(env: &Env, key: &Pubkey) -> Option<T> {
    let acc = env.svm.get_account(key)?;
    if acc.data.is_empty() {
        return None;
    }
    let mut d: &[u8] = &acc.data;
    T::try_deserialize(&mut d).ok()
}

pub fn lamports(env: &Env, key: &Pubkey) -> u64 {
    env.svm.get_account(key).map(|a| a.lamports).unwrap_or(0)
}

/// Asserts the failure contains the given custom Anchor error (by name and code).
pub fn assert_err(res: TxResult, e: PairproofError) {
    let msg = res.expect_err("expected the transaction to fail");
    let code = 6000 + e as u32;
    assert!(
        msg.contains(&format!("Custom({code})")) || msg.contains(&format!("0x{code:x}")),
        "expected {e:?} ({code}), got:\n{msg}"
    );
}

pub fn assert_failed(res: TxResult) {
    assert!(res.is_err(), "expected the transaction to fail");
}
