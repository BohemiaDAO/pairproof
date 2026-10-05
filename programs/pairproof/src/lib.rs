pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6XxZ4hSsYVp4c1VrTEo1RbAEhpoHxpCFT1yjUWH5Xias");

#[program]
pub mod pairproof {
    use super::*;

    /// Open a request to connect with `counterparty`. Signer pays rent.
    pub fn propose(
        ctx: Context<Propose>,
        counterparty: Pubkey,
        method: u8,
        context_hash: [u8; 32],
        expires_at: i64,
    ) -> Result<()> {
        propose::handle_propose(ctx, counterparty, method, context_hash, expires_at)
    }

    /// The counterparty accepts: creates the attestation and closes the proposal.
    pub fn confirm(ctx: Context<Confirm>) -> Result<()> {
        confirm::handle_confirm(ctx)
    }

    /// The proposer withdraws an open proposal and reclaims rent.
    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        cancel_proposal::handle_cancel_proposal(ctx)
    }

    /// Either party deletes the attestation; rent returns to the stored payer.
    pub fn revoke(ctx: Context<Revoke>) -> Result<()> {
        revoke::handle_revoke(ctx)
    }
}
