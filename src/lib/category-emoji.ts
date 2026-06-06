// Emoji shown for a category when it has no uploaded image. Matched by
// keyword against the category slug so new categories pick a sensible icon.
const EMOJI_FALLBACKS: Record<string, string> = {
  vegetable: "🥦", veg: "🥦", fruit: "🍎", dairy: "🥛", milk: "🥛",
  snack: "🍪", biscuit: "🍪", beverage: "🥤", drink: "🥤", juice: "🧃",
  tea: "🍵", coffee: "☕", "ice-cream": "🍨", icecream: "🍨", ice: "🍨",
  rice: "🍚", flour: "🌾", dal: "🫘", pulse: "🫘", masala: "🌶️", spice: "🌶️",
  oil: "🫙", ghee: "🧈", clean: "🧹", "personal-care": "🧴", care: "🧴",
  bakery: "🍞", bread: "🍞", egg: "🥚", meat: "🍗", chicken: "🍗",
  sauce: "🥫", jam: "🍯", chocolate: "🍫", candy: "🍬", water: "💧",
};

export function getCategoryEmoji(slug: string): string {
  const s = slug.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_FALLBACKS)) {
    if (s.includes(key)) return emoji;
  }
  return "🛒";
}
