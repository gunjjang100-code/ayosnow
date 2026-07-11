import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b5cff 0%, #08a8ff 58%, #f59e0b 100%)",
          color: "white",
          fontSize: 88,
          fontWeight: 800,
          fontFamily: "Arial, sans-serif",
          borderRadius: 36,
        }}
      >
        P
      </div>
    ),
    size,
  );
}
