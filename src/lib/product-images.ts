// Geeta Traders Product Image Mapping
// Maps product types to their images

// TMT & Steel
import tmtBar from '@/assets/products/tmt_bar.png';

// Structural Steel
import msAngle from '@/assets/products/ms_angle.png';
import msChannel from '@/assets/products/ms_channel.png';
// Note: Using ms_angle for MS Flat and MS Square Bar as placeholder
const msFlatPatti = msAngle;
const msSquareBar = msAngle;

// Pipes & Tubes
import msRoundPipe from '@/assets/products/ms_round_pipe.png';
import msSquarePipe from '@/assets/products/ms_square_pipe.png';
import giSquareTube from '@/assets/products/gi_square_tube.png';

// Cement
import cementBag from '@/assets/products/cement_bag.png';

// Sheets & Roofing
import hrSheet from '@/assets/products/hr_sheet.png';
import crSheet from '@/assets/products/cr_sheet.png';
import colourProfileSheet from '@/assets/products/colour_profile_sheet.png';
import acSheet from '@/assets/products/ac_sheet.png';
import cementSheet from '@/assets/products/cement_sheet.png';

// Solar & GI Structures
import giCChannel from '@/assets/products/gi_c_channel.png';
import solarMountingRail from '@/assets/products/solar_mounting_rail.png';
import clampBracket from '@/assets/products/clamp_bracket.png';

// Hardware & Consumables
import bindingWire from '@/assets/products/binding_wire.png';
import katiWire from '@/assets/products/kati_wire.png';
import weldingRod from '@/assets/products/welding_rod.png';
import nutBolt from '@/assets/products/nut_bolt.png';
import jali from '@/assets/products/jali.png';
import spring from '@/assets/products/spring.png';

// Product image map - matches product name keywords to images
// Order matters - more specific matches first
export const PRODUCT_IMAGE_RULES: Array<{ keywords: string[], image: string }> = [
  // TMT Bars - matches "TMT", "Sariya", "सरिया"
  { keywords: ['tmt', 'sariya', 'सरिया', 'tiscon', 'टिस्कॉन'], image: tmtBar },
  
  // Structural Steel
  { keywords: ['ms channel', 'एमएस चैनल'], image: msChannel },
  { keywords: ['ms angle', 'एमएस एंगल', 'angle'], image: msAngle },
  { keywords: ['ms flat', 'patti', 'पट्टी', 'flat'], image: msFlatPatti },
  { keywords: ['square bar', 'स्क्वायर बार'], image: msSquareBar },
  
  // Pipes & Tubes
  { keywords: ['round pipe', 'गोल पाइप', 'ms round'], image: msRoundPipe },
  { keywords: ['square pipe', 'स्क्वायर पाइप', 'ms square pipe'], image: msSquarePipe },
  { keywords: ['gi tube', 'gi square', 'जी.आई. ट्यूब', 'gi square tube'], image: giSquareTube },
  
  // Cement
  { keywords: ['cement', 'सीमेंट', 'acc', 'ultratech', 'ambuja', 'bangur', 'mycem', 'एसीसी', 'अल्ट्राटेक', 'अंबुजा'], image: cementBag },
  
  // Sheets & Roofing
  { keywords: ['hr sheet', 'hr शीट'], image: hrSheet },
  { keywords: ['cr sheet', 'cr शीट'], image: crSheet },
  { keywords: ['colour', 'color', 'profile sheet', 'कलर'], image: colourProfileSheet },
  { keywords: ['ac sheet', 'एसी शीट'], image: acSheet },
  { keywords: ['cement sheet', 'सीमेंट शीट'], image: cementSheet },
  
  // Solar & GI Structures
  { keywords: ['c channel', 'gi c', 'सी चैनल'], image: giCChannel },
  { keywords: ['solar rail', 'mounting rail', 'सोलर'], image: solarMountingRail },
  { keywords: ['clamp', 'bracket', 'क्लैंप'], image: clampBracket },
  
  // Hardware & Consumables
  { keywords: ['binding wire', 'बाइंडिंग वायर', 'wiron', 'वायरॉन'], image: bindingWire },
  { keywords: ['kati', 'कटी'], image: katiWire },
  { keywords: ['welding', 'वेल्डिंग'], image: weldingRod },
  { keywords: ['nut', 'bolt', 'नट', 'बोल्ट'], image: nutBolt },
  { keywords: ['jali', 'जाली', 'mesh'], image: jali },
  { keywords: ['spring', 'स्प्रिंग', 'stirrup', 'स्टिरप'], image: spring },
];

// Legacy map for backward compatibility
export const PRODUCT_IMAGES: Record<string, string> = PRODUCT_IMAGE_RULES.reduce((acc, rule) => {
  rule.keywords.forEach(keyword => {
    acc[keyword] = rule.image;
  });
  return acc;
}, {} as Record<string, string>);

// Get image for a product by matching name keywords
export function getProductImage(productName: string): string | null {
  const lowerName = productName.toLowerCase();
  
  // Check each rule in order (more specific first)
  for (const rule of PRODUCT_IMAGE_RULES) {
    for (const keyword of rule.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return rule.image;
      }
    }
  }
  
  return null;
}

// Category slider images
export const CATEGORY_SLIDER_IMAGES = {
  cement: cementBag,
  tmt: tmtBar,
  structural: msAngle,
  sheet: colourProfileSheet,
  pipe: msRoundPipe,
  solar: solarMountingRail,
  hardware: bindingWire,
};

// Export individual images for direct use
export {
  tmtBar,
  msAngle,
  msChannel,
  msFlatPatti,
  msSquareBar,
  msRoundPipe,
  msSquarePipe,
  giSquareTube,
  cementBag,
  hrSheet,
  crSheet,
  colourProfileSheet,
  acSheet,
  cementSheet,
  giCChannel,
  solarMountingRail,
  clampBracket,
  bindingWire,
  katiWire,
  weldingRod,
  nutBolt,
  jali,
  spring,
};
