# Pairproof

**Mutual, two-signature attestations that two people have met** (in person, on a video call, or by vouch),
as an open-source Solana program and web app. A minimal, composable primitive for proof-of-personhood and
sybil resistance.

Pairproof stores **no personal data**: an attestation is two public keys, a method code, a timestamp and an
optional 32-byte context hash. Nothing else.

- Program (devnet): [`6KDQk3vW9vv7nArqkkKo1bveZSnmJ7gBXp6PwwhaE4UR`](https://explorer.solana.com/address/6KDQk3vW9vv7nArqkkKo1bveZSnmJ7gBXp6PwwhaE4UR?cluster=devnet)
- License: MIT
- Status: hackathon build, **devnet only**

## Why

Sybil resistance usually asks one party to prove something to a central authority. Pairproof asks two people
to sign the same statement, "we met", so that the claim is only valid if **both** agree. The result is a public,
pseudonymous graph of mutual attestations that any program or app can read (see `isConnected` in the SDK, or
read the PDA directly). What a consumer does with the graph, such as gating, scoring or voting, is up to them.

## Origin

_TODO: author to write._

## Prior work disclosure

_TODO: author to write._

## How it works

1. **Propose.** Alice signs `propose(counterparty = Bob, method, context_hash, expires_at)` and funds a small
   `Proposal` account.
2. **Confirm.** Bob signs `confirm()`. The program creates the `Attestation`, closes the `Proposal` and
   emits `AttestationCreated`.
3. **Read.** Anyone derives the attestation PDA from the two public keys and reads it. No wallet needed.
4. **Revoke.** Either party can sign `revoke()` at any time; the account is closed.

```mermaid
flowchart LR
  subgraph Browser
    UI[Web app<br/>React + Vite]
    SDK[@pairproof/sdk<br/>PDAs, fetchers, ix builders]
    W[Wallet or devnet burner]
  end
  subgraph Solana
    P[(pairproof program)]
    PR[Proposal PDA<br/>proposal, a, b]
    AT[Attestation PDA<br/>edge, a, b]
  end
  UI --> SDK
  UI --> W
  W -- signed tx --> P
  SDK -- getProgramAccounts / getAccountInfo --> P
  P --> PR
  P --> AT
  PR -- confirm --> AT
```

A pair `(a, b)` is always sorted by **raw byte comparison** (`a < b`). The program sorts the pair itself and
never trusts the order a client used, so there is exactly one proposal address and one attestation address per
pair, however the two wallets are ordered.

## Account layouts

Both accounts are PDAs of the program. Sizes include the 8-byte Anchor discriminator.

**`Attestation`**, seeds `["edge", a, b]`, 147 bytes

| Field | Type | Offset | Notes |
|---|---|---|---|
| discriminator | `[u8; 8]` | 0 | |
| `version` | `u8` | 8 | currently `1` |
| `a` | `Pubkey` | 9 | the smaller key |
| `b` | `Pubkey` | 41 | the larger key |
| `method` | `u8` | 73 | `0` in person, `1` video call, `2` vouch |
| `created_at` | `i64` | 74 | unix seconds, from `Clock` |
| `context_hash` | `[u8; 32]` | 82 | all zeros = none |
| `payer` | `Pubkey` | 114 | rent goes back here on revoke |
| `bump` | `u8` | 146 | |

**`Proposal`**, seeds `["proposal", a, b]`, 155 bytes

| Field | Type | Offset |
|---|---|---|
| discriminator | `[u8; 8]` | 0 |
| `version` | `u8` | 8 |
| `a` | `Pubkey` | 9 |
| `b` | `Pubkey` | 41 |
| `proposer` | `Pubkey` | 73 |
| `method` | `u8` | 105 |
| `context_hash` | `[u8; 32]` | 106 |
| `created_at` | `i64` | 138 |
| `expires_at` | `i64` | 146 |
| `bump` | `u8` | 154 |

## Instructions

| Instruction | Signer | What it does | Fails when |
|---|---|---|---|
| `propose(counterparty, method, context_hash, expires_at)` | proposer (pays rent) | creates the `Proposal` | self-attestation, unknown method, `expires_at <= now`, attestation or proposal already exists, wrong PDA |
| `confirm()` | the non-proposer party | creates the `Attestation`, closes the `Proposal` | proposer confirming, third party, expired |
| `cancel_proposal()` | proposer | closes the `Proposal`, rent back to proposer | not the proposer |
| `revoke()` | `a` or `b` | closes the `Attestation`, rent back to the stored `payer` | third party, wrong rent destination |

Events: `ProposalCreated`, `ProposalCancelled`, `AttestationCreated`, `AttestationRevoked`.
Errors are a custom enum with readable messages (`programs/pairproof/src/error.rs`).

**Rent.** The confirmer fronts the attestation's rent and the (slightly larger) proposal account is closed to
the confirmer, which reimburses them. Net effect: the proposer funds the connection, the confirmer is never out
of pocket, and `payer = proposer` gets the rent back on revoke.

## Repository layout

```
programs/pairproof   Anchor program (Rust)
tests/               LiteSVM tests (Rust, load the built .so)
sdk/                 TypeScript helper: PDAs, fetchers, instruction builders, error mapping
scripts/             demo.ts, a full propose/confirm/read/revoke run against devnet or localnet
app/                 Vite + React + TypeScript + Tailwind web app
```

## Run it

Requirements: Rust, the Solana CLI (Agave), Anchor 1.2.0, Node, pnpm.

```bash
pnpm install

# program + tests
anchor build
cargo test -p pairproof-tests            # 19 LiteSVM tests

# SDK + app tests
pnpm test:sdk
pnpm --filter @pairproof/app test

# web app
cp app/.env.example app/.env             # devnet and the deployed program id by default
pnpm --filter @pairproof/app dev
```

**Two-person demo.** Switch on **Try without a wallet** to get a throwaway devnet key (stored in your browser,
disabled on mainnet). Open the app in a second browser, or a private window, for the second person. Fund both
burner addresses at <https://faucet.solana.com>, then propose from one and confirm from the other. Real wallets
(Phantom, Solflare, Backpack) connect through the Wallet Standard.

**CLI fallback demo.** `CLUSTER=devnet pnpm demo` runs the whole flow from the terminal and prints explorer links.

**Local validator.** `solana-test-validator --reset --bpf-program <program id> target/deploy/pairproof.so`, then
`VITE_CLUSTER=localnet pnpm --filter @pairproof/app dev`.

**Deploy the app.** It is a static site. On Vercel use the repository root with `pnpm --filter @pairproof/app build`
and output directory `app/dist` (already set in `vercel.json`). Configure `VITE_CLUSTER` / `VITE_RPC_URL` if needed.

## Limitations

- **The graph is public.** Every attestation, and therefore every connection between two wallets, is readable by
  anyone. Pseudonymous is not anonymous: if a wallet is tied to an identity elsewhere, so are its connections.
- **No sybil scoring yet.** Pairproof records who attested whom. It does not decide how much that is worth.
  Someone can create many wallets and attest between them; ranking or weighting the graph is future work.
- **Context hashes are only as private as the text.** The context is hashed with SHA-256 in the browser and the
  plaintext is never sent. Short, guessable text can be recovered by brute force, so don't put secrets in it.
- **Revoke is unilateral and final.** Either party can delete a connection; the record disappears (the original
  transactions remain in chain history).
- **"Ignore" is local.** Hiding an incoming request is a per-browser setting, not an on-chain action.
- **Burner keys are for demos.** They live in `localStorage`, hold only devnet SOL, and are blocked on mainnet.
- **Devnet only.** The program is not audited and has not been deployed to mainnet.

## Future work

- Zero-knowledge proofs of "at least *k* attestations" without revealing the graph.
- Sybil scoring and graph analysis on top of the attestation set.
- Event-issued attestations (an organiser as a trusted third signer).
- A CPI gating example: an on-chain program that requires a Pairproof attestation to act.

## License

MIT, see [LICENSE](LICENSE).
