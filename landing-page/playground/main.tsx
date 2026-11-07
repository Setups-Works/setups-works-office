// The real app (same bootstrap as src/main.tsx), running on its built-in demo data because there is no HQ token.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "../../src/App";
import "./playground.css";
import { applyFont, savedFont } from "../../src/theme/fonts";

applyFont(savedFont());

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
