import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  CircleDot, 
  Box, 
  Triangle, 
  Cylinder, 
  LayoutGrid, 
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

const categories: CategoryItem[] = [
  {
    id: 'tmt',
    nameEn: 'Sariya',
    nameHi: 'सरिया',
    icon: <CircleDot className="h-5 w-5" />,
    link: '/products?category=0333cb8e-b576-4c96-ae42-f2c5f2965a46',
  },
  {
    id: 'cement',
    nameEn: 'Cement',
    nameHi: 'सीमेंट',
    icon: <Box className="h-5 w-5" />,
    link: '/products?category=800b5781-b79e-4fb0-87a0-8d192eab01b8',
  },
  {
    id: 'structural',
    nameEn: 'Angle/Patti',
    nameHi: 'एंगल/पट्टी',
    icon: <Triangle className="h-5 w-5" />,
    link: '/products?category=35df5ed6-d693-4682-a00a-db647da5460f',
  },
  {
    id: 'pipe',
    nameEn: 'Pipe',
    nameHi: 'पाइप',
    icon: <Cylinder className="h-5 w-5" />,
    link: '/products?category=c2e845dd-f129-44c7-affb-6990fee9b38a',
  },
  {
    id: 'sheet',
    nameEn: 'Sheet',
    nameHi: 'शीट',
    icon: <LayoutGrid className="h-5 w-5" />,
    link: '/products?category=017d837e-e46f-438e-833f-8dc34e9ac899',
  },
  {
    id: 'hardware',
    nameEn: 'Wire/Hardware',
    nameHi: 'तार/हार्डवेयर',
    icon: <Wrench className="h-5 w-5" />,
    link: '/products?category=58ed85d4-c8bb-43e2-a1a4-7b84f2649deb',
  },
  {
    id: 'solar',
    nameEn: 'Solar',
    nameHi: 'सोलर',
    icon: <Sun className="h-5 w-5" />,
    link: '/products?category=d73dda81-0d67-45bb-b728-c456f371b833',
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
  const { language, t } = useLanguage();

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
