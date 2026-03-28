/**
 * Exa AI integration — searches for cheaper product alternatives.
 * Docs: https://docs.exa.ai/reference/search
 *
 * Features:
 *  - In-memory cache with TTL + max-size eviction
 *  - Per-minute rate limiter to avoid spamming the API
 *  - Request timeout
 *  - Graceful fallback when API key is missing or request fails
 */

const EXA_URL = "https://api.exa.ai/search";
const NUM_RESULTS = 3;

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  suggestions: string[];
  links: string[];
  at: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;   // 30 minutes
const CACHE_MAX_SIZE = 200;             // evict oldest when exceeded

function cacheKey(item: string, category: string): string {
  return `${category.toLowerCase()}::${item.toLowerCase().trim()}`;
}

function cacheGet(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry;
}

function cacheSet(key: string, value: Omit<CacheEntry, "at">): void {
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { ...value, at: Date.now() });
}

// ---------------------------------------------------------------------------
// Rate limiter — simple sliding window (max N calls per minute)
// ---------------------------------------------------------------------------

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_CALLS = 10;
const callTimestamps: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  while (callTimestamps.length > 0 && callTimestamps[0] < now - RATE_WINDOW_MS) {
    callTimestamps.shift();
  }
  return callTimestamps.length >= RATE_MAX_CALLS;
}

function recordCall(): void {
  callTimestamps.push(Date.now());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AlternativesResult {
  suggestions: string[];
  links: string[];
}

/**
 * Search Exa for cheaper alternatives to `itemName` in category `category`.
 *
 * Query: "cheaper alternatives to [itemName] in India with similar quality"
 *
 * Returns top 3 suggestions with source links. Falls back to heuristic
 * tips when the API key is missing, the request fails, or the rate limit
 * is hit.
 */
export async function getAlternatives(
  itemName: string,
  category: string,
): Promise<AlternativesResult> {
  const key = cacheKey(itemName, category);

  // 1. Cache hit
  const cached = cacheGet(key);
  if (cached) {
    return { suggestions: cached.suggestions, links: cached.links };
  }

  // 2. No API key → fallback
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    const fb = fallback(itemName, category);
    cacheSet(key, fb);
    return fb;
  }

  // 3. Rate limited → fallback
  if (isRateLimited()) {
    console.warn("[exa] Rate limit reached, returning fallback");
    return fallback(itemName, category);
  }

  // 4. Call Exa
  const query = `cheaper alternatives to ${itemName} in India with similar quality`;

  try {
    recordCall();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(EXA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        numResults: NUM_RESULTS,
        type: "auto",
        useAutoprompt: true,
        contents: { text: { maxCharacters: 200 } },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[exa] API returned ${res.status}: ${await res.text()}`);
      const fb = fallback(itemName, category);
      cacheSet(key, fb);
      return fb;
    }

    const json = (await res.json()) as {
      results?: { title?: string; url?: string; text?: string }[];
    };

    const results = json.results ?? [];

    const suggestions = results
      .map((r) => r.title?.trim() || r.text?.slice(0, 120).trim() || "")
      .filter(Boolean)
      .slice(0, NUM_RESULTS);

    const links = results
      .map((r) => r.url ?? "")
      .filter(Boolean)
      .slice(0, NUM_RESULTS);

    const out: AlternativesResult =
      suggestions.length > 0
        ? { suggestions, links }
        : fallback(itemName, category);

    cacheSet(key, out);
    return out;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort")) {
      console.error("[exa] Request timed out for:", itemName);
    } else {
      console.error("[exa] Request failed:", msg);
    }
    const fb = fallback(itemName, category);
    cacheSet(key, fb);
    return fb;
  }
}

// ---------------------------------------------------------------------------
// Fallback suggestions — category-aware tips when Exa is unavailable
// ---------------------------------------------------------------------------

const CATEGORY_TIPS: Record<string, string[]> = {
  Groceries: [
    "Compare prices on BigBasket, DMart Ready, and JioMart before buying.",
    "Store-brand alternatives are often 20–30% cheaper at DMart and Reliance Smart.",
    "Buy staples in bulk during weekend sales for better per-unit pricing.",
  ],
  Transport: [
    "Compare Uber, Ola, and Rapido — prices vary by time of day.",
    "Consider a monthly metro pass if you commute daily.",
    "Carpooling apps like Quick Ride can halve commute costs.",
  ],
  Clothing: [
    "Check Myntra, Ajio, and Flipkart for similar styles at lower prices.",
    "End-of-season sales (Jan, Jul) offer 40–60% off at most brands.",
    "Uniqlo and H&M basics are often cheaper than Zara equivalents.",
  ],
  Dining: [
    "Cooking at home can save 60–70% vs eating out.",
    "Use Swiggy/Zomato coupons and subscription plans for regular orders.",
    "Dine-in lunch menus are typically cheaper than à la carte dinner.",
  ],
  Health: [
    "Ask your pharmacist for generic equivalents — same compound, lower price.",
    "1mg, PharmEasy, and Netmeds often have 15–25% off on medicines.",
    "Compare diagnostic lab prices on Practo before booking tests.",
  ],
  Shopping: [
    "Wait for sale events (Big Billion Days, Great Indian Festival) for electronics.",
    "Refurbished or open-box products on Amazon Renewed save 20–40%.",
    "Compare prices across Amazon, Flipkart, and Croma before purchasing.",
  ],
};

function fallback(itemName: string, category: string): AlternativesResult {
  const tips = CATEGORY_TIPS[category];
  if (tips) {
    return { suggestions: tips, links: [] };
  }
  return {
    suggestions: [
      `Search "${itemName} cheaper alternative India" on Google for options.`,
      `Compare prices across Amazon India, Flipkart, and local stores.`,
      `Set a price alert to buy ${itemName} when it drops.`,
    ],
    links: [],
  };
}
