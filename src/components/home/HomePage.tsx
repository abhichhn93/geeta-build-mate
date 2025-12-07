import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useDailyRates } from '@/hooks/useDailyRates';
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
  Link as LinkIcon,
  Triangle,
  Square,
  Circle,
  Wrench,
  Package
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateRatesWhatsAppLink, openWhatsApp } from '@/lib/whatsapp';

const getCategoryIcon = (nameEn: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'TMT Sariya': <CircleDot className="h-5 w-5" />,
    'Cement': <Box className="h-5 w-5" />,
    'Binding Wire': <LinkIcon className="h-5 w-5" />,
    'MS Angles': <Triangle className="h-5 w-5" />,
    'MS Channels': <Square className="h-5 w-5" />,
    'Stirrups': <Circle className="h-5 w-5" />,
    'Fasteners': <Wrench className="h-5 w-5" />,
  };
  return iconMap[nameEn] || <Package className="h-5 w-5" />;
};

export function HomePage() {
  const { user, isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { data: rates, isLoading: ratesLoading } = useDailyRates();
  const { data: categories } = useCategories();

  const sariyaRates = rates?.filter(r => r.category.toLowerCase() === 'sariya') || [];
  const cementRates = rates?.filter(r => r.category.toLowerCase() === 'cement') || [];

  const handleShareRates = () => {
    if (rates && rates.length > 0) {
      const link = generateRatesWhatsAppLink(rates);
      openWhatsApp(link);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">
            {t('Geeta Traders', 'गीता ट्रेडर्स')}
          </h1>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Today's Rate Section */}
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/30 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t("Today's Rate", 'आज का रेट')}
                </CardTitle>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                onClick={handleShareRates}
                disabled={!rates?.length}
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
            ) : sariyaRates.length > 0 || cementRates.length > 0 ? (
              <div className="space-y-3">
                {sariyaRates.length > 0 && (
                  <div>
                    <Badge variant="secondary" className="mb-2 text-[10px]">
                      {t('TMT', 'सरिया')}
                    </Badge>
                    <div className="grid grid-cols-2 gap-1.5">
                    {sariyaRates.slice(0, 6).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded-md border bg-card px-2 py-1.5"
                        >
                          <span className="text-[10px] text-muted-foreground truncate max-w-[60%]">
                            {rate.brand} {rate.size && `• ${rate.size}`}
                          </span>
                          <span className="font-semibold text-primary text-xs">
                            {formatINR(rate.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cementRates.length > 0 && (
                  <div>
                    <Badge variant="secondary" className="mb-2 text-[10px]">
                      {t('Cement', 'सीमेंट')}
                    </Badge>
                    <div className="grid grid-cols-2 gap-1.5">
                      {cementRates.slice(0, 4).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded-md border bg-card px-2 py-1.5"
                        >
                          <span className="text-[10px] text-muted-foreground truncate max-w-[60%]">
                            {rate.brand}
                          </span>
                          <span className="font-semibold text-primary text-xs">
                            {formatINR(rate.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground text-sm">
                {t('No rates available', 'रेट उपलब्ध नहीं')}
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
