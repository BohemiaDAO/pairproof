import type { Attestation } from "@pairproof/sdk";

export interface GraphNode {
  id: string;
  depth: 0 | 1 | 2;
  x: number;
  y: number;
  /** Number of connections found for this node within the graph. */
  degree: number;
}
export interface GraphEdge { id: string; a: string; b: string }
export interface Graph { nodes: GraphNode[]; edges: GraphEdge[]; truncated2: number }

export const SIZE = 600;
const CENTER = SIZE / 2;
const R1 = 120;
const R2 = 235;
export const MAX_PEERS = 20;
export const MAX_DEPTH2 = 36;

/**
 * Depth-2 ego graph: me, my direct connections (depth 1) and their connections (depth 2).
 * Pure and deterministic so it can be tested. `peerAtts` maps a depth-1 address to that wallet's
 * attestations. Edges are deduplicated by attestation address.
 */
export function buildGraph(me: string, mine: Attestation[], peerAtts: Map<string, Attestation[]>): Graph {
  const other = (a: Attestation, x: string) => (a.a.toBase58() === x ? a.b.toBase58() : a.a.toBase58());
  const edges = new Map<string, GraphEdge>();
  const addEdge = (a: Attestation) => {
    const id = a.address.toBase58();
    if (!edges.has(id)) edges.set(id, { id, a: a.a.toBase58(), b: a.b.toBase58() });
  };

  const peers = [...new Set(mine.map((a) => other(a, me)))].slice(0, MAX_PEERS);
  const peerSet = new Set(peers);
  mine.filter((a) => peerSet.has(other(a, me))).forEach(addEdge);

  const parents = new Map<string, string[]>(); // depth-2 node -> depth-1 parents
  for (const p of peers) {
    for (const a of peerAtts.get(p) ?? []) {
      const o = other(a, p);
      if (o === me) continue;
      if (peerSet.has(o)) { addEdge(a); continue; } // link between two of my connections
      addEdge(a);
      parents.set(o, [...(parents.get(o) ?? []), p]);
    }
  }

  const angle1 = new Map<string, number>();
  peers.forEach((p, i) => angle1.set(p, (2 * Math.PI * i) / Math.max(peers.length, 1) - Math.PI / 2));

  const nodes: GraphNode[] = [{ id: me, depth: 0, x: CENTER, y: CENTER, degree: peers.length }];
  peers.forEach((p) => {
    const t = angle1.get(p)!;
    nodes.push({ id: p, depth: 1, x: CENTER + R1 * Math.cos(t), y: CENTER + R1 * Math.sin(t), degree: 0 });
  });

  // Depth-2 nodes sit on the outer ring near the (circular) mean angle of their parents,
  // nudged apart so siblings don't overlap.
  const all2 = [...parents.entries()].map(([id, ps]) => {
    const sx = ps.reduce((s, p) => s + Math.cos(angle1.get(p)!), 0);
    const sy = ps.reduce((s, p) => s + Math.sin(angle1.get(p)!), 0);
    return { id, theta: Math.atan2(sy, sx) };
  });
  const truncated2 = Math.max(0, all2.length - MAX_DEPTH2);
  const d2 = all2.sort((x, y) => x.theta - y.theta).slice(0, MAX_DEPTH2);
  const minGap = (2 * Math.PI) / Math.max(d2.length, 1) * 0.6;
  for (let i = 1; i < d2.length; i++) if (d2[i].theta - d2[i - 1].theta < minGap) d2[i].theta = d2[i - 1].theta + minGap;
  d2.forEach((n) => nodes.push({ id: n.id, depth: 2, x: CENTER + R2 * Math.cos(n.theta), y: CENTER + R2 * Math.sin(n.theta), degree: 0 }));

  const kept = new Set(nodes.map((n) => n.id));
  const finalEdges = [...edges.values()].filter((e) => kept.has(e.a) && kept.has(e.b));
  const deg = new Map<string, number>();
  finalEdges.forEach((e) => { deg.set(e.a, (deg.get(e.a) ?? 0) + 1); deg.set(e.b, (deg.get(e.b) ?? 0) + 1); });
  nodes.forEach((n) => { n.degree = deg.get(n.id) ?? 0; });
  return { nodes, edges: finalEdges, truncated2 };
}
