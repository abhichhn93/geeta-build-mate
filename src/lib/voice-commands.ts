// Enhanced voice command parsing with multi-command support
// Supports: rate update, rate query, payment reminder

import { supabase } from '@/integrations/supabase/client';

export interface ParsedCommand {
  type: 'update_rate' | 'query_rate' | 'payment_reminder' | 'unknown';
  brand?: string;
  category?: string;
  size?: string;
  price?: number;
  customerName?: string;
  amount?: number;
  rawClause: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  messageHi: string;
  data?: any;
  needsSelection?: boolean;
  options?: any[];
}

// Brand name mappings (Hindi/English variations)
const BRAND_MAPPINGS: Record<string, string> = {
  'kamdhenu': 'Kamdhenu',
  'कामधेनु': 'Kamdhenu',
  'jindal': 'Jindal',
  'जिंदल': 'Jindal',
  'tata': 'TATA Tiscon',
  'टाटा': 'TATA Tiscon',
  'tiscon': 'TATA Tiscon',
  'टिस्कन': 'TATA Tiscon',
  'jsw': 'JSW',
  'जेएसडब्ल्यू': 'JSW',
  'acc': 'ACC',
  'एसीसी': 'ACC',
  'ambuja': 'Ambuja',
  'अंबुजा': 'Ambuja',
  'ultratech': 'Ultratech',
  'अल्ट्राटेक': 'Ultratech',
  'birla': 'Birla',
  'बिरला': 'Birla',
  'shree': 'Shree',
  'श्री': 'Shree',
};

// Regex patterns for different commands
const RATE_UPDATE_PATTERN = /(?<brand>[a-zA-Z\u0900-\u097F]+)\s*(?<size>\d+\s*mm)?\s*(cement|सीमेंट)?\s*(ka|ke|का|के)\s*rate\s*(?<price>\d+)\s*(kar\s*do|karo|करो|कर\s*दो|set|change)?/i;

const RATE_QUERY_PATTERN = /(?<brand>[a-zA-Z\u0900-\u097F]+)\s*(?<size>\d+\s*mm)?\s*(cement|सीमेंट)?\s*(ka|ke|का|के)\s*rate\s*(kitna|कितना|kya|क्या)\s*(hai|है|h)?/i;

const PAYMENT_REMINDER_PATTERN = /(?<name>[a-zA-Z\u0900-\u097F\s]+)\s*(ko|को)\s*(?<amount>\d+)?\s*(ka|का)?\s*payment\s*reminder\s*(bhej|भेज|send)?\s*(do|दो)?/i;

// Parse a single command clause
export function parseCommandClause(clause: string): ParsedCommand {
  const text = clause.trim().toLowerCase();
  
  // Try rate update pattern
  const updateMatch = text.match(RATE_UPDATE_PATTERN);
  if (updateMatch?.groups) {
    const brandKey = updateMatch.groups.brand?.toLowerCase();
    const isCement = text.includes('cement') || text.includes('सीमेंट');
    const sizeRaw = updateMatch.groups.size?.replace(/\s+/g, '');
    
    return {
      type: 'update_rate',
      brand: BRAND_MAPPINGS[brandKey] || updateMatch.groups.brand,
      category: isCement ? 'cement' : 'sariya',
      size: sizeRaw ? sizeRaw : undefined,
      price: parseInt(updateMatch.groups.price, 10),
      rawClause: clause,
    };
  }
  
  // Try rate query pattern
  const queryMatch = text.match(RATE_QUERY_PATTERN);
  if (queryMatch?.groups) {
    const brandKey = queryMatch.groups.brand?.toLowerCase();
    const isCement = text.includes('cement') || text.includes('सीमेंट');
    const sizeRaw = queryMatch.groups.size?.replace(/\s+/g, '');
    
    return {
      type: 'query_rate',
      brand: BRAND_MAPPINGS[brandKey] || queryMatch.groups.brand,
      category: isCement ? 'cement' : 'sariya',
      size: sizeRaw ? sizeRaw : undefined,
      rawClause: clause,
    };
  }
  
  // Try payment reminder pattern
  const reminderMatch = text.match(PAYMENT_REMINDER_PATTERN);
  if (reminderMatch?.groups) {
    return {
      type: 'payment_reminder',
      customerName: reminderMatch.groups.name?.trim(),
      amount: reminderMatch.groups.amount ? parseInt(reminderMatch.groups.amount, 10) : undefined,
      rawClause: clause,
    };
  }
  
  return { type: 'unknown', rawClause: clause };
}

// Split transcript by "aur" for multi-command support
export function parseMultiCommand(transcript: string): ParsedCommand[] {
  const clauses = transcript.split(/\s+aur\s+|\s+और\s+/i);
  return clauses.map(clause => parseCommandClause(clause));
}

// Execute rate update command
export async function executeRateUpdate(command: ParsedCommand): Promise<CommandResult> {
  if (!command.brand || !command.price) {
    return {
      success: false,
      message: 'Missing brand or price',
      messageHi: 'ब्रांड या कीमत नहीं मिली',
    };
  }

  const today = new Date().toISOString().split('T')[0];
  
  // Find matching rate
  let query = supabase
    .from('daily_rates')
    .select('*')
    .eq('rate_date', today)
    .ilike('brand', `%${command.brand}%`)
    .eq('category', command.category || 'sariya');
  
  if (command.size) {
    query = query.ilike('size', `%${command.size.replace('mm', '')}%`);
  }
  
  const { data: rates, error } = await query;
  
  if (error) {
    return {
      success: false,
      message: `Database error: ${error.message}`,
      messageHi: `डेटाबेस त्रुटि: ${error.message}`,
    };
  }
  
  if (!rates || rates.length === 0) {
    // No existing rate, insert new one
    const { error: insertError } = await supabase
      .from('daily_rates')
      .insert({
        category: command.category || 'sariya',
        brand: command.brand,
        size: command.size || null,
        price: command.price,
        unit: command.category === 'cement' ? 'bag' : 'kg',
        rate_date: today,
      });
    
    if (insertError) {
      return {
        success: false,
        message: `Insert failed: ${insertError.message}`,
        messageHi: `रेट जोड़ने में त्रुटि`,
      };
    }
    
    return {
      success: true,
      message: `New rate added: ${command.brand} ${command.size || ''} → ₹${command.price}`,
      messageHi: `नया रेट जोड़ा: ${command.brand} ${command.size || ''} → ₹${command.price}`,
    };
  }
  
  if (rates.length === 1) {
    // Exactly one match, update it
    const { error: updateError } = await supabase
      .from('daily_rates')
      .update({ price: command.price, updated_at: new Date().toISOString() })
      .eq('id', rates[0].id);
    
    if (updateError) {
      return {
        success: false,
        message: `Update failed: ${updateError.message}`,
        messageHi: `अपडेट में त्रुटि`,
      };
    }
    
    return {
      success: true,
      message: `Rate updated: ${rates[0].brand} ${rates[0].size || ''} → ₹${command.price}`,
      messageHi: `रेट अपडेट: ${rates[0].brand} ${rates[0].size || ''} → ₹${command.price}`,
    };
  }
  
  // Multiple matches, need user selection
  return {
    success: false,
    message: `Multiple products found. Please select one.`,
    messageHi: `कई प्रोडक्ट मिले। कृपया एक चुनें।`,
    needsSelection: true,
    options: rates,
  };
}

// Execute rate query command
export async function executeRateQuery(command: ParsedCommand): Promise<CommandResult> {
  if (!command.brand) {
    return {
      success: false,
      message: 'Brand not recognized',
      messageHi: 'ब्रांड नहीं पहचाना',
    };
  }

  const today = new Date().toISOString().split('T')[0];
  
  let query = supabase
    .from('daily_rates')
    .select('*')
    .eq('rate_date', today)
    .ilike('brand', `%${command.brand}%`)
    .eq('category', command.category || 'sariya');
  
  if (command.size) {
    query = query.ilike('size', `%${command.size.replace('mm', '')}%`);
  }
  
  const { data: rates, error } = await query;
  
  if (error || !rates || rates.length === 0) {
    return {
      success: false,
      message: `No rate found for ${command.brand}`,
      messageHi: `${command.brand} का रेट नहीं मिला`,
    };
  }
  
  if (rates.length === 1) {
    const rate = rates[0];
    return {
      success: true,
      message: `${rate.brand} ${rate.size || ''}: ₹${rate.price} per ${rate.unit}`,
      messageHi: `${rate.brand} ${rate.size || ''}: ₹${rate.price} प्रति ${rate.unit}`,
      data: rate,
    };
  }
  
  // Multiple rates found
  const rateList = rates.map(r => `${r.brand} ${r.size || ''}: ₹${r.price}/${r.unit}`).join(', ');
  return {
    success: true,
    message: `Rates: ${rateList}`,
    messageHi: `रेट: ${rateList}`,
    data: rates,
  };
}

// Execute payment reminder command
export async function executePaymentReminder(command: ParsedCommand): Promise<CommandResult> {
  if (!command.customerName) {
    return {
      success: false,
      message: 'Customer name not recognized',
      messageHi: 'ग्राहक का नाम नहीं पहचाना',
    };
  }

  // Search for customer
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', `%${command.customerName}%`);
  
  if (error || !customers || customers.length === 0) {
    return {
      success: false,
      message: `No customer found with name "${command.customerName}"`,
      messageHi: `"${command.customerName}" नाम का कोई ग्राहक नहीं मिला`,
    };
  }
  
  if (customers.length > 1) {
    return {
      success: false,
      message: `Multiple customers found. Please select one.`,
      messageHi: `कई ग्राहक मिले। कृपया एक चुनें।`,
      needsSelection: true,
      options: customers,
    };
  }
  
  const customer = customers[0];
  const amount = command.amount || customer.current_balance || 0;
  
  if (!customer.phone) {
    return {
      success: false,
      message: `No phone number for ${customer.name}`,
      messageHi: `${customer.name} का फोन नंबर नहीं है`,
    };
  }
  
  // Build WhatsApp message
  const message = `Geeta Traders – Payment Reminder

Namaste ${customer.name} ji,
${amount > 0 ? `Aapka ₹${amount.toLocaleString('en-IN')} ka payment abhi baki hai.` : 'Aapka payment reminder.'}
Kripya jaldi se jama kar dein.

– Geeta Traders, Mohammadabad Gohna`;

  const phone = customer.phone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
  
  return {
    success: true,
    message: `Opening WhatsApp for ${customer.name}`,
    messageHi: `${customer.name} के लिए WhatsApp खोल रहे हैं`,
    data: { customer, waUrl },
  };
}
