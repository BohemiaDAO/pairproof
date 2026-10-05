import * as React from "react";
import jsQR from "jsqr";
import { PpButton, PpCard } from "./ui";
import { extractAddress } from "../lib/address";

type Phase = "starting" | "scanning" | "denied" | "unavailable" | "insecure";

/**
 * Camera QR scanner. Everything happens in the browser: frames are decoded locally with jsQR
 * and never leave the device. Camera access needs https (or localhost).
 */
export function QrScanner({ open, onClose, onAddress }: { open: boolean; onClose: () => void; onAddress: (address: string) => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = React.useState<Phase>("starting");
  const [notAddress, setNotAddress] = React.useState(false);
  // Keep the latest callback in a ref so a parent re-render never restarts the camera.
  const onAddressRef = React.useRef(onAddress);
  onAddressRef.current = onAddress;

  React.useEffect(() => {
    if (!open) return;
    let stopped = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    setPhase("starting");
    setNotAddress(false);

    (async () => {
      if (!window.isSecureContext) return setPhase("insecure");
      if (!navigator.mediaDevices?.getUserMedia) return setPhase("unavailable");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      } catch (e) {
        const name = (e as DOMException).name;
        return setPhase(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
      }
      if (stopped) return stream.getTracks().forEach((t) => t.stop());
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      setPhase("scanning");

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      let last = 0;
      const tick = (t: number) => {
        if (stopped) return;
        raf = requestAnimationFrame(tick);
        if (t - last < 120 || video.readyState < 2 || !video.videoWidth) return; // ~8 fps is plenty
        last = t;
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (!code) return;
        const address = extractAddress(code.data);
        if (address) {
          stopped = true;
          onAddressRef.current(address);
        } else {
          setNotAddress(true);
        }
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  if (!open) return null;
  const problem =
    phase === "denied" ? "Camera access was blocked. Allow it in your browser’s site settings, or paste the address instead."
    : phase === "insecure" ? "The camera only works on a secure (https) page. Paste the address instead."
    : phase === "unavailable" ? "No camera found on this device. Paste the address instead."
    : null;

  return (
    <div role="presentation" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 55, background: "var(--pp-overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "pp-fade var(--pp-dur-2) var(--pp-ease) both" }}>
      <div role="dialog" aria-modal="true" aria-label="Scan a QR code" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440 }}>
        <PpCard padding={20} title="Scan their code" action={<PpButton variant="quiet" size="sm" onClick={onClose}>Close</PpButton>}>
          {problem ? (
            <p style={{ margin: 0, font: "var(--pp-type-body)", color: "var(--pp-text-2)" }}>{problem}</p>
          ) : (
            <>
              <div style={{ position: "relative", aspectRatio: "1", borderRadius: 16, overflow: "hidden", background: "var(--pp-grey-950)" }}>
                <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div aria-hidden="true" style={{ position: "absolute", inset: "14%", borderRadius: 18, boxShadow: "0 0 0 2px var(--pp-yellow), 0 0 0 100vmax rgba(10,9,8,.35)" }} />
              </div>
              <span role="status" style={{ font: "var(--pp-type-small)", color: notAddress ? "var(--pp-warning-text)" : "var(--pp-text-2)" }}>
                {phase === "starting" ? "Starting the camera…" : notAddress ? "That QR code isn’t a Solana address. Try theirs." : "Point the camera at their Pairproof code."}
              </span>
            </>
          )}
        </PpCard>
      </div>
    </div>
  );
}
