import type { ParsedReceipt } from "./types";

/** Synthetic receipt when OCR is empty or unusable */
export function mockParsedReceipt(): ParsedReceipt {
  return {
    merchant: "Demo Store",
    date: new Date().toISOString().slice(0, 10),
    items: [
      { name: "Milk 1L", price: 56, quantity: 1 },
      { name: "Bread", price: 45, quantity: 1 },
      { name: "Uber Ride", price: 120, quantity: 1 },
    ],
    total: 221,
  };
}

/**
 * Parse loose OCR / receipt text into structured fields using regex and line heuristics.
 */
export function parseReceipt(text: string): ParsedReceipt {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (raw.length < 8) {
    return mockParsedReceipt();
  }

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let merchant = "Unknown merchant";
  if (lines[0] && !/^\d/.test(lines[0]) && lines[0].length < 80) {
    merchant = lines[0];
  }

  const dateMatch = raw.match(
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}-\d{2}-\d{2})/i
  );
  const date = dateMatch
    ? normalizeDate(dateMatch[0])
    : new Date().toISOString().slice(0, 10);

  const items: ParsedReceipt["items"] = [];
  const priceLine =
    /^(.*?)[\s\t]+(?:x\s*)?(\d+)?\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+\.?\d*)\s*$/i;

  for (const line of lines) {
    const m = line.match(priceLine);
    if (m) {
      const name = m[1].replace(/[*•\-]/g, "").trim();
      const qty = m[2] ? parseInt(m[2], 10) : undefined;
      const price = parseFloat(m[3].replace(/,/g, ""));
      if (name.length > 1 && !isNaN(price) && price > 0 && price < 1_000_000) {
        items.push({
          name,
          price,
          quantity: qty && qty > 0 ? qty : undefined,
        });
      }
    }
  }

  let total = 0;
  const totalMatch = raw.match(
    /(?:total|amount\s*due|grand\s*total|balance)[^\d]*(?:₹|Rs\.?|INR)?\s*([\d,]+\.?\d*)/i
  );
  if (totalMatch) {
    total = parseFloat(totalMatch[1].replace(/,/g, ""));
  }
  if (!total || isNaN(total)) {
    total = items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
  }

  if (items.length === 0) {
    return mockParsedReceipt();
  }

  return { merchant, date, items, total };
}

function normalizeDate(s: string): string {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const slash = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slash) {
    let y = parseInt(slash[3], 10);
    if (y < 100) y += 2000;
    const mo = slash[1].padStart(2, "0");
    const d = slash[2].padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  return new Date().toISOString().slice(0, 10);
}
