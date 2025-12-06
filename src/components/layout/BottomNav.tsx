import { NavLink, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, ClipboardList, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

const customerNavItems = [
  { to: '/', icon: Home, label: 'Home', labelHi: 'होम' },
  { to: '/products', icon: Package, label: 'Products', labelHi: 'प्रोडक्ट्स' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart', labelHi: 'कार्ट' },
  { to: '/orders', icon: ClipboardList, label: 'Orders', labelHi: 'ऑर्डर्स' },
  { to: '/account', icon: User, label: 'Account', labelHi: 'खाता' },
];

const adminNavItems = [
  { to: '/', icon: Home, label: 'Dashboard', labelHi: 'डैशबोर्ड' },
  { to: '/products', icon: Package, label: 'Products', labelHi: 'प्रोडक्ट्स' },
  { to: '/billing', icon: ShoppingCart, label: 'Billing', labelHi: 'बिलिंग' },
  { to: '/orders', icon: ClipboardList, label: 'Orders', labelHi: 'ऑर्डर्स' },
  { to: '/admin', icon: Settings, label: 'Admin', labelHi: 'एडमिन' },
];

export function BottomNav() {
  const { isAdmin } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navItems = isAdmin ? adminNavItems : customerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon
                className={cn('h-5 w-5', isActive && 'fill-primary/20')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">
                {language === 'en' ? item.label : item.labelHi}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}