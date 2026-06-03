import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#ffffff",
          border: "3px solid #000000",
          color: "#000000",
          display: "flex",
          fontSize: 13,
          fontWeight: 900,
          height: "100%",
          justifyContent: "center",
          letterSpacing: -1,
          width: "100%",
        }}
      >
        GD
      </div>
    ),
    size
  );
}
