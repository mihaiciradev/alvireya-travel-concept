import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ALVIREYA — A Travel Experience Concept by WebbingHUB",
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "browser",
    background_color: "#f4eee3",
    theme_color: "#f4eee3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
