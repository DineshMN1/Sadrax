// Common Indian-grocery search synonyms so e.g. "atta" finds "flour".
// Keys and values are lowercase. Matching is whole-query or per-word.
const SYNONYMS: Record<string, string[]> = {
  atta: ["flour", "wheat"],
  maida: ["flour"],
  curd: ["yogurt", "dahi"],
  dahi: ["curd", "yogurt"],
  jeera: ["cumin"],
  haldi: ["turmeric"],
  mirchi: ["chilli", "chili"],
  chai: ["tea"],
  biscuit: ["cookie", "rusk"],
  cookie: ["biscuit"],
  coke: ["cola", "soft drink", "pepsi"],
  pepsi: ["cola", "soft drink", "coke"],
  colddrink: ["soft drink", "beverage", "soda"],
  "cool drink": ["soft drink", "beverage", "soda"],
  softdrink: ["beverage", "soda"],
  oil: ["cooking oil"],
  ghee: ["clarified butter"],
  icecream: ["ice cream"],
  "ice cream": ["icecream"],
  noodles: ["maggi", "yippee"],
  choco: ["chocolate"],
};

// Expand a query into the set of terms to search (original + any synonyms).
export function expandSynonyms(query: string): string[] {
  const q = query.trim().toLowerCase();
  const terms = new Set<string>([q]);
  if (SYNONYMS[q]) SYNONYMS[q].forEach((t) => terms.add(t));
  for (const word of q.split(/\s+/)) {
    if (SYNONYMS[word]) SYNONYMS[word].forEach((t) => terms.add(t));
  }
  return [...terms].filter(Boolean);
}
