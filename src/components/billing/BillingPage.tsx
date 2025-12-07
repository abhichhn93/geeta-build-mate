import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { formatINR, generateOrderWhatsAppLink, openWhatsApp } from '@/lib/whatsapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Search,
  Package,
  MessageCircle,
  QrCode,
  Banknote,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';

interface BillItem {
  productId: string;
  name: string;
  nameHi: string;
  brand?: string | null;
  size?: string | null;
  price: number;
  unit: string;
  quantity: number;
}

export function BillingPage() {
  const { data: products = [], isLoading } = useProducts();
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank'>('cash');
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Filter products based on search
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.name_en.toLowerCase().includes(query) ||
      p.name_hi.includes(query) ||
      p.brand?.name?.toLowerCase().includes(query) ||
      p.size?.toLowerCase().includes(query)
    );
  });

  const addToBill = (product: typeof products[0]) => {
    setBillItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name_en,
        nameHi: product.name_hi,
        brand: product.brand?.name,
        size: product.size,
        price: product.price,
        unit: product.unit,
        quantity: 1,
      }];
    });
    toast.success(t('Added to bill', 'बिल में जोड़ा गया'));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setBillItems(prev => prev.filter(i => i.productId !== productId));
    } else {
      setBillItems(prev =>
        prev.map(i => i.productId === productId ? { ...i, quantity } : i)
      );
    }
  };

  const removeItem = (productId: string) => {
    setBillItems(prev => prev.filter(i => i.productId !== productId));
  };

  const clearBill = () => {
    setBillItems([]);
    setCustomerName('');
    setCustomerPhone('');
    toast.success(t('Bill cleared', 'बिल खाली किया गया'));
  };

  const totalAmount = billItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSendWhatsApp = () => {
    if (!customerName.trim()) {
      toast.error(t('Please enter customer name', 'कृपया ग्राहक का नाम दर्ज करें'));
      return;
    }
    if (billItems.length === 0) {
      toast.error(t('Bill is empty', 'बिल खाली है'));
      return;
    }

    const orderDetails = {
      customerName: customerName.trim(),
      branchName: 'Geeta Traders',
      items: billItems.map(item => ({
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
      paymentMode: paymentMode === 'cash' ? 'Cash' : paymentMode === 'upi' ? 'UPI' : 'Bank Transfer',
    };

    const link = generateOrderWhatsAppLink(orderDetails);
    openWhatsApp(link);
    toast.success(t('Opening WhatsApp...', 'WhatsApp खोल रहे हैं...'));
  };

  // Restrict to admin only
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t('Quick Billing is for admin only', 'क्विक बिलिंग केवल एडमिन के लिए है')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-48">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">{t('Quick Billing', 'क्विक बिलिंग')}</h1>
          </div>
          {billItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={clearBill}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t('Clear', 'खाली करें')}
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left: Product Search */}
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('Search products...', 'प्रोडक्ट खोजें...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">
                  {t('Loading...', 'लोड हो रहा है...')}
                </p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {t('No products found', 'कोई प्रोडक्ट नहीं मिला')}
                </p>
              ) : (
                filteredProducts.slice(0, 20).map(product => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => addToBill(product)}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">
                          {[product.brand?.name, product.size].filter(Boolean).join(' | ') || '—'}
                        </p>
                        <p className="font-medium text-sm truncate">{product.name_en}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-semibold text-primary text-sm">
                          {formatINR(product.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">/{product.unit}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="ml-2 h-8 w-8 shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right: Bill */}
          <div>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('Current Bill', 'वर्तमान बिल')}
                  {billItems.length > 0 && (
                    <Badge variant="secondary">{billItems.length}</Badge>
                  )}
                </h3>

                {billItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    {t('Click products to add', 'जोड़ने के लिए प्रोडक्ट पर क्लिक करें')}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                    {billItems.map(item => (
                      <div key={item.productId} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {[item.brand, item.size].filter(Boolean).join(' | ')}
                          </p>
                          <p className="text-sm font-medium truncate">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-1 border rounded">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-semibold w-16 text-right">
                          {formatINR(item.price * item.quantity)}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {billItems.length > 0 && (
                  <>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="font-medium">{t('Total', 'कुल')}</span>
                      <span className="text-xl font-bold text-primary">{formatINR(totalAmount)}</span>
                    </div>

                    {/* Customer Info */}
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label htmlFor="cust-name" className="text-xs">{t('Customer Name', 'ग्राहक का नाम')} *</Label>
                        <Input
                          id="cust-name"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          placeholder={t('Enter name', 'नाम दर्ज करें')}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cust-phone" className="text-xs">{t('Phone', 'फोन')}</Label>
                        <Input
                          id="cust-phone"
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          placeholder={t('Optional', 'वैकल्पिक')}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Payment Mode */}
                    <div className="mt-4">
                      <Label className="text-xs">{t('Payment Mode', 'भुगतान का तरीका')}</Label>
                      <RadioGroup
                        value={paymentMode}
                        onValueChange={(v) => setPaymentMode(v as 'cash' | 'upi' | 'bank')}
                        className="mt-2 flex gap-2"
                      >
                        <div className="flex items-center space-x-2 border rounded-lg p-2 flex-1 cursor-pointer hover:bg-accent/50"
                          onClick={() => setPaymentMode('cash')}>
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="flex items-center gap-1 cursor-pointer text-xs">
                            <Banknote className="h-3 w-3" /> Cash
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-2 flex-1 cursor-pointer hover:bg-accent/50"
                          onClick={() => setPaymentMode('upi')}>
                          <RadioGroupItem value="upi" id="upi" />
                          <Label htmlFor="upi" className="flex items-center gap-1 cursor-pointer text-xs">
                            <Smartphone className="h-3 w-3" /> UPI
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-2 flex-1 cursor-pointer hover:bg-accent/50"
                          onClick={() => setPaymentMode('bank')}>
                          <RadioGroupItem value="bank" id="bank" />
                          <Label htmlFor="bank" className="flex items-center gap-1 cursor-pointer text-xs">
                            <CreditCard className="h-3 w-3" /> Bank
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

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

                    {/* Send WhatsApp */}
                    <Button
                      className="w-full mt-4"
                      size="lg"
                      onClick={handleSendWhatsApp}
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      {t('Send Bill via WhatsApp', 'WhatsApp से बिल भेजें')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* UPI QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {t('Scan to Pay', 'भुगतान के लिए स्कैन करें')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
              <div className="text-center p-4">
                <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  {t('Upload your UPI QR code image in settings', 'सेटिंग्स में अपना UPI QR कोड इमेज अपलोड करें')}
                </p>
              </div>
            </div>
            <p className="mt-4 text-lg font-bold text-primary">{formatINR(totalAmount)}</p>
            <p className="text-sm text-muted-foreground">Geeta Traders</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
