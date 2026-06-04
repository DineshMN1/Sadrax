import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cord — Orders",
    short_name: "Cord",
    description: "Sadrax order management for store staff",
    start_url: "/cord",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#ea580c",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Active Orders", url: "/cord?filter=active", description: "View active orders" },
      { name: "All Orders",    url: "/cord?filter=all",    description: "View all orders"    },
    ],
  };
}
