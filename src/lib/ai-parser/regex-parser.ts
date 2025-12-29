// Regex-first parser for voice/text commands per spec v1.1.1
import {
  CATEGORY_ALIASES,
  BRAND_ALIASES,
  GODOWN_ALIASES,
  INTENT_KEYWORDS,
  UOM_PATTERNS,
  SIZE_PATTERNS,
  PRICE_PATTERNS,
} from './constants';
import type {
  Intent,
  CanonicalParsedJSON,
  ParsedItem,
  ProductCategory,
  UOM,
  GodownHint,
} from './types';

interface ParseResult {
  parsed: CanonicalParsedJSON;
  confidence: number;
}

// Detect intent from text
function detectIntent(text: string): { intent: Intent; confidence: number } {
  const lowerText = text.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return { intent: intent as Intent, confidence: 0.9 };
      }
    }
  }
  
  // Fallback heuristics
  if (/\d+\s*(mm|piece|pcs|bori|kg)/i.test(text)) {
    // Has quantity + unit, likely an estimate/order
    return { intent: 'CREATE_ESTIMATE', confidence: 0.6 };
  }
  
  return { intent: 'CREATE_ESTIMATE', confidence: 0.3 };
}

// Extract category from text
function extractCategory(text: string): ProductCategory | undefined {
  const lowerText = text.toLowerCase();
  
  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    if (lowerText.includes(alias.toLowerCase())) {
      return category as ProductCategory;
    }
  }
  
  return undefined;
}

// Extract brand from text
function extractBrand(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  for (const [alias, brand] of Object.entries(BRAND_ALIASES)) {
    if (lowerText.includes(alias.toLowerCase())) {
      return brand;
    }
  }
  
  return undefined;
}

// Extract godown hint from text
function extractGodown(text: string): GodownHint | undefined {
  const lowerText = text.toLowerCase();
  
  for (const [alias, canonicalId] of Object.entries(GODOWN_ALIASES)) {
    if (lowerText.includes(alias.toLowerCase())) {
      return canonicalId === '7738' ? 'main' : 'sutrahi';
    }
  }
  
  return undefined;
}

// Extract size from text
function extractSize(text: string, category?: ProductCategory): string | undefined {
  // TMT size (mm)
  const mmMatch = text.match(SIZE_PATTERNS.TMT_MM);
  if (mmMatch) {
    return `${mmMatch[1]}mm`;
  }
  
  // Pipe AxB
  const axbMatch = text.match(SIZE_PATTERNS.PIPE_AXB);
  if (axbMatch) {
    return `${axbMatch[1]}x${axbMatch[2]}`;
  }
  
  // Pipe square
  const sqMatch = text.match(SIZE_PATTERNS.PIPE_SQ);
  if (sqMatch) {
    return `${sqMatch[1]}sq`;
  }
  
  // Pipe round
  const rdMatch = text.match(SIZE_PATTERNS.PIPE_ROUND);
  if (rdMatch) {
    return `${rdMatch[1]}rd`;
  }
  
  return undefined;
}

// Extract quantity and UOM from text
function extractQuantityUOM(text: string): { qty?: number; uom?: UOM } {
  for (const [uomKey, pattern] of Object.entries(UOM_PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      return {
        qty: parseFloat(match[1]),
        uom: uomKey as UOM,
      };
    }
  }
  
  // Try to find standalone number
  const numMatch = text.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numMatch) {
    return { qty: parseFloat(numMatch[1]) };
  }
  
  return {};
}

// Extract price from text
function extractPrice(text: string): number | undefined {
  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  
  return undefined;
}

// Extract customer hint from text
function extractCustomerHint(text: string): { name?: string; phone?: string } {
  // Phone pattern (10 digits or last 4-6 digits)
  const phoneMatch = text.match(/\b(\d{4,10})\b/);
  const phone = phoneMatch ? phoneMatch[1] : undefined;
  
  // Name hint - look for patterns like "Rajan ka" or "Rajan Yadav ko"
  const nameMatch = text.match(/([a-zA-Z\u0900-\u097F]+(?:\s+[a-zA-Z\u0900-\u097F]+)?)\s*(?:ka|ke|ko|का|के|को)/i);
  const name = nameMatch ? nameMatch[1].trim() : undefined;
  
  return { name, phone };
}

// Main parser function
export function parseCommand(rawInput: string): ParseResult {
  const text = rawInput.trim();
  
  // Detect intent
  const { intent, confidence: intentConfidence } = detectIntent(text);
  
  // Extract components
  const category = extractCategory(text);
  const brand = extractBrand(text);
  const size = extractSize(text, category);
  const godownHint = extractGodown(text);
  const { qty, uom } = extractQuantityUOM(text);
  const price = extractPrice(text);
  const customerHint = extractCustomerHint(text);
  
  // Build parsed item if we have product info
  const items: ParsedItem[] = [];
  if (category || brand || qty) {
    items.push({
      raw_text: text,
      category,
      brand,
      size,
      qty,
      uom,
      godown_hint: godownHint,
    });
  }
  
  // Calculate confidence
  let confidence = intentConfidence;
  
  // Boost confidence for complete data
  if (category) confidence = Math.min(confidence + 0.1, 1);
  if (brand) confidence = Math.min(confidence + 0.1, 1);
  if (size) confidence = Math.min(confidence + 0.1, 1);
  if (qty && uom) confidence = Math.min(confidence + 0.1, 1);
  
  // Reduce confidence for missing critical data
  if (intent.includes('RATE') && !price && !brand) {
    confidence = Math.max(confidence - 0.2, 0.3);
  }
  if (intent.includes('STOCK') && !qty) {
    confidence = Math.max(confidence - 0.2, 0.3);
  }
  
  // Determine if needs clarification
  const needsClarification = 
    (intent === 'UPDATE_RATE' && (!brand || !price)) ||
    (intent === 'ADD_STOCK_MANUAL' && (!category || !qty)) ||
    (intent === 'CREATE_ESTIMATE' && items.length === 0) ||
    (uom === 'BUNDLE'); // Bundle always needs rods-per-bundle
  
  const clarificationReason = needsClarification
    ? !brand && intent === 'UPDATE_RATE' ? 'Brand not detected'
    : !price && intent === 'UPDATE_RATE' ? 'Price not detected'
    : uom === 'BUNDLE' ? 'Rods per bundle needed'
    : 'Incomplete information'
    : undefined;
  
  const parsed: CanonicalParsedJSON = {
    intent,
    customer: customerHint.name || customerHint.phone ? {
      name_hint: customerHint.name,
      phone_hint: customerHint.phone,
    } : undefined,
    items,
    financials: price ? { amount: price } : undefined,
    needs_clarification: needsClarification,
    clarification_reason: clarificationReason,
  };
  
  return { parsed, confidence };
}

// Parse multi-command (split by "aur" / "और")
export function parseMultiCommand(rawInput: string): ParseResult[] {
  const clauses = rawInput.split(/\s+aur\s+|\s+और\s+/i);
  return clauses.map(clause => parseCommand(clause.trim()));
}
