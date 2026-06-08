import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://sadrax.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/cord/", "/api/", "/account/", "/checkout", "/cart", "/orders", "/search"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
