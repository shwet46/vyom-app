import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "vyom-pwa",
    name: "VYOM",
    short_name: "VYOM",
    description: "AI teammate that finds money a Paytm merchant is silently losing and recovers it.",
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
        name: "Aaj (Home)",
        short_name: "Aaj",
        description: "Today's recovery and business overview",
        url: "/?tab=aaj",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Mauke (Opportunities)",
        short_name: "Mauke",
        description: "Review money-saving opportunities",
        url: "/?tab=mauke",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Udhaar (Credit Ledger)",
        short_name: "Udhaar",
        description: "Customer credit ledger and scan",
        url: "/?tab=udhaar",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
