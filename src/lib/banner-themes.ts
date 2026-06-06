// Gradient presets shared by the admin editor and the storefront carousel.
// Used when a banner has no background image (text-only promotional banner).

export interface BannerTheme {
  id: string;
  label: string;
  gradient: string;   // tailwind classes for the slide background
  text: string;       // main text colour
  sub: string;        // subtitle colour
  badgeBg: string;    // badge pill background
  ctaBg: string;      // CTA button background + text
}

export const BANNER_THEMES: BannerTheme[] = [
  {
    id: "green",
    label: "Green",
    gradient: "bg-linear-to-br from-green-600 via-green-700 to-emerald-800",
    text: "text-white",
    sub: "text-green-100",
    badgeBg: "bg-white/20 text-white border border-white/10",
    ctaBg: "bg-white text-green-700 hover:bg-green-50",
  },
  {
    id: "orange",
    label: "Orange",
    gradient: "bg-linear-to-br from-orange-500 via-orange-600 to-red-600",
    text: "text-white",
    sub: "text-orange-100",
    badgeBg: "bg-white/20 text-white border border-white/10",
    ctaBg: "bg-white text-orange-600 hover:bg-orange-50",
  },
  {
    id: "blue",
    label: "Blue",
    gradient: "bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800",
    text: "text-white",
    sub: "text-blue-100",
    badgeBg: "bg-white/20 text-white border border-white/10",
    ctaBg: "bg-white text-blue-700 hover:bg-blue-50",
  },
  {
    id: "purple",
    label: "Purple",
    gradient: "bg-linear-to-br from-purple-600 via-purple-700 to-fuchsia-800",
    text: "text-white",
    sub: "text-purple-100",
    badgeBg: "bg-white/20 text-white border border-white/10",
    ctaBg: "bg-white text-purple-700 hover:bg-purple-50",
  },
  {
    id: "dark",
    label: "Dark",
    gradient: "bg-linear-to-br from-gray-800 via-gray-900 to-black",
    text: "text-white",
    sub: "text-gray-300",
    badgeBg: "bg-white/15 text-white border border-white/10",
    ctaBg: "bg-white text-gray-900 hover:bg-gray-100",
  },
];

export function getBannerTheme(id?: string | null): BannerTheme {
  return BANNER_THEMES.find((t) => t.id === id) ?? BANNER_THEMES[0];
}
