import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "vyom-pwa",
    name: "VYOM - AI Business Partner",
    short_name: "VYOM",
    description: "AI Business Partner for Paytm Merchants: recover silent revenue leakage, festival-aware growth, and automated khata.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#2597d0",
    background_color: "#ffffff",
    lang: "en",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Vyom Copilot",
        short_name: "Copilot",
        description: "Talk to Vyom AI Copilot",
        url: "/?open_copilot=true",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Scan Khata",
        short_name: "Khata Scan",
        description: "Scan handwritten khata ledger photo",
        url: "/?open_scan=true",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Festival Planner",
        short_name: "Festivals",
        description: "Upcoming festivals & stock advisor",
        url: "/?tab=festivals",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
