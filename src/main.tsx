import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App";
import { CartProvider } from "./context/CartProvider";
import { SessionProvider } from "./context/SessionProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionProvider>
      <CartProvider>
        <App />
        <Toaster position="top-center" />
      </CartProvider>
    </SessionProvider>
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
