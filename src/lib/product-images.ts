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
export const PRODUCT_IMAGES: Record<string, string> = {
  // TMT Bars
  'tmt': tmtBar,
  'sariya': tmtBar,
  'सरिया': tmtBar,
  
  // Structural Steel
  'angle': msAngle,
  'एंगल': msAngle,
  'channel': msChannel,
  'चैनल': msChannel,
  'flat': msFlatPatti,
  'patti': msFlatPatti,
  'पट्टी': msFlatPatti,
  'square bar': msSquareBar,
  'स्क्वायर बार': msSquareBar,
  
  // Pipes & Tubes
  'round pipe': msRoundPipe,
  'गोल पाइप': msRoundPipe,
  'square pipe': msSquarePipe,
  'स्क्वायर पाइप': msSquarePipe,
  'gi tube': giSquareTube,
  'gi square': giSquareTube,
  'जी.आई. ट्यूब': giSquareTube,
  
  // Cement
  'cement': cementBag,
  'सीमेंट': cementBag,
  'bangur': cementBag,
  'mycem': cementBag,
  'बांगुर': cementBag,
  'मायसेम': cementBag,
  
  // Sheets & Roofing
  'hr sheet': hrSheet,
  'hr शीट': hrSheet,
  'cr sheet': crSheet,
  'cr शीट': crSheet,
  'colour': colourProfileSheet,
  'color': colourProfileSheet,
  'profile': colourProfileSheet,
  'कलर': colourProfileSheet,
  'ac sheet': acSheet,
  'एसी शीट': acSheet,
  'cement sheet': cementSheet,
  'सीमेंट शीट': cementSheet,
  
  // Solar & GI Structures
  'c channel': giCChannel,
  'gi c': giCChannel,
  'सी चैनल': giCChannel,
  'solar rail': solarMountingRail,
  'mounting rail': solarMountingRail,
  'सोलर रेल': solarMountingRail,
  'clamp': clampBracket,
  'bracket': clampBracket,
  'क्लैंप': clampBracket,
  
  // Hardware & Consumables
  'binding wire': bindingWire,
  'बाइंडिंग वायर': bindingWire,
  'kati': katiWire,
  'कटी': katiWire,
  'welding': weldingRod,
  'वेल्डिंग': weldingRod,
  'nut': nutBolt,
  'bolt': nutBolt,
  'नट': nutBolt,
  'बोल्ट': nutBolt,
  'jali': jali,
  'जाली': jali,
  'spring': spring,
  'स्प्रिंग': spring,
};

// Get image for a product by matching name keywords
export function getProductImage(productName: string): string | null {
  const lowerName = productName.toLowerCase();
  
  for (const [keyword, image] of Object.entries(PRODUCT_IMAGES)) {
    if (lowerName.includes(keyword.toLowerCase())) {
      return image;
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
