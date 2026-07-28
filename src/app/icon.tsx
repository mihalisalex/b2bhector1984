import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          fontSize: 22,
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
