import * as React from "react";
import { counterpartyOf, type Attestation } from "@pairproof/sdk";
import { PublicKey } from "@solana/web3.js";
import { PpAddressChip, PpButton, PpCard, PpEmptyState, PpListRow, PpSegmented, PpStatusPill } from "../components/ui";
import { NetworkGraph } from "../components/NetworkGraph";
import { MethodBadge, PageTitle } from "../components/shell";
import { explorerAddress, config } from "../lib/config";
import { formatDate } from "../lib/format";

interface Props {
  mobile: boolean;
  me: PublicKey;
  connections: Attestation[];
  busyId: string | null;
  onRevoke: (a: Attestation) => void;
  onVerify: (other: string) => void;
  goConnect: () => void;
}

export function ConnectionsScreen({ mobile, me, connections, busyId, onRevoke, onVerify, goConnect }: Props) {
  const [view, setView] = React.useState<"list" | "graph">("list");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 20 : 24 }}>
      <PageTitle mobile={mobile} title="My connections" sub={connections.length ? "People who confirmed they met you. Public and pseudonymous." : undefined}
        aside={connections.length ? <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flex: "none" }}>
          <span style={{ font: "var(--pp-type-number)", color: "var(--pp-text)" }}>{connections.length}</span>
          <span style={{ font: "var(--pp-type-caption)", color: "var(--pp-text-2)" }}>active</span></div> : null} />
      {connections.length === 0 ? (
        <PpEmptyState title="No connections yet"
          body="Meet someone, show them your code, and propose a connection. Once they confirm with their signature, it shows up here."
          action={<PpButton size="lg" onClick={goConnect}>Show my code</PpButton>} />
      ) : (
        <>
        <PpSegmented size="sm" value={view} onChange={(v) => setView(v as "list" | "graph")} options={[{ value: "list", label: "List" }, { value: "graph", label: "Network" }]} />
        {view === "graph" ? <NetworkGraph me={me} connections={connections} onVerify={onVerify} /> :
        <PpCard padding={0} style={{ gap: 0, overflow: "hidden" }}>
          {connections.map((a, i) => {
            const id = a.address.toBase58();
            const hasCtx = a.contextHash.some((b) => b !== 0);
            return (
              <PpListRow key={id} divider={i > 0} stack={mobile}
                title={<><PpAddressChip address={counterpartyOf(a, me).toBase58()} size="sm" />{mobile && <PpStatusPill status="connected" size="sm" />}</>}
                subtitle={hasCtx ? "Includes a private context note" : null}
                meta={<><MethodBadge method={a.method} /><span>{formatDate(a.createdAt)}</span><a href={explorerAddress(config, id)} target="_blank" rel="noreferrer" style={{ color: "var(--pp-link)", font: "var(--pp-type-label)", fontSize: 13 }}>View on explorer ↗</a></>}
                trailing={!mobile && <PpStatusPill status="connected" size="sm" />}
                actions={<PpButton variant="quiet" size={mobile ? "md" : "sm"} loading={busyId === id} onClick={() => onRevoke(a)}>Revoke</PpButton>} />
            );
          })}
        </PpCard>}
        </>
      )}
    </div>
  );
}
