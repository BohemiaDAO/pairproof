import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@solana/web3.js";
import { resolveConfig, explorerTx } from "../src/lib/config";
import { expiresIn, isExpired, timeAgo } from "../src/lib/format";
import { burnerAllowed, getOrCreateBurner, replaceBurner, setBurnerEnabled, isBurnerEnabled } from "../src/lib/burner";

test("config defaults to devnet and refuses burners on mainnet", () => {
  const d = resolveConfig({});
  assert.equal(d.cluster, "devnet");
  assert.equal(d.rpcUrl, "https://api.devnet.solana.com");
  assert.equal(burnerAllowed(d), true);

  const m = resolveConfig({ VITE_CLUSTER: "mainnet-beta" });
  assert.equal(m.isMainnet, true);
  assert.equal(burnerAllowed(m), false);
  assert.throws(() => getOrCreateBurner(m), /disabled on mainnet/);
  assert.throws(() => replaceBurner(m), /disabled on mainnet/);
  assert.throws(() => setBurnerEnabled(m, true), /disabled on mainnet/);
  assert.equal(isBurnerEnabled(m), false);

  assert.equal(resolveConfig({ VITE_CLUSTER: "garbage" }).cluster, "devnet");
  assert.equal(resolveConfig({ VITE_CLUSTER: "localnet" }).rpcUrl, "http://127.0.0.1:8899");
});

test("config program id override and explorer links", () => {
  const id = Keypair.generate().publicKey.toBase58();
  assert.equal(resolveConfig({ VITE_PROGRAM_ID: id }).programId.toBase58(), id);
  assert.match(explorerTx(resolveConfig({}), "abc"), /tx\/abc\?cluster=devnet$/);
  assert.match(explorerTx(resolveConfig({ VITE_CLUSTER: "localnet" }), "abc"), /cluster=custom&customUrl=/);
});

test("burner is created once and then reused (memory fallback without localStorage)", () => {
  const cfg = resolveConfig({});
  const a = getOrCreateBurner(cfg);
  const b = getOrCreateBurner(cfg);
  assert.equal(a.publicKey.toBase58(), b.publicKey.toBase58());
  const c = replaceBurner(cfg);
  assert.notEqual(c.publicKey.toBase58(), a.publicKey.toBase58());
  setBurnerEnabled(cfg, true);
  assert.equal(isBurnerEnabled(cfg), true);
});

test("time formatting", () => {
  const now = 1_800_000_000_000;
  assert.equal(timeAgo(now / 1000 - 5, now), "just now");
  assert.equal(timeAgo(now / 1000 - 120, now), "2 min ago");
  assert.equal(timeAgo(now / 1000 - 3 * 3600, now), "3 h ago");
  assert.equal(timeAgo(now / 1000 - 86400, now), "Yesterday");
  assert.equal(expiresIn(now / 1000 + 7 * 86400, now), "Expires in 7 days");
  assert.equal(expiresIn(now / 1000 + 23 * 3600, now), "Expires in 23 h");
  assert.equal(expiresIn(now / 1000 - 1, now), "Expired");
  assert.equal(isExpired(now / 1000, now), true);
  assert.equal(isExpired(now / 1000 + 1, now), false);
});
