import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const root = document.getElementById("root");
if (!root) throw new Error("missing #root element");

function PlaceholderShell() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        gap: 16,
        padding: 32,
        textAlign: "center",
      }}
    >
      <h1 style={{ color: "#d4943a", fontFamily: "Big Shoulders Display, sans-serif", margin: 0 }}>
        CONCRETE VERMIN
      </h1>
      <p style={{ color: "#a89344", margin: 0 }}>TACTICAL REFORGED</p>
      <p style={{ marginTop: 32, color: "#7a7368", maxWidth: 480 }}>
        Production build in progress. See <code>docs/plans/concrete-vermin.prq.md</code> for the
        delivery plan.
      </p>
    </div>
  );
}

createRoot(root).render(
  <StrictMode>
    <PlaceholderShell />
  </StrictMode>,
);
