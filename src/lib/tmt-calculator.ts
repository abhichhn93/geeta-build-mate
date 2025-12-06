// TMT Bar Weight Calculator
// Uses standard formula: Weight (kg) = (d² × L) / 162
// Where d = diameter in mm, L = length in meters

// Standard TMT bar weights per meter for common sizes
export const TMT_WEIGHTS_PER_METER: Record<number, number> = {
  6: 0.222,   // 6mm
  8: 0.395,   // 8mm
  10: 0.617,  // 10mm
  12: 0.888,  // 12mm
  16: 1.58,   // 16mm
  20: 2.469,  // 20mm
  25: 3.858,  // 25mm
  32: 6.321,  // 32mm
};

// Standard lengths in meters
export const STANDARD_LENGTHS = [12, 10, 9, 6];

// Calculate weight using d²/162 formula
export function calculateTMTWeight(
  diameter: number,
  lengthMeters: number,
  pieces: number = 1
): number {
  const weightPerMeter = (diameter * diameter) / 162;
  return weightPerMeter * lengthMeters * pieces;
}

// Get weight per meter for a given diameter
export function getWeightPerMeter(diameter: number): number {
  // Use lookup table if available, otherwise calculate
  if (TMT_WEIGHTS_PER_METER[diameter]) {
    return TMT_WEIGHTS_PER_METER[diameter];
  }
  return (diameter * diameter) / 162;
}

// Calculate total pieces from bundle count
// Standard: 1 bundle of 8mm = ~10 pieces, etc.
export function getPiecesPerBundle(diameter: number): number {
  const bundleMap: Record<number, number> = {
    6: 15,
    8: 10,
    10: 7,
    12: 5,
    16: 3,
    20: 2,
    25: 2,
    32: 1,
  };
  return bundleMap[diameter] || 5;
}

// Calculate cost based on weight and price per kg
export function calculateCost(weight: number, pricePerKg: number): number {
  return weight * pricePerKg;
}

// Format weight for display
export function formatWeight(weight: number): string {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(2)} MT`;
  }
  return `${weight.toFixed(2)} kg`;
}

// Get available TMT diameters
export function getAvailableDiameters(): number[] {
  return Object.keys(TMT_WEIGHTS_PER_METER).map(Number).sort((a, b) => a - b);
}