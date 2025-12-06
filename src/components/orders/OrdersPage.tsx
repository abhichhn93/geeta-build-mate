import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LanguageToggle } from '@/components/layout/LanguageToggle';

export function OrdersPage() {
  const { t } = useLanguage();

  // Placeholder orders for layout preview
  const placeholderOrders = [
    { id: '1', number: 'ORD-001', status: 'pending', total: 4500, date: '2024-01-15' },
    { id: '2', number: 'ORD-002', status: 'confirmed', total: 12300, date: '2024-01-14' },
    { id: '3', number: 'ORD-003', status: 'delivered', total: 8900, date: '2024-01-10' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1 text-[10px]"><Clock className="h-3 w-3" />{t('Pending', 'पेंडिंग')}</Badge>;
      case 'confirmed':
        return <Badge className="bg-primary/20 text-primary border-0 gap-1 text-[10px]"><Truck className="h-3 w-3" />{t('Confirmed', 'कन्फर्म')}</Badge>;
      case 'delivered':
        return <Badge className="bg-success/20 text-success border-0 gap-1 text-[10px]"><CheckCircle className="h-3 w-3" />{t('Delivered', 'डिलीवर')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-base font-bold">{t('My Orders', 'मेरे ऑर्डर')}</h1>
          </div>
          <LanguageToggle />
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-3 p-4">
        {placeholderOrders.map((order) => (
          <Card key={order.id} className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{order.number}</p>
                  <p className="text-[10px] text-muted-foreground">{order.date}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2">
                <span className="text-xs text-muted-foreground">{t('Total', 'कुल')}</span>
                <span className="font-bold text-primary">₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="py-6 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-2 text-xs text-muted-foreground">
            {t('Order history will appear here', 'ऑर्डर हिस्ट्री यहाँ दिखेगी')}
          </p>
        </div>
      </div>
    </div>
  );
}
