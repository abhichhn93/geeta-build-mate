import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { SmartVoiceAssistant } from '@/components/voice/SmartVoiceAssistant';
import { RateSlider } from '@/components/home/RateSlider';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import geetaTradersLogo from '@/assets/geeta-traders-logo.png';
import { Link } from 'react-router-dom';

export function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

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
        {/* Rate Slider - TMT and Cement rates slide */}
        <RateSlider />

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
