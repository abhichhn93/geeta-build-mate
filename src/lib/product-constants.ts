// ==============================================
// GEETA TRADERS - PRODUCT CATALOG CONSTANTS
// ==============================================

// Category slugs for identification
export const CATEGORY_SLUGS = {
  TMT: 'tmt',
  STRUCTURAL: 'structural',
  PIPES: 'pipes',
  CEMENT: 'cement',
  ROOFING: 'roofing',
  SOLAR: 'solar',
  HARDWARE: 'hardware',
  SERVICES: 'services',
} as const;

// Category name patterns for matching
export const CATEGORY_PATTERNS = {
  TMT: ['tmt', 'sariya'],
  STRUCTURAL: ['structural', 'angle', 'channel', 'flat', 'patti'],
  PIPES: ['pipe', 'tube'],
  CEMENT: ['cement'],
  ROOFING: ['sheet', 'roofing', 'hr', 'cr', 'profile', 'ac'],
  SOLAR: ['solar', 'gi structure', 'mounting'],
  HARDWARE: ['hardware', 'consumable', 'wire', 'binding', 'fastener', 'bolt', 'welding'],
  SERVICES: ['service', 'ring', 'stirrup'],
} as const;

// ==============================================
// TMT BAR SIZES (in mm)
// ==============================================
export const TMT_SIZES = ['6mm', '8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '32mm'];

// ==============================================
// STRUCTURAL STEEL SIZES
// ==============================================
export const STRUCTURAL_SIZES = {
  ANGLE: ['25x25mm', '30x30mm', '40x40mm', '50x50mm', '65x65mm', '75x75mm'],
  CHANNEL: ['75mm', '100mm', '125mm', '150mm'],
  FLAT: ['25mm', '32mm', '40mm', '50mm', '65mm', '75mm'],
  SQUARE_BAR: ['10mm', '12mm', '16mm', '20mm'],
  ROUND_BAR: ['10mm', '12mm', '16mm', '20mm', '25mm'],
  GATE_CHANNEL: ['2 inch', '2.5 inch', '3 inch'],
};

// ==============================================
// PIPE & TUBE SIZES
// ==============================================
export const PIPE_SIZES = {
  SQUARE: ['1x1 inch', '1.5x1.5 inch', '2x2 inch'],
  ROUND: ['1 inch', '1.5 inch', '2 inch'],
  RECTANGULAR: ['2x1 inch', '2.5x1.5 inch', '3x1.5 inch'],
};

// ==============================================
// CEMENT (unit: BAG)
// ==============================================
export const CEMENT_SIZES = ['50kg bag'];

// ==============================================
// ROOFING & SHEETS
// ==============================================
export const SHEET_TYPES = ['HR Sheet', 'CR Sheet', 'Profile Sheet', 'AC Sheet'];
export const SHEET_THICKNESSES = ['0.35mm', '0.40mm', '0.45mm', '0.50mm', '0.63mm'];

// ==============================================
// SOLAR & GI STRUCTURES
// ==============================================
export const SOLAR_COMPONENTS = ['Mounting Structure', 'Purlin', 'Bracket', 'Base Plate', 'Clamp'];
export const SOLAR_CONFIGS = ['Plain', 'Slotted'];

// ==============================================
// HARDWARE & CONSUMABLES
// ==============================================
export const HARDWARE_ITEMS = {
  WIRE: ['Binding Wire', 'Kati Wire'],
  WIRE_GAUGES: ['18 gauge', '20 gauge', '22 gauge'],
  WIRE_BUNDLES: ['5kg bundle', '10kg bundle', '25kg bundle'],
  FASTENERS: ['Nut Bolts', 'J Bolts', 'U Bolts'],
  WELDING: ['Welding Rod 2.5mm', 'Welding Rod 3.15mm', 'Welding Rod 4mm'],
};

// ==============================================
// STOCK STATUS
// ==============================================
export const STOCK_STATUS_OPTIONS = [
  { value: 'in_stock', labelEn: 'In Stock', labelHi: 'स्टॉक में' },
  { value: 'low_stock', labelEn: 'Low Stock', labelHi: 'कम स्टॉक' },
  { value: 'out_of_stock', labelEn: 'Out of Stock', labelHi: 'स्टॉक खत्म' },
];

// ==============================================
// UNITS
// ==============================================
export const UNITS = {
  KG: { en: 'KG', hi: 'किग्रा' },
  BAG: { en: 'BAG', hi: 'बैग' },
  PCS: { en: 'PCS', hi: 'पीस' },
  BUNDLE: { en: 'BUNDLE', hi: 'बंडल' },
};

// ==============================================
// HELPER: Get sizes for a category
// ==============================================
export function getSizesForCategory(categoryName: string): string[] {
  const name = categoryName.toLowerCase();
  
  // TMT Bars
  if (CATEGORY_PATTERNS.TMT.some(p => name.includes(p))) {
    return TMT_SIZES;
  }
  
  // Structural Steel
  if (CATEGORY_PATTERNS.STRUCTURAL.some(p => name.includes(p))) {
    return [
      ...STRUCTURAL_SIZES.ANGLE,
      ...STRUCTURAL_SIZES.CHANNEL,
      ...STRUCTURAL_SIZES.FLAT,
    ];
  }
  
  // Pipes & Tubes
  if (CATEGORY_PATTERNS.PIPES.some(p => name.includes(p))) {
    return [
      ...PIPE_SIZES.SQUARE,
      ...PIPE_SIZES.ROUND,
      ...PIPE_SIZES.RECTANGULAR,
    ];
  }
  
  // Cement
  if (CATEGORY_PATTERNS.CEMENT.some(p => name.includes(p))) {
    return CEMENT_SIZES;
  }
  
  // Roofing & Sheets
  if (CATEGORY_PATTERNS.ROOFING.some(p => name.includes(p))) {
    return [...SHEET_TYPES, ...SHEET_THICKNESSES];
  }
  
  // Solar & GI
  if (CATEGORY_PATTERNS.SOLAR.some(p => name.includes(p))) {
    return [...SOLAR_COMPONENTS, ...SOLAR_CONFIGS];
  }
  
  // Hardware
  if (CATEGORY_PATTERNS.HARDWARE.some(p => name.includes(p))) {
    return [
      ...HARDWARE_ITEMS.WIRE_GAUGES,
      ...HARDWARE_ITEMS.WIRE_BUNDLES,
    ];
  }
  
  // Default - return empty
  return [];
}

// ==============================================
// HELPER: Identify category type
// ==============================================
export function getCategoryType(categoryName: string): keyof typeof CATEGORY_PATTERNS | null {
  const name = categoryName.toLowerCase();
  
  for (const [key, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some(p => name.includes(p))) {
      return key as keyof typeof CATEGORY_PATTERNS;
    }
  }
  
  return null;
}

// ==============================================
// HELPER: Get unit for category
// ==============================================
export function getDefaultUnitForCategory(categoryName: string): string {
  const name = categoryName.toLowerCase();
  
  if (CATEGORY_PATTERNS.CEMENT.some(p => name.includes(p))) {
    return 'BAG';
  }
  
  if (CATEGORY_PATTERNS.SERVICES.some(p => name.includes(p))) {
    return 'PCS';
  }
  
  // Default to KG for steel products
  return 'KG';
}
