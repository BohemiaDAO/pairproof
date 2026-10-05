use anchor_lang::prelude::*;

#[event]
pub struct ProposalCreated {
    pub a: Pubkey,
    pub b: Pubkey,
    pub proposer: Pubkey,
    pub method: u8,
    pub context_hash: [u8; 32],
    pub expires_at: i64,
}

#[event]
pub struct ProposalCancelled {
    pub a: Pubkey,
    pub b: Pubkey,
    pub proposer: Pubkey,
}

#[event]
pub struct AttestationCreated {
    pub a: Pubkey,
    pub b: Pubkey,
    pub method: u8,
    pub context_hash: [u8; 32],
    pub created_at: i64,
}

#[event]
pub struct AttestationRevoked {
    pub a: Pubkey,
    pub b: Pubkey,
    pub by: Pubkey,
    pub at: i64,
}
