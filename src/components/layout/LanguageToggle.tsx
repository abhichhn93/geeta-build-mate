import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-1.5 text-xs font-medium"
      title={language === 'en' ? 'हिंदी में देखें' : 'View in English'}
    >
      <Languages className="h-4 w-4" />
      {language === 'en' ? 'हिंदी' : 'EN'}
    </Button>
  );
}
