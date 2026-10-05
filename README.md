# Pairproof

Open-source Solana program + web app for **mutual, two-signature attestations** that two people have met
(in person, video call, or vouch). Stores no personal data: two pubkeys, a method code, a timestamp and an
optional 32-byte context hash.

> Work in progress. Full README arrives in Phase 4.

## Origin

_TODO (author to write)._

## Run the program tests

```bash
anchor build
cargo test -p pairproof-tests
```

## Run the web app

```bash
pnpm install
cp app/.env.example app/.env     # defaults to devnet and the deployed program id
pnpm --filter @pairproof/app dev
```

Use **Try without a wallet** for a throwaway devnet key (stored in your browser, disabled on mainnet).
For a two-person demo, open the app in two browsers (or a normal and a private window), fund both burner
addresses at https://faucet.solana.com, and propose from one, confirm from the other.

Local validator instead of devnet: `VITE_CLUSTER=localnet pnpm --filter @pairproof/app dev`.

## Run the SDK tests

```bash
pnpm test:sdk && pnpm --filter @pairproof/app test
```

