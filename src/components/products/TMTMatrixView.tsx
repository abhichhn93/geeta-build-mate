import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useLatestRates } from '@/hooks/useDailyRates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, MessageCircle } from 'lucide-react';
import { tmtBar } from '@/lib/product-images';
import { toast } from 'sonner';

// TMT Brands as per Geeta Traders catalog (from Excel data)
const TMT_BRANDS = ['Kamdhenu', 'Ankur', 'Kay2', 'Radhe', 'Singhal', 'Jindal', 'Tata'] as const;

// TMT Sizes
const TMT_SIZES = ['6mm', '8mm', '10mm', '12mm', '16mm', '20mm', '25mm'] as const;

// Weight per piece (kg) - approximate values for 12m length
const WEIGHT_PER_PIECE: Record<string, number> = {
  '6mm': 2.67,
  '8mm': 4.74,
  '10mm': 7.40,
  '12mm': 10.67,
  '16mm': 18.96,
  '20mm': 29.63,
  '25mm': 46.30,
};

interface SizeQuantity {
  size: string;
  pieces: number;
}

interface TMTMatrixViewProps {
  brand: string;
  onAddToCart?: (brand: string, items: SizeQuantity[]) => void;
  onWhatsAppOrder?: (brand: string, items: SizeQuantity[]) => void;
}

export function TMTMatrixCard({ brand, onAddToCart, onWhatsAppOrder }: TMTMatrixViewProps) {
  const { language, t } = useLanguage();
  const { data: ratesData } = useLatestRates();
  
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Get rate for this brand from daily rates
  const brandRate = useMemo(() => {
    const rates = ratesData?.rates || [];
    const rate = rates.find(r => 
      r.brand.toLowerCase() === brand.toLowerCase() && 
      (r.category.toLowerCase() === 'sariya' || r.category.toLowerCase() === 'tmt')
    );
    return rate?.price || 0;
  }, [ratesData, brand]);

  const handleQuantityChange = (size: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[size] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [size]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [size]: newQty };
    });
  };

  const handleInputChange = (size: string, value: string) => {
    const num = parseInt(value) || 0;
    if (num <= 0) {
      const { [size]: _, ...rest } = quantities;
      setQuantities(rest);
    } else {
      setQuantities(prev => ({ ...prev, [size]: num }));
    }
  };

  // Calculate total weight
  const totalWeight = useMemo(() => {
    return Object.entries(quantities).reduce((sum, [size, pieces]) => {
      return sum + (WEIGHT_PER_PIECE[size] || 0) * pieces;
    }, 0);
  }, [quantities]);

  // Calculate total pieces
  const totalPieces = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  const handleAddToCart = () => {
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([size, pieces]) => ({ size, pieces }));
    
    if (items.length === 0) {
      toast.error(t('Select quantity', 'मात्रा चुनें'));
      return;
    }
    
    onAddToCart?.(brand, items);
    setQuantities({});
    toast.success(t('Added to cart', 'कार्ट में जोड़ा'));
  };

  const handleWhatsAppOrder = () => {
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([size, pieces]) => ({ size, pieces }));
    
    if (items.length === 0) {
      toast.error(t('Select quantity', 'मात्रा चुनें'));
      return;
    }
    
    onWhatsAppOrder?.(brand, items);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center gap-3">
        <img src={tmtBar} alt="TMT Bar" className="h-12 w-12 object-contain" />
        <div className="flex-1">
          <CardTitle className="text-base">{brand} TMT</CardTitle>
          {brandRate > 0 && (
            <p className="text-sm text-muted-foreground">
              ₹{brandRate}/{t('kg', 'किग्रा')}
            </p>
          )}
        </div>
        {totalPieces > 0 && (
          <Badge variant="secondary" className="text-xs">
            {totalPieces} {t('pcs', 'पीस')}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Size Matrix */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {TMT_SIZES.map((size) => {
            const qty = quantities[size] || 0;
            return (
              <div key={size} className="text-center">
                <span className="text-[9px] text-muted-foreground block mb-0.5">
                  {size}
                </span>
                <div className="flex flex-col items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded"
                    onClick={() => handleQuantityChange(size, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={qty || ''}
                    onChange={(e) => handleInputChange(size, e.target.value)}
                    className="h-6 w-8 text-center text-[10px] p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded"
                    onClick={() => handleQuantityChange(size, -1)}
                    disabled={qty === 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weight calculation */}
        {totalPieces > 0 && (
          <div className="bg-muted/50 rounded-lg p-2 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {t('Approx Weight', 'अनुमानित वजन')}:
              </span>
              <span className="font-semibold">
                {totalWeight.toFixed(2)} {t('kg', 'किग्रा')} 
                <span className="text-muted-foreground font-normal ml-1">
                  ({(totalWeight / 1000).toFixed(3)} MT)
                </span>
              </span>
            </div>
            {brandRate > 0 && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">
                  {t('Approx Amount', 'अनुमानित राशि')}:
                </span>
                <span className="font-bold text-primary">
                  ₹{Math.round(totalWeight * brandRate).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleWhatsAppOrder}
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1 text-xs"
            disabled={totalPieces === 0}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {t('WhatsApp', 'व्हाट्सएप')}
          </Button>
          <Button 
            onClick={handleAddToCart}
            size="sm" 
            className="flex-1 gap-1 text-xs"
            disabled={totalPieces === 0}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {t('Add to Cart', 'कार्ट में जोड़ें')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Full TMT Matrix Page Component
export function TMTMatrixView() {
  const { t } = useLanguage();

  const handleAddToCart = (brand: string, items: SizeQuantity[]) => {
    console.log('Add to cart:', brand, items);
    // Will be connected to cart hook
  };

  const handleWhatsAppOrder = (brand: string, items: SizeQuantity[]) => {
    const itemsText = items
      .map(item => `${item.size}: ${item.pieces} pcs`)
      .join(', ');
    
    const totalWeight = items.reduce((sum, item) => {
      return sum + (WEIGHT_PER_PIECE[item.size] || 0) * item.pieces;
    }, 0);
    
    const message = encodeURIComponent(
      `🏗️ *TMT Order*\n\n` +
      `Brand: ${brand}\n` +
      `Items: ${itemsText}\n` +
      `Approx Weight: ${totalWeight.toFixed(2)} kg (${(totalWeight/1000).toFixed(3)} MT)\n\n` +
      `Please confirm availability and rate.`
    );
    
    window.open(`https://wa.me/919876543210?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold px-1">
        {t('TMT Sariya - Quick Order', 'टीएमटी सरिया - क्विक ऑर्डर')}
      </h2>
      {TMT_BRANDS.map((brand) => (
        <TMTMatrixCard
          key={brand}
          brand={brand}
          onAddToCart={handleAddToCart}
          onWhatsAppOrder={handleWhatsAppOrder}
        />
      ))}
    </div>
  );
}
