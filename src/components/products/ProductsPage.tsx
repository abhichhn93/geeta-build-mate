import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts, useCategories, useBrands, Product } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR } from '@/lib/whatsapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProductFilters, ProductFiltersState } from './ProductFilters';
import { ProductEditModal } from './ProductEditModal';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import {
  Plus, 
  Minus, 
  ShoppingCart, 
  Pencil, 
  Search, 
  ArrowLeft,
  CircleDot,
  Box,
  Link as LinkIcon,
  Triangle,
  Square,
  Circle,
  Wrench,
  Package,
  PackagePlus
} from 'lucide-react';

const getCategoryIcon = (nameEn: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'TMT Sariya': <CircleDot className="h-8 w-8" />,
    'Cement': <Box className="h-8 w-8" />,
    'Binding Wire': <LinkIcon className="h-8 w-8" />,
    'MS Angles': <Triangle className="h-8 w-8" />,
    'MS Channels': <Square className="h-8 w-8" />,
    'Stirrups': <Circle className="h-8 w-8" />,
    'Fasteners': <Wrench className="h-8 w-8" />,
  };
  return iconMap[nameEn] || <Package className="h-8 w-8" />;
};

interface ProductWithRelations extends Product {
  category?: { id: string; name_en: string; name_hi: string; icon?: string } | null;
  brand?: { id: string; name: string; logo_url?: string } | null;
}

interface ProductsPageProps {
  onAddToCart?: (product: ProductWithRelations, quantity: number) => void;
}

const defaultFilters: ProductFiltersState = {
  categories: [],
  brands: [],
  sizes: [],
  priceRange: [0, 10000],
};

export function ProductsPage({ onAddToCart }: ProductsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<ProductFiltersState>(defaultFilters);
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const maxPrice = useMemo(() => {
    if (!products || products.length === 0) return 10000;
    return Math.ceil(Math.max(...products.map((p) => p.price)) / 100) * 100;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.name_en.toLowerCase().includes(query) ||
          product.name_hi.toLowerCase().includes(query) ||
          product.brand?.name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (selectedCategory !== 'all') {
        if (product.category_id !== selectedCategory) return false;
      } else if (filters.categories.length > 0) {
        if (!product.category_id || !filters.categories.includes(product.category_id)) return false;
      }

      if (filters.brands.length > 0) {
        if (!product.brand_id || !filters.brands.includes(product.brand_id)) return false;
      }

      if (filters.sizes.length > 0) {
        if (!product.size || !filters.sizes.includes(product.size)) return false;
      }

      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, filters]) as ProductWithRelations[];

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta),
    }));
  };

  const getQuantity = (productId: string) => quantities[productId] || 0;

  const getStockBadge = (status: string | null) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-success/20 text-success border-0 text-[9px] px-1.5 py-0">{t('In Stock', 'स्टॉक में')}</Badge>;
      case 'low_stock':
        return <Badge className="bg-warning/20 text-warning border-0 text-[9px] px-1.5 py-0">{t('Low', 'कम')}</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-destructive/20 text-destructive border-0 text-[9px] px-1.5 py-0">{t('Out', 'खत्म')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-2.5 shadow-sm">
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-base font-bold">{t('Products', 'प्रोडक्ट्स')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageToggle />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('Search...', 'खोजें...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 bg-muted/50 border-0 text-sm"
            />
          </div>
        </div>
      </header>

      {/* Category Filter + Filters Button */}
      <div className="sticky top-[85px] z-30 border-b bg-card shadow-sm">
        <div className="mx-auto max-w-lg overflow-x-auto px-4 py-2 scrollbar-hide">
          <div className="flex items-center gap-1.5">
            {categories && brands && (
              <ProductFilters
                categories={categories}
                brands={brands}
                filters={filters}
                onFiltersChange={setFilters}
                maxPrice={maxPrice}
              />
            )}
            
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('all')}
              className="shrink-0 rounded-full h-7 text-xs px-3"
            >
              {t('All', 'सभी')}
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(category.id)}
                className="shrink-0 rounded-full h-7 text-xs px-3"
              >
                {language === 'en' ? category.name_en : category.name_hi}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Add Button */}
      {isAdmin && (
        <div className="mx-auto max-w-lg px-4 pt-3">
          <Button 
            onClick={() => setShowAddModal(true)} 
            className="w-full gap-2"
            size="sm"
          >
            <PackagePlus className="h-4 w-4" />
            {t('Add New Product', 'नया प्रोडक्ट जोड़ें')}
          </Button>
        </div>
      )}

      {/* Products Grid - 2 columns */}
      <div className="mx-auto max-w-lg p-4 pt-3">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-muted" />
                <CardContent className="p-2.5">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="mt-1.5 h-3 w-1/2 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Product Image - compact aspect ratio for 4 visible cards */}
                <div className="relative aspect-[5/3] bg-gradient-to-br from-muted/50 to-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name_en}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
                      <div className="text-muted-foreground/40">
                        {getCategoryIcon(product.category?.name_en || '')}
                      </div>
                    </div>
                  )}

                  {/* Admin Edit Button */}
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute right-1 top-1 h-6 w-6 rounded-full shadow"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}

                  {/* Stock Badge */}
                  <div className="absolute bottom-1 left-1">
                    {getStockBadge(product.stock_status)}
                  </div>
                </div>

                <CardContent className="p-2">
                  {/* Brand + Size */}
                  <p className="text-[9px] text-muted-foreground truncate">
                    {product.brand?.name || 'Generic'}{product.size && ` • ${product.size}`}
                  </p>
                  
                  {/* Product Name */}
                  <p className="line-clamp-1 text-[11px] font-medium">
                    {language === 'en' ? product.name_en : product.name_hi}
                  </p>

                  {/* Price + Add Button in same row */}
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs font-bold text-primary">
                        {formatINR(product.price)}
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        /{product.unit}
                      </span>
                    </div>
                    
                    {/* Compact Add Button */}
                    <div>
                      {getQuantity(product.id) > 0 ? (
                        <div className="flex items-center rounded border h-6">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-l"
                            onClick={() => handleQuantityChange(product.id, -1)}
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </Button>
                          <span className="text-[10px] font-medium w-4 text-center">{getQuantity(product.id)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-r"
                            onClick={() => handleQuantityChange(product.id, 1)}
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          disabled={product.stock_status === 'out_of_stock'}
                          onClick={() => handleQuantityChange(product.id, 1)}
                        >
                          <Plus className="h-2.5 w-2.5 mr-0.5" />
                          {t('Add', 'जोड़ें')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {t('No products found', 'कोई प्रोडक्ट नहीं मिला')}
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ProductEditModal
        open={!!editingProduct || showAddModal}
        onClose={() => {
          setEditingProduct(null);
          setShowAddModal(false);
        }}
        product={editingProduct}
      />
    </div>
  );
}
