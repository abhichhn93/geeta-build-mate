import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts, useCategories, useBrands, Product } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { formatINR } from '@/lib/whatsapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProductFilters, ProductFiltersState } from './ProductFilters';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Pencil, 
  Trash2, 
  Search, 
  ArrowLeft,
  CircleDot,
  Box,
  Link as LinkIcon,
  Triangle,
  Square,
  Circle,
  Wrench,
  Package
} from 'lucide-react';

// Map category names to Lucide icons
const getCategoryIcon = (nameEn: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'TMT Sariya': <CircleDot className="h-4 w-4" />,
    'Cement': <Box className="h-4 w-4" />,
    'Binding Wire': <LinkIcon className="h-4 w-4" />,
    'MS Angles': <Triangle className="h-4 w-4" />,
    'MS Channels': <Square className="h-4 w-4" />,
    'Stirrups': <Circle className="h-4 w-4" />,
    'Fasteners': <Wrench className="h-4 w-4" />,
  };
  return iconMap[nameEn] || <Package className="h-4 w-4" />;
};

interface ProductWithRelations extends Product {
  category?: { id: string; name_en: string; name_hi: string; icon?: string } | null;
  brand?: { id: string; name: string; logo_url?: string } | null;
}

interface ProductsPageProps {
  onAddToCart?: (product: ProductWithRelations, quantity: number) => void;
  onEditProduct?: (product: ProductWithRelations) => void;
  onDeleteProduct?: (product: ProductWithRelations) => void;
}

const defaultFilters: ProductFiltersState = {
  categories: [],
  brands: [],
  sizes: [],
  priceRange: [0, 10000],
};

export function ProductsPage({ onAddToCart, onEditProduct, onDeleteProduct }: ProductsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<ProductFiltersState>(defaultFilters);

  const { isAdmin } = useAuth();
  const { data: products, isLoading } = useProducts(); // Fetch all products for filtering
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  // Calculate max price from products
  const maxPrice = useMemo(() => {
    if (!products || products.length === 0) return 10000;
    return Math.ceil(Math.max(...products.map((p) => p.price)) / 100) * 100;
  }, [products]);

  // Apply all filters
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.name_en.toLowerCase().includes(query) ||
          product.name_hi.toLowerCase().includes(query) ||
          product.brand?.name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter (from URL param or filter panel)
      if (selectedCategory !== 'all') {
        if (product.category_id !== selectedCategory) return false;
      } else if (filters.categories.length > 0) {
        if (!product.category_id || !filters.categories.includes(product.category_id)) return false;
      }

      // Brand filter
      if (filters.brands.length > 0) {
        if (!product.brand_id || !filters.brands.includes(product.brand_id)) return false;
      }

      // Size filter
      if (filters.sizes.length > 0) {
        if (!product.size || !filters.sizes.includes(product.size)) return false;
      }

      // Price filter
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
        return <Badge className="bg-success/20 text-success border-0 text-[10px]">In Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-warning/20 text-warning border-0 text-[10px]">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-destructive/20 text-destructive border-0 text-[10px]">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-lg">
          <div className="mb-3 flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">Products / प्रोडक्ट्स</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products... / खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-0"
            />
          </div>
        </div>
      </header>

      {/* Category Filter + Filters Button */}
      <div className="sticky top-[105px] z-30 border-b bg-card shadow-sm">
        <div className="mx-auto max-w-lg overflow-x-auto px-4 py-2 scrollbar-hide">
          <div className="flex items-center gap-2">
            {/* Filters Button */}
            {categories && brands && (
              <ProductFilters
                categories={categories}
                brands={brands}
                filters={filters}
                onFiltersChange={setFilters}
                maxPrice={maxPrice}
              />
            )}
            
            {/* Category Pills */}
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('all')}
              className="shrink-0 rounded-full"
            >
              All / सभी
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(category.id)}
                className="shrink-0 gap-1.5 rounded-full"
              >
                {getCategoryIcon(category.name_en)}
                {category.name_en}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="mx-auto max-w-lg p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="aspect-square bg-muted" />
                <CardContent className="p-3">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="relative aspect-square bg-muted/30">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name_en}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted/50">
                      <div className="text-muted-foreground">
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
                        className="h-7 w-7 rounded-full"
                        onClick={() => onEditProduct?.(product)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7 rounded-full"
                        onClick={() => onDeleteProduct?.(product)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Stock Badge */}
                  <div className="absolute bottom-1 left-1">
                    {getStockBadge(product.stock_status)}
                  </div>
                </div>

                <CardContent className="p-3">
                  {/* Brand + Size */}
                  {(product.brand || product.size) && (
                    <p className="text-xs text-muted-foreground">
                      {product.brand?.name}{product.brand && product.size && ' | '}{product.size}
                    </p>
                  )}
                  
                  {/* Product Info */}
                  <div className="mb-2">
                    <p className="line-clamp-1 text-sm font-medium">{product.name_en}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground hindi-text">
                      {product.name_hi}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <span className="text-lg font-bold text-primary">
                      {formatINR(product.price)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      प्रति {product.unit} / per {product.unit}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    {getQuantity(product.id) > 0 ? (
                      <>
                        <div className="flex flex-1 items-center justify-between rounded-lg border">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-l-lg"
                            onClick={() => handleQuantityChange(product.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium text-sm">{getQuantity(product.id)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-r-lg"
                            onClick={() => handleQuantityChange(product.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => {
                            onAddToCart?.(product, getQuantity(product.id));
                            setQuantities((prev) => ({ ...prev, [product.id]: 0 }));
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full rounded-lg"
                        disabled={product.stock_status === 'out_of_stock'}
                        onClick={() => handleQuantityChange(product.id, 1)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No products found</p>
            <p className="text-sm text-muted-foreground hindi-text">कोई प्रोडक्ट नहीं मिला</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Products will appear here once added by admin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
