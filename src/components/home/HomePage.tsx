import { useAuth } from '@/hooks/useAuth';
import { useDailyRates } from '@/hooks/useDailyRates';
import { useCategories } from '@/hooks/useProducts';
import { formatINR } from '@/lib/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  TrendingUp, 
  Package, 
  Calculator,
  CircleDot,
  Box,
  Link as LinkIcon,
  Triangle,
  Square,
  Circle,
  Wrench,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateRatesWhatsAppLink, openWhatsApp } from '@/lib/whatsapp';

// Map category names to Lucide icons
const getCategoryIcon = (nameEn: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'TMT Sariya': <CircleDot className="h-6 w-6" />,
    'Cement': <Box className="h-6 w-6" />,
    'Binding Wire': <LinkIcon className="h-6 w-6" />,
    'MS Angles': <Triangle className="h-6 w-6" />,
    'MS Channels': <Square className="h-6 w-6" />,
    'Stirrups': <Circle className="h-6 w-6" />,
    'Fasteners': <Wrench className="h-6 w-6" />,
  };
  return iconMap[nameEn] || <Package className="h-6 w-6" />;
};

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-lg">
          <h1 className="text-xl font-bold text-foreground">गीता ट्रेडर्स</h1>
          <p className="text-sm text-muted-foreground">Geeta Traders</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            Mohammadabad Gohna, Mau, UP
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Today's Rate Section */}
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-muted/30 pb-3">
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
                      <Badge variant="secondary">
                        सरिया / TMT
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {sariyaRates.slice(0, 6).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
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
                      <Badge variant="secondary">
                        सीमेंट / Cement
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {cementRates.slice(0, 4).map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
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
            <Card className="cursor-pointer shadow-sm transition-all hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <div className="rounded-xl bg-primary/10 p-3">
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
            <Card className="cursor-pointer shadow-sm transition-all hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Calculator className="h-6 w-6 text-primary" />
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
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Categories / श्रेणियाँ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.id}`}
                    className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-all hover:border-primary hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      {getCategoryIcon(category.name_en)}
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium leading-tight">
                        {category.name_en}
                      </span>
                      <span className="block text-[9px] text-muted-foreground hindi-text">
                        {category.name_hi}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome / Login prompt */}
        {!user && (
          <Card className="border-dashed shadow-sm">
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
