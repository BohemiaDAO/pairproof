import "./polyfills";
import "@fontsource/unbounded/latin-600.css";
import "@fontsource/unbounded/latin-800.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "./styles/tokens.css";
import "./index.css";

import * as React from "react";
import { createRoot } from "react-dom/client";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { App } from "./App";
import { IdentityProvider } from "./lib/identity";
import { startThemeSync } from "./lib/theme";

startThemeSync();

// No adapters listed on purpose: Phantom, Solflare, Backpack and others register themselves
// through the Wallet Standard and are discovered automatically.
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProvider wallets={[]} autoConnect>
      <IdentityProvider>
        <App />
      </IdentityProvider>
    </WalletProvider>
  </React.StrictMode>,
);
