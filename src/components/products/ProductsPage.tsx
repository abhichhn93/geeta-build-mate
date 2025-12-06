import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProducts, useCategories, Product } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { formatINR } from '@/lib/whatsapp';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Minus, ShoppingCart, Pencil, Trash2, Search, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductWithRelations extends Product {
  category?: { id: string; name_en: string; name_hi: string; icon?: string } | null;
  brand?: { id: string; name: string; logo_url?: string } | null;
}

interface ProductsPageProps {
  onAddToCart?: (product: ProductWithRelations, quantity: number) => void;
  onEditProduct?: (product: ProductWithRelations) => void;
  onDeleteProduct?: (product: ProductWithRelations) => void;
}

export function ProductsPage({ onAddToCart, onEditProduct, onDeleteProduct }: ProductsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { isAdmin } = useAuth();
  const { data: products, isLoading } = useProducts(selectedCategory === 'all' ? undefined : selectedCategory);
  const { data: categories } = useCategories();

  // Filter products by search
  const filteredProducts = products?.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name_en.toLowerCase().includes(query) ||
      product.name_hi.toLowerCase().includes(query) ||
      product.brand?.name.toLowerCase().includes(query)
    );
  }) as ProductWithRelations[] | undefined;

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
        return <Badge className="bg-success/20 text-success">In Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-warning/20 text-warning">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-destructive/20 text-destructive">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3">
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
              className="pl-9"
            />
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="sticky top-[105px] z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg overflow-x-auto px-4 py-2">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('all')}
              className="shrink-0"
            >
              All / सभी
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(category.id)}
                className="shrink-0 gap-1"
              >
                <span>{category.icon}</span>
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
              <Card key={i} className="animate-pulse">
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
              <Card key={product.id} className="overflow-hidden">
                {/* Product Image */}
                <div className="relative aspect-square bg-secondary/30">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name_en}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      {product.category?.icon || '📦'}
                    </div>
                  )}

                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute right-1 top-1 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={() => onEditProduct?.(product)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
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
                  {/* Product Info */}
                  <div className="mb-2">
                    <p className="line-clamp-1 text-sm font-medium">{product.name_en}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground hindi-text">
                      {product.name_hi}
                    </p>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground">{product.brand.name}</p>
                    )}
                    {product.size && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {product.size}
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-2 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-primary">
                      {formatINR(product.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">/{product.unit}</span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    {getQuantity(product.id) > 0 ? (
                      <>
                        <div className="flex flex-1 items-center justify-between rounded-lg border border-border">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium">{getQuantity(product.id)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          className="h-8 w-8"
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
                        className="w-full"
                        disabled={product.stock_status === 'out_of_stock'}
                        onClick={() => handleQuantityChange(product.id, 1)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No products found</p>
            <p className="text-sm text-muted-foreground hindi-text">कोई प्रोडक्ट नहीं मिला</p>
          </div>
        )}
      </div>
    </div>
  );
}