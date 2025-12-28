import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useLatestRates } from '@/hooks/useDailyRates';
import { useCategories } from '@/hooks/useProducts';
import { formatINR } from '@/lib/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { EnhancedVoiceAssistant } from '@/components/voice/EnhancedVoiceAssistant';
import { 
  Share2, 
  TrendingUp, 
  Calculator,
  CircleDot,
  Box,
  Cylinder,
  LayoutGrid,
  Sun,
  Wrench,
  Settings,
  Triangle,
  Package
} from 'lucide-react';
import geetaTradersLogo from '@/assets/geeta-traders-logo.png';
import { Link } from 'react-router-dom';
import { generateRatesWhatsAppLink, openWhatsApp } from '@/lib/whatsapp';

// Category icon mapping for the 8 Geeta Traders categories
const getCategoryIcon = (nameEn: string) => {
  const name = nameEn.toLowerCase();
  
  if (name.includes('tmt') || name.includes('sariya')) {
    return <CircleDot className="h-5 w-5" />;
  }
  if (name.includes('structural') || name.includes('angle') || name.includes('channel')) {
    return <Triangle className="h-5 w-5" />;
  }
  if (name.includes('pipe') || name.includes('tube')) {
    return <Cylinder className="h-5 w-5" />;
  }
  if (name.includes('cement')) {
    return <Box className="h-5 w-5" />;
  }
  if (name.includes('sheet') || name.includes('roofing')) {
    return <LayoutGrid className="h-5 w-5" />;
  }
  if (name.includes('solar') || name.includes('gi')) {
    return <Sun className="h-5 w-5" />;
  }
  if (name.includes('hardware') || name.includes('consumable') || name.includes('wire')) {
    return <Wrench className="h-5 w-5" />;
  }
  if (name.includes('service') || name.includes('ring')) {
    return <Settings className="h-5 w-5" />;
  }
  
  return <Package className="h-5 w-5" />;
};

export function HomePage() {
  const { user, isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { data: ratesData, isLoading: ratesLoading } = useLatestRates();
  const { data: categories } = useCategories();

  const rates = ratesData?.rates || [];
  const rateDate = ratesData?.date;

  // Filter rates by category (supporting both old "sariya" and new "tmt" naming)
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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-2 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 overflow-hidden">
          <img 
            src={geetaTradersLogo} 
            alt="Geeta Traders" 
            className="h-20 max-w-[60%] object-contain object-left shrink-0"
          />
          <div className="flex items-center gap-1 shrink-0">
            <ThemeSwitcher />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Rate Board - Prominent Design */}
        <Card className="overflow-hidden shadow-md border-primary/20">
          <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {rateDate ? formatRateDate(rateDate) : t("Today's Rate", 'आज का रेट')}
                </CardTitle>
                {rateDate && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {t('Latest prices', 'नवीनतम भाव')} • {new Date(rateDate).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs border-primary/30 hover:bg-primary/10"
                onClick={handleShareRates}
                disabled={!rates.length}
              >
                <Share2 className="h-3.5 w-3.5" />
                {t('Share', 'शेयर')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {ratesLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 rounded-lg bg-muted" />
                ))}
              </div>
            ) : tmtRates.length > 0 || cementRates.length > 0 ? (
              <div className="space-y-4">
                {/* TMT Rates */}
                {tmtRates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDot className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        {t('TMT Sariya', 'टीएमटी सरिया')}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        (₹/{t('kg', 'किग्रा')})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {tmtRates.slice(0, 8).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded-lg border bg-gradient-to-r from-card to-muted/30 px-2.5 py-2"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-medium text-foreground truncate">
                              {rate.brand}
                            </span>
                            {rate.size && (
                              <span className="text-[9px] text-muted-foreground">
                                {rate.size}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-primary text-sm ml-2">
                            ₹{rate.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cement Rates */}
                {cementRates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Box className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        {t('Cement', 'सीमेंट')}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        (₹/{t('bag', 'बैग')})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {cementRates.slice(0, 6).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded-lg border bg-gradient-to-r from-card to-muted/30 px-2.5 py-2"
                        >
                          <span className="text-[11px] font-medium text-foreground truncate">
                            {rate.brand}
                          </span>
                          <span className="font-bold text-primary text-sm ml-2">
                            ₹{rate.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link to full rates page */}
                {isAdmin && (
                  <Link to="/rates" className="block">
                    <Button variant="outline" size="sm" className="w-full text-xs mt-2">
                      {t('Manage Rates', 'रेट प्रबंधन')}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="py-6 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('No rates available', 'रेट उपलब्ध नहीं')}
                </p>
                {isAdmin && (
                  <Link to="/rates">
                    <Button variant="outline" size="sm" className="mt-3 text-xs">
                      {t('Add Rates', 'रेट जोड़ें')}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories Grid with TMT Calculator as special item */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('Categories', 'श्रेणियाँ')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {/* TMT Calculator - highlighted special item */}
              <Link
                to="/calculator"
                className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-primary/30 bg-primary/5 p-2.5 text-center transition-all hover:border-primary hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Calculator className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium leading-tight">
                  {t('TMT Calc', 'वजन कैलक')}
                </span>
                <Badge variant="secondary" className="text-[8px] px-1 py-0">
                  {t('Tool', 'टूल')}
                </Badge>
              </Link>

              {/* Regular categories */}
              {categories?.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl border bg-card p-2.5 text-center transition-all hover:border-primary hover:shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {getCategoryIcon(category.name_en)}
                  </div>
                  <span className="text-[10px] font-medium leading-tight line-clamp-2">
                    {language === 'en' ? category.name_en : category.name_hi}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Login prompt */}
        {!user && (
          <Card className="border-dashed shadow-sm">
            <CardContent className="py-5 text-center">
              <p className="text-sm text-muted-foreground">
                {t('Login to place orders', 'ऑर्डर देने के लिए लॉगिन करें')}
              </p>
              <Link to="/auth">
                <Button className="mt-3" size="sm">
                  {t('Login', 'लॉगिन')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Voice Assistant - Available for all logged-in users */}
      {user && <EnhancedVoiceAssistant />}
    </div>
  );
}
