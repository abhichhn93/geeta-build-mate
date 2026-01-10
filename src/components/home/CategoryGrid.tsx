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
    icon: <Calculator className="h-6 w-6" />,
    link: '/calculator',
    highlight: true,
    badge: { en: 'Tool', hi: 'टूल' },
  },
];

export function CategoryGrid() {
  const { language } = useLanguage();

  return (
    <div className="grid grid-cols-4 gap-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={category.link}
          className={`flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-all ${
            category.highlight
              ? 'border-2 border-primary/30 bg-primary/5 hover:border-primary hover:shadow-md'
              : 'border bg-card hover:border-primary/50 hover:shadow-sm'
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden ${
            category.highlight
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50'
          }`}>
            {category.image ? (
              <img 
                src={category.image} 
                alt={category.nameEn}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              category.icon
            )}
          </div>
          <span className="text-xs font-medium leading-tight">
            {language === 'en' ? category.nameEn : category.nameHi}
          </span>
          {category.badge && (
            <Badge variant="secondary" className="text-[8px] px-1.5 py-0">
              {language === 'en' ? category.badge.en : category.badge.hi}
            </Badge>
          )}
        </Link>
      ))}
    </div>
  );
}
