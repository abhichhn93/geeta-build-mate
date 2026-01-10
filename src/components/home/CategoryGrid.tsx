import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  CircleDot, 
  Package, 
  Triangle, 
  Cylinder, 
  Layers, 
  Sun, 
  Wrench, 
  Calculator 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CategoryItem {
  id: string;
  nameEn: string;
  nameHi: string;
  icon: React.ReactNode;
  link: string;
  highlight?: boolean;
  badge?: { en: string; hi: string };
}

// Updated with new category UUIDs
const categories: CategoryItem[] = [
  {
    id: 'tmt',
    nameEn: 'Sariya',
    nameHi: 'सरिया',
    icon: <CircleDot className="h-5 w-5" />,
    link: '/products?category=11111111-1111-1111-1111-111111111101',
  },
  {
    id: 'cement',
    nameEn: 'Cement',
    nameHi: 'सीमेंट',
    icon: <Package className="h-5 w-5" />,
    link: '/products?category=11111111-1111-1111-1111-111111111102',
  },
  {
    id: 'structural',
    nameEn: 'Angle/Patti',
    nameHi: 'एंगल/पट्टी',
    icon: <Triangle className="h-5 w-5" />,
    link: '/products?category=11111111-1111-1111-1111-111111111103',
  },
  {
    id: 'pipe',
    nameEn: 'Pipe',
    nameHi: 'पाइप',
    icon: <Cylinder className="h-5 w-5" />,
    link: '/products?category=11111111-1111-1111-1111-111111111104',
  },
  {
    id: 'sheet',
    nameEn: 'Sheet',
    nameHi: 'शीट',
    icon: <Layers className="h-5 w-5" />,
    link: '/products?category=11111111-1111-1111-1111-111111111105',
  },
  {
    id: 'solar',
    nameEn: 'Solar/GI',
    nameHi: 'सोलर/जीआई',
    icon: <Sun className="h-5 w-5" />,
    link: '/products?category=11111111-1111-1111-1111-111111111106',
  },
  {
    id: 'hardware',
    nameEn: 'Hardware',
    nameHi: 'हार्डवेयर',
    icon: <Wrench className="h-5 w-5" />,
    link: '/products?category=11111111-1111-1111-1111-111111111107',
  },
  {
    id: 'calculator',
    nameEn: 'TMT Calc',
    nameHi: 'वजन कैलक',
    icon: <Calculator className="h-5 w-5" />,
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
          className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition-all ${
            category.highlight
              ? 'border-2 border-primary/30 bg-primary/5 hover:border-primary hover:shadow-md'
              : 'border bg-card hover:border-primary/50 hover:shadow-sm'
          }`}
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            category.highlight
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}>
            {category.icon}
          </div>
          <span className="text-[10px] font-medium leading-tight">
            {language === 'en' ? category.nameEn : category.nameHi}
          </span>
          {category.badge && (
            <Badge variant="secondary" className="text-[8px] px-1 py-0">
              {language === 'en' ? category.badge.en : category.badge.hi}
            </Badge>
          )}
        </Link>
      ))}
    </div>
  );
}
