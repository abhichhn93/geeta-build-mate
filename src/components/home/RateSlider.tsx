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
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden shadow-md border-primary/20">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-32 rounded bg-muted" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-10 rounded-lg bg-muted" />
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
        <CardContent className="py-6 text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t('No rates available', 'रेट उपलब्ध नहीं')}
          </p>
          {isAdmin && (
            <Link to="/rates">
              <Button variant="outline" size="sm" className="mt-3">
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
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5 pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {current.type === 'tmt' ? (
              <CircleDot className="h-4 w-4 text-primary" />
            ) : (
              <Box className="h-4 w-4 text-primary" />
            )}
            <CardTitle className="text-sm">
              {current.type === 'tmt' 
                ? t('TMT Sariya Rates', 'टीएमटी सरिया रेट')
                : t('Cement Rates', 'सीमेंट रेट')
              }
            </CardTitle>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {rateDate ? formatRateDate(rateDate) : t("Today", 'आज')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-[10px] border-primary/30 hover:bg-primary/10"
              onClick={handleShareRates}
            >
              <Share2 className="h-3 w-3" />
              {t('Share', 'शेयर')}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 relative">
        {/* Navigation Arrows - Only show if multiple slides */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-background/80 shadow-md hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-background/80 shadow-md hover:bg-background"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </>
        )}

        {/* Rate Content with animation */}
        <div className="overflow-hidden">
          <div 
            className="transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            <div className="flex">
              {slides.map((slide, index) => (
                <div key={slide.type} className="w-full flex-shrink-0 px-4">
                  {slide.type === 'tmt' ? (
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-2 text-center">
                        ₹/{t('kg', 'किग्रा')}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {slide.rates.map((rate) => (
                          <div
                            key={rate.id}
                            className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 px-2 py-2"
                          >
                            <span className="text-[10px] font-medium text-foreground truncate text-center w-full">
                              {rate.brand}
                            </span>
                            <span className="font-bold text-primary text-lg">
                              ₹{rate.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-2 text-center">
                        ₹/{t('bag', 'बैग')}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {slide.rates.map((rate) => (
                          <div
                            key={rate.id}
                            className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 px-3 py-2"
                          >
                            <span className="text-xs font-medium text-foreground truncate text-center w-full">
                              {rate.brand}
                            </span>
                            <span className="font-bold text-primary text-xl">
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

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {slides.map((slide, index) => (
              <button
                key={slide.type}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-4 bg-primary' 
                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Admin link */}
        {isAdmin && (
          <Link to="/rates" className="block mt-3">
            <Button variant="outline" size="sm" className="w-full text-[10px] h-7">
              {t('Manage Rates', 'रेट प्रबंधन')}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}