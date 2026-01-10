import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useLatestRates } from '@/hooks/useDailyRates';
import { formatINR } from '@/lib/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { SmartVoiceAssistant } from '@/components/voice/SmartVoiceAssistant';
import { CategorySlider } from '@/components/home/CategorySlider';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { 
  Share2, 
  TrendingUp, 
  CircleDot,
  Box
} from 'lucide-react';
import geetaTradersLogo from '@/assets/geeta-traders-logo.png';
import { Link } from 'react-router-dom';
import { generateRatesWhatsAppLink, openWhatsApp } from '@/lib/whatsapp';

export function HomePage() {
  const { user, isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { data: ratesData, isLoading: ratesLoading } = useLatestRates();

  const rates = ratesData?.rates || [];
  const rateDate = ratesData?.date;

  // Filter rates by category
  const tmtRates = rates.filter(r => 
    r.category.toLowerCase() === 'sariya' || 
    r.category.toLowerCase() === 'tmt' ||
    r.category.toLowerCase().includes('tmt')
  );
  const cementRates = rates.filter(r => r.category.toLowerCase() === 'cement');

  const handleShareRates = () => {
    if (rates.length > 0) {
      const link = generateRatesWhatsAppLink(rates);
      openWhatsApp(link);
    }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Compact */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-2 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <img 
            src={geetaTradersLogo} 
            alt="Geeta Traders" 
            className="h-14 max-w-[55%] object-contain object-left"
          />
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Category Auto-Slider - Compact, <30% screen height */}
        <CategorySlider />

        {/* Rate Board - Prominent Design */}
        <Card className="overflow-hidden shadow-md border-primary/20">
          <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5 pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {rateDate ? formatRateDate(rateDate) : t("Today's Rate", 'आज का रेट')}
                </CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-[10px] border-primary/30 hover:bg-primary/10"
                onClick={handleShareRates}
                disabled={!rates.length}
              >
                <Share2 className="h-3 w-3" />
                {t('Share', 'शेयर')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {ratesLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-8 rounded-lg bg-muted" />
                ))}
              </div>
            ) : tmtRates.length > 0 || cementRates.length > 0 ? (
              <div className="space-y-3">
                {/* TMT Rates - Compact */}
                {tmtRates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CircleDot className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-semibold text-foreground">
                        {t('TMT Sariya', 'टीएमटी सरिया')}
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        (₹/{t('kg', 'किग्रा')})
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {tmtRates.slice(0, 6).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded border bg-muted/30 px-2 py-1.5"
                        >
                          <span className="text-[10px] font-medium text-foreground truncate">
                            {rate.brand}
                          </span>
                          <span className="font-bold text-primary text-xs ml-1">
                            ₹{rate.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cement Rates - Compact */}
                {cementRates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Box className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-semibold text-foreground">
                        {t('Cement', 'सीमेंट')}
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        (₹/{t('bag', 'बैग')})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {cementRates.slice(0, 4).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded border bg-muted/30 px-2 py-1.5"
                        >
                          <span className="text-[10px] font-medium text-foreground truncate">
                            {rate.brand}
                          </span>
                          <span className="font-bold text-primary text-xs ml-1">
                            ₹{rate.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link to full rates page - Admin only */}
                {isAdmin && (
                  <Link to="/rates" className="block">
                    <Button variant="outline" size="sm" className="w-full text-[10px] h-7 mt-1">
                      {t('Manage Rates', 'रेट प्रबंधन')}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <TrendingUp className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  {t('No rates available', 'रेट उपलब्ध नहीं')}
                </p>
                {isAdmin && (
                  <Link to="/rates">
                    <Button variant="outline" size="sm" className="mt-2 text-[10px] h-7">
                      {t('Add Rates', 'रेट जोड़ें')}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-sm">{t('Categories', 'श्रेणियाँ')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <CategoryGrid />
          </CardContent>
        </Card>

        {/* Login prompt for non-logged in users */}
        {!user && (
          <Card className="border-dashed shadow-sm">
            <CardContent className="py-4 text-center">
              <p className="text-xs text-muted-foreground">
                {t('Login to place orders', 'ऑर्डर देने के लिए लॉगिन करें')}
              </p>
              <Link to="/auth">
                <Button className="mt-2" size="sm">
                  {t('Login', 'लॉगिन')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Voice Assistant - Available for all logged-in users */}
      {user && <SmartVoiceAssistant />}
    </div>
  );
}
