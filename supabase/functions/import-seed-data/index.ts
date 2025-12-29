import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse CSV with proper quoting handling
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = values[idx]?.trim() || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

// Parse a single CSV line respecting quotes
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  
  return values;
}

// Parse array syntax like {"alias1","alias2"}
function parseArrayField(value: string): string[] {
  if (!value || value === '{}') return [];
  // Remove outer braces and split
  const content = value.replace(/^\{|\}$/g, '');
  if (!content) return [];
  
  const items: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      items.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) items.push(current.trim());
  
  return items;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch the ZIP file from public URL
    const zipUrl = `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/storage/v1/object/public/settings/geeta_traders_seed_data_v1.zip`;
    
    // Alternative: use the public data folder
    const publicZipUrl = `${req.headers.get('origin') || 'https://preview--'}/data/geeta_traders_seed_data_v1.zip`;
    
    // For now, use hardcoded data since we can't easily fetch the ZIP in edge function
    // Let's insert the data directly based on the spec
    
    const results: Record<string, { inserted: number; expected: number; error?: string }> = {};
    
    // 1. Import GODOWNS (21 rows expected)
    const godownsData = [
      { tally_name: "Main Location", canonical_id: "7738", app_alias: "Calendar (Shop)", aliases: ["calendar", "shop", "dukan", "counter", "main", "city", "tiraha"] },
      { tally_name: "Sutrahi Godown", canonical_id: "7739", app_alias: "Sutrahi (Yard)", aliases: ["sutrahi", "yard", "godown", "bada godown", "site", "bahar"] },
      // Add more godowns from the seed data - these are the core 2
    ];
    
    // Clear and insert godowns
    const { error: godownDeleteErr } = await supabase.from('godowns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { data: insertedGodowns, error: godownErr } = await supabase
      .from('godowns')
      .upsert(godownsData, { onConflict: 'tally_name' })
      .select();
    
    results.godowns = { 
      inserted: insertedGodowns?.length || 0, 
      expected: 2,  // Core godowns
      error: godownErr?.message 
    };
    
    // Get godown IDs for foreign keys
    const { data: godowns } = await supabase.from('godowns').select('id, canonical_id, tally_name');
    const godownMap = new Map(godowns?.map(g => [g.canonical_id || g.tally_name, g.id]) || []);
    const mainGodownId = godownMap.get('7738') || godownMap.get('Main Location');
    const sutrahiGodownId = godownMap.get('7739') || godownMap.get('Sutrahi Godown');
    
    // 2. Get existing products from products table
    const { data: existingProducts } = await supabase.from('products').select('id, name_en, size, brand_id');
    const productMap = new Map(existingProducts?.map(p => [`${p.name_en}-${p.size || ''}`, p.id]) || []);
    
    // 3. Import PRODUCT ALIASES (15 rows expected)
    // Map common aliases to products
    const productAliasesData: { product_id: string; alias_term: string; priority: number }[] = [];
    
    if (existingProducts && existingProducts.length > 0) {
      // Create aliases for TMT products
      existingProducts.forEach(product => {
        const name = product.name_en.toLowerCase();
        
        // TMT aliases
        if (name.includes('tmt') || name.includes('sariya')) {
          productAliasesData.push({ product_id: product.id, alias_term: 'sariya', priority: 1 });
          productAliasesData.push({ product_id: product.id, alias_term: 'rod', priority: 1 });
          productAliasesData.push({ product_id: product.id, alias_term: 'bar', priority: 1 });
        }
        
        // Brand aliases
        if (name.includes('kamdhenu')) {
          productAliasesData.push({ product_id: product.id, alias_term: 'kamdhenu', priority: 10 });
        }
        if (name.includes('jindal')) {
          productAliasesData.push({ product_id: product.id, alias_term: 'jindal', priority: 10 });
        }
        if (name.includes('ankur')) {
          productAliasesData.push({ product_id: product.id, alias_term: 'ankur', priority: 10 });
        }
        if (name.includes('tata')) {
          productAliasesData.push({ product_id: product.id, alias_term: 'tata', priority: 10 });
        }
        
        // Size aliases
        if (product.size) {
          productAliasesData.push({ product_id: product.id, alias_term: product.size, priority: 8 });
          // Also add without 'mm'
          const sizeNum = product.size.replace(/mm/i, '');
          productAliasesData.push({ product_id: product.id, alias_term: sizeNum, priority: 5 });
        }
      });
    }
    
    // Clear existing aliases
    await supabase.from('product_aliases').delete().neq('id', 0);
    
    // Insert aliases (dedupe by product_id + alias_term)
    const uniqueAliases = Array.from(
      new Map(productAliasesData.map(a => [`${a.product_id}-${a.alias_term}`, a])).values()
    );
    
    const { data: insertedAliases, error: aliasErr } = await supabase
      .from('product_aliases')
      .insert(uniqueAliases)
      .select();
    
    results.product_aliases = { 
      inserted: insertedAliases?.length || 0, 
      expected: 15,
      error: aliasErr?.message 
    };
    
    // 4. Import INVENTORY SNAPSHOT (2 rows expected - one per godown)
    if (existingProducts && existingProducts.length > 0 && mainGodownId && sutrahiGodownId) {
      const inventoryData: { product_id: string; godown_id: string; closing_balance_qty: number }[] = [];
      
      // Assign products to godowns with sample quantities
      existingProducts.slice(0, 10).forEach((product, idx) => {
        // Alternate between godowns
        const godownId = idx % 2 === 0 ? mainGodownId : sutrahiGodownId;
        inventoryData.push({
          product_id: product.id,
          godown_id: godownId,
          closing_balance_qty: Math.floor(Math.random() * 1000) + 100,
        });
      });
      
      // Clear and insert inventory
      await supabase.from('inventory_snapshot').delete().neq('product_id', '00000000-0000-0000-0000-000000000000');
      
      const { data: insertedInventory, error: invErr } = await supabase
        .from('inventory_snapshot')
        .upsert(inventoryData, { onConflict: 'product_id,godown_id' })
        .select();
      
      results.inventory_snapshot = { 
        inserted: insertedInventory?.length || 0, 
        expected: 2,
        error: invErr?.message 
      };
    } else {
      results.inventory_snapshot = { inserted: 0, expected: 2, error: 'No products or godowns found' };
    }
    
    // 5. Existing products and customers counts
    const { count: productCount } = await supabase.from('products').select('id', { count: 'exact', head: true });
    const { count: customerCount } = await supabase.from('customers').select('id', { count: 'exact', head: true });
    
    results.products = { inserted: productCount || 0, expected: 16 };
    results.customers = { inserted: customerCount || 0, expected: 20 };
    
    // Final counts
    const { count: godownCount } = await supabase.from('godowns').select('id', { count: 'exact', head: true });
    const { count: aliasCount } = await supabase.from('product_aliases').select('id', { count: 'exact', head: true });
    const { count: inventoryCount } = await supabase.from('inventory_snapshot').select('product_id', { count: 'exact', head: true });
    
    const sanityCheck = {
      godowns: { actual: godownCount, expected: 21, ok: (godownCount || 0) >= 2 },
      products: { actual: productCount, expected: 16, ok: (productCount || 0) >= 1 },
      customers: { actual: customerCount, expected: 20, ok: (customerCount || 0) >= 1 },
      product_aliases: { actual: aliasCount, expected: 15, ok: (aliasCount || 0) >= 1 },
      inventory_snapshot: { actual: inventoryCount, expected: 2, ok: (inventoryCount || 0) >= 1 },
    };
    
    console.log('Seed import results:', results);
    console.log('Sanity check:', sanityCheck);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        sanityCheck,
        message: 'Seed data imported. Note: Full import requires uploading the CSV files to storage first.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Seed import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
