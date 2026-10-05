import { IDL } from "./constants";

export interface ProgramError {
  code: number;
  name: string;
  message: string;
}

const BY_CODE = new Map<number, ProgramError>(
  (IDL.errors ?? []).map((e) => [e.code, { code: e.code, name: e.name, message: e.msg ?? e.name }]),
);

/** Look up a Pairproof program error by numeric code (6000+). */
export function programErrorFromCode(code: number): ProgramError | undefined {
  return BY_CODE.get(code);
}

/**
 * Best-effort extraction of a Pairproof error from whatever a failed transaction throws
 * (web3.js SendTransactionError, simulation logs, wallet-adapter wrappers, ...).
 * Returns undefined when the failure is not one of this program's custom errors.
 */
export function parseProgramError(err: unknown): ProgramError | undefined {
  const parts: string[] = [];
  const e = err as { message?: string; logs?: string[]; transactionLogs?: string[]; cause?: unknown };
  if (e?.message) parts.push(e.message);
  for (const l of [e?.logs, e?.transactionLogs]) if (Array.isArray(l)) parts.push(l.join("\n"));
  if (e?.cause) parts.push(String((e.cause as { message?: string }).message ?? e.cause));
  parts.push(typeof err === "string" ? err : safeJson(err));
  const text = parts.join("\n");

  // Anchor logs: "Error Code: NotParty. Error Number: 6009."
  const named = /Error Number:\s*(\d+)/.exec(text);
  if (named) return BY_CODE.get(Number(named[1]));
  // Raw runtime form: "custom program error: 0x1771" or {"Custom":6001}
  const hex = /custom program error:\s*0x([0-9a-f]+)/i.exec(text);
  if (hex) return BY_CODE.get(parseInt(hex[1], 16));
  const json = /"Custom"\s*:\s*(\d+)/.exec(text);
  if (json) return BY_CODE.get(Number(json[1]));
  return undefined;
}

/** Human-readable message for any thrown error. */
export function describeError(err: unknown): string {
  const pe = parseProgramError(err);
  if (pe) return pe.message;
  const msg = (err as { message?: string })?.message ?? String(err);
  if (/insufficient (funds|lamports)|0x1\b/i.test(msg)) return "Not enough SOL to pay for this transaction.";
  if (/User rejected|rejected the request/i.test(msg)) return "Request rejected in the wallet.";
  return msg;
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v) ?? "";
  } catch {
    return "";
  }
}
