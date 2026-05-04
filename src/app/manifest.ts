import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fairplay",
    short_name: "Fairplay",
    description:
      "A calm household planning app for shared responsibilities and check-ins.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFDF8",
    theme_color: "#FFFDF8",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
