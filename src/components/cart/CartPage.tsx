import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, generateOrderWhatsAppLink, openWhatsApp } from '@/lib/whatsapp';
import { useUPIQRCode } from '@/components/settings/UPIQRUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  MessageCircle,
  Package,
  QrCode,
  Banknote,
  Smartphone,
  CreditCard,
  Image,
} from 'lucide-react';
import { toast } from 'sonner';

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { t } = useLanguage();
  const { data: upiQRUrl } = useUPIQRCode();
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank'>('cash');
  const [showQRDialog, setShowQRDialog] = useState(false);

  const handleWhatsAppOrder = () => {
    if (!customerName.trim()) {
      toast.error(t('Please enter your name', 'कृपया अपना नाम दर्ज करें'));
      return;
    }

    // Get branch info from first item (assuming all items from same branch selection)
    const branchName = items[0]?.branchName || 'All Branches';

    const orderDetails = {
      customerName: customerName.trim(),
      address: address.trim() || undefined,
      branchName,
      items: items.map(item => ({
        name: item.name,
        nameHi: item.nameHi,
        brand: item.brand,
        size: item.size,
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

            {/* Payment Mode */}
            <div className="pt-2">
              <Label className="text-xs">{t('Payment Mode', 'भुगतान का तरीका')}</Label>
              <RadioGroup
                value={paymentMode}
                onValueChange={(v) => setPaymentMode(v as 'cash' | 'upi' | 'bank')}
                className="mt-2 flex gap-2"
              >
                <div 
                  className="flex items-center space-x-2 border rounded-lg p-2 flex-1 cursor-pointer hover:bg-accent/50"
                  onClick={() => setPaymentMode('cash')}
                >
                  <RadioGroupItem value="cash" id="cart-cash" />
                  <Label htmlFor="cart-cash" className="flex items-center gap-1 cursor-pointer text-xs">
                    <Banknote className="h-3 w-3" /> {t('Cash', 'नकद')}
                  </Label>
                </div>
                <div 
                  className="flex items-center space-x-2 border rounded-lg p-2 flex-1 cursor-pointer hover:bg-accent/50"
                  onClick={() => setPaymentMode('upi')}
                >
                  <RadioGroupItem value="upi" id="cart-upi" />
                  <Label htmlFor="cart-upi" className="flex items-center gap-1 cursor-pointer text-xs">
                    <Smartphone className="h-3 w-3" /> UPI
                  </Label>
                </div>
                <div 
                  className="flex items-center space-x-2 border rounded-lg p-2 flex-1 cursor-pointer hover:bg-accent/50"
                  onClick={() => setPaymentMode('bank')}
                >
                  <RadioGroupItem value="bank" id="cart-bank" />
                  <Label htmlFor="cart-bank" className="flex items-center gap-1 cursor-pointer text-xs">
                    <CreditCard className="h-3 w-3" /> {t('Bank', 'बैंक')}
                  </Label>
                </div>
              </RadioGroup>

              {/* UPI QR Button */}
              {paymentMode === 'upi' && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => setShowQRDialog(true)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  {t('Show UPI QR Code', 'UPI QR कोड दिखाएं')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* UPI QR Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">
                {t('Scan to Pay', 'भुगतान के लिए स्कैन करें')}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              {upiQRUrl ? (
                <img 
                  src={upiQRUrl} 
                  alt="UPI QR Code" 
                  className="w-48 h-48 rounded-lg border shadow-sm object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                  <div className="text-center p-4">
                    <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {t('No QR code uploaded', 'कोई QR कोड अपलोड नहीं')}
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-4 text-lg font-bold text-primary">{formatINR(totalAmount)}</p>
              <p className="text-sm text-muted-foreground">Geeta Traders</p>
            </div>
          </DialogContent>
        </Dialog>
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
