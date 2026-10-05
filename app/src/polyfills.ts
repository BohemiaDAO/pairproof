// @solana/web3.js and @anchor-lang/core expect a Node-style global Buffer.
import { Buffer } from "buffer";

if (!(globalThis as { Buffer?: unknown }).Buffer) {
  (globalThis as { Buffer?: unknown }).Buffer = Buffer;
}
