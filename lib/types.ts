/** Shared domain types for Smart Receipt AI */

export interface ReceiptItemInput {
  name: string;
  price: number;
  quantity?: number;
}

export interface ParsedReceipt {
  merchant: string;
  date: string;
  items: ReceiptItemInput[];
  total: number;
}

export interface ReceiptRow {
  id: string;
  user_id: string;
  merchant: string;
  date: string;
  total: number;
  image_url: string | null;
  created_at: string;
}

export interface ItemRow {
  id: string;
  receipt_id: string;
  name: string;
  category: string;
  price: number;
  quantity: number | null;
}

export interface ReceiptWithItems extends ReceiptRow {
  items: ItemRow[];
}

export interface Insight {
  type: "overspending" | "habit" | "expensive" | "info";
  title: string;
  detail: string;
}

export interface AnalyzerResult {
  insights: Insight[];
  flaggedItems: { name: string; category: string; price: number; reason: string }[];
}

export interface AlternativeBlock {
  item: string;
  suggestions: string[];
  links: string[];
}
