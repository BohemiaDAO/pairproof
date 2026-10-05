import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@pairproof/sdk";

export type ClusterName = "devnet" | "localnet" | "mainnet-beta";

export interface AppConfig {
  cluster: ClusterName;
  /** Human label for the header badge. */
  networkLabel: string;
  rpcUrl: string;
  programId: PublicKey;
  /** Burner keys are a devnet/localnet convenience and are impossible on mainnet. */
  isMainnet: boolean;
  githubUrl: string;
  faucetUrl: string;
}

const DEFAULT_RPC: Record<ClusterName, string> = {
  devnet: "https://api.devnet.solana.com",
  localnet: "http://127.0.0.1:8899",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
};

const LABELS: Record<ClusterName, string> = {
  devnet: "Devnet",
  localnet: "Localnet",
  "mainnet-beta": "Mainnet",
};

export const GITHUB_URL = "https://github.com/BohemiaDAO/pairproof";
export const FAUCET_URL = "https://faucet.solana.com";

/** Pure so it can be tested without a browser. Unknown clusters fall back to devnet. */
export function resolveConfig(env: Record<string, string | undefined>): AppConfig {
  const raw = (env.VITE_CLUSTER ?? "devnet").trim().toLowerCase();
  const cluster: ClusterName =
    raw === "localnet" || raw === "localhost" ? "localnet" : raw.startsWith("mainnet") ? "mainnet-beta" : "devnet";
  return {
    cluster,
    networkLabel: LABELS[cluster],
    rpcUrl: env.VITE_RPC_URL?.trim() || DEFAULT_RPC[cluster],
    programId: env.VITE_PROGRAM_ID?.trim() ? new PublicKey(env.VITE_PROGRAM_ID.trim()) : PROGRAM_ID,
    isMainnet: cluster === "mainnet-beta",
    githubUrl: GITHUB_URL,
    faucetUrl: FAUCET_URL,
  };
}

function clusterParam(cfg: AppConfig): string {
  if (cfg.cluster === "devnet") return "?cluster=devnet";
  if (cfg.cluster === "localnet") return `?cluster=custom&customUrl=${encodeURIComponent(cfg.rpcUrl)}`;
  return "";
}

export const explorerTx = (cfg: AppConfig, sig: string) =>
  `https://explorer.solana.com/tx/${sig}${clusterParam(cfg)}`;

export const explorerAddress = (cfg: AppConfig, address: string) =>
  `https://explorer.solana.com/address/${address}${clusterParam(cfg)}`;

export const config: AppConfig = resolveConfig((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {});
