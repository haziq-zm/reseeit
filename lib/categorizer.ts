/**
 * Extensible item categorizer.
 *
 * Adding a new rule: append a keyword to the relevant array in KEYWORD_MAP,
 * or add a new category key. Merchant overrides take priority so that
 * an "Uber" item always maps to Transport even if the word appears elsewhere.
 */

type Category = string;

const KEYWORD_MAP: Record<Category, string[]> = {
  Groceries: [
    "milk", "bread", "egg", "rice", "dal", "atta", "flour", "sugar",
    "oil", "butter", "cheese", "paneer", "curd", "yogurt",
    "vegetable", "fruit", "onion", "potato", "tomato", "grocery",
    "beans", "cereal", "pasta", "noodle", "sauce", "spice",
    "salt", "pepper", "tea", "biscuit", "juice", "water",
  ],
  Transport: [
    "uber", "ola", "rapido", "lyft", "taxi", "cab", "auto",
    "metro", "bus", "fuel", "petrol", "diesel", "parking", "toll",
  ],
  Clothing: [
    "zara", "h&m", "uniqlo", "myntra", "ajio",
    "shirt", "jeans", "kurta", "tshirt", "t-shirt", "trouser",
    "jacket", "dress", "clothing", "apparel", "shoes", "sneaker",
  ],
  Dining: [
    "restaurant", "cafe", "coffee", "starbucks", "domino",
    "swiggy", "zomato", "biryani", "pizza", "burger", "meal",
    "food court", "dine", "pastry", "bakery", "chai",
  ],
  Health: [
    "pharmacy", "medicine", "hospital", "clinic", "apollo",
    "tablet", "syrup", "capsule", "diagnostic", "lab test",
  ],
  Shopping: [
    "amazon", "flipkart", "electronics", "mobile", "charger",
    "cable", "headphone", "earphone", "laptop", "gadget",
  ],
  Subscriptions: [
    "netflix", "spotify", "prime", "subscription", "hotstar",
    "youtube premium", "apple music", "cloud storage",
  ],
  Utilities: [
    "rent", "electricity", "water bill", "broadband", "wifi",
    "gas bill", "internet", "recharge", "postpaid",
  ],
};

/**
 * Merchant-name overrides — checked first so that "Uber Ride" always
 * resolves to Transport regardless of item-level keywords.
 */
const MERCHANT_OVERRIDES: { test: RegExp; category: Category }[] = [
  { test: /\buber\b/i, category: "Transport" },
  { test: /\bola\b/i, category: "Transport" },
  { test: /\bzara\b/i, category: "Clothing" },
  { test: /\bh&m\b/i, category: "Clothing" },
  { test: /\bstarbucks\b/i, category: "Dining" },
  { test: /\bapollo\b/i, category: "Health" },
];

const compiled = buildPatterns(KEYWORD_MAP);

function buildPatterns(
  map: Record<Category, string[]>
): { pattern: RegExp; category: Category }[] {
  return Object.entries(map).map(([category, keywords]) => {
    const alt = keywords
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    return { pattern: new RegExp(`\\b(?:${alt})\\b`, "i"), category };
  });
}

/**
 * Categorize a single item name.
 * Priority: merchant overrides → keyword match → "Other".
 */
export function categorizeItem(name: string): Category {
  const n = name.trim();
  if (!n) return "Other";

  for (const { test, category } of MERCHANT_OVERRIDES) {
    if (test.test(n)) return category;
  }

  for (const { pattern, category } of compiled) {
    if (pattern.test(n)) return category;
  }

  return "Other";
}

/** Expose all known categories (useful for UI filters or summaries). */
export const ALL_CATEGORIES: readonly string[] = [
  ...Object.keys(KEYWORD_MAP),
  "Other",
];
