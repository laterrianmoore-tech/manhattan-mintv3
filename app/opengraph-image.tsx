import { ImageResponse } from "next/og";

// Link-preview image (iMessage, WhatsApp, Slack, Facebook…) — the site
// wordmark, same fonts as the nav: DM Sans for "manhattan", DM Serif Display
// italic mint for "mint". Must live in root app/ (src/app/ is dead code).

export const alt = "Manhattan Mint — Luxury Home Cleaning NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pull a Google Font's TTF at build time. Falls back to system fonts if the
// fetch fails so the image still renders.
async function googleFont(family: string, weight: number, italic = false): Promise<ArrayBuffer | null> {
  try {
    const spec = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${spec}`, {
      // An old UA makes Google return TTF (Satori can't read woff2).
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0" },
    }).then((r) => r.text());
    // Satori reads TTF, OTF and WOFF (not woff2); the old UA gets us one of those.
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype|woff)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const [sans, serifItalic] = await Promise.all([
    googleFont("DM Sans", 500),
    googleFont("DM Serif Display", 400, true),
  ]);
  const fonts = [
    sans && { name: "DM Sans", data: sans, weight: 500 as const, style: "normal" as const },
    serifItalic && { name: "DM Serif Display", data: serifItalic, weight: 400 as const, style: "italic" as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 500; style: "normal" | "italic" }[];

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
          fontFamily: "DM Sans, sans-serif",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "#1d9e75", display: "flex" }} />

        {/* Wordmark — matches .brand / .brand-mint in the nav */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 26 }}>
          <span style={{ fontSize: 110, fontWeight: 500, color: "#1a1a1a", letterSpacing: "-3px" }}>manhattan</span>
          <span style={{ fontSize: 110, fontFamily: "DM Serif Display, serif", fontStyle: "italic", color: "#1d9e75" }}>mint</span>
        </div>

        <div style={{ fontSize: 30, color: "#555", letterSpacing: "0.5px", marginBottom: 44 }}>
          Luxury Home Cleaning · New York City
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {["Fully insured", "5.0 on Google", "Flat rates from $175"].map((badge) => (
            <div
              key={badge}
              style={{ background: "#e1f5ee", color: "#085041", padding: "10px 24px", borderRadius: 999, fontSize: 22, display: "flex" }}
            >
              {badge}
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: "#085041", display: "flex" }} />
      </div>
    ),
    // An empty fonts array disables Satori's built-in fallback, so only pass it when we have fonts.
    fonts.length ? { ...size, fonts } : { ...size }
  );
}
