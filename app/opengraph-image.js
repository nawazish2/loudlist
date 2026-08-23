import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "LOUDLIST — a public attention auction";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#fff7e9", color: "#17211f", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "#ff482f", color: "#fff7e9", fontSize: 26, fontWeight: 800 }}>!</span>LOUDLIST
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 104, fontWeight: 800, lineHeight: 0.92, letterSpacing: -5, textTransform: "uppercase" }}>
          <span>Your thing</span>
          <span>deserves a</span>
          <span>louder room.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 24 }}>
          <span style={{ maxWidth: 620, lineHeight: 1.35 }}>A public wall of internet projects. The rank is bought, never bestowed.</span>
          <span style={{ padding: "12px 18px", background: "#ffcf3c", border: "3px solid #17211f", fontWeight: 800 }}>FROM $7</span>
        </div>
      </div>
    ),
    size,
  );
}
