import * as React from "react";
import { PublicKey } from "@solana/web3.js";
import {
  type Attestation,
  type Proposal,
  getProgram,
  listIncomingProposals,
  listMyAttestations,
  listOutgoingProposals,
} from "@pairproof/sdk";
import { config } from "./config";
import { useIdentity } from "./identity";

export const POLL_MS = 10_000;
/** Below this the user likely can't pay rent + fees for a proposal (~0.0013 SOL rent). */
export const LOW_SOL_LAMPORTS = 5_000_000;

export interface ChainData {
  incoming: Proposal[];
  outgoing: Proposal[];
  connections: Attestation[];
  lamports: number | null;
  loaded: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Everything the signed-in person can see, refreshed every ~10 s and after each transaction. */
export function useChainData(me: PublicKey | null): ChainData {
  const { connection } = useIdentity();
  const [data, setData] = React.useState<Omit<ChainData, "refresh">>({
    incoming: [],
    outgoing: [],
    connections: [],
    lamports: null,
    loaded: false,
    error: null,
  });
  const meKey = me?.toBase58() ?? null;
  const reqId = React.useRef(0);

  const refresh = React.useCallback(async () => {
    if (!me) {
      setData({ incoming: [], outgoing: [], connections: [], lamports: null, loaded: true, error: null });
      return;
    }
    const id = ++reqId.current;
    try {
      const [incoming, outgoing, connections, lamports] = await Promise.all([
        listIncomingProposals(connection, me, config.programId),
        listOutgoingProposals(connection, me, config.programId),
        listMyAttestations(connection, me, config.programId),
        connection.getBalance(me),
      ]);
      if (id === reqId.current) setData({ incoming, outgoing, connections, lamports, loaded: true, error: null });
    } catch (e) {
      if (id === reqId.current) setData((d) => ({ ...d, loaded: true, error: (e as Error).message }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, meKey]);

  React.useEffect(() => {
    setData((d) => ({ ...d, loaded: false }));
    void refresh();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return { ...data, refresh };
}

export function useProgram() {
  const { connection } = useIdentity();
  return React.useMemo(() => getProgram(connection, config.programId), [connection]);
}
