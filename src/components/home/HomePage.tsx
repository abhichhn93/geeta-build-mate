import { useAuth } from '@/hooks/useAuth';
import { useDailyRates } from '@/hooks/useDailyRates';
import { useCategories } from '@/hooks/useProducts';
import { formatINR } from '@/lib/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, TrendingUp, Package, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateRatesWhatsAppLink, openWhatsApp } from '@/lib/whatsapp';

export function HomePage() {
  const { user, isAdmin } = useAuth();
  const { data: rates, isLoading: ratesLoading } = useDailyRates();
  const { data: categories } = useCategories();

  // Group rates by category
  const sariyaRates = rates?.filter(r => r.category.toLowerCase() === 'sariya') || [];
  const cementRates = rates?.filter(r => r.category.toLowerCase() === 'cement') || [];

  const handleShareRates = () => {
    if (rates && rates.length > 0) {
      const link = generateRatesWhatsAppLink(rates);
      openWhatsApp(link);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary px-4 py-4 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <h1 className="text-xl font-bold">गीता ट्रेडर्स</h1>
          <p className="text-sm opacity-90">Geeta Traders</p>
          <p className="mt-1 text-xs opacity-75">
            📍 Mohammadabad Gohna, Mau, UP
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Today's Rate Section */}
        <Card className="overflow-hidden border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  आज का रेट / Today's Rate
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('hi-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={handleShareRates}
                disabled={!rates?.length}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {ratesLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 rounded-lg bg-muted" />
                ))}
              </div>
            ) : sariyaRates.length > 0 || cementRates.length > 0 ? (
              <div className="space-y-4">
                {/* Sariya Rates */}
                {sariyaRates.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 font-semibold">
                      <Badge variant="secondary" className="bg-steel/20 text-steel">
                        सरिया / TMT
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {sariyaRates.slice(0, 6).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                        >
                          <div>
                            <span className="font-medium">{rate.size || rate.brand}</span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              {rate.brand}
                            </span>
                          </div>
                          <span className="font-bold text-primary">
                            {formatINR(rate.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cement Rates */}
                {cementRates.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 font-semibold">
                      <Badge variant="secondary" className="bg-cement/30 text-foreground">
                        सीमेंट / Cement
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {cementRates.slice(0, 4).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                        >
                          <span className="font-medium">{rate.brand}</span>
                          <span className="font-bold text-primary">
                            {formatINR(rate.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No rates available for today</p>
                <p className="text-sm hindi-text">आज के लिए कोई रेट उपलब्ध नहीं</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/products">
            <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Products</p>
                  <p className="text-xs text-muted-foreground hindi-text">
                    प्रोडक्ट देखें
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/calculator">
            <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <div className="rounded-full bg-accent/20 p-3">
                  <Calculator className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">TMT Calculator</p>
                  <p className="text-xs text-muted-foreground hindi-text">
                    वजन कैलकुलेटर
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Categories Grid */}
        {categories && categories.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Categories / श्रेणियाँ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.id}`}
                    className="flex flex-col items-center gap-1 rounded-lg bg-secondary/50 p-2 text-center transition-colors hover:bg-secondary"
                  >
                    <span className="text-2xl">{category.icon || '📦'}</span>
                    <span className="text-[10px] font-medium leading-tight">
                      {category.name_en}
                    </span>
                    <span className="text-[8px] text-muted-foreground hindi-text">
                      {category.name_hi}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome / Login prompt */}
        {!user && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Login to place orders and track your purchases
              </p>
              <p className="text-xs text-muted-foreground hindi-text">
                ऑर्डर देने के लिए लॉगिन करें
              </p>
              <Link to="/auth">
                <Button className="mt-3" size="sm">
                  Login / लॉगिन
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}