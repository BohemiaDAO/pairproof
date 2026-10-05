import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair, PublicKey } from "@solana/web3.js";
import type { Attestation } from "@pairproof/sdk";
import { buildGraph, MAX_DEPTH2, MAX_PEERS } from "../src/lib/graph";
import { extractAddress } from "../src/lib/address";

const k = () => Keypair.generate().publicKey;
const att = (a: PublicKey, b: PublicKey): Attestation => ({
  address: k(), version: 1, a, b, method: 0, createdAt: 0, contextHash: new Uint8Array(32), payer: a, bump: 1,
});

test("depth-2 graph: me, peers, peers-of-peers, shared nodes and links between peers", () => {
  const [me, p1, p2, x, y] = [k(), k(), k(), k(), k()];
  const mine = [att(me, p1), att(p2, me)];
  const peerAtts = new Map<string, Attestation[]>([
    [p1.toBase58(), [att(me, p1), att(p1, x), att(p1, y)]],
    [p2.toBase58(), [att(p2, me), att(p2, x), att(p1, p2)]], // x is shared; p1<->p2 are linked
  ]);
  const g = buildGraph(me.toBase58(), mine, peerAtts);
  const depth = (id: PublicKey) => g.nodes.find((n) => n.id === id.toBase58())?.depth;
  assert.equal(depth(me), 0);
  assert.equal(depth(p1), 1);
  assert.equal(depth(p2), 1);
  assert.equal(depth(x), 2);
  assert.equal(depth(y), 2);
  assert.equal(g.nodes.length, 5);
  // edges: me-p1, me-p2, p1-x, p1-y, p2-x, p1-p2 (no duplicates, nothing back to me from peers' lists)
  assert.equal(g.edges.length, 6);
  assert.equal(new Set(g.edges.map((e) => e.id)).size, g.edges.length);
  assert.equal(g.nodes.find((n) => n.id === x.toBase58())!.degree, 2);
  for (const n of g.nodes) assert.ok(Number.isFinite(n.x) && Number.isFinite(n.y));
});

test("graph is capped so a huge neighbourhood stays readable", () => {
  const me = k();
  const peers = Array.from({ length: MAX_PEERS + 5 }, k);
  const mine = peers.map((p) => att(me, p));
  const peerAtts = new Map<string, Attestation[]>();
  for (const p of peers) peerAtts.set(p.toBase58(), Array.from({ length: 5 }, () => att(p, k())));
  const g = buildGraph(me.toBase58(), mine, peerAtts);
  assert.equal(g.nodes.filter((n) => n.depth === 1).length, MAX_PEERS);
  assert.equal(g.nodes.filter((n) => n.depth === 2).length, MAX_DEPTH2);
  assert.ok(g.truncated2 > 0);
  const ids = new Set(g.nodes.map((n) => n.id));
  assert.ok(g.edges.every((e) => ids.has(e.a) && ids.has(e.b)));
});

test("empty network is just me", () => {
  const me = k();
  const g = buildGraph(me.toBase58(), [], new Map());
  assert.equal(g.nodes.length, 1);
  assert.equal(g.edges.length, 0);
});

test("extractAddress understands bare addresses, solana: URIs and URLs", () => {
  const a = k().toBase58();
  assert.equal(extractAddress(a), a);
  assert.equal(extractAddress(`  ${a}\n`), a);
  assert.equal(extractAddress(`solana:${a}`), a);
  assert.equal(extractAddress(`solana:${a}?label=x`), a);
  assert.equal(extractAddress(`https://example.com/u/${a}`), a);
  assert.equal(extractAddress("hello world"), null);
  assert.equal(extractAddress(""), null);
});
