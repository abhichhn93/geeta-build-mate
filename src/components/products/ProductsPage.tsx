import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts, useCategories, useBrands, useDeleteProduct, Product } from '@/hooks/useProducts';
import { useProductStocks, getAggregatedStock } from '@/hooks/useProductStocks';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { formatINR } from '@/lib/whatsapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProductFilters, ProductFiltersState } from './ProductFilters';
import { ProductEditModal } from './ProductEditModal';
import { BranchSelector } from './BranchSelector';
import { VoiceAssistant } from '@/components/voice/VoiceAssistant';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Plus, 
  Minus, 
  Pencil, 
  Trash2,
  Search, 
  ArrowLeft,
  CircleDot,
  Box,
  Link as LinkIcon,
  Triangle,
  Cylinder,
  LayoutGrid,
  Sun,
  Wrench,
  Settings,
  Package,
  PackagePlus
} from 'lucide-react';

// Category icon mapping for the 8 Geeta Traders categories
const getCategoryIcon = (nameEn: string) => {
  const name = nameEn.toLowerCase();
  
  // TMT Bars
  if (name.includes('tmt') || name.includes('sariya')) {
    return <CircleDot className="h-8 w-8" />;
  }
  // Structural Steel
  if (name.includes('structural') || name.includes('angle') || name.includes('channel')) {
    return <Triangle className="h-8 w-8" />;
  }
  // Pipes & Tubes
  if (name.includes('pipe') || name.includes('tube')) {
    return <Cylinder className="h-8 w-8" />;
  }
  // Cement
  if (name.includes('cement')) {
    return <Box className="h-8 w-8" />;
  }
  // Roofing & Sheets
  if (name.includes('sheet') || name.includes('roofing')) {
    return <LayoutGrid className="h-8 w-8" />;
  }
  // Solar & GI Structures
  if (name.includes('solar') || name.includes('gi')) {
    return <Sun className="h-8 w-8" />;
  }
  // Hardware & Consumables
  if (name.includes('hardware') || name.includes('consumable') || name.includes('wire')) {
    return <Wrench className="h-8 w-8" />;
  }
  // Services
  if (name.includes('service') || name.includes('ring')) {
    return <Settings className="h-8 w-8" />;
  }
  
  return <Package className="h-8 w-8" />;
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
  stockStatus: [],
  priceRange: [0, 10000],
};

export function ProductsPage({ onAddToCart }: ProductsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFiltersState>(defaultFilters);
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductWithRelations | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: branches } = useBranches();
  const { data: productStocks } = useProductStocks(selectedBranch);
  const deleteProduct = useDeleteProduct();

  const maxPrice = useMemo(() => {
    if (!products || products.length === 0) return 10000;
    return Math.ceil(Math.max(...products.map((p) => p.price)) / 100) * 100;
  }, [products]);

  // Compute stock for each product based on selected branch
  const productsWithStock = useMemo(() => {
    if (!products || !productStocks) return [];

    return products.map((product) => {
      const stockInfo = getAggregatedStock(product.id, productStocks, selectedBranch);
      return {
        ...product,
        computed_stock_qty: stockInfo.stock_qty,
        computed_stock_status: stockInfo.stock_status,
      };
    });
  }, [products, productStocks, selectedBranch]);

  const filteredProducts = useMemo(() => {
    if (!productsWithStock) return [];

    return productsWithStock.filter((product) => {
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

      // Stock status filter - use computed status
      if (filters.stockStatus.length > 0) {
        if (!filters.stockStatus.includes(product.computed_stock_status)) return false;
      }

      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      return true;
    });
  }, [productsWithStock, searchQuery, selectedCategory, filters]) as (ProductWithRelations & { computed_stock_qty: number; computed_stock_status: string })[];

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  const handleAddToCart = (product: ProductWithRelations) => {
    const selectedBranchData = branches?.find(b => b.id === selectedBranch);
    addItem({
      productId: product.id,
      name: product.name_en,
      nameHi: product.name_hi,
      brand: product.brand?.name || undefined,
      size: product.size,
      price: product.price,
      unit: product.unit,
      imageUrl: product.image_url,
      branchId: selectedBranch !== 'all' ? selectedBranch : undefined,
      branchName: selectedBranch !== 'all' ? selectedBranchData?.name : 'All Branches',
    });
    toast.success(t('Added to cart', 'कार्ट में जोड़ा गया'));
  };

  const handleQuantityChange = (product: ProductWithRelations, delta: number) => {
    const currentQty = getItemQuantity(product.id);
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      updateQuantity(product.id, 0);
    } else if (currentQty === 0 && delta > 0) {
      handleAddToCart(product);
    } else {
      updateQuantity(product.id, newQty);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct.mutateAsync(deletingProduct.id);
      toast.success(t('Product deleted', 'प्रोडक्ट हटा दिया'));
      setDeletingProduct(null);
    } catch (error) {
      toast.error(t('Failed to delete', 'हटाने में समस्या'));
    }
  };

  const getStockBadge = (status: string) => {
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

  // Format brand + size display (handles no brand case)
  const formatBrandSize = (product: ProductWithRelations) => {
    const parts: string[] = [];
    if (product.brand?.name) {
      parts.push(product.brand.name);
    }
    if (product.size) {
      parts.push(product.size);
    }
    return parts.join(' • ') || '—';
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
            <BranchSelector
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
            />
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

                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute right-1 top-1 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6 rounded-full shadow"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6 rounded-full shadow text-destructive hover:text-destructive"
                        onClick={() => setDeletingProduct(product)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Stock Badge with Quantity */}
                  <div className="absolute bottom-1 left-1 flex items-center gap-1">
                    {getStockBadge(product.computed_stock_status)}
                    {isAdmin && product.computed_stock_qty > 0 && (
                      <Badge className="bg-background/80 text-foreground border-0 text-[8px] px-1 py-0">
                        {product.computed_stock_qty} {product.unit}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-2">
                  {/* Brand + Size - handles no brand gracefully */}
                  <p className="text-[9px] text-muted-foreground truncate">
                    {formatBrandSize(product)}
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
                      {getItemQuantity(product.id) > 0 ? (
                        <div className="flex items-center rounded border h-6">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-l"
                            onClick={() => handleQuantityChange(product, -1)}
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </Button>
                          <span className="text-[10px] font-medium w-4 text-center">{getItemQuantity(product.id)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-r"
                            onClick={() => handleQuantityChange(product, 1)}
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          disabled={product.computed_stock_status === 'out_of_stock'}
                          onClick={() => handleAddToCart(product)}
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
        selectedBranchId={selectedBranch}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete Product?', 'प्रोडक्ट हटाएं?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('This will remove', 'यह हटा देगा')} "{deletingProduct?.name_en}" {t('from the catalog.', 'कैटलॉग से।')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel', 'रद्द करें')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('Delete', 'हटाएं')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Voice Assistant - Admin Only */}
      {isAdmin && <VoiceAssistant />}
    </div>
  );
}
