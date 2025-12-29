// Validator layer - runs after parsing to generate clarifications and resolve products
import { supabase } from '@/integrations/supabase/client';
import type {
  CanonicalParsedJSON,
  DraftClarification,
  DraftCardRender,
  DraftCardLineItem,
  DraftStatus,
  ParseSource,
  ClarificationReasonCode,
} from './types';
import { TMT_WEIGHTS, INTENT_DISPLAY } from './types';


interface ValidationResult {
  status: DraftStatus;
  clarifications: DraftClarification[];
  renderData: DraftCardRender;
}

// Calculate TMT weight from pieces
export function calculateTMTWeight(sizeMm: number, pieces: number): number {
  const weightPerRod = TMT_WEIGHTS[String(sizeMm)] || 0;
  return weightPerRod * pieces;
}

// Extract mm size as number
function parseSizeMm(size?: string): number | undefined {
  if (!size) return undefined;
  const match = size.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

// Validate parsed command and generate clarifications
export async function validateParsedCommand(
  parsed: CanonicalParsedJSON,
  rawInput: string,
  parseSource: ParseSource,
  parseConfidence: number,
  language: 'en' | 'hi' = 'hi'
): Promise<ValidationResult> {
  const clarifications: DraftClarification[] = [];
  const lineItems: DraftCardLineItem[] = [];
  const clarificationChecklist: string[] = [];
  
  // Validate each item
  for (const item of parsed.items) {
    const flags: ClarificationReasonCode[] = [];
    
    // Check for missing brand (for rate/stock intents)
    if (!item.brand && ['UPDATE_RATE', 'CHECK_RATE', 'ADD_STOCK_MANUAL'].includes(parsed.intent)) {
      flags.push('MISSING_BRAND');
      clarifications.push({
        reason_code: 'MISSING_BRAND',
        prompt: language === 'hi' ? 'कौन सा ब्रांड?' : 'Which brand?',
        options: [
          { label: 'Kamdhenu', value: 'Kamdhenu' },
          { label: 'Jindal', value: 'Jindal' },
          { label: 'Ankur', value: 'Ankur' },
          { label: 'TATA', value: 'TATA' },
        ],
      });
      clarificationChecklist.push(language === 'hi' ? 'ब्रांड चुनें' : 'Select brand');
    }
    
    // Check for missing size (for TMT)
    if (!item.size && item.category === 'tmt') {
      flags.push('MISSING_SIZE');
      clarifications.push({
        reason_code: 'MISSING_SIZE',
        prompt: language === 'hi' ? 'कौन सा साइज (mm)?' : 'Which size (mm)?',
        options: [
          { label: '8mm', value: '8mm' },
          { label: '10mm', value: '10mm' },
          { label: '12mm', value: '12mm' },
          { label: '16mm', value: '16mm' },
        ],
      });
      clarificationChecklist.push(language === 'hi' ? 'साइज चुनें' : 'Select size');
    }
    
    // Check for bundle (need rods per bundle)
    if (item.uom === 'BUNDLE') {
      flags.push('BUNDLE_RODS_NEEDED');
      clarifications.push({
        reason_code: 'BUNDLE_RODS_NEEDED',
        prompt: language === 'hi' ? 'एक बंडल में कितने रॉड?' : 'Rods per bundle?',
        options: [
          { label: '6', value: '6' },
          { label: '8', value: '8' },
          { label: '10', value: '10' },
          { label: '12', value: '12' },
        ],
      });
      clarificationChecklist.push(language === 'hi' ? 'बंडल में रॉड की संख्या बताएं' : 'Specify rods per bundle');
    }
    
    // Check for pipe weight confirmation
    if (item.category === 'pipe' && item.uom === 'PCS') {
      flags.push('CONFIRM_WEIGHT');
      clarificationChecklist.push(language === 'hi' ? 'पाइप का वजन कन्फर्म करें' : 'Confirm pipe weight');
    }
    
    // Convert units if possible
    let convertedQty: number | undefined;
    let convertedUnit: string | undefined;
    let conversionFormula: string | undefined;
    
    if (item.category === 'tmt' && item.uom === 'PCS' && item.size) {
      const sizeMm = parseSizeMm(item.size);
      if (sizeMm && item.qty) {
        convertedQty = calculateTMTWeight(sizeMm, item.qty);
        convertedUnit = 'KGS';
        conversionFormula = `(${sizeMm}²/162)*12m`;
      }
    }
    
    // Build line item
    lineItems.push({
      product_name: `${item.brand || ''} ${item.size || ''} ${item.category || 'Item'}`.trim(),
      input_qty: item.qty || 0,
      input_unit: item.uom || 'PCS',
      converted_qty: convertedQty,
      converted_unit: convertedUnit as any,
      conversion_formula: conversionFormula,
      stock_status: 'UNKNOWN',
      stock_location: item.godown_hint === 'sutrahi' ? 'Sutrahi (Yard)' : 'Calendar (Shop)',
      flags,
    });
  }
  
  // Determine status
  const hasBlockingClarifications = clarifications.length > 0;
  const status: DraftStatus = hasBlockingClarifications ? 'NEEDS_CLARIFICATION' : 'DRAFT';
  
  // Build render data
  const intentDisplay = INTENT_DISPLAY[parsed.intent];
  
  const renderData: DraftCardRender = {
    card_id: '', // Will be set after DB insert
    intent: parsed.intent,
    intent_display: language === 'hi' ? intentDisplay.hi : intentDisplay.en,
    customer_display: parsed.customer?.name_hint ? {
      name: parsed.customer.name_hint,
      is_ambiguous: false,
    } : undefined,
    line_items: lineItems,
    clarification_checklist: clarificationChecklist,
    status,
    raw_input: rawInput,
    parse_source: parseSource,
    parse_confidence: parseConfidence,
  };
  
  return {
    status,
    clarifications,
    renderData,
  };
}

// Save draft card to database
export async function saveDraftCard(
  userId: string,
  rawInput: string,
  parsed: CanonicalParsedJSON,
  parseSource: ParseSource,
  parseConfidence: number,
  status: DraftStatus,
  clarifications: DraftClarification[]
): Promise<string | null> {
  // Insert draft card
  const { data: draft, error: draftError } = await supabase
    .from('draft_cards')
    .insert({
      user_id: userId,
      raw_input: rawInput,
      intent: parsed.intent,
      parse_source: parseSource,
      parse_confidence: parseConfidence,
      parsed_json: parsed as any,
      status,
    })
    .select('id')
    .single();
  
  if (draftError || !draft) {
    console.error('Failed to save draft card:', draftError);
    return null;
  }
  
  // Insert clarifications
  if (clarifications.length > 0) {
    const clarificationRows = clarifications.map(c => ({
      draft_id: draft.id,
      reason_code: c.reason_code,
      prompt: c.prompt,
      options: c.options || null,
    }));
    
    const { error: clarError } = await supabase
      .from('draft_clarifications')
      .insert(clarificationRows);
    
    if (clarError) {
      console.error('Failed to save clarifications:', clarError);
    }
  }
  
  return draft.id;
}

// Fetch draft card with clarifications
export async function fetchDraftCard(draftId: string): Promise<DraftCardRender | null> {
  const { data: draft, error } = await supabase
    .from('draft_cards')
    .select(`
      *,
      draft_clarifications(*)
    `)
    .eq('id', draftId)
    .single();
  
  if (error || !draft) {
    return null;
  }
  
  const parsed = draft.parsed_json as unknown as CanonicalParsedJSON;
  const intentDisplay = INTENT_DISPLAY[parsed.intent as keyof typeof INTENT_DISPLAY];
  
  // Build line items from parsed JSON
  const lineItems: DraftCardLineItem[] = parsed.items.map(item => ({
    product_name: `${item.brand || ''} ${item.size || ''} ${item.category || 'Item'}`.trim(),
    input_qty: item.qty || 0,
    input_unit: (item.uom || 'PCS') as any,
    stock_status: 'UNKNOWN',
    flags: [],
  }));
  
  return {
    card_id: draft.id,
    intent: parsed.intent,
    intent_display: intentDisplay?.hi || parsed.intent,
    customer_display: parsed.customer?.name_hint ? {
      name: parsed.customer.name_hint,
      is_ambiguous: false,
    } : undefined,
    line_items: lineItems,
    clarification_checklist: (draft.draft_clarifications as any[])?.map((c: any) => c.prompt) || [],
    status: draft.status as DraftStatus,
    raw_input: draft.raw_input || '',
    parse_source: draft.parse_source as ParseSource,
    parse_confidence: draft.parse_confidence,
  };
}
