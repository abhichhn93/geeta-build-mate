// Voice recognition utilities using Web Speech API
// Supports Hindi (hi-IN) and English (en-IN)

export interface VoiceCommand {
  type: 'update_rate' | 'filter_category' | 'add_item' | 'unknown';
  brand?: string;
  category?: string;
  size?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  rawText: string;
}

// Common brand name mappings (Hindi variations)
const BRAND_MAPPINGS: Record<string, string> = {
  'kamdhenu': 'Kamdhenu',
  'कामधेनु': 'Kamdhenu',
  'jsw': 'JSW',
  'जेएसडब्ल्यू': 'JSW',
  'jindal': 'Jindal',
  'जिंदल': 'Jindal',
  'tata': 'Tata Tiscon',
  'टाटा': 'Tata Tiscon',
  'tiscon': 'Tata Tiscon',
  'टिस्कन': 'Tata Tiscon',
  'acc': 'ACC',
  'एसीसी': 'ACC',
  'ambuja': 'Ambuja',
  'अंबुजा': 'Ambuja',
  'ultratech': 'UltraTech',
  'अल्ट्राटेक': 'UltraTech',
  'shree': 'Shree',
  'श्री': 'Shree',
  'birla': 'Birla',
  'बिरला': 'Birla',
};

// Category mappings
const CATEGORY_MAPPINGS: Record<string, string> = {
  'sariya': 'Sariya',
  'सरिया': 'Sariya',
  'cement': 'Cement',
  'सीमेंट': 'Cement',
  'wire': 'Wire',
  'तार': 'Wire',
  'binding': 'Wire',
  'बाइंडिंग': 'Wire',
  'angle': 'Angles',
  'एंगल': 'Angles',
  'channel': 'Channels',
  'चैनल': 'Channels',
  'stirrup': 'Stirrups',
  'स्टिरप': 'Stirrups',
  'fastener': 'Fasteners',
  'फास्टनर': 'Fasteners',
};

// Parse voice command text
export function parseVoiceCommand(text: string): VoiceCommand {
  const lowerText = text.toLowerCase();
  
  // Detect brand
  let detectedBrand: string | undefined;
  for (const [key, value] of Object.entries(BRAND_MAPPINGS)) {
    if (lowerText.includes(key)) {
      detectedBrand = value;
      break;
    }
  }

  // Detect category
  let detectedCategory: string | undefined;
  for (const [key, value] of Object.entries(CATEGORY_MAPPINGS)) {
    if (lowerText.includes(key)) {
      detectedCategory = value;
      break;
    }
  }

  // Detect size (mm patterns)
  const sizeMatch = text.match(/(\d+)\s*(?:mm|एमएम|मिमी)/i);
  const detectedSize = sizeMatch ? `${sizeMatch[1]}mm` : undefined;

  // Detect price
  const pricePatterns = [
    /(?:rate|रेट|price|भाव|दाम)\s*(?:to|को|=|:)?\s*(?:₹|rs|रुपये?)?\s*(\d+)/i,
    /(\d+)\s*(?:rupee|रुपये?|₹|rs)/i,
    /(?:kar\s*do|करो|कर\s*दो)\s*(\d+)/i,
    /(\d+)\s*(?:kar\s*do|करो|कर\s*दो)/i,
  ];
  
  let detectedPrice: number | undefined;
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match) {
      detectedPrice = parseInt(match[1], 10);
      break;
    }
  }

  // Detect quantity
  const quantityPatterns = [
    /(\d+)\s*(?:bori|बोरी|bag|bags)/i,
    /(\d+)\s*(?:kg|किलो|kilo)/i,
    /(\d+)\s*(?:piece|pieces|पीस|टुकड़े)/i,
    /(\d+)\s*(?:bundle|बंडल)/i,
  ];

  let detectedQuantity: number | undefined;
  let detectedUnit: string | undefined;
  for (const pattern of quantityPatterns) {
    const match = text.match(pattern);
    if (match) {
      detectedQuantity = parseInt(match[1], 10);
      if (/bori|बोरी|bag/i.test(match[0])) detectedUnit = 'bag';
      else if (/kg|किलो|kilo/i.test(match[0])) detectedUnit = 'kg';
      else if (/piece|पीस|टुकड़े/i.test(match[0])) detectedUnit = 'piece';
      else if (/bundle|बंडल/i.test(match[0])) detectedUnit = 'bundle';
      break;
    }
  }

  // Determine command type
  let commandType: VoiceCommand['type'] = 'unknown';
  
  // Check for rate update
  if (
    (lowerText.includes('rate') || lowerText.includes('रेट') || 
     lowerText.includes('price') || lowerText.includes('भाव') ||
     lowerText.includes('kar do') || lowerText.includes('करो')) &&
    detectedPrice
  ) {
    commandType = 'update_rate';
  }
  // Check for category filter
  else if (
    (lowerText.includes('dikhao') || lowerText.includes('दिखाओ') ||
     lowerText.includes('show') || lowerText.includes('filter') ||
     lowerText.includes('sirf') || lowerText.includes('सिर्फ')) &&
    detectedCategory
  ) {
    commandType = 'filter_category';
  }
  // Check for add item
  else if (
    (lowerText.includes('add') || lowerText.includes('जोड़ो') ||
     lowerText.includes('डालो') || lowerText.includes('karo')) &&
    detectedQuantity
  ) {
    commandType = 'add_item';
  }

  return {
    type: commandType,
    brand: detectedBrand,
    category: detectedCategory,
    size: detectedSize,
    price: detectedPrice,
    quantity: detectedQuantity,
    unit: detectedUnit,
    rawText: text,
  };
}

// Speech Recognition type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Check if Web Speech API is supported
export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

// Create speech recognition instance
export function createSpeechRecognition(
  onResult: (text: string) => void,
  onError: (error: string) => void,
  onEnd?: () => void,
  lang: string = 'hi-IN'
): SpeechRecognitionInstance | null {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser');
    return null;
  }

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionClass) {
    onError('Speech recognition is not available');
    return null;
  }

  const recognition = new SpeechRecognitionClass();

  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    onError(event.error);
  };

  if (onEnd) {
    recognition.onend = onEnd;
  }

  return recognition;
}