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
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      {/* Header - Compact */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm px-4 py-2 shadow-sm dark:bg-slate-900/80">
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
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground px-1">Categories</h2>
          <CategoryGrid />
        </div>

        {/* Login prompt for non-logged in users */}
        {!user && (
          <Card className="border-dashed shadow-sm bg-white/70 dark:bg-slate-800/70">
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
