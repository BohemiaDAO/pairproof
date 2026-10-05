/** Small per-browser conveniences. Nothing here is required for the app to work. */
const CTX = "pairproof.ctx.";
const DISMISSED = "pairproof.dismissed";
const mem = new Map<string, string>();

function read(k: string): string | null {
  try {
    return localStorage.getItem(k) ?? mem.get(k) ?? null;
  } catch {
    return mem.get(k) ?? null;
  }
}
function write(k: string, v: string) {
  mem.set(k, v);
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
}

/** The plaintext context a proposer typed. Only the proposer's own browser ever has it. */
export const rememberContext = (proposalAddress: string, text: string) => {
  if (text.trim()) write(CTX + proposalAddress, text.trim());
};
export const recallContext = (proposalAddress: string): string | null => read(CTX + proposalAddress);

/** "Ignore" is not an on-chain action: hide the proposal in this browser only. */
export function dismissedSet(): Set<string> {
  try {
    return new Set(JSON.parse(read(DISMISSED) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
export function dismiss(address: string) {
  const s = dismissedSet();
  s.add(address);
  write(DISMISSED, JSON.stringify([...s]));
}
