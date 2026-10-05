import * as React from "react";
import { PpAddressInput } from "./ui";
import { QrScanner } from "./QrScanner";
import { cameraSupported } from "../lib/address";

type Props = Omit<React.ComponentProps<typeof PpAddressInput>, "onScan" | "onChange"> & { onChange: (v: string) => void };

/** Address input with Paste and (when the device has a camera) Scan QR. */
export function AddressField(props: Props) {
  const [scanning, setScanning] = React.useState(false);
  const { onChange } = props;
  const onAddress = React.useCallback((a: string) => { onChange(a); setScanning(false); }, [onChange]);
  return (
    <>
      <PpAddressInput {...props} onScan={cameraSupported() ? () => setScanning(true) : undefined} />
      <QrScanner open={scanning} onClose={() => setScanning(false)} onAddress={onAddress} />
    </>
  );
}
