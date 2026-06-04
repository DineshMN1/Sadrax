import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sadrax Grocery",
    short_name: "Sadrax",
    description: "Fresh groceries delivered fast in Sadras & Kalpakam",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#16a34a",
    orientation: "portrait-primary",
    categories: ["shopping", "food"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My Cart",   url: "/cart",   description: "View your cart"    },
      { name: "My Orders", url: "/orders", description: "Track your orders" },
      { name: "Offers",    url: "/offers", description: "View offers"        },
    ],
  };
}
