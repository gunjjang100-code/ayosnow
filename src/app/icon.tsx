import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #0f766e 100%)",
          color: "white",
          fontSize: 220,
          fontWeight: 800,
          fontFamily: "Arial, sans-serif",
        }}
      >
        A
      </div>
    ),
    size,
  );
}
