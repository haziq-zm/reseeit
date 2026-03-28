/**
 * Keyword → category map. Extend for locale-specific merchants.
 */
const KEYWORDS: { pattern: RegExp; category: string }[] = [
  { pattern: /\bmilk\b|grocery|vegetable|fruit|rice|dal|atta/i, category: "Groceries" },
  { pattern: /\buber\b|ola|rapido|metro|fuel|petrol|diesel|taxi|auto\b/i, category: "Transport" },
  { pattern: /\bzara\b|h&m|myntra|clothing|shirt|jeans|kurta/i, category: "Clothing" },
  { pattern: /restaurant|cafe|coffee|starbucks|domino|swiggy|zomato|biryani/i, category: "Dining" },
  { pattern: /pharmacy|medicine|hospital|clinic|apollo/i, category: "Health" },
  { pattern: /amazon|flipkart|electronics|mobile|charger|cable/i, category: "Shopping" },
  { pattern: /netflix|spotify|subscription|prime\b/i, category: "Subscriptions" },
  { pattern: /rent|electricity|water bill|broadband|wifi/i, category: "Utilities" },
];

const MERCHANT_OVERRIDES: { pattern: RegExp; category: string }[] = [
  { pattern: /^uber\b/i, category: "Transport" },
  { pattern: /\bzara\b/i, category: "Clothing" },
];

export function categorizeItem(name: string): string {
  const n = name.trim();
  for (const { pattern, category } of MERCHANT_OVERRIDES) {
    if (pattern.test(n)) return category;
  }
  for (const { pattern, category } of KEYWORDS) {
    if (pattern.test(n)) return category;
  }
  return "Other";
}
