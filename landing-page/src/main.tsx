import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./landing.css";
import { applyFont, savedFont } from "../../src/theme/fonts";

applyFont(savedFont());

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
