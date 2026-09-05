import { ImageResponse } from "next/og";

export const alt =
  "Suffa — community homeschool pods where the software carries the curriculum";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#faf4ea",
          color: "#2c2521",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#c05e3b",
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 600 }}>Suffa</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.1, maxWidth: 900 }}>
            Learning that doesn&apos;t stop when a volunteer moves on
          </div>
          <div style={{ fontSize: 30, color: "#574d44", maxWidth: 940 }}>
            Community homeschool pods for Quebec Muslim families. Waqf-sustained, free to
            families.
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#857868" }}>
          A curriculum playground · live volunteer enrichment · masjid-run compliance
        </div>
      </div>
    ),
    size,
  );
}
