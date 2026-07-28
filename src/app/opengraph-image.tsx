import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [bodoniExtraBold, bodoniBold] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/BodoniModa-ExtraBold.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/BodoniModa-Bold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1a1d22",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              background: "#fff",
              color: "#1a1d22",
              fontSize: 38,
              fontFamily: "Bodoni Moda ExtraBold",
            }}
          >
            H
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              color: "#fff",
              letterSpacing: 4,
              fontFamily: "Bodoni Moda Bold",
            }}
          >
            HECTOR
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 62, fontWeight: 700, color: "#fff", lineHeight: 1.05, letterSpacing: -1.5 }}>
            Track-engineered footwear,
          </div>
          <div style={{ display: "flex", fontSize: 62, fontWeight: 700, color: "#fff", lineHeight: 1.05, letterSpacing: -1.5 }}>
            wholesaled right.
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, fontSize: 20, color: "#a9a39a", fontFamily: "monospace" }}>
          <div style={{ display: "flex" }}>EST. 1984</div>
          <div style={{ display: "flex" }}>WHOLESALE ONLY</div>
          <div style={{ display: "flex" }}>NET 30/60</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bodoni Moda ExtraBold", data: bodoniExtraBold, style: "normal", weight: 800 },
        { name: "Bodoni Moda Bold", data: bodoniBold, style: "normal", weight: 700 },
      ],
    },
  );
}
