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
import { 
  getSizesForCategory, 
  STOCK_STATUS_OPTIONS,
  getCategoryType,
} from '@/lib/product-constants';

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

  // Get relevant sizes based on selected categories (category-aware filtering)
  const availableSizes = useMemo(() => {
    const selectedCategories = categories.filter((c) => 
      localFilters.categories.includes(c.id)
    );

    if (selectedCategories.length === 0) {
      // When no category selected, gather sizes from all categories
      const allSizes = new Set<string>();
      categories.forEach(cat => {
        getSizesForCategory(cat.name_en).forEach(size => allSizes.add(size));
      });
      return Array.from(allSizes);
    }

    // Get sizes for selected categories only
    const sizes = new Set<string>();
    selectedCategories.forEach(cat => {
      getSizesForCategory(cat.name_en).forEach(size => sizes.add(size));
    });
    
    return Array.from(sizes);
  }, [categories, localFilters.categories]);

  // Filter brands by selected categories
  const filteredBrands = useMemo(() => {
    if (localFilters.categories.length === 0) {
      return brands;
    }
    return brands.filter(brand => 
      brand.category_id && localFilters.categories.includes(brand.category_id)
    );
  }, [brands, localFilters.categories]);

  const toggleCategory = (categoryId: string) => {
    setLocalFilters((prev) => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId];
      
      // Clear sizes and brands when category changes to avoid invalid selections
      return {
        ...prev,
        categories: newCategories,
        sizes: [], // Reset sizes when category changes
        brands: prev.brands.filter(brandId => 
          filteredBrands.some(b => b.id === brandId)
        ),
      };
    });
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

  // Get category type label for size section
  const sizeLabel = useMemo(() => {
    if (localFilters.categories.length === 1) {
      const cat = categories.find(c => c.id === localFilters.categories[0]);
      if (cat) {
        const type = getCategoryType(cat.name_en);
        if (type === 'TMT') return t('Diameter', 'व्यास');
        if (type === 'PIPES') return t('Dimensions', 'आकार');
        if (type === 'STRUCTURAL') return t('Section Size', 'सेक्शन साइज़');
        if (type === 'ROOFING') return t('Type / Thickness', 'प्रकार / मोटाई');
      }
    }
    return t('Size / Type', 'साइज़ / प्रकार');
  }, [localFilters.categories, categories, t]);

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

          {/* Brand Filter - filtered by selected category */}
          {filteredBrands.length > 0 && (
            <div>
              <Label className="mb-3 block text-sm font-medium">
                {t('Brand', 'ब्रांड')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {filteredBrands.map((brand) => (
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
          )}

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

          {/* Size Filter - category-aware */}
          {availableSizes.length > 0 && (
            <div>
              <Label className="mb-3 block text-sm font-medium">
                {sizeLabel}
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
          )}

          {/* Price Range */}
          <div>
            <Label className="mb-3 block text-sm font-medium">
              {t('Price Range', 'कीमत सीमा')} (₹/{t('unit', 'यूनिट')})
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
