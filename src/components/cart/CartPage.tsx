import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, generateOrderWhatsAppLink, openWhatsApp } from '@/lib/whatsapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  MessageCircle,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { t } = useLanguage();
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');

  const handleWhatsAppOrder = () => {
    if (!customerName.trim()) {
      toast.error(t('Please enter your name', 'कृपया अपना नाम दर्ज करें'));
      return;
    }

    const orderDetails = {
      customerName: customerName.trim(),
      address: address.trim() || undefined,
      items: items.map(item => ({
        name: item.name,
        nameHi: item.nameHi,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        total: item.price * item.quantity,
      })),
      totalAmount,
    };

    const link = generateOrderWhatsAppLink(orderDetails);
    openWhatsApp(link);
    toast.success(t('Opening WhatsApp...', 'WhatsApp खोल रहे हैं...'));
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/products">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-bold">{t('Cart', 'कार्ट')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageToggle />
            </div>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">{t('Your cart is empty', 'आपका कार्ट खाली है')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Add products to get started', 'शुरू करने के लिए प्रोडक्ट जोड़ें')}
          </p>
          <Link to="/products">
            <Button className="mt-6">
              <Package className="mr-2 h-4 w-4" />
              {t('Browse Products', 'प्रोडक्ट देखें')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-48">
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/products">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">
              {t('Cart', 'कार्ट')} ({items.length})
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                clearCart();
                toast.success(t('Cart cleared', 'कार्ट खाली किया गया'));
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t('Clear', 'खाली करें')}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg p-4">
        {/* Cart Items */}
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.productId} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {[item.brand, item.size].filter(Boolean).join(' • ') || '—'}
                    </p>
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      {formatINR(item.price)}/{item.unit}
                    </p>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    <div className="flex items-center rounded border">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Line Total */}
                <div className="mt-2 flex justify-end border-t pt-2">
                  <span className="text-sm font-semibold">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Customer Details */}
        <Card className="mt-6">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">
              {t('Customer Details', 'ग्राहक विवरण')}
            </h3>
            <div>
              <Label htmlFor="name" className="text-xs">
                {t('Name', 'नाम')} *
              </Label>
              <Input
                id="name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder={t('Enter your name', 'अपना नाम दर्ज करें')}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address" className="text-xs">
                {t('Delivery Address', 'डिलीवरी पता')}
              </Label>
              <Input
                id="address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={t('Optional', 'वैकल्पिक')}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-16 left-0 right-0 border-t bg-card p-4 shadow-lg safe-bottom">
        <div className="mx-auto max-w-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('Total', 'कुल')} ({items.length} {t('items', 'आइटम')})
            </span>
            <span className="text-xl font-bold text-primary">
              {formatINR(totalAmount)}
            </span>
          </div>
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleWhatsAppOrder}
          >
            <MessageCircle className="h-5 w-5" />
            {t('Order via WhatsApp', 'WhatsApp से ऑर्डर करें')}
          </Button>
        </div>
      </div>
    </div>
  );
}
