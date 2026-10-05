import * as React from "react";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { config } from "./config";
import {
  burnerAllowed,
  getOrCreateBurner,
  isBurnerEnabled,
  replaceBurner,
  setBurnerEnabled,
} from "./burner";

export interface Identity {
  connection: Connection;
  publicKey: PublicKey | null;
  mode: "burner" | "wallet" | "none";
  burnerOn: boolean;
  burnerAllowed: boolean;
  connecting: boolean;
  setBurnerOn: (on: boolean) => void;
  newBurner: () => void;
  disconnect: () => Promise<void>;
  /** Sign with the burner or the connected wallet, send, and wait for confirmation. */
  send: (ixs: TransactionInstruction[]) => Promise<string>;
}

const Ctx = React.createContext<Identity | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const connection = React.useMemo(() => new Connection(config.rpcUrl, "confirmed"), []);
  const wallet = useWallet();
  const [burnerOn, setBurnerOnState] = React.useState(() => isBurnerEnabled(config));
  const [burner, setBurner] = React.useState<Keypair | null>(() =>
    isBurnerEnabled(config) ? getOrCreateBurner(config) : null,
  );

  const setBurnerOn = React.useCallback((on: boolean) => {
    if (on && !burnerAllowed(config)) return;
    setBurnerEnabled(config, on);
    setBurnerOnState(on);
    setBurner(on ? getOrCreateBurner(config) : null);
  }, []);

  const newBurner = React.useCallback(() => {
    if (burnerAllowed(config)) setBurner(replaceBurner(config));
  }, []);

  const mode: Identity["mode"] = burnerOn && burner ? "burner" : wallet.publicKey ? "wallet" : "none";
  const publicKey = mode === "burner" ? burner!.publicKey : mode === "wallet" ? wallet.publicKey : null;

  const send = React.useCallback(
    async (ixs: TransactionInstruction[]) => {
      if (!publicKey) throw new Error("Connect a wallet first.");
      const tx = new Transaction().add(...ixs);
      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      let signature: string;
      if (mode === "burner") {
        tx.sign(burner!);
        signature = await connection.sendRawTransaction(tx.serialize());
      } else {
        signature = await wallet.sendTransaction(tx, connection);
      }
      const res = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      if (res.value.err) throw new Error(`Transaction failed: ${JSON.stringify(res.value.err)}`);
      return signature;
    },
    [publicKey, mode, burner, connection, wallet],
  );

  const value = React.useMemo<Identity>(
    () => ({
      connection,
      publicKey,
      mode,
      burnerOn,
      burnerAllowed: burnerAllowed(config),
      connecting: wallet.connecting,
      setBurnerOn,
      newBurner,
      disconnect: wallet.disconnect,
      send,
    }),
    [connection, publicKey, mode, burnerOn, wallet.connecting, wallet.disconnect, setBurnerOn, newBurner, send],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useIdentity(): Identity {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useIdentity must be used inside IdentityProvider");
  return v;
}
