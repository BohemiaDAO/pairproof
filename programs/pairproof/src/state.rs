use anchor_lang::prelude::*;

use crate::error::PairproofError;

/// How the two parties know each other. Stored on-chain as a `u8`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum Method {
    InPerson = 0,
    VideoCall = 1,
    Vouch = 2,
}

impl TryFrom<u8> for Method {
    type Error = Error;

    fn try_from(v: u8) -> Result<Self> {
        match v {
            0 => Ok(Method::InPerson),
            1 => Ok(Method::VideoCall),
            2 => Ok(Method::Vouch),
            _ => err!(PairproofError::InvalidMethod),
        }
    }
}

/// A confirmed, mutual connection. PDA seeds: `["edge", a, b]` with `a < b`.
#[account]
#[derive(InitSpace)]
pub struct Attestation {
    pub version: u8,
    pub a: Pubkey,
    pub b: Pubkey,
    pub method: u8,
    pub created_at: i64,
    /// All zeros = no context.
    pub context_hash: [u8; 32],
    /// Wallet that economically funded the rent; receives it back on revoke.
    pub payer: Pubkey,
    pub bump: u8,
}

/// A pending, one-sided request. PDA seeds: `["proposal", a, b]` with `a < b`.
#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub version: u8,
    pub a: Pubkey,
    pub b: Pubkey,
    pub proposer: Pubkey,
    pub method: u8,
    pub context_hash: [u8; 32],
    pub created_at: i64,
    pub expires_at: i64,
    pub bump: u8,
}

/// Canonical ordering of a pair: raw byte comparison, smaller key first.
/// The program always sorts itself and never trusts client ordering.
pub fn sort_pair(x: &Pubkey, y: &Pubkey) -> (Pubkey, Pubkey) {
    if x.to_bytes() <= y.to_bytes() {
        (*x, *y)
    } else {
        (*y, *x)
    }
}

pub fn lo(x: &Pubkey, y: &Pubkey) -> Pubkey {
    sort_pair(x, y).0
}

pub fn hi(x: &Pubkey, y: &Pubkey) -> Pubkey {
    sort_pair(x, y).1
}
