import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sadrax Admin",
    short_name: "Admin",
    description: "Sadrax grocery store admin panel",
    start_url: "/admin",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Orders",   url: "/admin/orders",   description: "View all orders"    },
      { name: "Products", url: "/admin/products", description: "Manage products"    },
      { name: "Settings", url: "/admin/settings", description: "Store settings"     },
    ],
  };
}
