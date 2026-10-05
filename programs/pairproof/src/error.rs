use anchor_lang::prelude::*;

#[error_code]
pub enum PairproofError {
    #[msg("You cannot attest a connection with yourself")]
    SelfAttestation,
    #[msg("Unknown method code (expected 0 = in person, 1 = video call, 2 = vouch)")]
    InvalidMethod,
    #[msg("Expiry must be in the future")]
    ExpiryInPast,
    #[msg("This proposal has expired")]
    ProposalExpired,
    #[msg("A connection between these two wallets already exists")]
    AttestationAlreadyExists,
    #[msg("A proposal between these two wallets is already open")]
    ProposalAlreadyExists,
    #[msg("Account address does not match the canonical sorted-pair PDA")]
    InvalidPda,
    #[msg("Only the other party of the proposal can confirm it")]
    InvalidConfirmer,
    #[msg("Only the proposer can cancel this proposal")]
    NotProposer,
    #[msg("Only one of the two connected wallets can revoke this connection")]
    NotParty,
}
