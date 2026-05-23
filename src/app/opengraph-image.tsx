import { ImageResponse } from "next/og";

export const alt = "Manhattan Mint | Home Cleaning NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f8f8f6",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: "#1d9e75",
            display: "flex",
          }}
        />

        {/* Logo wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 88,
              fontWeight: 500,
              color: "#1a1a1a",
              letterSpacing: "-3px",
            }}
          >
            manhattan
          </span>
          <span
            style={{
              fontSize: 88,
              fontWeight: 400,
              color: "#1d9e75",
              fontStyle: "italic",
            }}
          >
            mint
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 30,
            color: "#555",
            fontWeight: 300,
            letterSpacing: "0.5px",
            marginBottom: 44,
          }}
        >
          Luxury Home Cleaning · New York City
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: 24 }}>
          {["Fully Insured", "5-Star Local Team", "Building-Friendly"].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  background: "#e1f5ee",
                  color: "#085041",
                  padding: "10px 24px",
                  borderRadius: "999px",
                  fontSize: 22,
                  fontWeight: 500,
                  display: "flex",
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#085041",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
