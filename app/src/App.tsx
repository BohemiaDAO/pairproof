import * as React from "react";
import { PublicKey } from "@solana/web3.js";
import {
  buildCancelProposalIx,
  buildConfirmIx,
  buildProposeIx,
  buildRevokeIx,
  counterpartyOf,
  describeError,
  findProposalPda,
  sha256Context,
  type Attestation,
  type Proposal,
} from "@pairproof/sdk";
import { PpAddressChip, PpDialog, PpFooter, PpHeader } from "./components/ui";
import { SuccessMoment, TabBar, ToastRegion, TopTabs, WalletPicker, useIsMobile, type ScreenId, type ToastState } from "./components/shell";
import { ConnectScreen, type ProposeInput } from "./screens/ConnectScreen";
import { RequestsScreen } from "./screens/RequestsScreen";
import { ConnectionsScreen } from "./screens/ConnectionsScreen";
import { VerifyScreen } from "./screens/VerifyScreen";
import { config, explorerAddress, explorerTx } from "./lib/config";
import { LOW_SOL_LAMPORTS, useChainData, useProgram } from "./lib/chain";
import { useIdentity } from "./lib/identity";
import { EXPIRY_SECONDS, isExpired } from "./lib/format";
import { dismiss, dismissedSet, rememberContext } from "./lib/local";

export function App() {
  const mobile = useIsMobile();
  const id = useIdentity();
  const program = useProgram();
  const me = id.publicKey;
  const chain = useChainData(me);

  const [screen, setScreen] = React.useState<ScreenId>("connect");
  const [tab, setTab] = React.useState<"in" | "out">("in");
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [proposing, setProposing] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [moment, setMoment] = React.useState<{ who: string; method: number; sig: string; k: number } | null>(null);
  const [revoke, setRevoke] = React.useState<Attestation | null>(null);
  const [dismissedTick, setDismissedTick] = React.useState(0);
  const [prefill, setPrefill] = React.useState<{ a: string; b: string; n: number } | null>(null);

  React.useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  React.useEffect(() => {
    if (!toast || toast.status === "pending") return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const dismissed = React.useMemo(() => dismissedSet(), [dismissedTick, chain.incoming]); // eslint-disable-line react-hooks/exhaustive-deps
  const incoming = chain.incoming.filter((p) => !dismissed.has(p.address.toBase58()));
  const pendingCount = incoming.filter((p) => !isExpired(p.expiresAt)).length;
  const lowSol = me !== null && chain.lamports !== null && chain.lamports < LOW_SOL_LAMPORTS;

  /** One place for the pending → success/error toast flow and the post-tx refresh. */
  async function run(pending: string, success: ToastState, build: () => Promise<Parameters<typeof id.send>[0]>): Promise<string | null> {
    setToast({ status: "pending", title: pending, body: id.mode === "wallet" ? "Approve the request in your wallet." : "Signing and sending…" });
    try {
      const sig = await id.send(await build());
      setToast({ ...success, link: { href: explorerTx(config, sig), label: "View on explorer" } });
      void chain.refresh();
      return sig;
    } catch (e) {
      setToast({ status: "error", title: "That didn’t go through", body: describeError(e) });
      return null;
    }
  }

  const onPropose = async ({ addr, method, ctx, expiry }: ProposeInput): Promise<boolean> => {
    if (!me) return false;
    let counterparty: PublicKey;
    try { counterparty = new PublicKey(addr); } catch { setToast({ status: "error", title: "Invalid address", body: "Check the address and try again." }); return false; }
    setProposing(true);
    const expiresAt = Math.floor(Date.now() / 1000) + (EXPIRY_SECONDS[expiry] ?? 86_400);
    const sig = await run("Waiting for your signature", { status: "success", title: "Proposal sent", body: "They need to confirm it with their own signature." },
      async () => [await buildProposeIx(program, me, counterparty, method, expiresAt, sha256Context(ctx))]);
    setProposing(false);
    if (sig) {
      rememberContext(findProposalPda(me, counterparty, config.programId)[0].toBase58(), ctx);
      setTab("out");
    }
    return sig !== null;
  };

  const onConfirm = async (p: Proposal) => {
    if (!me) return;
    const key = p.address.toBase58();
    setBusyId(key);
    const sig = await run("Waiting for your signature", { status: "success", title: "Connection confirmed" }, async () => [await buildConfirmIx(program, me, p.proposer)]);
    setBusyId(null);
    if (sig) { setToast(null); setMoment({ who: p.proposer.toBase58(), method: p.method, sig, k: Date.now() }); }
  };

  const onCancel = async (p: Proposal) => {
    if (!me) return;
    setBusyId(p.address.toBase58());
    await run("Waiting for your signature", { status: "success", title: "Request cancelled", body: "Your deposit was returned." }, async () => [await buildCancelProposalIx(program, me, counterpartyOf(p, me))]);
    setBusyId(null);
  };

  const doRevoke = async () => {
    if (!me || !revoke) return;
    const a = revoke;
    setBusyId(a.address.toBase58());
    const sig = await run("Waiting for your signature", { status: "success", title: "Connection revoked", body: "The connection record was removed from the chain." }, async () => [await buildRevokeIx(program, me, counterpartyOf(a, me), a.payer)]);
    setBusyId(null);
    if (sig) setRevoke(null);
  };

  const openPicker = () => setPickerOpen(true);
  const gateProps = { onConnectWallet: openPicker, onUseBurner: id.burnerAllowed ? () => id.setBurnerOn(true) : undefined };

  let body: React.ReactNode;
  if (screen === "verify") body = <VerifyScreen mobile={mobile} prefill={prefill} />;
  else if (!me) body = <ConnectScreen mobile={mobile} me={null} burner={false} lowSol={false} proposing={false} onPropose={async () => false} {...gateProps} />;
  else if (screen === "requests") body = <RequestsScreen mobile={mobile} me={me} incoming={incoming} outgoing={chain.outgoing} tab={tab} setTab={setTab} busyId={busyId}
    onConfirm={onConfirm} onIgnore={(p) => { dismiss(p.address.toBase58()); setDismissedTick((t) => t + 1); }} onCancel={onCancel} goConnect={() => setScreen("connect")} />;
  else if (screen === "connections") body = <ConnectionsScreen mobile={mobile} me={me} connections={chain.connections} busyId={busyId} onRevoke={setRevoke} onVerify={(other) => { setPrefill({ a: me.toBase58(), b: other, n: Date.now() }); setScreen("verify"); }} goConnect={() => setScreen("connect")} />;
  else body = <ConnectScreen mobile={mobile} me={me.toBase58()} burner={id.mode === "burner"} lowSol={lowSol} proposing={proposing} onPropose={onPropose} {...gateProps} />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--pp-bg)" }}>
      <PpHeader compact={mobile} network={config.networkLabel} wallet={me?.toBase58() ?? null} burner={id.mode === "burner"} burnerDisabled={!id.burnerAllowed}
        onBurnerChange={id.setBurnerOn} onNewBurner={id.newBurner} onConnect={openPicker} onDisconnect={() => void id.disconnect()} connecting={id.connecting} />
      {!mobile && <TopTabs value={screen} onChange={setScreen} counts={{ requests: pendingCount }} />}
      <main style={{ flex: 1, width: "100%", maxWidth: "var(--pp-max-w)", margin: "0 auto", boxSizing: "border-box", padding: mobile ? "24px 20px 24px" : "40px 20px 64px" }}>
        {chain.error && me && <p role="status" style={{ margin: "0 0 16px", font: "var(--pp-type-small)", color: "var(--pp-warning-text)" }}>Couldn’t refresh from {config.networkLabel}: {chain.error}. Retrying…</p>}
        {body}
      </main>
      <PpFooter compact={mobile} programId={config.programId.toBase58()} githubHref={config.githubUrl} />
      {mobile && <div style={{ height: "calc(var(--pp-tabbar-h) + 8px)" }} />}
      {mobile && <TabBar value={screen} onChange={setScreen} counts={{ requests: pendingCount }} />}
      <ToastRegion toast={toast} mobile={mobile} onClose={() => setToast(null)} />
      <WalletPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
      <PpDialog open={!!revoke} title="Revoke this connection?" destructive confirmLabel="Revoke connection" cancelLabel="Keep it" loading={!!revoke && busyId === revoke.address.toBase58()}
        layout={mobile ? "sheet" : "center"} onCancel={() => !busyId && setRevoke(null)} onConfirm={doRevoke}>
        {revoke && me && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span>With</span><PpAddressChip address={counterpartyOf(revoke, me).toBase58()} size="sm" copy={false} /></div>}
        <span>This removes the connection record from the chain, so anyone who verifies the two of you will see no connection. Either of you can revoke. The original transactions stay in public history. This can’t be undone.</span>
        {revoke && <a href={explorerAddress(config, revoke.address.toBase58())} target="_blank" rel="noreferrer" style={{ color: "var(--pp-link)", font: "var(--pp-type-label)" }}>View the record ↗</a>}
      </PpDialog>
      {moment && me && <SuccessMoment mobile={mobile} me={me.toBase58()} who={moment.who} method={moment.method} sig={moment.sig} playKey={moment.k} onDone={() => { setMoment(null); setScreen("connections"); }} />}
    </div>
  );
}
