import { counterpartyOf, type Proposal } from "@pairproof/sdk";
import { PublicKey } from "@solana/web3.js";
import { PpAddressChip, PpButton, PpCard, PpEmptyState, PpListRow, PpSegmented, PpStatusPill } from "../components/ui";
import { MethodBadge, PageTitle } from "../components/shell";
import { expiresIn, isExpired, timeAgo } from "../lib/format";
import { recallContext } from "../lib/local";

/** Plaintext exists only in the proposer's own browser; everyone else sees that a hash exists. */
export function contextNote(p: { address: PublicKey; contextHash: Uint8Array }): string | null {
  const text = recallContext(p.address.toBase58());
  if (text) return `“${text}”`;
  return p.contextHash.some((b) => b !== 0) ? "Includes a private context note" : null;
}

interface Props {
  mobile: boolean;
  me: PublicKey;
  incoming: Proposal[];
  outgoing: Proposal[];
  tab: "in" | "out";
  setTab: (t: "in" | "out") => void;
  busyId: string | null;
  onConfirm: (p: Proposal) => void;
  onIgnore: (p: Proposal) => void;
  onCancel: (p: Proposal) => void;
  goConnect: () => void;
}

export function RequestsScreen({ mobile, me, incoming, outgoing, tab, setTab, busyId, onConfirm, onIgnore, onCancel, goConnect }: Props) {
  const list = tab === "in" ? incoming : outgoing;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 20 : 24 }}>
      <PageTitle mobile={mobile} title="Requests" sub="Confirm people you’ve actually met. Ignore anyone you don’t recognise." />
      <PpSegmented full={mobile} size="md" value={tab} onChange={(v) => setTab(v as "in" | "out")} options={[{ value: "in", label: "Incoming", count: incoming.length }, { value: "out", label: "Outgoing", count: outgoing.length }]} />
      {list.length === 0 ? (
        tab === "in"
          ? <PpEmptyState title="No requests waiting" body="When someone proposes a connection with you, it appears here for you to confirm." action={<PpButton size="md" variant="secondary" onClick={goConnect}>Show my code</PpButton>} />
          : <PpEmptyState title="Nothing sent yet" body="Propose a connection from the Connect tab. It waits here until they confirm with their signature." action={<PpButton size="md" onClick={goConnect}>Propose a connection</PpButton>} />
      ) : (
        <PpCard padding={0} style={{ gap: 0, overflow: "hidden" }}>
          {list.map((p, i) => {
            const id = p.address.toBase58();
            const expired = isExpired(p.expiresAt);
            const busy = busyId === id;
            return tab === "in" ? (
              <PpListRow key={id} divider={i > 0} stack={mobile}
                title={<><PpAddressChip address={p.proposer.toBase58()} size="sm" /><span style={{ font: "var(--pp-type-small)", color: "var(--pp-text-2)" }}>wants to connect</span></>}
                subtitle={contextNote(p)}
                meta={<><MethodBadge method={p.method} /><span>{timeAgo(p.createdAt)}</span><span>{expiresIn(p.expiresAt)}</span></>}
                actions={<>
                  <PpButton variant="quiet" size="md" onClick={() => onIgnore(p)} disabled={busy}>Ignore</PpButton>
                  <PpButton size="md" loading={busy} disabled={expired} onClick={() => onConfirm(p)} style={mobile ? { flex: 1 } : undefined}>{busy ? "Signing…" : expired ? "Expired" : "Confirm"}</PpButton>
                </>} />
            ) : (
              <PpListRow key={id} divider={i > 0} stack={mobile}
                title={<><span style={{ font: "var(--pp-type-small)", color: "var(--pp-text-2)" }}>To</span><PpAddressChip address={counterpartyOf(p, me).toBase58()} size="sm" /></>}
                subtitle={contextNote(p)}
                meta={<><MethodBadge method={p.method} /><span>Sent {timeAgo(p.createdAt)}</span><span>{expiresIn(p.expiresAt)}</span></>}
                trailing={!mobile && <PpStatusPill status={expired ? "expired" : "pending"} size="sm" label={expired ? "Expired" : "Waiting for them"} />}
                actions={<>
                  {mobile && <PpStatusPill status={expired ? "expired" : "pending"} size="sm" label={expired ? "Expired" : "Waiting for them"} />}
                  <span style={{ flex: mobile ? 1 : "none" }} />
                  <PpButton variant="secondary" size="md" loading={busy} onClick={() => onCancel(p)}>{expired ? "Cancel and reclaim" : "Cancel"}</PpButton>
                </>} />
            );
          })}
        </PpCard>
      )}
    </div>
  );
}
