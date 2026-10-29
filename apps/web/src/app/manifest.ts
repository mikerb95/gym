import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.description,
    lang: "es-CO",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f4f3",
    theme_color: "#2b55c6",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Empezar entreno", url: "/entrenar" },
      { name: "Registrar comida", url: "/nutricion" },
    ],
  };
}
