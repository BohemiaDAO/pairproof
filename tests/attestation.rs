use anchor_lang::prelude::Pubkey;
use pairproof_tests::*;
use solana_signer::Signer;

const HASH: [u8; 32] = [7u8; 32];
const NONE: [u8; 32] = [0u8; 32];

struct World {
    env: Env,
    p: Kp, // proposer
    c: Kp, // counterparty
}

fn world() -> World {
    let mut env = setup();
    let p = funded(&mut env);
    let c = funded(&mut env);
    World { env, p, c }
}

fn propose(w: &mut World) {
    let ix = ix_propose(&w.p.pubkey(), &w.c.pubkey(), 0, HASH, T0 + 3600);
    send(&mut w.env, ix, &w.p).unwrap();
}

fn connect(w: &mut World) {
    propose(w);
    let ix = ix_confirm(&w.c.pubkey(), &w.p.pubkey(), &w.c.pubkey());
    send(&mut w.env, ix, &w.c).unwrap();
}

#[test]
fn happy_path_propose_then_confirm() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    propose(&mut w);

    let prop: Proposal = read(&w.env, &proposal_pda(&pp, &cp)).expect("proposal exists");
    let (a, b) = sorted(&pp, &cp);
    assert_eq!((prop.a, prop.b, prop.proposer), (a, b, pp));
    assert_eq!(prop.method, 0);
    assert_eq!(prop.context_hash, HASH);
    assert_eq!(prop.expires_at, T0 + 3600);
    assert!(a.to_bytes() < b.to_bytes());

    let ix = ix_confirm(&cp, &pp, &cp);
    send(&mut w.env, ix, &w.c).unwrap();

    assert!(read::<Proposal>(&w.env, &proposal_pda(&pp, &cp)).is_none(), "proposal closed");
    let e: Attestation = read(&w.env, &edge_pda(&pp, &cp)).expect("attestation exists");
    assert_eq!((e.a, e.b), (a, b));
    assert_eq!(e.method, 0);
    assert_eq!(e.created_at, T0);
    assert_eq!(e.context_hash, HASH);
    assert_eq!(e.payer, pp, "proposer is the economic payer");
    assert_eq!(e.version, 1);
    // Order of the pair does not matter for lookup.
    assert_eq!(edge_pda(&pp, &cp), edge_pda(&cp, &pp));
}

#[test]
fn no_context_is_all_zeros() {
    let mut w = world();
    let ix = ix_propose(&w.p.pubkey(), &w.c.pubkey(), 2, NONE, T0 + 10);
    send(&mut w.env, ix, &w.p).unwrap();
    let prop: Proposal = read(&w.env, &proposal_pda(&w.p.pubkey(), &w.c.pubkey())).unwrap();
    assert_eq!((prop.method, prop.context_hash), (2, NONE));
}

#[test]
fn rent_flows_on_propose_confirm_and_revoke() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    let p0 = lamports(&w.env, &pp);
    let c0 = lamports(&w.env, &cp);

    propose(&mut w);
    let prop_rent = lamports(&w.env, &proposal_pda(&pp, &cp));
    assert!(prop_rent > 0);
    let fee = p0 - lamports(&w.env, &pp) - prop_rent; // propose tx fee
    assert!(fee < 1_000_000);

    let ix = ix_confirm(&cp, &pp, &cp);
    send(&mut w.env, ix, &w.c).unwrap();
    let edge_rent = lamports(&w.env, &edge_pda(&pp, &cp));
    assert!(edge_rent > 0 && edge_rent <= prop_rent);
    // Confirmer is reimbursed by the proposal's rent: net gain = difference minus the tx fee.
    let c1 = lamports(&w.env, &cp);
    assert_eq!(c1 + fee, c0 + (prop_rent - edge_rent), "confirmer not out of pocket");

    // Revoke by the confirmer: rent goes to the proposer (stored payer), not to the signer.
    let p_before = lamports(&w.env, &pp);
    let c_before = lamports(&w.env, &cp);
    let ix = ix_revoke(&cp, &pp, &cp, &pp);
    send(&mut w.env, ix, &w.c).unwrap();
    assert_eq!(lamports(&w.env, &pp), p_before + edge_rent);
    assert_eq!(lamports(&w.env, &cp), c_before - fee);
    assert!(read::<Attestation>(&w.env, &edge_pda(&pp, &cp)).is_none());
}

#[test]
fn cancel_returns_rent_to_proposer() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    let p0 = lamports(&w.env, &pp);
    propose(&mut w);
    let rent = lamports(&w.env, &proposal_pda(&pp, &cp));
    let ix = ix_cancel(&pp, &pp, &cp);
    send(&mut w.env, ix, &w.p).unwrap();
    assert!(read::<Proposal>(&w.env, &proposal_pda(&pp, &cp)).is_none());
    // Back to start minus two tx fees only.
    let spent = p0 - lamports(&w.env, &pp);
    assert!(spent < rent / 10, "rent {rent} should have been refunded, spent {spent}");
}

#[test]
fn cancel_by_non_proposer_fails() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    propose(&mut w);
    let ix = ix_cancel(&cp, &pp, &cp);
    assert_err(send(&mut w.env, ix, &w.c), PairproofError::NotProposer);
    assert!(read::<Proposal>(&w.env, &proposal_pda(&pp, &cp)).is_some());
}

#[test]
fn self_attestation_fails() {
    let mut w = world();
    let me = w.p.pubkey();
    let ix = ix_propose(&me, &me, 0, NONE, T0 + 100);
    assert_err(send(&mut w.env, ix, &w.p), PairproofError::SelfAttestation);
}

#[test]
fn unknown_method_fails() {
    let mut w = world();
    let ix = ix_propose(&w.p.pubkey(), &w.c.pubkey(), 3, NONE, T0 + 100);
    assert_err(send(&mut w.env, ix, &w.p), PairproofError::InvalidMethod);
    let ix = ix_propose(&w.p.pubkey(), &w.c.pubkey(), 255, NONE, T0 + 100);
    assert_err(send(&mut w.env, ix, &w.p), PairproofError::InvalidMethod);
}

#[test]
fn expiry_in_the_past_fails() {
    let mut w = world();
    let ix = ix_propose(&w.p.pubkey(), &w.c.pubkey(), 0, NONE, T0);
    assert_err(send(&mut w.env, ix, &w.p), PairproofError::ExpiryInPast);
}

#[test]
fn confirm_by_wrong_party_fails() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    propose(&mut w);
    let stranger = funded(&mut w.env);
    let ix = ix_confirm(&stranger.pubkey(), &pp, &cp);
    assert_err(send(&mut w.env, ix, &stranger), PairproofError::InvalidConfirmer);
}

#[test]
fn confirm_by_proposer_fails() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    propose(&mut w);
    let ix = ix_confirm(&pp, &pp, &cp);
    assert_err(send(&mut w.env, ix, &w.p), PairproofError::InvalidConfirmer);
}

#[test]
fn expired_proposal_cannot_be_confirmed() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    propose(&mut w);
    set_time(&mut w.env, T0 + 3600); // exactly at expiry counts as expired
    let ix = ix_confirm(&cp, &pp, &cp);
    assert_err(send(&mut w.env, ix, &w.c), PairproofError::ProposalExpired);
    // The proposer can still reclaim rent after expiry.
    let ix = ix_cancel(&pp, &pp, &cp);
    send(&mut w.env, ix, &w.p).unwrap();
}

#[test]
fn duplicate_attestation_fails() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    connect(&mut w);
    // Either side tries to propose again.
    let ix = ix_propose(&pp, &cp, 0, NONE, T0 + 100);
    assert_err(send(&mut w.env, ix, &w.p), PairproofError::AttestationAlreadyExists);
    let ix = ix_propose(&cp, &pp, 1, NONE, T0 + 100);
    assert_err(send(&mut w.env, ix, &w.c), PairproofError::AttestationAlreadyExists);
}

#[test]
fn duplicate_open_proposal_fails() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    propose(&mut w);
    let ix = ix_propose(&cp, &pp, 1, NONE, T0 + 100);
    assert_err(send(&mut w.env, ix, &w.c), PairproofError::ProposalAlreadyExists);
}

#[test]
fn can_reconnect_after_revoke() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    connect(&mut w);
    let ix = ix_revoke(&pp, &pp, &cp, &pp);
    send(&mut w.env, ix, &w.p).unwrap();
    // Roles swapped this time.
    let ix = ix_propose(&cp, &pp, 1, NONE, T0 + 100);
    send(&mut w.env, ix, &w.c).unwrap();
    let ix = ix_confirm(&pp, &pp, &cp);
    send(&mut w.env, ix, &w.p).unwrap();
    let e: Attestation = read(&w.env, &edge_pda(&pp, &cp)).unwrap();
    assert_eq!((e.method, e.payer), (1, cp));
}

#[test]
fn revoke_by_a_and_by_b() {
    for a_revokes in [true, false] {
        let mut w = world();
        let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
        connect(&mut w);
        let (a, _b) = sorted(&pp, &cp);
        let (signer_kp, signer) = if (a == pp) == a_revokes { (&w.p, pp) } else { (&w.c, cp) };
        let ix = ix_revoke(&signer, &pp, &cp, &pp);
        send(&mut w.env, ix, signer_kp).unwrap();
        assert!(read::<Attestation>(&w.env, &edge_pda(&pp, &cp)).is_none());
    }
}

#[test]
fn revoke_by_third_party_fails() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    connect(&mut w);
    let stranger = funded(&mut w.env);
    let ix = ix_revoke(&stranger.pubkey(), &pp, &cp, &pp);
    assert_err(send(&mut w.env, ix, &stranger), PairproofError::NotParty);
    assert!(read::<Attestation>(&w.env, &edge_pda(&pp, &cp)).is_some());
}

#[test]
fn revoke_with_wrong_rent_destination_fails() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    connect(&mut w);
    // Revoker tries to redirect the rent to themselves instead of the stored payer.
    let ix = ix_revoke(&cp, &pp, &cp, &cp);
    assert_failed(send(&mut w.env, ix, &w.c));
    assert!(read::<Attestation>(&w.env, &edge_pda(&pp, &cp)).is_some());
}

#[test]
fn unsorted_or_forged_pda_fails() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    let (a, b) = sorted(&pp, &cp);
    let wrong_order = |tag: &[u8]| Pubkey::find_program_address(&[tag, b.as_ref(), a.as_ref()], &pid()).0;
    // Reversed seed order for the proposal.
    let ix = ix_propose_with(&pp, &cp, 0, NONE, T0 + 100, wrong_order(b"proposal"), edge_pda(&pp, &cp));
    assert_err(send(&mut w.env, ix, &w.p), PairproofError::InvalidPda);
    // Reversed seed order for the attestation check (would sidestep the duplicate check).
    let ix = ix_propose_with(&pp, &cp, 0, NONE, T0 + 100, proposal_pda(&pp, &cp), wrong_order(b"edge"));
    assert_err(send(&mut w.env, ix, &w.p), PairproofError::InvalidPda);
    // A different pair's proposal address.
    let other = Pubkey::new_unique();
    let ix = ix_propose_with(&pp, &cp, 0, NONE, T0 + 100, proposal_pda(&pp, &other), edge_pda(&pp, &cp));
    assert_err(send(&mut w.env, ix, &w.p), PairproofError::InvalidPda);
    assert!(read::<Proposal>(&w.env, &proposal_pda(&pp, &cp)).is_none());
}

#[test]
fn prefunded_proposal_pda_cannot_block_proposing() {
    let mut w = world();
    let (pp, cp) = (w.p.pubkey(), w.c.pubkey());
    // Attacker sends lamports to the (publicly derivable) proposal address.
    let target = proposal_pda(&pp, &cp);
    // (Must be >= the 0-byte rent minimum, or the runtime rejects the transfer outright.)
    w.env.svm.airdrop(&target, 1_000_000).unwrap();
    propose(&mut w);
    assert!(read::<Proposal>(&w.env, &target).is_some());
}
