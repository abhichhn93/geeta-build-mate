import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, Users, TrendingUp, Calculator, ScanLine, 
  Settings, ShoppingCart, ClipboardList, LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { LanguageToggle } from '@/components/layout/LanguageToggle';

const adminTools = [
  { to: '/products', icon: Package, label: 'Manage Products', labelHi: 'प्रोडक्ट्स प्रबंधन', desc: 'Add, edit, delete products', descHi: 'प्रोडक्ट जोड़ें, बदलें, हटाएं' },
  { to: '/customers', icon: Users, label: 'Customers', labelHi: 'ग्राहक', desc: 'View & manage customers', descHi: 'ग्राहक देखें व प्रबंधित करें' },
  { to: '/rates', icon: TrendingUp, label: 'Daily Rates', labelHi: 'दैनिक रेट', desc: 'Update TMT & Cement rates', descHi: 'TMT और सीमेंट के रेट अपडेट करें' },
  { to: '/orders', icon: ClipboardList, label: 'All Orders', labelHi: 'सभी ऑर्डर', desc: 'View all customer orders', descHi: 'सभी ग्राहकों के ऑर्डर देखें' },
  { to: '/billing', icon: ShoppingCart, label: 'POS Billing', labelHi: 'बिलिंग', desc: 'Create bills for walk-in', descHi: 'वॉक-इन ग्राहकों के लिए बिल बनाएं' },
  { to: '/bill-scanner', icon: ScanLine, label: 'Bill OCR Scanner', labelHi: 'बिल OCR स्कैनर', desc: 'Scan bills to extract data', descHi: 'बिल स्कैन करके डेटा निकालें' },
  { to: '/calculator', icon: Calculator, label: 'TMT Calculator', labelHi: 'TMT कैलकुलेटर', desc: 'Calculate TMT requirements', descHi: 'TMT आवश्यकता कैलकुलेट करें' },
];

export function AdminSettingsPage() {
  const { user, signOut, isAdmin } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {language === 'en' ? 'Admin Panel' : 'एडमिन पैनल'}
            </h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              {language === 'en' 
                ? 'Welcome to Admin Panel. Manage your store from here.' 
                : 'एडमिन पैनल में आपका स्वागत है। यहाँ से अपनी दुकान प्रबंधित करें।'}
            </p>
          </CardContent>
        </Card>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-2 gap-3">
          {adminTools.map((tool) => (
            <Card 
              key={tool.to}
              className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98]"
              onClick={() => navigate(tool.to)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <tool.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {language === 'en' ? tool.label : tool.labelHi}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {language === 'en' ? tool.desc : tool.descHi}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full mt-4 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Sign Out' : 'साइन आउट'}
        </Button>
      </div>
    </div>
  );
}
