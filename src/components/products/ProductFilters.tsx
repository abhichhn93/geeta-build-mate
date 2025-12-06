import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { SlidersHorizontal, X } from 'lucide-react';
import { Category, Brand } from '@/hooks/useProducts';
import { useLanguage } from '@/hooks/useLanguage';

// TMT sizes in mm
const TMT_SIZES = ['6mm', '8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '32mm'];
// Cement sizes
const CEMENT_SIZES = ['50kg bag'];
// Binding wire sizes
const WIRE_SIZES = ['18 gauge', '20 gauge', '22 gauge', '5kg bundle', '10kg bundle'];
// General sizes for angles/channels
const STEEL_SIZES = ['25x25mm', '40x40mm', '50x50mm', '75x75mm'];
// Stock status options
const STOCK_STATUS_OPTIONS = [
  { value: 'in_stock', labelEn: 'In Stock', labelHi: 'स्टॉक में' },
  { value: 'low_stock', labelEn: 'Low Stock', labelHi: 'कम स्टॉक' },
  { value: 'out_of_stock', labelEn: 'Out of Stock', labelHi: 'स्टॉक खत्म' },
];

export interface ProductFiltersState {
  categories: string[];
  brands: string[];
  sizes: string[];
  stockStatus: string[];
  priceRange: [number, number];
}

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  filters: ProductFiltersState;
  onFiltersChange: (filters: ProductFiltersState) => void;
  maxPrice?: number;
}

export function ProductFilters({
  categories,
  brands,
  filters,
  onFiltersChange,
  maxPrice = 10000,
}: ProductFiltersProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ProductFiltersState>(filters);

  // Get relevant sizes based on selected categories
  const availableSizes = useMemo(() => {
    const selectedCategoryNames = categories
      .filter((c) => localFilters.categories.includes(c.id))
      .map((c) => c.name_en.toLowerCase());

    let sizes: string[] = [];

    if (selectedCategoryNames.length === 0) {
      // Show all sizes if no category selected
      sizes = [...TMT_SIZES, ...CEMENT_SIZES, ...WIRE_SIZES, ...STEEL_SIZES];
    } else {
      if (selectedCategoryNames.some((n) => n.includes('tmt') || n.includes('sariya'))) {
        sizes = [...sizes, ...TMT_SIZES];
      }
      if (selectedCategoryNames.some((n) => n.includes('cement'))) {
        sizes = [...sizes, ...CEMENT_SIZES];
      }
      if (selectedCategoryNames.some((n) => n.includes('wire') || n.includes('binding'))) {
        sizes = [...sizes, ...WIRE_SIZES];
      }
      if (
        selectedCategoryNames.some(
          (n) => n.includes('angle') || n.includes('channel') || n.includes('stirrup')
        )
      ) {
        sizes = [...sizes, ...STEEL_SIZES];
      }
    }

    return [...new Set(sizes)];
  }, [categories, localFilters.categories]);

  const toggleCategory = (categoryId: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleBrand = (brandId: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brandId)
        ? prev.brands.filter((id) => id !== brandId)
        : [...prev.brands, brandId],
    }));
  };

  const toggleSize = (size: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const toggleStockStatus = (status: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      stockStatus: prev.stockStatus.includes(status)
        ? prev.stockStatus.filter((s) => s !== status)
        : [...prev.stockStatus, status],
    }));
  };

  const handlePriceChange = (value: number[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      priceRange: [value[0], value[1]] as [number, number],
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: ProductFiltersState = {
      categories: [],
      brands: [],
      sizes: [],
      stockStatus: [],
      priceRange: [0, maxPrice],
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount =
    filters.categories.length +
    filters.brands.length +
    filters.sizes.length +
    filters.stockStatus.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 rounded-full border-primary/20 h-7 text-xs px-3"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t('Filters', 'फ़िल्टर')}
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-20">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>{t('Filters', 'फ़िल्टर')}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-4 w-4" />
              {t('Clear All', 'सब हटाएं')}
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Category Filter */}
          <div>
            <Label className="mb-3 block text-sm font-medium">
              {t('Category', 'श्रेणी')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={localFilters.categories.includes(category.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleCategory(category.id)}
                  className="rounded-full text-xs"
                >
                  {language === 'en' ? category.name_en : category.name_hi}
                </Button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <Label className="mb-3 block text-sm font-medium">
              {t('Brand', 'ब्रांड')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={localFilters.brands.includes(brand.id)}
                    onCheckedChange={() => toggleBrand(brand.id)}
                  />
                  <label
                    htmlFor={`brand-${brand.id}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {brand.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Status Filter */}
          <div>
            <Label className="mb-3 block text-sm font-medium">
              {t('Stock Status', 'स्टॉक स्थिति')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {STOCK_STATUS_OPTIONS.map((status) => (
                <Button
                  key={status.value}
                  variant={localFilters.stockStatus.includes(status.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleStockStatus(status.value)}
                  className="rounded-full text-xs"
                >
                  {language === 'en' ? status.labelEn : status.labelHi}
                </Button>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div>
            <Label className="mb-3 block text-sm font-medium">
              {t('Size', 'साइज़')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <Button
                  key={size}
                  variant={localFilters.sizes.includes(size) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSize(size)}
                  className="rounded-full text-xs"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <Label className="mb-3 block text-sm font-medium">
              {t('Price Range', 'कीमत सीमा')}
            </Label>
            <div className="px-2">
              <Slider
                value={[localFilters.priceRange[0], localFilters.priceRange[1]]}
                min={0}
                max={maxPrice}
                step={100}
                onValueChange={handlePriceChange}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>₹{localFilters.priceRange[0]}</span>
                <span>₹{localFilters.priceRange[1]}</span>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="fixed bottom-0 left-0 right-0 flex gap-2 border-t bg-background p-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setIsOpen(false)}
          >
            {t('Cancel', 'रद्द करें')}
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            {t('Apply Filters', 'फ़िल्टर लगाएं')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Helper to add/remove size options - just update the arrays at the top of this file:
// - TMT_SIZES for TMT bar sizes
// - CEMENT_SIZES for cement bag sizes
// - WIRE_SIZES for binding wire sizes
// - STEEL_SIZES for angles/channels sizes
// No database changes needed.