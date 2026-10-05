use anchor_lang::prelude::*;

use crate::{constants::*, error::PairproofError, events::*, state::*};

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    /// Only the original proposer may cancel; receives the rent back.
    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(
        mut,
        close = proposer,
        seeds = [PROPOSAL_SEED, proposal.a.as_ref(), proposal.b.as_ref()],
        bump = proposal.bump,
        has_one = proposer @ PairproofError::NotProposer,
    )]
    pub proposal: Account<'info, Proposal>,
}

pub fn handle_cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
    let p = &ctx.accounts.proposal;
    emit!(ProposalCancelled { a: p.a, b: p.b, proposer: p.proposer });
    Ok(())
}
