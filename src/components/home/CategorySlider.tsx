import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cementBag, tmtBar, msAngle, colourProfileSheet } from '@/lib/product-images';

interface SlideItem {
  id: string;
  titleEn: string;
  titleHi: string;
  image: string;
  categoryId?: string;
  link: string;
  bgColor: string;
}

const slides: SlideItem[] = [
  {
    id: 'cement',
    titleEn: 'Cement',
    titleHi: 'सीमेंट',
    image: cementBag,
    link: '/products?category=800b5781-b79e-4fb0-87a0-8d192eab01b8',
    bgColor: 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/30',
  },
  {
    id: 'tmt',
    titleEn: 'TMT Sariya',
    titleHi: 'टीएमटी सरिया',
    image: tmtBar,
    link: '/products?category=0333cb8e-b576-4c96-ae42-f2c5f2965a46',
    bgColor: 'from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/30',
  },
  {
    id: 'structural',
    titleEn: 'Structural Steel',
    titleHi: 'स्ट्रक्चरल स्टील',
    image: msAngle,
    link: '/products?category=35df5ed6-d693-4682-a00a-db647da5460f',
    bgColor: 'from-zinc-50 to-zinc-100 dark:from-zinc-950/20 dark:to-zinc-900/30',
  },
  {
    id: 'sheet',
    titleEn: 'Roofing Sheets',
    titleHi: 'छत की शीट',
    image: colourProfileSheet,
    link: '/products?category=017d837e-e46f-438e-833f-8dc34e9ac899',
    bgColor: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30',
  },
];

export function CategorySlider() {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Compact slider - takes <30% screen height */}
      <Link to={slide.link}>
        <div 
          className={`relative flex items-center h-28 bg-gradient-to-r ${slide.bgColor} transition-all duration-500`}
        >
          {/* Text content */}
          <div className="flex-1 pl-4 pr-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {language === 'en' ? 'Shop Now' : 'अभी खरीदें'}
            </span>
            <h3 className="text-lg font-bold text-foreground mt-0.5">
              {language === 'en' ? slide.titleEn : slide.titleHi}
            </h3>
          </div>

          {/* Product image */}
          <div className="h-full w-32 flex items-center justify-center p-2">
            <img 
              src={slide.image} 
              alt={slide.titleEn}
              className="max-h-full max-w-full object-contain drop-shadow-lg"
            />
          </div>
        </div>
      </Link>

      {/* Navigation arrows */}
      <button
        onClick={(e) => { e.preventDefault(); prevSlide(); }}
        className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background/60 flex items-center justify-center hover:bg-background/80 transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); nextSlide(); }}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background/60 flex items-center justify-center hover:bg-background/80 transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentSlide 
                ? 'w-4 bg-primary' 
                : 'w-1.5 bg-foreground/30 hover:bg-foreground/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
