import * as React from "react";
import { PublicKey } from "@solana/web3.js";
import { listMyAttestations, type Attestation } from "@pairproof/sdk";
import { PpAddressChip, PpButton, PpCard, PpEmptyState, PpSpinner, shortAddress } from "./ui";
import { MAX_PEERS, SIZE, buildGraph } from "../lib/graph";
import { config } from "../lib/config";
import { useIdentity } from "../lib/identity";

/** Read-only depth-2 view: me, my connections, and their connections. Fetched on demand. */
export function NetworkGraph({ me, connections, onVerify }: { me: PublicKey; connections: Attestation[]; onVerify: (other: string) => void }) {
  const { connection } = useIdentity();
  const [peerAtts, setPeerAtts] = React.useState<Map<string, Attestation[]> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const meId = me.toBase58();
  // Re-fetch when the set of direct connections changes, not on every 10 s refresh.
  const peerKey = connections.map((c) => c.address.toBase58()).sort().join(",");

  const load = React.useCallback(async () => {
    setError(null);
    const peers = [...new Set(connections.map((c) => (c.a.equals(me) ? c.b : c.a).toBase58()))].slice(0, MAX_PEERS);
    try {
      const entries = await Promise.all(peers.map(async (p) => [p, await listMyAttestations(connection, new PublicKey(p), config.programId)] as const));
      setPeerAtts(new Map(entries));
    } catch (e) {
      setError((e as Error).message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, peerKey]);

  React.useEffect(() => { setPeerAtts(null); void load(); }, [load]);

  const graph = React.useMemo(() => (peerAtts ? buildGraph(meId, connections, peerAtts) : null), [peerAtts, connections, meId]);

  if (connections.length === 0) {
    return <PpEmptyState title="Nothing to draw yet" body="Once you have a connection, you’ll see it here along with the people they’re connected to." compact />;
  }
  if (error) {
    return <PpCard tone="sunken"><span style={{ font: "var(--pp-type-small)", color: "var(--pp-error-text)" }}>Couldn’t load the network: {error}</span><PpButton size="md" variant="secondary" onClick={() => void load()}>Try again</PpButton></PpCard>;
  }
  if (!graph) {
    return <PpCard tone="sunken"><span style={{ display: "inline-flex", alignItems: "center", gap: 10, font: "var(--pp-type-small)", color: "var(--pp-text-2)" }}><PpSpinner size={16} /> Loading your network…</span></PpCard>;
  }

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const sel = selected ? byId.get(selected) : null;
  const fill = (d: number) => (d === 0 ? "var(--pp-accent)" : d === 1 ? "var(--pp-surface)" : "var(--pp-surface-sunken)");

  return (
    <PpCard padding={16} title="Your network" eyebrow="Two steps out" action={<PpButton size="sm" variant="quiet" onClick={() => { setPeerAtts(null); void load(); }}>Refresh</PpButton>}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label={`Connection graph with ${graph.nodes.length} wallets`} style={{ width: "100%", height: "auto", display: "block" }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={120} fill="none" stroke="var(--pp-border-subtle)" strokeDasharray="3 6" />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={235} fill="none" stroke="var(--pp-border-subtle)" strokeDasharray="3 6" />
        {graph.edges.map((e) => {
          const a = byId.get(e.a)!, b = byId.get(e.b)!;
          const hot = selected && (e.a === selected || e.b === selected);
          return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot ? "var(--pp-accent)" : "var(--pp-border-input)"} strokeWidth={hot ? 2.5 : 1.5} />;
        })}
        {graph.nodes.map((n) => {
          const r = n.depth === 0 ? 24 : n.depth === 1 ? 17 : 12;
          const on = n.id === selected;
          return (
            <g key={n.id} tabIndex={0} role="button" aria-label={`${n.depth === 0 ? "You" : shortAddress(n.id)}, ${n.degree} connection${n.degree === 1 ? "" : "s"}`}
              onClick={() => setSelected(on ? null : n.id)} onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setSelected(on ? null : n.id); } }} style={{ cursor: "pointer", outline: "none" }}>
              <title>{n.id}</title>
              <circle cx={n.x} cy={n.y} r={r + 8} fill="transparent" />
              <circle cx={n.x} cy={n.y} r={r} fill={fill(n.depth)} stroke={on ? "var(--pp-highlight)" : "var(--pp-accent)"} strokeWidth={on ? 4 : n.depth === 2 ? 1.5 : 2.5} />
              {n.depth === 0 && <text x={n.x} y={n.y + 4} textAnchor="middle" fill="var(--pp-text-on-accent)" style={{ font: "700 12px var(--pp-font-body)" }}>You</text>}
              {n.depth > 0 && <text x={n.x} y={n.y + r + 14} textAnchor="middle" fill="var(--pp-text-2)" style={{ font: "500 10px var(--pp-font-mono)" }}>{shortAddress(n.id)}</text>}
            </g>
          );
        })}
      </svg>
      {graph.truncated2 > 0 && <span style={{ font: "var(--pp-type-small)", color: "var(--pp-text-3)" }}>Showing the first {graph.nodes.filter((n) => n.depth === 2).length} second-degree wallets ({graph.truncated2} more not drawn).</span>}
      {sel && sel.depth > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <PpAddressChip address={sel.id} size="sm" />
          <span style={{ font: "var(--pp-type-small)", color: "var(--pp-text-2)" }}>{sel.depth === 1 ? "Your connection" : "Connected to one of yours"} · {sel.degree} link{sel.degree === 1 ? "" : "s"}</span>
          <PpButton size="sm" variant="secondary" onClick={() => onVerify(sel.id)}>Verify with me</PpButton>
        </div>
      ) : (
        <span style={{ font: "var(--pp-type-small)", color: "var(--pp-text-3)" }}>Tap a wallet to see who it is connected to. Everything here is public on-chain data.</span>
      )}
    </PpCard>
  );
}
