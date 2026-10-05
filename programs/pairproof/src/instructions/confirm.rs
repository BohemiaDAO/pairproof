use anchor_lang::prelude::*;

use crate::{constants::*, error::PairproofError, events::*, state::*};

/// Rent design: the confirmer fronts the attestation's rent via `init`, and the proposal
/// account (funded by the proposer, and slightly larger) is closed *to the confirmer*,
/// which reimburses them. Net effect: the proposer funds the connection, the confirmer
/// is never out of pocket, and `Attestation.payer = proposer` gets the rent back on revoke.
#[derive(Accounts)]
pub struct Confirm<'info> {
    #[account(mut)]
    pub confirmer: Signer<'info>,

    /// Address is re-derived from the stored (sorted) pair, and the proposal is closed so
    /// it cannot be replayed. Rent goes to the confirmer (see struct docs).
    #[account(
        mut,
        close = confirmer,
        seeds = [PROPOSAL_SEED, proposal.a.as_ref(), proposal.b.as_ref()],
        bump = proposal.bump,
        // The confirmer must be the party that did NOT propose.
        constraint = proposal.proposer != confirmer.key() @ PairproofError::InvalidConfirmer,
        constraint = confirmer.key() == proposal.a || confirmer.key() == proposal.b
            @ PairproofError::InvalidConfirmer,
    )]
    pub proposal: Account<'info, Proposal>,

    /// `init` fails if an attestation for this pair already exists.
    #[account(
        init,
        payer = confirmer,
        space = 8 + Attestation::INIT_SPACE,
        seeds = [EDGE_SEED, proposal.a.as_ref(), proposal.b.as_ref()],
        bump
    )]
    pub attestation: Account<'info, Attestation>,

    pub system_program: Program<'info, System>,
}

pub fn handle_confirm(ctx: Context<Confirm>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let p = &ctx.accounts.proposal;
    require!(now < p.expires_at, PairproofError::ProposalExpired);

    let e = &mut ctx.accounts.attestation;
    e.version = ACCOUNT_VERSION;
    e.a = p.a;
    e.b = p.b;
    e.method = p.method;
    e.created_at = now;
    e.context_hash = p.context_hash;
    e.payer = p.proposer;
    e.bump = ctx.bumps.attestation;

    emit!(AttestationCreated {
        a: e.a,
        b: e.b,
        method: e.method,
        context_hash: e.context_hash,
        created_at: now,
    });
    Ok(())
}
