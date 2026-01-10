import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useLatestRates } from '@/hooks/useDailyRates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Share2, 
  TrendingUp, 
  CircleDot,
  Box,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateRatesWhatsAppLink, openWhatsApp } from '@/lib/whatsapp';
import { useAuth } from '@/hooks/useAuth';

export function RateSlider() {
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { data: ratesData, isLoading } = useLatestRates();
  const [currentSlide, setCurrentSlide] = useState(0);

  const rates = ratesData?.rates || [];
  const rateDate = ratesData?.date;

  // Filter rates by category
  const tmtRates = rates.filter(r => 
    r.category.toLowerCase() === 'sariya' || 
    r.category.toLowerCase() === 'tmt' ||
    r.category.toLowerCase().includes('tmt')
  );
  const cementRates = rates.filter(r => r.category.toLowerCase() === 'cement');

  // Build slides based on available rates
  const slides = [];
  if (tmtRates.length > 0) {
    slides.push({ type: 'tmt', rates: tmtRates });
  }
  if (cementRates.length > 0) {
    slides.push({ type: 'cement', rates: cementRates });
  }

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleShareRates = () => {
    if (rates.length > 0) {
      const link = generateRatesWhatsAppLink(rates);
      openWhatsApp(link);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Format the rate date for display
  const formatRateDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rateDay = new Date(dateStr);
    rateDay.setHours(0, 0, 0, 0);
    
    const isToday = rateDay.getTime() === today.getTime();
    
    if (isToday) {
      return t("Today's Rate", 'आज का रेट');
    }
    
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden shadow-md border-primary/20">
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 rounded bg-muted" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (slides.length === 0) {
    return (
      <Card className="overflow-hidden shadow-md border-primary/20">
        <CardContent className="py-4 text-center">
          <TrendingUp className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">
            {t('No rates available', 'रेट उपलब्ध नहीं')}
          </p>
          {isAdmin && (
            <Link to="/rates">
              <Button variant="outline" size="sm" className="mt-2 h-6 text-[10px]">
                {t('Add Rates', 'रेट जोड़ें')}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  const current = slides[currentSlide];

  return (
    <Card className="overflow-hidden shadow-md border-primary/20">
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5 py-2 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {current.type === 'tmt' ? (
              <CircleDot className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Box className="h-3.5 w-3.5 text-primary" />
            )}
            <CardTitle className="text-xs">
              {current.type === 'tmt' 
                ? t('TMT Sariya', 'सरिया रेट')
                : t('Cement', 'सीमेंट')
              }
            </CardTitle>
            <span className="text-[9px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
              {rateDate ? formatRateDate(rateDate) : t("Today", 'आज')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={handleShareRates}
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 relative">
        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded-full bg-background/80 shadow hover:bg-background"
            >
              <ChevronLeft className="h-3 w-3 text-foreground" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded-full bg-background/80 shadow hover:bg-background"
            >
              <ChevronRight className="h-3 w-3 text-foreground" />
            </button>
          </>
        )}

        {/* Rate Content - Compact Grid */}
        <div className="overflow-hidden px-3">
          <div 
            className="transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            <div className="flex">
              {slides.map((slide) => (
                <div key={slide.type} className="w-full flex-shrink-0">
                  {slide.type === 'tmt' ? (
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-1 text-center">
                        ₹/{t('kg', 'किग्रा')}
                      </div>
                      {/* Compact 2-row grid for TMT - 4-5 columns */}
                      <div className="grid grid-cols-5 gap-1">
                        {slide.rates.slice(0, 10).map((rate) => (
                          <div
                            key={rate.id}
                            className="flex flex-col items-center justify-center rounded border bg-muted/30 px-1 py-1"
                          >
                            <span className="text-[8px] font-medium text-foreground truncate text-center w-full leading-tight">
                              {rate.brand.split(' ')[0]}
                            </span>
                            <span className="font-bold text-primary text-sm leading-tight">
                              ₹{rate.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-1 text-center">
                        ₹/{t('bag', 'बैग')}
                      </div>
                      {/* Compact single row for Cement */}
                      <div className="grid grid-cols-4 gap-1">
                        {slide.rates.slice(0, 4).map((rate) => (
                          <div
                            key={rate.id}
                            className="flex flex-col items-center justify-center rounded border bg-muted/30 px-1 py-1"
                          >
                            <span className="text-[8px] font-medium text-foreground truncate text-center w-full leading-tight">
                              {rate.brand}
                            </span>
                            <span className="font-bold text-primary text-sm leading-tight">
                              ₹{rate.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dot indicators + Admin link inline */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {slides.length > 1 && (
            <div className="flex gap-1">
              {slides.map((slide, index) => (
                <button
                  key={slide.type}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'w-3 bg-primary' 
                      : 'w-1 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          )}
          {isAdmin && (
            <Link to="/rates">
              <Button variant="ghost" size="sm" className="h-5 text-[9px] px-2">
                {t('Edit', 'संपादित')}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
