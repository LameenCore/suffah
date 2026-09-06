import { ImageResponse } from "next/og";

// Generated PWA icons (T61): /pwa-icon/192 and /pwa-icon/512.
// A white eight-point star (the Suffa motif) on a solid teal field with a wide
// margin, so it survives a maskable crop.

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

const STAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#fffdf8" d="M24 2l5.3 9.9 11-2.1-2.1 11L48 24l-9.8 3.2 2.1 11-11-2.1L24 46l-5.3-9.9-11 2.1 2.1-11L0 24l9.8-3.2-2.1-11 11 2.1z"/><circle cx="24" cy="24" r="7" fill="#2f7d78"/></svg>`,
  );

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await params;
  const size = raw === "512" ? 512 : 192;
  const pad = Math.round(size * 0.18);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2f7d78",
          padding: pad,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={STAR} width={size - pad * 2} height={size - pad * 2} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
