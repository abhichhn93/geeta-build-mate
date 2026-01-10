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
    icon: <Calculator className="h-8 w-8" />,
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
          className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all active:scale-95 ${
            category.highlight
              ? 'border-2 border-primary bg-primary/10 shadow-md hover:shadow-lg'
              : 'border border-border bg-card shadow-sm hover:border-primary/50 hover:shadow-md'
          }`}
        >
          <div className={`flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden ${
            category.highlight
              ? 'bg-primary text-primary-foreground'
              : 'bg-gradient-to-br from-muted to-muted/50'
          }`}>
            {category.image ? (
              <img 
                src={category.image} 
                alt={category.nameEn}
                className="h-14 w-14 object-contain drop-shadow-sm"
              />
            ) : (
              category.icon
            )}
          </div>
          <span className="text-sm font-semibold leading-tight text-foreground">
            {language === 'en' ? category.nameEn : category.nameHi}
          </span>
          {category.badge && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 -mt-1">
              {language === 'en' ? category.badge.en : category.badge.hi}
            </Badge>
          )}
        </Link>
      ))}
    </div>
  );
}
