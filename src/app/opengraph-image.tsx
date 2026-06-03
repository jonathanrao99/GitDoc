import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          border: "18px solid #000000",
          color: "#000000",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 64,
          width: "100%",
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: -4 }}>GitDoc</div>
        <div style={{ fontSize: 48, lineHeight: 1.08, maxWidth: 880 }}>
          Compile GitHub repositories into deep, LLM-ready context.
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 28, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase" }}>
          <span>Claude</span>
          <span>GPT</span>
          <span>Gemini</span>
          <span>Cursor</span>
          <span>Codex</span>
        </div>
      </div>
    ),
    size
  );
}
