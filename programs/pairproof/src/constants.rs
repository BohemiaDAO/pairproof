use anchor_lang::prelude::*;

/// PDA seed prefix for `Attestation` accounts.
#[constant]
pub const EDGE_SEED: &[u8] = b"edge";

/// PDA seed prefix for `Proposal` accounts.
#[constant]
pub const PROPOSAL_SEED: &[u8] = b"proposal";

/// Current on-chain account layout version.
pub const ACCOUNT_VERSION: u8 = 1;
