// Synonym & Alias mappings for regex parsing per spec v1.1.1

// Category keywords -> canonical category
export const CATEGORY_ALIASES: Record<string, string> = {
  // TMT
  'sariya': 'tmt', 'rod': 'tmt', 'bar': 'tmt', 'tmt': 'tmt', 'tor': 'tmt',
  'सरिया': 'tmt', 'रॉड': 'tmt', 'टीएमटी': 'tmt',
  // Cement
  'cement': 'cement', 'bori': 'cement', 'bag': 'cement', 'katta': 'cement',
  'सीमेंट': 'cement', 'बोरी': 'cement', 'कट्टा': 'cement',
  // Pipe
  'pipe': 'pipe', 'paip': 'pipe', 'tube': 'pipe', 'hollow': 'pipe',
  'पाइप': 'pipe', 'ट्यूब': 'pipe',
  // Sheet
  'chaddar': 'sheet', 'tin': 'sheet', 'sheet': 'sheet', 'profile': 'sheet', 'roofing': 'sheet',
  'चद्दर': 'sheet', 'टीन': 'sheet', 'शीट': 'sheet',
  // Structural
  'angle': 'structural', 'engle': 'structural', 'l-patti': 'structural', 
  'channel': 'structural', 'beam': 'structural', 'flat': 'structural', 
  'patti': 'structural', 'patta': 'structural',
  'एंगल': 'structural', 'चैनल': 'structural', 'पट्टी': 'structural',
  // Wire/Service
  'binding wire': 'wire', 'wire': 'wire', 'taar': 'wire', 
  'welding rod': 'wire', 'nut': 'wire', 'bolt': 'wire',
  'तार': 'wire', 'बाइंडिंग': 'wire',
  'ring': 'service', 'kanti': 'service',
};

// Brand keywords -> canonical brand name
export const BRAND_ALIASES: Record<string, string> = {
  // TMT brands
  'kamdhenu': 'Kamdhenu', 'nxt': 'Kamdhenu NXT', 'कामधेनु': 'Kamdhenu',
  'kay2': 'Kay 2', 'kay 2': 'Kay 2', 'के2': 'Kay 2',
  'ankur': 'Ankur', 'अंकुर': 'Ankur',
  'jindal': 'Jindal', 'panther': 'Jindal Panther', 'जिंदल': 'Jindal',
  'singhal': 'Singhal', 'सिंघल': 'Singhal',
  'radhe': 'Radhe', 'राधे': 'Radhe',
  'tata': 'TATA', 'tiscon': 'TATA Tiscon', 'टाटा': 'TATA',
  // Cement brands
  'bangur': 'Bangur', 'power': 'Bangur Power', 'megna': 'Bangur Megna', 'बांगड़': 'Bangur',
  'mycem': 'Mycem', 'माईसेम': 'Mycem',
  'dalmia': 'Dalmia', 'डालमिया': 'Dalmia',
  'acc': 'ACC', 'एसीसी': 'ACC',
  'ultratech': 'Ultratech', 'अल्ट्राटेक': 'Ultratech',
};

// Godown aliases -> canonical ID
export const GODOWN_ALIASES: Record<string, string> = {
  // Main Location (7738)
  'calendar': '7738', 'shop': '7738', 'dukan': '7738', 'counter': '7738',
  'main': '7738', 'city': '7738', 'tiraha': '7738',
  'दुकान': '7738', 'काउंटर': '7738', 'मेन': '7738',
  // Sutrahi Godown (7739)
  'sutrahi': '7739', 'yard': '7739', 'godown': '7739', 'bada godown': '7739',
  'site': '7739', 'bahar': '7739',
  'सुतरही': '7739', 'यार्ड': '7739', 'गोदाम': '7739', 'बाहर': '7739',
};

// Intent keywords
export const INTENT_KEYWORDS: Record<string, string[]> = {
  // Rate intents
  CHECK_RATE: ['rate kitna', 'rate kya', 'रेट कितना', 'रेट क्या', 'bhav', 'भाव', 'price check'],
  UPDATE_RATE: ['rate kar do', 'rate lagao', 'रेट करो', 'रेट लगाओ', 'set rate', 'change rate'],
  // Stock intents
  CHECK_STOCK: ['stock kitna', 'kitna hai', 'स्टॉक कितना', 'check stock', 'maal kitna', 'माल कितना'],
  ADD_STOCK_MANUAL: ['stock add', 'stock jodo', 'स्टॉक जोड़ो', 'maal add', 'माल जोड़ो', 'inward'],
  TRANSFER_STOCK: ['transfer', 'bhejo', 'भेजो', 'shift', 'move'],
  // Sales intents
  CREATE_ESTIMATE: ['estimate', 'bill banao', 'बिल बनाओ', 'quotation', 'कोटेशन'],
  CREATE_ORDER: ['order', 'book karo', 'बुक करो', 'ऑर्डर'],
  // Ledger intents
  CHECK_LEDGER: ['ledger', 'khata', 'खाता', 'hisab', 'हिसाब', 'balance'],
  ADD_PAYMENT: ['payment', 'jama', 'जमा', 'received', 'credit'],
  SHARE_LEDGER: ['share ledger', 'khata bhejo', 'खाता भेजो'],
  // Calculator intents
  CALCULATE_WEIGHT: ['weight', 'wajan', 'वजन', 'kitna kg', 'कितना किलो'],
  CALCULATE_PRICE: ['price calculate', 'kitna rupay', 'कितना रुपया', 'total'],
  // System
  CANCEL_ACTION: ['cancel', 'रद्द', 'clear', 'hatao', 'हटाओ'],
};

// UOM patterns (regex)
export const UOM_PATTERNS = {
  BAG: /\b(\d+)\s*(bori|bag|bags|katta|बोरी|कट्टा)\b/i,
  PCS: /\b(\d+)\s*(pc|pcs|piece|pieces|nos|length|len|पीस|टुकड़े)\b/i,
  BUNDLE: /\b(\d+)\s*(bndl|bundle|bundles|बंडल)\b/i,
  KGS: /\b(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|किलो)\b/i,
  TON: /\b(\d+(?:\.\d+)?)\s*(ton|mt|टन)\b/i,
};

// Size patterns (regex)
export const SIZE_PATTERNS = {
  TMT_MM: /\b(\d{1,2})\s*(mm|एमएम|मिमी)\b/i,
  PIPE_AXB: /\b(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)\b/,
  PIPE_SQ: /\b(\d+(?:\.\d+)?)\s*(sq|square|स्क्वायर)\b/i,
  PIPE_ROUND: /\b(\d+(?:\.\d+)?)\s*(rd|round|inch|इंच|gol|गोल)\b/i,
};

// Price patterns (regex)
export const PRICE_PATTERNS = [
  /(?:rate|रेट|price|भाव|daam|दाम)\s*(?:to|ko|=|:)?\s*(?:₹|rs|रुपये?)?\s*(\d+(?:\.\d+)?)/i,
  /(\d+(?:\.\d+)?)\s*(?:rupee|rupay|रुपये?|₹|rs)\s*(?:kar|karo|करो|लगाओ|lagao)/i,
  /(?:kar\s*do|karo|करो|कर\s*दो|lagao|लगाओ)\s*(\d+(?:\.\d+)?)/i,
  /(\d+(?:\.\d+)?)\s*(?:kar\s*do|karo|करो|कर\s*दो|lagao|लगाओ)/i,
];
