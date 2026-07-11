import { ImageResponse } from "next/og";

export const alt = "PuntaGo trusted local professionals platform";
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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #ffffff 0%, #f4fbf8 48%, #e6f7f0 100%)",
          color: "#020617",
          padding: 72,
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 24,
              background: "linear-gradient(135deg, #0f766e, #14b8a6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 44,
              fontWeight: 900,
            }}
          >
            P
          </div>
          <div style={{ fontSize: 46, fontWeight: 900 }}>PuntaGo</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              borderRadius: 999,
              border: "2px solid #99f6e4",
              background: "#f0fdfa",
              color: "#0f766e",
              padding: "14px 22px",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 1.2,
            }}
          >
            Starting in Pangasinan. Built for the Philippines.
          </div>
          <div
            style={{
              marginTop: 30,
              maxWidth: 850,
              fontSize: 72,
              lineHeight: 0.98,
              fontWeight: 950,
              letterSpacing: -2,
            }}
          >
            Find trusted local professionals near you.
          </div>
          <div
            style={{
              marginTop: 28,
              maxWidth: 800,
              color: "#475569",
              fontSize: 28,
              lineHeight: 1.35,
              fontWeight: 600,
            }}
          >
            Fair quotations, verified experts, fast matching, and safe communication in one platform.
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, color: "#0f766e", fontSize: 24, fontWeight: 850 }}>
          <span>Verified Professionals</span>
          <span>•</span>
          <span>Fair Quotations</span>
          <span>•</span>
          <span>Fast Matching</span>
        </div>
      </div>
    ),
    size,
  );
}
