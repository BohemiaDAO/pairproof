import * as React from "react";
import { PublicKey } from "@solana/web3.js";
import { findAttestationPda, getAttestation, METHOD_LABELS, type Attestation } from "@pairproof/sdk";
import { PpAddressChip, PpAddressInput, PpButton, PpCard, PpMark, isSolanaAddress } from "../components/ui";
import { PageTitle } from "../components/shell";
import { useIdentity } from "../lib/identity";
import { config, explorerAddress } from "../lib/config";
import { formatDate } from "../lib/format";
import { shortAddress } from "../components/ui";

type Result = { kind: "yes"; att: Attestation } | { kind: "no" } | { kind: "error"; message: string } | null;

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderTop: "1px solid var(--pp-accent-border)", font: "var(--pp-type-small)" }}>
      <span style={{ color: "var(--pp-text-2)" }}>{k}</span>
      <span style={{ color: "var(--pp-text)", textAlign: "right" }}>{v}</span>
    </div>
  );
}

export function VerifyScreen({ mobile }: { mobile: boolean }) {
  const { connection } = useIdentity();
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [result, setResult] = React.useState<Result>(null);
  const [busy, setBusy] = React.useState(false);
  const ta = a.trim(), tb = b.trim();
  const ok = isSolanaAddress(ta) && isSolanaAddress(tb) && ta !== tb;
  const same = !!ta && ta === tb;

  const run = async () => {
    setBusy(true);
    try {
      const att = await getAttestation(connection, new PublicKey(ta), new PublicKey(tb), config.programId);
      setResult(att ? { kind: "yes", att } : { kind: "no" });
    } catch (e) {
      setResult({ kind: "error", message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 20 : 24 }}>
      <PageTitle mobile={mobile} title="Verify a connection" sub="Check whether two addresses confirmed they met. Anyone can check, no wallet needed." />
      <PpCard padding={mobile ? 20 : 24}>
        <PpAddressInput label="First address" value={a} onChange={(v) => { setA(v); setResult(null); }} hint="Paste a Solana address." />
        <PpAddressInput label="Second address" value={b} onChange={(v) => { setB(v); setResult(null); }} error={same ? "Enter two different addresses." : undefined} hint="Paste a Solana address." />
        <PpButton full size="lg" disabled={!ok} loading={busy} onClick={run}>{busy ? "Checking…" : "Verify"}</PpButton>
      </PpCard>
      {result?.kind === "yes" && (
        <div style={{ animation: "pp-fade-up var(--pp-dur-3) var(--pp-ease) both" }}>
          <PpCard tone="accent" padding={mobile ? 20 : 28}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--pp-surface)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><PpMark size={40} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ font: mobile ? "var(--pp-type-h2)" : "800 28px/1.1 var(--pp-font-display)", color: "var(--pp-text)" }}>Yes, they’re connected.</span>
                <span style={{ font: "var(--pp-type-small)", color: "var(--pp-text-2)" }}>Both signed. The connection is active.</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}><PpAddressChip address={ta} size="sm" /><span style={{ color: "var(--pp-text-2)", font: "var(--pp-type-label)" }}>+</span><PpAddressChip address={tb} size="sm" /></div>
            <div>
              <KV k="Method" v={METHOD_LABELS[result.att.method] ?? "Unknown"} />
              <KV k="Confirmed" v={formatDate(result.att.createdAt)} />
              <KV k="Context" v={result.att.contextHash.some((x) => x !== 0) ? "Hash on-chain only" : "None"} />
              <KV k="Record" v={<a href={explorerAddress(config, findAttestationPda(new PublicKey(ta), new PublicKey(tb), config.programId)[0].toBase58())} target="_blank" rel="noreferrer" style={{ color: "var(--pp-link)", font: "var(--pp-type-mono-sm)" }}>{shortAddress(result.att.address.toBase58())} ↗</a>} />
            </div>
          </PpCard>
        </div>
      )}
      {result?.kind === "no" && (
        <div style={{ animation: "pp-fade-up var(--pp-dur-3) var(--pp-ease) both" }}>
          <PpCard tone="sunken" padding={mobile ? 20 : 28}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--pp-surface)", boxShadow: "inset 0 0 0 1px var(--pp-border)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", font: "800 26px/1 var(--pp-font-display)", color: "var(--pp-text-2)" }}>×</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ font: mobile ? "var(--pp-type-h2)" : "800 28px/1.1 var(--pp-font-display)", color: "var(--pp-text)" }}>No connection found.</span>
                <span style={{ font: "var(--pp-type-small)", color: "var(--pp-text-2)", textWrap: "pretty" }}>These two addresses haven’t both confirmed a connection on {config.networkLabel.toLowerCase()}, or it was revoked.</span>
              </div>
            </div>
          </PpCard>
        </div>
      )}
      {result?.kind === "error" && (
        <PpCard tone="sunken" padding={20}><span style={{ font: "var(--pp-type-small)", color: "var(--pp-error-text)" }}>Couldn’t reach the network: {result.message}</span></PpCard>
      )}
    </div>
  );
}
