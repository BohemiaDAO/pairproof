import { test } from "node:test";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { Keypair } from "@solana/web3.js";
import { extractAddress } from "../src/lib/address";

/** Rasterise a QR matrix the way a camera frame would see it (white quiet zone, dark modules). */
function render(text: string, logoFraction: number, px = 10) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" }); // same level the app uses
  const n = qr.modules.size, quiet = 4, side = (n + quiet * 2) * px;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);
  const paint = (x0: number, y0: number, x1: number, y1: number, rgb: [number, number, number]) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * side + x) * 4; data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; }
  };
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
    if (qr.modules.get(r, c)) paint((c + quiet) * px, (r + quiet) * px, (c + quiet + 1) * px, (r + quiet + 1) * px, [26, 23, 20]);
  // The app overlays a violet logo tile covering ~20% of the width in the centre.
  const half = Math.round((n * px * logoFraction) / 2), mid = side / 2;
  paint(mid - half, mid - half, mid + half, mid + half, [121, 22, 243]);
  return { data, side };
}

test("a Solana address QR with the logo overlay still decodes to the address", () => {
  for (let i = 0; i < 20; i++) {
    const addr = Keypair.generate().publicKey.toBase58();
    const { data, side } = render(addr, 0.2);
    const res = jsQR(data, side, side);
    assert.ok(res, "QR should decode");
    assert.equal(extractAddress(res!.data), addr);
  }
});

test("a non-address QR is rejected by extractAddress", () => {
  const { data, side } = render("https://example.com/not-an-address", 0);
  const res = jsQR(data, side, side);
  assert.ok(res);
  assert.equal(extractAddress(res!.data), null);
});
