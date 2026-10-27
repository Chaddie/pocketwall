import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pocketwall",
    short_name: "Pocketwall",
    description: "Mobile console for Sophos Firewall.",
    start_url: "/",
    display: "standalone",
    background_color: "#edf2f9",
    theme_color: "#0a143a",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
