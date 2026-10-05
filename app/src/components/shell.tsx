import * as React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { METHOD_LABELS } from "@pairproof/sdk";
import {
  PpAddressChip,
  PpBadge,
  PpButton,
  PpCard,
  PpJoinMoment,
  PpToast,
} from "./ui";
import { explorerTx, config } from "../lib/config";

export function useIsMobile(): boolean {
  const [m, setM] = React.useState(() => window.innerWidth < 640);
  React.useEffect(() => {
    const f = () => setM(window.innerWidth < 640);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return m;
}

export function PageTitle({ title, sub, mobile, aside }: { title: string; sub?: React.ReactNode; mobile: boolean; aside?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <h1 style={{ margin: 0, font: mobile ? "var(--pp-type-h1-mobile)" : "var(--pp-type-h1)", color: "var(--pp-text)", textWrap: "balance", letterSpacing: "-.01em" }}>{title}</h1>
        {sub && <p style={{ margin: 0, font: "var(--pp-type-body)", color: "var(--pp-text-2)", textWrap: "pretty", maxWidth: 560 }}>{sub}</p>}
      </div>
      {aside}
    </div>
  );
}

export type ScreenId = "connect" | "requests" | "connections" | "verify";
const TABS: [ScreenId, string][] = [["connect", "Connect"], ["requests", "Requests"], ["connections", "Connections"], ["verify", "Verify"]];
type Counts = Partial<Record<ScreenId, number>>;

export function TopTabs({ value, onChange, counts = {} }: { value: ScreenId; onChange: (s: ScreenId) => void; counts?: Counts }) {
  return (
    <nav aria-label="Sections" style={{ borderBottom: "1px solid var(--pp-border)", background: "var(--pp-bg)" }}>
      <div style={{ maxWidth: "var(--pp-max-w)", margin: "0 auto", padding: "0 20px", display: "flex", gap: 4 }}>
        {TABS.map(([id, label]) => {
          const on = id === value;
          return (
            <button key={id} type="button" onClick={() => onChange(id)} aria-current={on ? "page" : undefined}
              style={{ appearance: "none", border: 0, background: "transparent", cursor: "pointer", minHeight: 52, padding: "0 14px", display: "flex", alignItems: "center", gap: 8,
                font: "var(--pp-type-label)", fontSize: 15, color: on ? "var(--pp-text)" : "var(--pp-text-2)", boxShadow: on ? "inset 0 -3px 0 var(--pp-accent)" : "none" }}>
              {label}
              {counts[id] ? <span style={{ font: "700 11px/1 var(--pp-font-body)", padding: "4px 7px", borderRadius: 999, background: "var(--pp-highlight)", color: "var(--pp-text-on-yellow)" }}>{counts[id]}</span> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function TabBar({ value, onChange, counts = {} }: { value: ScreenId; onChange: (s: ScreenId) => void; counts?: Counts }) {
  return (
    <nav aria-label="Sections" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20, background: "var(--pp-surface)", borderTop: "1px solid var(--pp-border)", padding: "6px 8px calc(8px + env(safe-area-inset-bottom))", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
      {TABS.map(([id, label]) => {
        const on = id === value;
        return (
          <button key={id} type="button" onClick={() => onChange(id)} aria-current={on ? "page" : undefined}
            style={{ appearance: "none", border: 0, cursor: "pointer", minHeight: 56, borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              background: on ? "var(--pp-accent-soft)" : "transparent", color: on ? "var(--pp-accent-soft-text)" : "var(--pp-text-2)", font: "600 13px/1 var(--pp-font-body)", position: "relative" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: on ? "var(--pp-accent)" : "transparent" }} />
            {label}
            {counts[id] ? <span style={{ position: "absolute", top: 6, right: "calc(50% - 30px)", font: "700 10px/1 var(--pp-font-body)", padding: "3px 6px", borderRadius: 999, background: "var(--pp-highlight)", color: "var(--pp-text-on-yellow)" }}>{counts[id]}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

export interface ToastState {
  status: "pending" | "success" | "error";
  title: string;
  body?: string;
  link?: { href: string; label: string };
}

export function ToastRegion({ toast, onClose, mobile }: { toast: ToastState | null; onClose: () => void; mobile: boolean }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: mobile ? 96 : 28, zIndex: 40, display: "flex", justifyContent: "center", padding: "0 16px", pointerEvents: "none" }}>
      <div style={{ pointerEvents: "auto", width: "100%", maxWidth: 440 }}>
        <PpToast status={toast.status} title={toast.title} link={toast.link} onClose={onClose}>{toast.body}</PpToast>
      </div>
    </div>
  );
}

export function MethodBadge({ method }: { method: number }) {
  return <PpBadge tone={method === 0 ? "violet" : method === 2 ? "outline" : "neutral"} size="sm">{METHOD_LABELS[method] ?? "Unknown"}</PpBadge>;
}

/** Lists the wallets the browser can actually use (Wallet Standard: Phantom, Solflare, Backpack, ...). */
export function WalletPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallets, select } = useWallet();
  if (!open) return null;
  const usable = wallets.filter((w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable);
  return (
    <div role="presentation" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--pp-overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "pp-fade var(--pp-dur-2) var(--pp-ease) both" }}>
      <div role="dialog" aria-modal="true" aria-label="Connect a wallet" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440 }}>
        <PpCard padding={24} title="Connect a wallet" action={<PpButton variant="quiet" size="sm" onClick={onClose}>Close</PpButton>}>
          {usable.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {usable.map((w) => (
                <button key={w.adapter.name} type="button" onClick={() => { select(w.adapter.name); onClose(); }}
                  style={{ appearance: "none", border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, minHeight: 56, padding: "0 16px", borderRadius: 14, background: "var(--pp-surface-sunken)", boxShadow: "inset 0 0 0 1px var(--pp-border)", color: "var(--pp-text)", font: "var(--pp-type-body-strong)", textAlign: "left" }}>
                  {w.adapter.icon && <img src={w.adapter.icon} alt="" width={28} height={28} style={{ borderRadius: 8 }} />}
                  {w.adapter.name}
                </button>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, font: "var(--pp-type-body)", color: "var(--pp-text-2)" }}>
              No wallet found in this browser. Install{" "}
              <a href="https://phantom.app" target="_blank" rel="noreferrer" style={{ color: "var(--pp-link)" }}>Phantom</a>,{" "}
              <a href="https://solflare.com" target="_blank" rel="noreferrer" style={{ color: "var(--pp-link)" }}>Solflare</a> or{" "}
              <a href="https://backpack.app" target="_blank" rel="noreferrer" style={{ color: "var(--pp-link)" }}>Backpack</a>, or switch on “Try without a wallet” at the top.
            </p>
          )}
          <span style={{ font: "var(--pp-type-small)", color: "var(--pp-text-3)" }}>Set your wallet to {config.networkLabel} before signing.</span>
        </PpCard>
      </div>
    </div>
  );
}

export function SuccessMoment({ mobile, me, who, method, sig, onDone, playKey }: { mobile: boolean; me: string; who: string; method: number; sig: string; onDone: () => void; playKey: number }) {
  const how = method === 1 ? "on a video call" : method === 2 ? "through a vouch" : "in person";
  return (
    <div role="dialog" aria-modal="true" aria-label="Connection confirmed" style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--pp-bg)", display: "flex", flexDirection: "column", animation: "pp-fade var(--pp-dur-2) var(--pp-ease) both" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px", overflow: "auto" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <PpJoinMoment playKey={playKey} size={mobile ? 132 : 168} title="You’re connected."
            action={<>
              <PpButton full size="lg" onClick={onDone}>Done</PpButton>
              <PpButton variant="ghost" size="md" href={explorerTx(config, sig)} trailing="↗">View on explorer</PpButton>
            </>}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8 }}>
              <PpAddressChip address={me} label="You" size="sm" copy={false} />
              <span style={{ font: "var(--pp-type-label)", color: "var(--pp-text-2)" }}>+</span>
              <PpAddressChip address={who} size="sm" copy={false} />
            </div>
            <span style={{ textWrap: "pretty" }}>You both signed. Anyone can now verify you met {how}. No personal data was stored.</span>
          </PpJoinMoment>
        </div>
      </div>
    </div>
  );
}
