/**
 * Exa web search for cheaper alternatives (India-focused query).
 * Docs: https://docs.exa.ai/reference/search
 */

const EXA_URL = "https://api.exa.ai/search";

type CacheEntry = { suggestions: string[]; links: string[]; at: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function cacheKey(itemName: string, category: string) {
  return `${category.toLowerCase()}::${itemName.toLowerCase()}`;
}

export async function getAlternatives(
  itemName: string,
  category: string
): Promise<{ suggestions: string[]; links: string[] }> {
  const key = cacheKey(itemName, category);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { suggestions: hit.suggestions, links: hit.links };
  }

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    const fallback = fallbackAlternatives(itemName, category);
    cache.set(key, { ...fallback, at: Date.now() });
    return fallback;
  }

  const query = `cheaper alternatives to ${itemName} in India ${category} similar quality budget`;

  const res = await fetch(EXA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      numResults: 3,
      type: "auto",
      userLocation: "IN",
      contents: { text: true },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Exa API error", res.status, errText);
    const fallback = fallbackAlternatives(itemName, category);
    return fallback;
  }

  const json = (await res.json()) as {
    results?: { title?: string; url?: string; text?: string }[];
  };

  const results = json.results || [];
  const suggestions = results
    .map((r) => r.title || r.text?.slice(0, 120) || "")
    .filter(Boolean);
  const links = results.map((r) => r.url || "").filter(Boolean);

  const out = {
    suggestions: suggestions.length ? suggestions : fallbackAlternatives(itemName, category).suggestions,
    links: links.length ? links : [],
  };
  cache.set(key, { ...out, at: Date.now() });
  return out;
}

function fallbackAlternatives(itemName: string, category: string) {
  return {
    suggestions: [
      `Compare ${itemName} prices on Google Shopping / Amazon India.`,
      `Look for store brands in ${category} at DMart, BigBasket, or Reliance Smart.`,
      `Set a price alert and buy during weekend grocery sales.`,
    ],
    links: [] as string[],
  };
}
