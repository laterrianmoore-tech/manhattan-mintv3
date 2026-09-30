import { ImageResponse } from "next/og";

// Favicon / search-result icon. Lives in root app/ (src/app/ is dead code, so the
// old one never shipped and Google showed a generic globe). Mint square with the
// wordmark's italic serif "m" — the same mark at 16px and 192px.

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

async function serifItalic(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital,wght@1,400", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0" },
    }).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype|woff)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export default async function Icon() {
  const font = await serifItalic();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1d9e75",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f8f8f6",
          fontFamily: "DM Serif Display, Georgia, serif",
          fontStyle: "italic",
          fontSize: 150,
          lineHeight: 1,
          paddingBottom: 14,
        }}
      >
        m
      </div>
    ),
    font ? { ...size, fonts: [{ name: "DM Serif Display", data: font, weight: 400, style: "italic" }] } : { ...size }
  );
}
