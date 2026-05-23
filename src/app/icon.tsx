import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#085041",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            color: "#1d9e75",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size }
  );
}
