// Canonical types for AI parsing system per Geeta Traders spec v1.1.1

// 16 Intents - Frozen
export type Intent =
  // Sales & Quotes
  | 'CREATE_ESTIMATE'
  | 'CREATE_ORDER'
  | 'SHARE_QUOTE'
  | 'CHECK_STOCK'
  // Ledger & Payments
  | 'CHECK_LEDGER'
  | 'ADD_PAYMENT'
  | 'SHARE_LEDGER'
  // Purchase & Inventory
  | 'ADD_STOCK_MANUAL'
  | 'ADD_PURCHASE_DRAFT'
  | 'TRANSFER_STOCK'
  // Rate & Admin
  | 'CHECK_RATE'
  | 'UPDATE_RATE'
  | 'GENERATE_RATE_BANNER'
  // Tools & Calculators
  | 'CALCULATE_WEIGHT'
  | 'CALCULATE_PRICE'
  // System
  | 'CANCEL_ACTION';

export type ProductCategory = 'tmt' | 'cement' | 'pipe' | 'sheet' | 'structural' | 'wire' | 'service';
export type UOM = 'PCS' | 'KGS' | 'BAG' | 'BUNDLE' | 'TON';
export type GodownHint = 'main' | 'sutrahi';

// Canonical Parser Output JSON (Contract)
export interface ParsedItem {
  raw_text: string;
  category?: ProductCategory;
  brand?: string;
  size?: string;
  qty?: number;
  uom?: UOM;
  godown_hint?: GodownHint;
}

export interface ParsedCustomer {
  name_hint?: string;
  phone_hint?: string;
  address_hint?: string;
}

export interface ParsedFinancials {
  amount?: number;
  mode?: 'Cash' | 'Online' | 'Cheque';
}

export interface CanonicalParsedJSON {
  intent: Intent;
  customer?: ParsedCustomer;
  items: ParsedItem[];
  financials?: ParsedFinancials;
  needs_clarification: boolean;
  clarification_reason?: string;
}

export type ParseSource = 'REGEX_RULE' | 'LLM_FALLBACK' | 'MANUAL_ENTRY';
export type DraftStatus = 'DRAFT' | 'NEEDS_CLARIFICATION' | 'CONFIRMED' | 'POSTED_TO_TALLY' | 'REJECTED';

// Clarification flags
export type ClarificationReasonCode =
  | 'MISSING_BRAND'
  | 'MISSING_SIZE'
  | 'UOM_MISMATCH'
  | 'CONFIRM_WEIGHT'
  | 'GODOWN_AMBIGUOUS'
  | 'CUSTOMER_AMBIGUOUS'
  | 'LOW_STOCK'
  | 'NEGATIVE_STOCK_DEFAULT'
  | 'UNKNOWN_ITEM'
  | 'BUNDLE_RODS_NEEDED';

export interface DraftClarification {
  reason_code: ClarificationReasonCode;
  prompt: string;
  options?: Array<{ label: string; value: string }>;
}

// Draft Card Render JSON (Frontend Contract)
export interface DraftCardLineItem {
  product_id?: string;
  product_name: string;
  input_qty: number;
  input_unit: UOM;
  converted_qty?: number;
  converted_unit?: UOM;
  conversion_formula?: string;
  rate_ref?: number;
  stock_status: 'AVAILABLE' | 'LOW_STOCK' | 'NOT_AVAILABLE' | 'UNKNOWN';
  stock_location?: string;
  flags: ClarificationReasonCode[];
}

export interface DraftCardRender {
  card_id: string;
  intent: Intent;
  intent_display: string;
  customer_display?: {
    name: string;
    balance?: string;
    match_method?: 'PHONE_EXACT' | 'TOKEN_MATCH' | 'FUZZY' | 'NONE';
    is_ambiguous: boolean;
  };
  line_items: DraftCardLineItem[];
  clarification_checklist: string[];
  status: DraftStatus;
  raw_input: string;
  parse_source: ParseSource;
  parse_confidence: number;
}

// TMT weight constants (12m rod)
export const TMT_WEIGHTS: Record<string, number> = {
  '6': 2.66,
  '8': 4.74,
  '10': 7.40,
  '12': 10.66,
  '16': 18.96,
  '20': 29.60,
  '25': 46.20,
};

// Intent display names
export const INTENT_DISPLAY: Record<Intent, { en: string; hi: string }> = {
  CREATE_ESTIMATE: { en: 'New Estimate', hi: 'नया एस्टीमेट' },
  CREATE_ORDER: { en: 'New Order', hi: 'नया ऑर्डर' },
  SHARE_QUOTE: { en: 'Share Quote', hi: 'कोटेशन शेयर' },
  CHECK_STOCK: { en: 'Check Stock', hi: 'स्टॉक देखें' },
  CHECK_LEDGER: { en: 'View Ledger', hi: 'खाता देखें' },
  ADD_PAYMENT: { en: 'Add Payment', hi: 'भुगतान जोड़ें' },
  SHARE_LEDGER: { en: 'Share Ledger', hi: 'खाता शेयर' },
  ADD_STOCK_MANUAL: { en: 'Add Stock', hi: 'स्टॉक जोड़ें' },
  ADD_PURCHASE_DRAFT: { en: 'Purchase Draft', hi: 'खरीद ड्राफ्ट' },
  TRANSFER_STOCK: { en: 'Transfer Stock', hi: 'स्टॉक ट्रांसफर' },
  CHECK_RATE: { en: 'Check Rate', hi: 'रेट देखें' },
  UPDATE_RATE: { en: 'Update Rate', hi: 'रेट अपडेट' },
  GENERATE_RATE_BANNER: { en: 'Rate Banner', hi: 'रेट बैनर' },
  CALCULATE_WEIGHT: { en: 'Calculate Weight', hi: 'वजन कैलकुलेट' },
  CALCULATE_PRICE: { en: 'Calculate Price', hi: 'दाम कैलकुलेट' },
  CANCEL_ACTION: { en: 'Cancel', hi: 'रद्द करें' },
};
