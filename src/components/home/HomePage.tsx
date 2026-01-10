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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-emerald-50/50 to-white dark:from-primary/10 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl dark:bg-emerald-900/20" />
        <div className="absolute bottom-1/4 right-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
      </div>

      {/* Header - Compact with glassmorphism */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/70 backdrop-blur-md px-4 py-2 shadow-sm dark:bg-slate-900/70">
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

      <div className="relative mx-auto max-w-lg space-y-4 p-4">
        {/* Rate Slider - TMT and Cement rates slide */}
        <RateSlider />

        {/* Categories Section with subtle background */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground px-1 flex items-center gap-2">
            <span className="h-1 w-4 bg-primary rounded-full"></span>
            {t('Categories', 'श्रेणियाँ')}
          </h2>
          <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-3 shadow-lg shadow-primary/5 border border-white/50 dark:border-slate-700/50">
            <CategoryGrid />
          </div>
        </div>

        {/* Login prompt for non-logged in users */}
        {!user && (
          <Card className="border-dashed shadow-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
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

      {/* Voice Assistant - Admin only */}
      {user && <SmartVoiceAssistant adminOnly />}
    </div>
  );
}
