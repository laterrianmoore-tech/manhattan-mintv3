import { ImageResponse } from "next/og";

// Square brand image (1080x1080) for places that need one: the Google Business
// Profile logo, Facebook/Instagram avatars, Nextdoor. Same wordmark and fonts
// as /opengraph-image. Download it at /brand/square and upload it there.
// (GBP pulls its own uploads, not the site's og:image, for the search panel.)

export const dynamic = "force-static";

async function googleFont(family: string, weight: number, italic = false): Promise<ArrayBuffer | null> {
  try {
    const spec = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${spec}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0" },
    }).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype|woff)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET() {
  const [sans, serifItalic] = await Promise.all([googleFont("DM Sans", 500), googleFont("DM Serif Display", 400, true)]);
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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, background: "#1d9e75", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
          <span style={{ fontSize: 150, fontWeight: 500, color: "#1a1a1a", letterSpacing: "-5px" }}>manhattan</span>
          <span style={{ fontSize: 190, fontFamily: "DM Serif Display, serif", fontStyle: "italic", color: "#1d9e75", marginTop: -10 }}>mint</span>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: "#085041", display: "flex" }} />
      </div>
    ),
    fonts.length ? { width: 1080, height: 1080, fonts } : { width: 1080, height: 1080 }
  );
}
