import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const bodoniExtraBold = await readFile(
    join(process.cwd(), "src/assets/fonts/BodoniModa-ExtraBold.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121212",
          color: "#fff",
          fontSize: 120,
          fontFamily: "Bodoni Moda",
        }}
      >
        H
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Bodoni Moda", data: bodoniExtraBold, style: "normal", weight: 800 }],
    },
  );
}
