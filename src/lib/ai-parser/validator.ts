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
  ProductCategory,
  GodownHint,
} from './types';
import { TMT_WEIGHTS, INTENT_DISPLAY } from './types';

interface ValidationResult {
  status: DraftStatus;
  clarifications: DraftClarification[];
  renderData: DraftCardRender;
}

interface ResolvedProduct {
  id: string;
  name: string;
  category: ProductCategory;
  brand?: string;
  size?: string;
  unit: string;
}

interface ResolvedGodown {
  id: string;
  name: string;
  canonical_id: string;
  app_alias: string;
}

interface InventoryInfo {
  product_id: string;
  godown_id: string;
  godown_name: string;
  closing_balance_qty: number;
}

interface ResolvedCustomer {
  id: string;
  name: string;
  phone?: string;
  current_balance?: number;
  match_method: 'PHONE_EXACT' | 'TOKEN_MATCH' | 'FUZZY';
  is_ambiguous: boolean;
  alternatives?: { id: string; name: string }[];
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

// Lookup product by alias terms from product_aliases table
async function lookupProductByAlias(
  category?: ProductCategory,
  brand?: string,
  size?: string
): Promise<ResolvedProduct | null> {
  // Build search terms
  const searchTerms: string[] = [];
  if (brand) searchTerms.push(brand.toLowerCase());
  if (size) {
    searchTerms.push(size.toLowerCase());
    // Also add without 'mm'
    searchTerms.push(size.replace(/mm/i, '').toLowerCase());
  }
  if (category) searchTerms.push(category.toLowerCase());
  
  if (searchTerms.length === 0) return null;
  
  // Query product_aliases for matching terms
  const { data: aliases } = await supabase
    .from('product_aliases')
    .select('product_id, alias_term, priority')
    .in('alias_term', searchTerms)
    .order('priority', { ascending: false });
  
  if (!aliases || aliases.length === 0) return null;
  
  // Get the product with highest priority match
  const productId = aliases[0].product_id;
  
  // Fetch product details
  const { data: product } = await supabase
    .from('products')
    .select(`
      id,
      name_en,
      size,
      unit,
      category_id,
      brand_id,
      brands(name),
      categories(name_en)
    `)
    .eq('id', productId)
    .single();
  
  if (!product) return null;
  
  return {
    id: product.id,
    name: product.name_en,
    category: ((product.categories as any)?.name_en?.toUpperCase() || category) as ProductCategory,
    brand: (product.brands as any)?.name,
    size: product.size || undefined,
    unit: product.unit,
  };
}

// Lookup godown by alias from godowns table
async function lookupGodown(hint?: GodownHint): Promise<ResolvedGodown | null> {
  if (!hint) return null;
  
  // Map hint to search terms
  const searchTerms = hint === 'main' 
    ? ['calendar', 'shop', 'main', 'city', 'tiraha', 'counter', 'dukan']
    : ['sutrahi', 'yard', 'godown', 'site', 'bahar'];
  
  const { data: godowns } = await supabase
    .from('godowns')
    .select('id, tally_name, canonical_id, app_alias, aliases');
  
  if (!godowns || godowns.length === 0) return null;
  
  // Find matching godown
  for (const godown of godowns) {
    const aliases = Array.isArray(godown.aliases) ? godown.aliases : [];
    const allAliases = [
      godown.tally_name?.toLowerCase(),
      godown.app_alias?.toLowerCase(),
      ...aliases.map((a: string) => a.toLowerCase()),
    ].filter(Boolean);
    
    if (searchTerms.some(term => allAliases.includes(term))) {
      return {
        id: godown.id,
        name: godown.tally_name,
        canonical_id: godown.canonical_id || '',
        app_alias: godown.app_alias || godown.tally_name,
      };
    }
  }
  
  // Default to first godown if no match
  const defaultGodown = godowns[0];
  return {
    id: defaultGodown.id,
    name: defaultGodown.tally_name,
    canonical_id: defaultGodown.canonical_id || '',
    app_alias: defaultGodown.app_alias || defaultGodown.tally_name,
  };
}

// Check inventory for product in godown
async function checkInventory(
  productId: string,
  godownId?: string
): Promise<InventoryInfo[]> {
  let query = supabase
    .from('inventory_snapshot')
    .select(`
      product_id,
      godown_id,
      closing_balance_qty,
      godowns(tally_name, app_alias)
    `)
    .eq('product_id', productId);
  
  if (godownId) {
    query = query.eq('godown_id', godownId);
  }
  
  const { data } = await query;
  
  if (!data) return [];
  
  return data.map(item => ({
    product_id: item.product_id,
    godown_id: item.godown_id,
    godown_name: (item.godowns as any)?.app_alias || (item.godowns as any)?.tally_name || 'Unknown',
    closing_balance_qty: Number(item.closing_balance_qty) || 0,
  }));
}

// Lookup customer by name or phone hint
async function lookupCustomer(
  nameHint?: string,
  phoneHint?: string
): Promise<ResolvedCustomer | null> {
  if (!nameHint && !phoneHint) return null;
  
  let query = supabase.from('customers').select('id, name, phone, current_balance');
  
  // Exact phone match
  if (phoneHint && phoneHint.length >= 4) {
    const { data: phoneMatches } = await supabase
      .from('customers')
      .select('id, name, phone, current_balance')
      .ilike('phone', `%${phoneHint}`);
    
    if (phoneMatches && phoneMatches.length === 1) {
      return {
        id: phoneMatches[0].id,
        name: phoneMatches[0].name,
        phone: phoneMatches[0].phone || undefined,
        current_balance: Number(phoneMatches[0].current_balance) || 0,
        match_method: 'PHONE_EXACT',
        is_ambiguous: false,
      };
    }
    
    if (phoneMatches && phoneMatches.length > 1) {
      return {
        id: phoneMatches[0].id,
        name: phoneMatches[0].name,
        phone: phoneMatches[0].phone || undefined,
        current_balance: Number(phoneMatches[0].current_balance) || 0,
        match_method: 'PHONE_EXACT',
        is_ambiguous: true,
        alternatives: phoneMatches.slice(1, 4).map(c => ({ id: c.id, name: c.name })),
      };
    }
  }
  
  // Name token match
  if (nameHint) {
    const { data: nameMatches } = await supabase
      .from('customers')
      .select('id, name, phone, current_balance')
      .ilike('name', `%${nameHint}%`);
    
    if (nameMatches && nameMatches.length === 1) {
      return {
        id: nameMatches[0].id,
        name: nameMatches[0].name,
        phone: nameMatches[0].phone || undefined,
        current_balance: Number(nameMatches[0].current_balance) || 0,
        match_method: 'TOKEN_MATCH',
        is_ambiguous: false,
      };
    }
    
    if (nameMatches && nameMatches.length > 1) {
      return {
        id: nameMatches[0].id,
        name: nameMatches[0].name,
        phone: nameMatches[0].phone || undefined,
        current_balance: Number(nameMatches[0].current_balance) || 0,
        match_method: 'TOKEN_MATCH',
        is_ambiguous: true,
        alternatives: nameMatches.slice(1, 4).map(c => ({ id: c.id, name: c.name })),
      };
    }
  }
  
  return null;
}

// Get routing rule for category and direction
async function getRoutingRule(
  category: ProductCategory,
  direction: 'INWARD' | 'OUTWARD',
  weightKg?: number
): Promise<{ godownId?: string; action: 'DEFAULT' | 'ASK_USER' | 'FORCE' }> {
  const categoryUpper = category.toUpperCase() as 'TMT' | 'CEMENT' | 'PIPE' | 'STRUCTURAL' | 'SHEET' | 'WIRE' | 'SERVICE';
  const { data: rules } = await supabase
    .from('routing_rules')
    .select('*')
    .eq('category', categoryUpper)
    .eq('direction', direction);
  
  if (!rules || rules.length === 0) {
    return { action: 'DEFAULT' };
  }
  
  // Find applicable rule based on conditions
  for (const rule of rules) {
    const condition = rule.condition_json as { min_weight_kg?: number; max_weight_kg?: number };
    
    if (condition.min_weight_kg && weightKg && weightKg < condition.min_weight_kg) continue;
    if (condition.max_weight_kg && weightKg && weightKg > condition.max_weight_kg) continue;
    
    // Get godown ID from canonical ID
    if (rule.default_godown_canonical_id) {
      const { data: godown } = await supabase
        .from('godowns')
        .select('id')
        .eq('canonical_id', rule.default_godown_canonical_id)
        .single();
      
      return {
        godownId: godown?.id,
        action: rule.action as 'DEFAULT' | 'ASK_USER' | 'FORCE',
      };
    }
    
    return { action: rule.action as 'DEFAULT' | 'ASK_USER' | 'FORCE' };
  }
  
  return { action: 'DEFAULT' };
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
  
  // Resolve customer
  let resolvedCustomer: ResolvedCustomer | null = null;
  if (parsed.customer?.name_hint || parsed.customer?.phone_hint) {
    resolvedCustomer = await lookupCustomer(
      parsed.customer.name_hint,
      parsed.customer.phone_hint
    );
    
    if (resolvedCustomer?.is_ambiguous) {
      clarifications.push({
        reason_code: 'CUSTOMER_AMBIGUOUS',
        prompt: language === 'hi' 
          ? `कई ग्राहक मिले "${parsed.customer.name_hint || parsed.customer.phone_hint}" के लिए` 
          : `Multiple customers found for "${parsed.customer.name_hint || parsed.customer.phone_hint}"`,
        options: [
          { label: resolvedCustomer.name, value: resolvedCustomer.id },
          ...(resolvedCustomer.alternatives?.map(c => ({ label: c.name, value: c.id })) || []),
        ],
      });
      clarificationChecklist.push(language === 'hi' ? 'ग्राहक चुनें' : 'Select customer');
    }
  }
  
  // Validate each item
  for (const item of parsed.items) {
    const flags: ClarificationReasonCode[] = [];
    
    // Resolve product from aliases
    const resolvedProduct = await lookupProductByAlias(
      item.category,
      item.brand,
      item.size
    );
    
    // Resolve godown
    const resolvedGodown = await lookupGodown(item.godown_hint);
    
    // Check for missing brand
    if (!item.brand && !resolvedProduct?.brand && ['UPDATE_RATE', 'CHECK_RATE', 'ADD_STOCK_MANUAL', 'CREATE_ESTIMATE'].includes(parsed.intent)) {
      flags.push('MISSING_BRAND');
      
      // Fetch available brands from database
      const { data: brands } = await supabase
        .from('brands')
        .select('name')
        .limit(6);
      
      clarifications.push({
        reason_code: 'MISSING_BRAND',
        prompt: language === 'hi' ? 'कौन सा ब्रांड?' : 'Which brand?',
        options: brands?.map(b => ({ label: b.name, value: b.name })) || [
          { label: 'Kamdhenu', value: 'Kamdhenu' },
          { label: 'Jindal', value: 'Jindal' },
          { label: 'Ankur', value: 'Ankur' },
          { label: 'TATA', value: 'TATA' },
        ],
      });
      clarificationChecklist.push(language === 'hi' ? 'ब्रांड चुनें' : 'Select brand');
    }
    
    // Check for missing size (for TMT)
    if (!item.size && !resolvedProduct?.size && item.category === 'tmt') {
      flags.push('MISSING_SIZE');
      clarifications.push({
        reason_code: 'MISSING_SIZE',
        prompt: language === 'hi' ? 'कौन सा साइज (mm)?' : 'Which size (mm)?',
        options: [
          { label: '8mm', value: '8mm' },
          { label: '10mm', value: '10mm' },
          { label: '12mm', value: '12mm' },
          { label: '16mm', value: '16mm' },
          { label: '20mm', value: '20mm' },
          { label: '25mm', value: '25mm' },
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
    
    const actualSize = item.size || resolvedProduct?.size;
    
    if (item.category === 'tmt' && item.uom === 'PCS' && actualSize) {
      const sizeMm = parseSizeMm(actualSize);
      if (sizeMm && item.qty) {
        convertedQty = calculateTMTWeight(sizeMm, item.qty);
        convertedUnit = 'KGS';
        conversionFormula = `(${sizeMm}²/162)*12m`;
      }
    }
    
    // Check inventory
    let stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'NOT_AVAILABLE' | 'UNKNOWN' = 'UNKNOWN';
    let stockLocation = resolvedGodown?.app_alias || (item.godown_hint === 'sutrahi' ? 'Sutrahi (Yard)' : 'Calendar (Shop)');
    
    if (resolvedProduct) {
      const inventory = await checkInventory(resolvedProduct.id, resolvedGodown?.id);
      
      if (inventory.length > 0) {
        const totalQty = inventory.reduce((sum, inv) => sum + inv.closing_balance_qty, 0);
        const requiredQty = convertedQty || item.qty || 0;
        
        if (totalQty >= requiredQty) {
          stockStatus = 'AVAILABLE';
        } else if (totalQty > 0) {
          stockStatus = 'LOW_STOCK';
          flags.push('LOW_STOCK');
        } else {
          stockStatus = 'NOT_AVAILABLE';
          flags.push('NEGATIVE_STOCK_DEFAULT');
        }
        
        // If stock is low in requested godown but available elsewhere
        if (inventory.length > 1 && stockStatus !== 'AVAILABLE') {
          const otherGodown = inventory.find(inv => inv.godown_id !== resolvedGodown?.id && inv.closing_balance_qty >= requiredQty);
          if (otherGodown) {
            flags.push('GODOWN_AMBIGUOUS');
            clarifications.push({
              reason_code: 'GODOWN_AMBIGUOUS',
              prompt: language === 'hi' 
                ? `${stockLocation} में स्टॉक कम है, ${otherGodown.godown_name} में उपलब्ध है`
                : `Low stock at ${stockLocation}, available at ${otherGodown.godown_name}`,
              options: [
                { label: stockLocation, value: resolvedGodown?.id || 'default' },
                { label: otherGodown.godown_name, value: otherGodown.godown_id },
              ],
            });
            clarificationChecklist.push(language === 'hi' ? 'गोदाम चुनें' : 'Select godown');
          }
        }
      }
    }
    
    // Build line item
    const actualBrand = item.brand || resolvedProduct?.brand;
    
    lineItems.push({
      product_id: resolvedProduct?.id,
      product_name: resolvedProduct?.name || `${actualBrand || ''} ${actualSize || ''} ${item.category || 'Item'}`.trim(),
      input_qty: item.qty || 0,
      input_unit: item.uom || 'PCS',
      converted_qty: convertedQty,
      converted_unit: convertedUnit as any,
      conversion_formula: conversionFormula,
      rate_ref: parsed.financials?.amount,
      stock_status: stockStatus,
      stock_location: stockLocation,
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
    customer_display: resolvedCustomer ? {
      id: resolvedCustomer.id,
      name: resolvedCustomer.name,
      phone: resolvedCustomer.phone,
      balance: resolvedCustomer.current_balance 
        ? `${resolvedCustomer.current_balance >= 0 ? '+' : '-'} ₹${Math.abs(resolvedCustomer.current_balance).toLocaleString('en-IN')}`
        : undefined,
      match_method: resolvedCustomer.match_method,
      is_ambiguous: resolvedCustomer.is_ambiguous,
    } : parsed.customer?.name_hint ? {
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
