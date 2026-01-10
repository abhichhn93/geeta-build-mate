import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for LLM fallback - strict JSON output
const SYSTEM_PROMPT = `You are a voice command parser for Geeta Traders, a building materials shop in India.
Parse the user's Hindi/English voice command and return ONLY valid JSON in this exact structure:

{
  "intent": "one of: CREATE_ESTIMATE, CREATE_ORDER, CHECK_STOCK, CHECK_RATE, UPDATE_RATE, ADD_STOCK_MANUAL, TRANSFER_STOCK, CHECK_LEDGER, ADD_PAYMENT, CALCULATE_WEIGHT, CALCULATE_PRICE, CANCEL_ACTION",
  "customer": {
    "name_hint": "customer name if mentioned",
    "phone_hint": "phone digits if mentioned"
  },
  "items": [
    {
      "raw_text": "original text for this item",
      "category": "tmt|cement|pipe|sheet|structural|wire|service",
      "brand": "Kamdhenu|Jindal|Ankur|TATA|Bangur|Mycem|etc",
      "size": "8mm|10mm|12mm|1.5x1.5|etc",
      "qty": 0,
      "uom": "PCS|KGS|BAG|BUNDLE|TON",
      "godown_hint": "main|sutrahi"
    }
  ],
  "financials": {
    "amount": 0,
    "mode": "Cash|Online|Cheque"
  },
  "needs_clarification": false,
  "clarification_reason": "reason if needs_clarification is true"
}

Product categories:
- tmt/sariya: TMT bars (sizes: 6mm, 8mm, 10mm, 12mm, 16mm, 20mm, 25mm)
- cement: Cement bags (brands: Bangur, Mycem, Dalmia, ACC)
- pipe: MS pipes (sizes like 1.5x1.5, 2x2, round/square)
- structural: Angles, channels, flats
- sheet: Tin sheets, roofing
- wire: Binding wire, welding rods

Godowns:
- main/calendar/shop/dukan = Main Location
- sutrahi/yard/godown/bahar = Sutrahi Godown

Return ONLY the JSON object. No explanations. No markdown.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - validate JWT and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No valid token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Now proceed with command parsing
    const { rawInput } = await req.json();

    if (!rawInput) {
      return new Response(
        JSON.stringify({ success: false, error: 'No input provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing command for admin user:', user.id, 'Input:', rawInput);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: rawInput }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI processing failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('LLM response received');

    // Parse JSON from response
    let parsedResult;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      parsedResult = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse LLM response');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to parse AI response'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, parsed: parsedResult, source: 'LLM_FALLBACK' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI parser error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred during processing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
