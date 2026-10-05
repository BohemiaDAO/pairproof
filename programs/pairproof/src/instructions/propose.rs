use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Allocate, Assign, CreateAccount, Transfer};

use crate::{constants::*, error::PairproofError, events::*, state::*};

/// Both PDAs are derived and verified in the handler rather than via `seeds = [...]`,
/// because the seeds depend on the *sorted* pair, which Anchor's declarative seeds
/// (and its IDL builder) cannot express. The program sorts the pair itself and never
/// trusts the ordering the client used.
#[derive(Accounts)]
pub struct Propose<'info> {
    /// Signs and pays rent for the proposal.
    #[account(mut)]
    pub proposer: Signer<'info>,

    /// CHECK: Must equal PDA `["proposal", lo, hi]` (verified in the handler) and must be
    /// an empty system account. Created manually in the handler.
    #[account(mut)]
    pub proposal: UncheckedAccount<'info>,

    /// CHECK: Must equal PDA `["edge", lo, hi]` (verified in the handler) and must be an
    /// empty system account, i.e. no attestation exists (never created, or revoked).
    pub attestation: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_propose(
    ctx: Context<Propose>,
    counterparty: Pubkey,
    method: u8,
    context_hash: [u8; 32],
    expires_at: i64,
) -> Result<()> {
    let proposer = ctx.accounts.proposer.key();
    require_keys_neq!(proposer, counterparty, PairproofError::SelfAttestation);
    Method::try_from(method)?;

    let now = Clock::get()?.unix_timestamp;
    require!(expires_at > now, PairproofError::ExpiryInPast);

    let (a, b) = sort_pair(&proposer, &counterparty);

    // No attestation may exist for this pair.
    let (edge_key, _) = Pubkey::find_program_address(&[EDGE_SEED, a.as_ref(), b.as_ref()], &crate::ID);
    require_keys_eq!(ctx.accounts.attestation.key(), edge_key, PairproofError::InvalidPda);
    let edge = &ctx.accounts.attestation;
    require!(
        edge.lamports() == 0 && *edge.owner == system_program::ID,
        PairproofError::AttestationAlreadyExists
    );

    // The proposal must be at its canonical address and not already open.
    let (proposal_key, bump) =
        Pubkey::find_program_address(&[PROPOSAL_SEED, a.as_ref(), b.as_ref()], &crate::ID);
    let info = ctx.accounts.proposal.to_account_info();
    require_keys_eq!(info.key(), proposal_key, PairproofError::InvalidPda);
    require!(
        *info.owner == system_program::ID && info.data_is_empty(),
        PairproofError::ProposalAlreadyExists
    );

    // Create the account. If someone pre-funded the PDA with lamports, a plain
    // `create_account` would fail (grief vector), so fall back to transfer + allocate + assign.
    let space = 8 + Proposal::INIT_SPACE;
    let needed = Rent::get()?.minimum_balance(space);
    let signer_seeds: &[&[&[u8]]] = &[&[PROPOSAL_SEED, a.as_ref(), b.as_ref(), &[bump]]];
    let sys = ctx.accounts.system_program.key();
    if info.lamports() == 0 {
        system_program::create_account(
            CpiContext::new_with_signer(
                sys,
                CreateAccount {
                    from: ctx.accounts.proposer.to_account_info(),
                    to: info.clone(),
                },
                signer_seeds,
            ),
            needed,
            space as u64,
            &crate::ID,
        )?;
    } else {
        let top_up = needed.saturating_sub(info.lamports());
        if top_up > 0 {
            system_program::transfer(
                CpiContext::new(
                    sys,
                    Transfer { from: ctx.accounts.proposer.to_account_info(), to: info.clone() },
                ),
                top_up,
            )?;
        }
        system_program::allocate(
            CpiContext::new_with_signer(sys, Allocate { account_to_allocate: info.clone() }, signer_seeds),
            space as u64,
        )?;
        system_program::assign(
            CpiContext::new_with_signer(sys, Assign { account_to_assign: info.clone() }, signer_seeds),
            &crate::ID,
        )?;
    }

    let proposal = Proposal {
        version: ACCOUNT_VERSION,
        a,
        b,
        proposer,
        method,
        context_hash,
        created_at: now,
        expires_at,
        bump,
    };
    let mut data = info.try_borrow_mut_data()?;
    proposal.try_serialize(&mut &mut data[..])?;

    emit!(ProposalCreated { a, b, proposer, method, context_hash, expires_at });
    Ok(())
}
