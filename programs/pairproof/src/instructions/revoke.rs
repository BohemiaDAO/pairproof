use anchor_lang::prelude::*;

use crate::{constants::*, error::PairproofError, events::*, state::*};

#[derive(Accounts)]
pub struct Revoke<'info> {
    /// Either party of the attestation. Checked in the attestation constraint below.
    pub signer: Signer<'info>,

    /// Rent goes to the stored `payer` (`has_one`), never to an address chosen by the caller.
    #[account(
        mut,
        close = payer,
        seeds = [EDGE_SEED, attestation.a.as_ref(), attestation.b.as_ref()],
        bump = attestation.bump,
        has_one = payer,
        constraint = signer.key() == attestation.a || signer.key() == attestation.b
            @ PairproofError::NotParty,
    )]
    pub attestation: Account<'info, Attestation>,

    /// CHECK: Verified equal to `attestation.payer` by `has_one`; only receives lamports.
    #[account(mut)]
    pub payer: UncheckedAccount<'info>,
}

pub fn handle_revoke(ctx: Context<Revoke>) -> Result<()> {
    let e = &ctx.accounts.attestation;
    emit!(AttestationRevoked {
        a: e.a,
        b: e.b,
        by: ctx.accounts.signer.key(),
        at: Clock::get()?.unix_timestamp,
    });
    Ok(())
}
