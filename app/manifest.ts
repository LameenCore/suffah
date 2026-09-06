import type { MetadataRoute } from "next";

// PWA manifest (T61). Served at /manifest.webmanifest and picked up automatically
// by the root layout's metadata. Colours are the design-system light tokens.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suffa — community homeschool pods",
    short_name: "Suffa",
    description:
      "The self-paced curriculum playground for Suffa pods. Download a unit and keep learning with the network down.",
    id: "/",
    start_url: "/student",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf4ea",
    theme_color: "#2f7d78",
    categories: ["education"],
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
