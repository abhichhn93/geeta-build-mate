import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Import product images for categories
import tmtBarImg from '@/assets/products/tmt_bar.png';
import cementBagImg from '@/assets/products/cement_bag.png';
import msAngleImg from '@/assets/products/ms_angle.png';
import msRoundPipeImg from '@/assets/products/ms_round_pipe.png';
import colourProfileSheetImg from '@/assets/products/colour_profile_sheet.png';
import solarMountingRailImg from '@/assets/products/solar_mounting_rail.png';
import nutBoltImg from '@/assets/products/nut_bolt.png';

interface CategoryItem {
  id: string;
  nameEn: string;
  nameHi: string;
  image?: string;
  icon?: React.ReactNode;
  link: string;
  highlight?: boolean;
  badge?: { en: string; hi: string };
}

const categories: CategoryItem[] = [
  {
    id: 'tmt',
    nameEn: 'Sariya',
    nameHi: 'सरिया',
    image: tmtBarImg,
    link: '/products?category=11111111-1111-1111-1111-111111111101',
  },
  {
    id: 'cement',
    nameEn: 'Cement',
    nameHi: 'सीमेंट',
    image: cementBagImg,
    link: '/products?category=11111111-1111-1111-1111-111111111102',
  },
  {
    id: 'structural',
    nameEn: 'Angle/Patti',
    nameHi: 'एंगल/पट्टी',
    image: msAngleImg,
    link: '/products?category=11111111-1111-1111-1111-111111111103',
  },
  {
    id: 'pipe',
    nameEn: 'Pipe',
    nameHi: 'पाइप',
    image: msRoundPipeImg,
    link: '/products?category=11111111-1111-1111-1111-111111111104',
  },
  {
    id: 'sheet',
    nameEn: 'Sheet',
    nameHi: 'शीट',
    image: colourProfileSheetImg,
    link: '/products?category=11111111-1111-1111-1111-111111111105',
  },
  {
    id: 'solar',
    nameEn: 'Solar/GI',
    nameHi: 'सोलर/जीआई',
    image: solarMountingRailImg,
    link: '/products?category=11111111-1111-1111-1111-111111111106',
  },
  {
    id: 'hardware',
    nameEn: 'Hardware',
    nameHi: 'हार्डवेयर',
    image: nutBoltImg,
    link: '/products?category=11111111-1111-1111-1111-111111111107',
  },
  {
    id: 'calculator',
    nameEn: 'TMT Calc',
    nameHi: 'वजन कैलक',
    icon: <Calculator className="h-10 w-10 text-primary" />,
    link: '/calculator',
    highlight: true,
    badge: { en: 'Tool', hi: 'टूल' },
  },
];

export function CategoryGrid() {
  const { language } = useLanguage();

  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={category.link}
          className="group flex flex-col items-center gap-1.5 text-center transition-all duration-200 active:scale-95"
        >
          {/* Image Container - Clean square, no inner box */}
          <div className={`flex h-[72px] w-[72px] items-center justify-center rounded-2xl overflow-hidden transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg ${
            category.highlight
              ? 'bg-primary/15 ring-2 ring-primary/30'
              : 'bg-white shadow-md dark:bg-slate-800'
          }`}>
            {category.image ? (
              <img 
                src={category.image} 
                alt={category.nameEn}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              category.icon
            )}
          </div>
          
          {/* Label - Outside the square */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-foreground leading-tight">
              {language === 'en' ? category.nameEn : category.nameHi}
            </span>
            {category.badge && (
              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 mt-0.5">
                {language === 'en' ? category.badge.en : category.badge.hi}
              </Badge>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
