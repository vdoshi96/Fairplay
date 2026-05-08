import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fairplay",
    short_name: "Fairplay",
    id: "/app/distribute",
    description:
      "A mobile-first responsibility card app for shared household work.",
    start_url: "/app/distribute",
    scope: "/",
    display: "standalone",
    background_color: "#FFFDF8",
    theme_color: "#FFFDF8",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/fairplay-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/fairplay-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/fairplay-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
