import { Keypair } from "@solana/web3.js";
import type { AppConfig } from "./config";

/**
 * Devnet-only throwaway key for "Try without a wallet". Stored in localStorage so a reload
 * keeps the same identity (a second browser or a private window gets its own). No funded key
 * is ever embedded in the code. Everything here refuses to run when the cluster is mainnet.
 */
const KEY = "pairproof.burner.v1";
const FLAG = "pairproof.burner.enabled";

const mem: Record<string, string> = {};
function get(k: string): string | null {
  try {
    return localStorage.getItem(k) ?? mem[k] ?? null;
  } catch {
    return mem[k] ?? null;
  }
}
function set(k: string, v: string) {
  mem[k] = v;
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage unavailable (private mode etc.): fall back to memory for this session */
  }
}
function del(k: string) {
  delete mem[k];
  try {
    localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function burnerAllowed(cfg: Pick<AppConfig, "isMainnet">): boolean {
  return !cfg.isMainnet;
}

function assertAllowed(cfg: Pick<AppConfig, "isMainnet">) {
  if (!burnerAllowed(cfg)) throw new Error("Burner keys are disabled on mainnet.");
}

export function isBurnerEnabled(cfg: Pick<AppConfig, "isMainnet">): boolean {
  return burnerAllowed(cfg) && get(FLAG) === "1";
}

export function setBurnerEnabled(cfg: Pick<AppConfig, "isMainnet">, on: boolean) {
  if (on) assertAllowed(cfg);
  set(FLAG, on ? "1" : "0");
}

export function getOrCreateBurner(cfg: Pick<AppConfig, "isMainnet">): Keypair {
  assertAllowed(cfg);
  const raw = get(KEY);
  if (raw) {
    try {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
    } catch {
      /* corrupt entry: replace it */
    }
  }
  return replaceBurner(cfg);
}

export function replaceBurner(cfg: Pick<AppConfig, "isMainnet">): Keypair {
  assertAllowed(cfg);
  const kp = Keypair.generate();
  set(KEY, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

export function clearBurner() {
  del(KEY);
  del(FLAG);
}
