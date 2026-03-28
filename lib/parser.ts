import type { ParsedReceipt, ReceiptItemInput } from "./types";

/** Synthetic receipt returned when OCR text is empty or totally unparseable. */
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

// ---------------------------------------------------------------------------
// Noise detection — lines we should never treat as item rows
// ---------------------------------------------------------------------------

const NOISE_PATTERNS: RegExp[] = [
  /^(tel|phone|ph|fax|mob)[:\s]/i,
  /^(gstin?|tin|pan|cin|fssai)[:\s]/i,
  /^(addr|address)[:\s]/i,
  /thank\s*you/i,
  /visit\s*again/i,
  /have\s*a\s*(nice|good|great)\s*day/i,
  /^\*{3,}/,
  /^-{3,}$/,
  /^={3,}$/,
  /^\s*\d{10,}\s*$/,                       // bare phone numbers
  /^\s*(sub\s*total|subtotal)\s*$/i,        // standalone subtotal header
  /^\s*(tax|vat|cgst|sgst|igst|gst)\b/i,   // tax header lines
  /^\s*(cash|card|upi|gpay|paytm|phonepe|net\s*banking)\s/i,
  /^\s*(change|tender|paid)\s/i,
  /^\s*inv(oice)?\s*(no|#|number)/i,
  /^\s*(bill|receipt)\s*(no|#|number)/i,
  /^\s*(date|time)[:\s]/i,
  /^\s*(qty|s\.?no|sr|sl|item\s*name|description|amount|rate|price)\s*$/i,
  /^\s*\d{1,3}\s*$/,                       // lone small numbers (line numbers)
];

function isNoiseLine(line: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(line));
}

// ---------------------------------------------------------------------------
// Total-line keywords (ordered by specificity — first match wins)
// ---------------------------------------------------------------------------

const TOTAL_PATTERNS: RegExp[] = [
  /(?:grand\s*total|net\s*(?:amount|total|payable)|amount\s*(?:due|payable)|total\s*(?:amount|due|payable)|balance\s*due)[^\d]*(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)/i,
  /(?:total)[^\d]*(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)/i,
];

// ---------------------------------------------------------------------------
// Item-line patterns — tried in order; first match wins for a given line.
// Covers common receipt layouts:
//   "Milk 1L            ₹56.00"
//   "Milk 1L   x2       112"
//   "2 x Milk 1L        112.00"
//   "Milk 1L   2   56   112"
// ---------------------------------------------------------------------------

const ITEM_PATTERNS: RegExp[] = [
  // "Name  qty x price  lineTotal"  or  "Name  qty  price  lineTotal"
  /^(.+?)\s{2,}(\d+)\s*[x×]\s*(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)\s+(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)\s*$/i,

  // "qty x Name    price"
  /^(\d+)\s*[x×]\s+(.+?)\s{2,}(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)\s*$/i,

  // "Name    qty    price"  (qty and per-unit price, no line total column)
  /^(.+?)\s{2,}(\d+)\s{2,}(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)\s*$/i,

  // "Name    price"  (simplest — no quantity column)
  /^(.+?)[\s\t]{2,}(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)\s*$/i,

  // Single-space separator fallback: "Name price"
  /^([A-Za-z][\w\s&'./-]{1,40})\s+(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)\s*$/i,
];

interface ItemCapture {
  name: string;
  price: number;
  quantity?: number;
}

function tryParseItem(line: string): ItemCapture | null {
  if (isNoiseLine(line)) return null;

  for (let pi = 0; pi < ITEM_PATTERNS.length; pi++) {
    const m = line.match(ITEM_PATTERNS[pi]);
    if (!m) continue;

    let name: string;
    let price: number;
    let qty: number | undefined;

    switch (pi) {
      case 0: {
        // Name  qty x price  lineTotal
        name = m[1];
        qty = parseInt(m[2], 10);
        price = toNum(m[4]); // use lineTotal as the meaningful price
        break;
      }
      case 1: {
        // qty x Name  price
        qty = parseInt(m[1], 10);
        name = m[2];
        price = toNum(m[3]);
        break;
      }
      case 2: {
        // Name  qty  price
        name = m[1];
        qty = parseInt(m[2], 10);
        price = toNum(m[3]);
        break;
      }
      case 3:
      case 4: {
        // Name  price  |  Name price
        name = m[1];
        price = toNum(m[2]);
        break;
      }
      default:
        continue;
    }

    name = cleanName(name);
    if (!isValidItem(name, price)) continue;

    return { name, price, quantity: qty && qty > 0 ? qty : undefined };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Merchant extraction
// ---------------------------------------------------------------------------

const SKIP_MERCHANT: RegExp[] = [
  /^(tel|phone|ph|fax|mob|gstin?|tin|pan|addr|address|date|time|inv|bill|receipt)/i,
  /^\d{4,}/,
  /^[*=\-]{3,}/,
  /^\s*$/,
];

function extractMerchant(lines: string[]): string {
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (trimmed.length < 2 || trimmed.length > 80) continue;
    if (SKIP_MERCHANT.some((p) => p.test(trimmed))) continue;
    if (/^\d+[\/\-]\d+[\/\-]\d+$/.test(trimmed)) continue; // bare date
    return trimmed;
  }
  return "Unknown merchant";
}

// ---------------------------------------------------------------------------
// Date extraction
// ---------------------------------------------------------------------------

function extractDate(raw: string): string {
  const patterns: RegExp[] = [
    /(\d{4})-(\d{2})-(\d{2})/,                     // 2026-03-28
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,     // DD/MM/YYYY or MM-DD-YY
  ];
  for (const p of patterns) {
    const m = raw.match(p);
    if (m) return normalizeDate(m[0]);
  }
  return new Date().toISOString().slice(0, 10);
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNum(s: string): number {
  return parseFloat(s.replace(/,/g, ""));
}

function cleanName(raw: string): string {
  return raw
    .replace(/[*•\-]+$/g, "")  // trailing bullets
    .replace(/^[*•\-]+/g, "")  // leading bullets
    .replace(/\s+/g, " ")
    .trim();
}

const TOTAL_KEYWORDS = /^(total|sub\s*total|subtotal|tax|vat|cgst|sgst|igst|discount|round|rounding|amount|balance|change|tender|paid|net|grand|gst)/i;

function isValidItem(name: string, price: number): boolean {
  if (name.length < 2) return false;
  if (isNaN(price) || price <= 0 || price >= 1_000_000) return false;
  if (TOTAL_KEYWORDS.test(name)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse raw OCR / receipt text into structured fields.
 *
 * Strategy:
 * 1. Normalize whitespace, split into lines, trim blanks.
 * 2. Extract merchant from the first few non-noise lines.
 * 3. Find a date anywhere in the text.
 * 4. Walk each line through a cascade of item-line regex patterns.
 * 5. Extract the total; fall back to summing detected items.
 * 6. If zero items found, return mockParsedReceipt() so the UI still works.
 */
export function parseReceipt(text: string): ParsedReceipt {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (raw.length < 8) return mockParsedReceipt();

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const merchant = extractMerchant(lines);
  const date = extractDate(raw);

  // --- item extraction ---
  const items: ReceiptItemInput[] = [];
  for (const line of lines) {
    const parsed = tryParseItem(line);
    if (parsed) {
      items.push({
        name: parsed.name,
        price: parsed.price,
        quantity: parsed.quantity,
      });
    }
  }

  // --- total extraction ---
  let total = 0;
  for (const tp of TOTAL_PATTERNS) {
    const m = raw.match(tp);
    if (m) {
      const v = toNum(m[1]);
      if (!isNaN(v) && v > 0) {
        total = v;
        break;
      }
    }
  }
  if (!total) {
    total = items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
  }

  if (items.length === 0) return mockParsedReceipt();

  return { merchant, date, items, total };
}
