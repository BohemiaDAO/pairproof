import * as React from "react";
import { AddressField } from "../components/AddressField";
import { PpBanner, PpButton, PpCard, PpEmptyState, PpQRCard, PpSegmented, PpSelect, PpTextInput, isSolanaAddress, shortAddress, PpAddressChip } from "../components/ui";
import { PageTitle } from "../components/shell";
import { config } from "../lib/config";

export interface ProposeInput { addr: string; method: number; ctx: string; expiry: string }

interface Props {
  mobile: boolean;
  me: string | null;
  burner: boolean;
  lowSol: boolean;
  proposing: boolean;
  onPropose: (i: ProposeInput) => Promise<boolean>;
  onConnectWallet: () => void;
  onUseBurner?: () => void;
}

export function ConnectScreen({ mobile, me, burner, lowSol, proposing, onPropose, onConnectWallet, onUseBurner }: Props) {
  const [addr, setAddr] = React.useState("");
  const [method, setMethod] = React.useState("0");
  const [ctx, setCtx] = React.useState("");
  const [expiry, setExpiry] = React.useState("24h");
  const trimmed = addr.trim();
  const valid = isSolanaAddress(trimmed) && trimmed !== me;

  if (!me) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 20 : 28 }}>
        <PageTitle mobile={mobile} title="Connect with someone" sub="Met someone? Swap codes. One of you proposes, the other confirms." />
        <PpEmptyState title="Connect to get started" body="Use your Solana wallet, or try it with a temporary devnet key. Nothing to install."
          action={<PpButton size="lg" onClick={onConnectWallet}>Connect wallet</PpButton>}
          secondaryAction={onUseBurner && <PpButton size="lg" variant="secondary" onClick={onUseBurner}>Try without a wallet</PpButton>} />
      </div>
    );
  }

  const submit = async () => {
    const ok = await onPropose({ addr: trimmed, method: Number(method), ctx, expiry });
    if (ok) { setAddr(""); setCtx(""); }
  };
  const propose = <PpButton full size="lg" disabled={!valid} loading={proposing} onClick={submit}>{proposing ? "Waiting for signature…" : "Propose connection"}</PpButton>;
  const selfErr = trimmed && trimmed === me ? "That’s your own address. Enter the address of the person you met." : undefined;

  const form = (
    <PpCard title="Propose a connection" padding={mobile ? 20 : 24}>
      <AddressField value={addr} onChange={setAddr} error={selfErr} />
      <PpSegmented full label="How did you meet?" value={method} onChange={setMethod} options={[
        { value: "0", label: "In person" }, { value: "1", label: "Video call" }, { value: "2", label: "Vouch" }]} />
      <PpTextInput label="Context" optional="(optional)" placeholder="e.g. Breakpoint 2026" value={ctx} onChange={setCtx} hint="Only a hash of this text goes on-chain. The words stay with you." />
      <PpSelect label="Request expires" value={expiry} onChange={setExpiry} options={[{ value: "24h", label: "In 24 hours" }, { value: "7d", label: "In 7 days" }, { value: "30d", label: "In 30 days" }]} hint="If they don’t confirm by then, the request expires." />
      {!mobile && <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        {propose}
        <span style={{ font: "var(--pp-type-small)", color: "var(--pp-text-3)", textAlign: "center" }}>You sign once. They confirm with their own signature.</span>
      </div>}
    </PpCard>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 20 : 28 }}>
      <PageTitle mobile={mobile} title="Connect with someone" sub="Met someone? Swap codes. One of you proposes, the other confirms." />
      {lowSol && (
        <PpBanner tone="warning" title={burner ? "Your burner needs devnet SOL" : "Your devnet SOL is running low"}
          action={<PpButton variant="secondary" size="sm" href={config.faucetUrl} trailing="↗">Get free devnet SOL</PpButton>}>
          {burner ? <>Copy your burner address below, paste it into the faucet, then come back. <PpAddressChip address={me} size="sm" /></> : "Signing needs a tiny amount of SOL. Top up from the devnet faucet, then come back here."}
        </PpBanner>
      )}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "264px minmax(0,1fr)", gap: mobile ? 16 : 20, alignItems: "start" }}>
        <PpQRCard address={me} title={burner ? "Your burner code" : "Your code"} caption={`Let them scan this to fill in your address (${shortAddress(me)}).`} size={mobile ? 260 : 216} />
        {form}
      </div>
      {mobile && <div style={{ position: "sticky", bottom: "calc(var(--pp-tabbar-h) + 8px)", zIndex: 5, margin: "0 -20px", padding: "12px 20px", background: "linear-gradient(to top, var(--pp-bg) 70%, transparent)" }}>{propose}</div>}
    </div>
  );
}
