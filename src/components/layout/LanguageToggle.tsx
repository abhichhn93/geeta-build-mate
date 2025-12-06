import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 rounded-full px-3 text-xs font-semibold"
      title={language === 'en' ? 'हिंदी में देखें' : 'View in English'}
    >
      <span className={language === 'en' ? 'text-primary font-bold' : 'text-muted-foreground'}>EN</span>
      <span className="mx-1 text-border">/</span>
      <span className={language === 'hi' ? 'text-primary font-bold' : 'text-muted-foreground'}>हिं</span>
    </Button>
  );
}
