import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, Receipt, ShoppingBag, IndianRupee } from 'lucide-react';

// Customer type from Tally data
export interface TallyCustomer {
  name: string;
  phone: string | null;
  pendingAmount: number;
  lastTransactionDate?: string;
  lastTransactionType?: 'Sales' | 'Receipt';
  lastTransactionAmount?: number;
}

interface CustomerDetailDrawerProps {
  customer: TallyCustomer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDrawer({ customer, open, onOpenChange }: CustomerDetailDrawerProps) {
  const { t } = useLanguage();

  if (!customer) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPendingBadge = (amount: number) => {
    if (amount >= 300000) {
      return <Badge className="bg-destructive/20 text-destructive">🔴 {t('High', 'उच्च')}</Badge>;
    } else if (amount >= 100000) {
      return <Badge className="bg-warning/20 text-warning">🟡 {t('Medium', 'मध्यम')}</Badge>;
    }
    return <Badge className="bg-success/20 text-success">🟢 {t('Low', 'कम')}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-left flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold">{customer.name}</p>
              {customer.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </p>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Pending Amount */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                {t('Total Pending Amount', 'कुल बकाया राशि')}
              </span>
              {getPendingBadge(customer.pendingAmount)}
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(customer.pendingAmount)}
            </p>
          </div>

          {/* Last Transaction Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t('Last Transaction', 'अंतिम लेनदेन')}
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  {t('Date', 'तारीख')}
                </div>
                <p className="font-medium text-sm">
                  {formatDate(customer.lastTransactionDate)}
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  {customer.lastTransactionType === 'Receipt' ? (
                    <Receipt className="h-3 w-3" />
                  ) : (
                    <ShoppingBag className="h-3 w-3" />
                  )}
                  {t('Type', 'प्रकार')}
                </div>
                <p className="font-medium text-sm">
                  {customer.lastTransactionType === 'Receipt' 
                    ? t('Payment Received', 'भुगतान प्राप्त')
                    : customer.lastTransactionType === 'Sales'
                    ? t('Sales', 'बिक्री')
                    : '-'}
                </p>
              </div>
            </div>

            {customer.lastTransactionAmount && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <IndianRupee className="h-3 w-3" />
                  {t('Amount', 'राशि')}
                </div>
                <p className="font-medium">
                  {formatCurrency(customer.lastTransactionAmount)}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
