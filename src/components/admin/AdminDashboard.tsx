import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, Navigate } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  IndianRupee,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  Phone,
  Activity,
  Receipt,
  ShoppingBag,
  Eye
} from 'lucide-react';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useProductStocks } from '@/hooks/useProductStocks';
import { useCustomers } from '@/hooks/useCustomers';
import { useMemo, useState } from 'react';
import { CustomerDetailDrawer, TallyCustomer } from './CustomerDetailDrawer';
import { RateSlider } from '@/components/home/RateSlider';

// Stock data from Excel (extracted values)
const STOCK_DATA = {
  totalStockValue: 19825647.52,
  categoryBreakdown: [
    { nameEn: 'TMT Bars (Sariya)', nameHi: 'टीएमटी सरिया', value: 7730132.36, qty: '99,418 kg' },
    { nameEn: 'MS Pipe', nameHi: 'एमएस पाइप', value: 3917039.82, qty: '65,118 kg' },
    { nameEn: 'Structural Steel', nameHi: 'स्ट्रक्चरल स्टील', value: 2621591.76, qty: '71,681 kg' },
    { nameEn: 'Sheets / Roofing', nameHi: 'शीट / छत', value: 780600.98, qty: '12,064 kg' },
    { nameEn: 'GI & Solar', nameHi: 'जीआई और सोलर', value: 667192.33, qty: '10,979 kg' },
    { nameEn: 'Cement', nameHi: 'सीमेंट', value: 9551.15, qty: '333 bag' },
  ],
  lastUpdated: '2025-12-11',
};

// Sales data from Excel
const SALES_DATA = {
  totalSales: 16894220.45,
  trend: '+12%',
  topCategories: [
    { name: 'TMT Bars', value: 8945000 },
    { name: 'MS Pipe', value: 3210000 },
    { name: 'Structural Steel', value: 2890000 },
  ],
};

// Purchase data from Excel
const PURCHASE_DATA = {
  totalPurchases: 14235890.32,
  trend: '+8%',
};

// ===== TALLY DATA: Top 20 Customers by Pending Balance =====
const TOP_CUSTOMERS_OUTSTANDING: TallyCustomer[] = [
  { name: 'Shashikant Yadav', phone: '9452616678', pendingAmount: 717928.80, lastTransactionDate: '2025-12-01', lastTransactionType: 'Sales', lastTransactionAmount: 45000 },
  { name: 'Vicky (D.J.)', phone: '9696967838', pendingAmount: 458389.00, lastTransactionDate: '2025-11-28', lastTransactionType: 'Sales', lastTransactionAmount: 32000 },
  { name: 'Sunil Vishwakarma', phone: '7897928239', pendingAmount: 387467.00, lastTransactionDate: '2025-12-06', lastTransactionType: 'Sales', lastTransactionAmount: 13475 },
  { name: 'Pradeep Singh', phone: null, pendingAmount: 343861.95, lastTransactionDate: '2025-11-25', lastTransactionType: 'Sales', lastTransactionAmount: 28000 },
  { name: 'Guddu Yadav', phone: '7084710842', pendingAmount: 298449.75, lastTransactionDate: '2025-11-30', lastTransactionType: 'Receipt', lastTransactionAmount: 15000 },
  { name: 'Gabbar', phone: '7355441648', pendingAmount: 209744.60, lastTransactionDate: '2025-11-22', lastTransactionType: 'Sales', lastTransactionAmount: 18500 },
  { name: 'Jai Maa Sharada Sathiyaon', phone: '8542048760', pendingAmount: 186766.00, lastTransactionDate: '2025-11-20', lastTransactionType: 'Sales', lastTransactionAmount: 42000 },
  { name: 'Shailendra Chauhan', phone: '9006397289', pendingAmount: 176685.00, lastTransactionDate: '2025-12-02', lastTransactionType: 'Receipt', lastTransactionAmount: 25000 },
  { name: 'Manoj Chauhan (Pradhan)', phone: null, pendingAmount: 171437.00, lastTransactionDate: '2025-12-10', lastTransactionType: 'Sales', lastTransactionAmount: 108463 },
  { name: 'Virju Chauhan', phone: '8090297213', pendingAmount: 161533.00, lastTransactionDate: '2025-12-08', lastTransactionType: 'Receipt', lastTransactionAmount: 50000 },
  { name: 'Gajendra Singh', phone: '8858199540', pendingAmount: 148007.00, lastTransactionDate: '2025-11-18', lastTransactionType: 'Sales', lastTransactionAmount: 22000 },
  { name: 'Ajit Jaishwal', phone: '7007132038', pendingAmount: 143461.00, lastTransactionDate: '2025-11-15', lastTransactionType: 'Sales', lastTransactionAmount: 35000 },
  { name: 'Devendra Singh Sutrahi', phone: '9643260597', pendingAmount: 133279.00, lastTransactionDate: '2025-11-28', lastTransactionType: 'Receipt', lastTransactionAmount: 20000 },
  { name: 'Bhusuvan', phone: null, pendingAmount: 132909.00, lastTransactionDate: '2025-11-10', lastTransactionType: 'Sales', lastTransactionAmount: 28000 },
  { name: 'Lallu Tiwari Calender', phone: '9454739494', pendingAmount: 130477.00, lastTransactionDate: '2025-12-01', lastTransactionType: 'Sales', lastTransactionAmount: 15500 },
  { name: 'Harikesh Pradhan', phone: null, pendingAmount: 127445.00, lastTransactionDate: '2025-11-05', lastTransactionType: 'Sales', lastTransactionAmount: 32000 },
  { name: 'Ajay Chauhan', phone: '8604324364', pendingAmount: 127218.00, lastTransactionDate: '2025-12-03', lastTransactionType: 'Receipt', lastTransactionAmount: 10000 },
  { name: 'Virju Chauhan 2', phone: null, pendingAmount: 116005.00, lastTransactionDate: '2025-10-28', lastTransactionType: 'Sales', lastTransactionAmount: 45000 },
  { name: 'Tarikh Khan', phone: null, pendingAmount: 115286.00, lastTransactionDate: '2025-12-08', lastTransactionType: 'Sales', lastTransactionAmount: 3309 },
  { name: 'Ramvijay Yadav', phone: '9721236879', pendingAmount: 106131.00, lastTransactionDate: '2025-11-25', lastTransactionType: 'Receipt', lastTransactionAmount: 8000 },
];

// ===== TALLY DATA: Recent Activity Feed (Last 30 Transactions) =====
interface RecentActivity {
  customerName: string;
  phone: string | null;
  date: string;
  type: 'Sales' | 'Receipt';
  amount: number;
}

const RECENT_ACTIVITY: RecentActivity[] = [
  { customerName: 'Bittu Sutrahi Bagal Me', phone: null, date: '2025-12-11', type: 'Receipt', amount: 40000 },
  { customerName: 'Manoj Chauhan (Pradhan)', phone: null, date: '2025-12-10', type: 'Sales', amount: 108463 },
  { customerName: 'Rajan Yadav', phone: '9795858550', date: '2025-12-09', type: 'Sales', amount: 4838 },
  { customerName: 'Ajay Yadav Baniyapar', phone: '8853879868', date: '2025-12-08', type: 'Receipt', amount: 2140 },
  { customerName: 'Virju Chauhan', phone: '8090297213', date: '2025-12-08', type: 'Receipt', amount: 50000 },
  { customerName: 'Harendra Chaurasiya', phone: '8090611832', date: '2025-12-08', type: 'Receipt', amount: 14000 },
  { customerName: 'Anand Vishwakarma', phone: null, date: '2025-12-08', type: 'Receipt', amount: 40000 },
  { customerName: 'Tarikh Khan', phone: null, date: '2025-12-08', type: 'Sales', amount: 3309 },
  { customerName: 'Pradeep (Ramsakal)', phone: null, date: '2025-12-08', type: 'Receipt', amount: 11000 },
  { customerName: 'Baburam Chauhan', phone: '8009821771', date: '2025-12-08', type: 'Receipt', amount: 6695 },
  { customerName: 'Brijesh Chauhan', phone: '8604343689', date: '2025-12-08', type: 'Sales', amount: 7725 },
  { customerName: 'Baliram Plant K Pass', phone: '7021307818', date: '2025-12-08', type: 'Sales', amount: 18231 },
  { customerName: 'Manish Singh Sutrahi', phone: '7458840909', date: '2025-12-08', type: 'Sales', amount: 704 },
  { customerName: 'Jhavhari', phone: '7752917330', date: '2025-12-07', type: 'Receipt', amount: 6908 },
  { customerName: 'Nasir', phone: '8604400551', date: '2025-12-06', type: 'Receipt', amount: 17113 },
  { customerName: 'Sunil Vishwakarma', phone: '7897928239', date: '2025-12-06', type: 'Sales', amount: 13475 },
  { customerName: 'Brijesh Yadav', phone: null, date: '2025-12-05', type: 'Receipt', amount: 1000 },
  { customerName: 'Anjesh', phone: '9795266297', date: '2025-12-05', type: 'Receipt', amount: 8350 },
  { customerName: 'Ravindra Yadav', phone: '8009844683', date: '2025-12-05', type: 'Receipt', amount: 50000 },
  { customerName: 'Jagmohan Yadav', phone: '7068429124', date: '2025-12-05', type: 'Receipt', amount: 10000 },
];

export function AdminDashboard() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: stocks } = useProductStocks();
  const { customers, metrics } = useCustomers();
  
  // State for customer detail drawer
  const [selectedCustomer, setSelectedCustomer] = useState<TallyCustomer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Calculate low stock items
  const lowStockItems = useMemo(() => {
    if (!stocks) return [];
    return stocks.filter(s => s.stock_status === 'low_stock' || s.stock_status === 'out_of_stock');
  }, [stocks]);

  // Get top 8 customers for display
  const topCustomers = TOP_CUSTOMERS_OUTSTANDING.slice(0, 8);
  
  // Get latest 10 activities
  const recentActivities = RECENT_ACTIVITY.slice(0, 10);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getPendingBadge = (amount: number) => {
    if (amount >= 300000) {
      return <Badge className="bg-destructive/20 text-destructive text-[9px] px-1.5">🔴</Badge>;
    } else if (amount >= 100000) {
      return <Badge className="bg-warning/20 text-warning text-[9px] px-1.5">🟡</Badge>;
    }
    return <Badge className="bg-success/20 text-success text-[9px] px-1.5">🟢</Badge>;
  };

  const handleCustomerClick = (customer: TallyCustomer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const handleActivityCustomerClick = (activity: RecentActivity) => {
    // Find matching customer from top customers or create temporary one
    const existingCustomer = TOP_CUSTOMERS_OUTSTANDING.find(
      c => c.name === activity.customerName
    );
    
    if (existingCustomer) {
      setSelectedCustomer(existingCustomer);
    } else {
      // Create a temporary customer object for activity-only customers
      setSelectedCustomer({
        name: activity.customerName,
        phone: activity.phone,
        pendingAmount: 0, // Unknown pending
        lastTransactionDate: activity.date,
        lastTransactionType: activity.type,
        lastTransactionAmount: activity.amount,
      });
    }
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-lg">
          <h1 className="text-lg font-bold">{t('Admin Dashboard', 'एडमिन डैशबोर्ड')}</h1>
          <p className="text-xs text-muted-foreground">
            {t('Last updated', 'अंतिम अपडेट')}: {STOCK_DATA.lastUpdated}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg p-4 space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Stock Value */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {t('Stock Value', 'स्टॉक मूल्य')}
                </span>
              </div>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(STOCK_DATA.totalStockValue)}
              </p>
            </CardContent>
          </Card>

          {/* Total Sales */}
          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {t('Sales', 'बिक्री')}
                </span>
                <Badge className="bg-success/20 text-success text-[8px] px-1 py-0">
                  {SALES_DATA.trend}
                </Badge>
              </div>
              <p className="text-lg font-bold text-success">
                {formatCurrency(SALES_DATA.totalSales)}
              </p>
            </CardContent>
          </Card>

          {/* Total Purchases */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {t('Purchases', 'खरीद')}
                </span>
                <Badge className="bg-blue-500/20 text-blue-500 text-[8px] px-1 py-0">
                  {PURCHASE_DATA.trend}
                </Badge>
              </div>
              <p className="text-lg font-bold text-blue-500">
                {formatCurrency(PURCHASE_DATA.totalPurchases)}
              </p>
            </CardContent>
          </Card>

          {/* Customers */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-orange-500" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {t('Customers', 'ग्राहक')}
                </span>
              </div>
              <p className="text-lg font-bold text-orange-500">
                {TOP_CUSTOMERS_OUTSTANDING.length}+
              </p>
              <p className="text-[9px] text-muted-foreground">
                {t('Pending', 'बकाया')}: {formatCurrency(
                  TOP_CUSTOMERS_OUTSTANDING.reduce((sum, c) => sum + c.pendingAmount, 0)
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Banner Preview Section */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                {t('Rate Banner Preview', 'रेट बैनर प्रीव्यू')}
              </CardTitle>
              <Link to="/rates">
                <Button variant="outline" size="sm" className="h-6 text-[10px]">
                  {t('Edit Rates', 'रेट संपादित करें')}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <RateSlider />
          </CardContent>
        </Card>

        {/* SECTION A: Top Customers - Outstanding */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-destructive" />
                {t('Top Customers – Outstanding', 'शीर्ष ग्राहक – बकाया')}
              </CardTitle>
              <Badge variant="secondary" className="text-[9px]">
                {t('Top 8', 'टॉप 8')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-2">
              {topCustomers.map((customer, index) => (
                <button
                  key={index}
                  onClick={() => handleCustomerClick(customer)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-medium text-xs">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" />
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold">
                      {formatFullCurrency(customer.pendingAmount)}
                    </span>
                    {getPendingBadge(customer.pendingAmount)}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SECTION B: Recent Activity */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t('Recent Activity', 'हाल की गतिविधि')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-2">
              {recentActivities.map((activity, index) => (
                <button
                  key={index}
                  onClick={() => handleActivityCustomerClick(activity)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'Receipt' 
                        ? 'bg-success/10' 
                        : 'bg-blue-500/10'
                    }`}>
                      {activity.type === 'Receipt' ? (
                        <Receipt className="h-3 w-3 text-success" />
                      ) : (
                        <ShoppingBag className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{activity.customerName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {activity.type === 'Receipt' 
                          ? t('Payment Received', 'भुगतान प्राप्त')
                          : t('Sales', 'बिक्री')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${
                      activity.type === 'Receipt' ? 'text-success' : 'text-foreground'
                    }`}>
                      {activity.type === 'Receipt' ? '+' : ''}{formatFullCurrency(activity.amount)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm text-warning">
                  {t('Low Stock Alert', 'कम स्टॉक चेतावनी')}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {lowStockItems.length} {t('items', 'आइटम')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <Link to="/products">
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                  {t('View Products', 'प्रोडक्ट देखें')}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Inventory Breakdown */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {t('Inventory by Category', 'श्रेणी अनुसार इन्वेंटरी')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {STOCK_DATA.categoryBreakdown.map((category, index) => {
              const percentage = (category.value / STOCK_DATA.totalStockValue) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">
                      {language === 'en' ? category.nameEn : category.nameHi}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {category.qty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium w-12 text-right">
                      {formatCurrency(category.value)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-sm">
              {t('Quick Actions', 'त्वरित कार्य')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <Link to="/billing">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  {t('Quick Bill', 'क्विक बिल')}
                </Button>
              </Link>
              <Link to="/rates">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  {t('Update Rates', 'रेट अपडेट')}
                </Button>
              </Link>
              <Link to="/customers">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  {t('Customers', 'ग्राहक')}
                </Button>
              </Link>
              <Link to="/orders">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  {t('Orders', 'ऑर्डर')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Data Sync Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">
              {t('Dashboard data synced from Tally Excel exports. Values are aggregated.', 'डैशबोर्ड डेटा टैली एक्सेल एक्सपोर्ट से सिंक किया गया। मान एकत्रित हैं।')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        customer={selectedCustomer}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
