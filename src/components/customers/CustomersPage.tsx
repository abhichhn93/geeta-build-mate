import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Star,
  IndianRupee,
  CreditCard,
  Search,
  Plus,
  Phone,
  MapPin,
  StarOff,
} from 'lucide-react';
import { CustomerEditModal } from './CustomerEditModal';
import { cn } from '@/lib/utils';

export function CustomersPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { customers, isLoading, metrics, updateCustomer } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query)
    );
  });

  const toggleFavourite = (customer: Customer) => {
    updateCustomer.mutate({
      id: customer.id,
      updates: { is_regular: !customer.is_regular },
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4 p-4 pb-20">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-4">
        <Card className="max-w-sm text-center">
          <CardContent className="pt-6">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">
              {language === 'en' ? 'Admin Access Only' : 'केवल एडमिन के लिए'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === 'en'
                ? 'This page is only accessible to administrators.'
                : 'यह पेज केवल एडमिन के लिए है।'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-20">
      {/* Page Title */}
      <h1 className="text-xl font-bold">
        {language === 'en' ? 'Customers' : 'ग्राहक'}
      </h1>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-primary/20 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Total' : 'कुल'}
              </p>
              <p className="text-xl font-bold">{metrics.totalCustomers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-amber-500/20 p-2">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Regular' : 'नियमित'}
              </p>
              <p className="text-xl font-bold">{metrics.regularCustomers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-destructive/20 p-2">
              <IndianRupee className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Pending' : 'बकाया'}
              </p>
              <p className="text-xl font-bold">
                ₹{metrics.totalPendingAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-green-500/20 p-2">
              <CreditCard className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Credit Limit' : 'क्रेडिट लिमिट'}
              </p>
              <p className="text-xl font-bold">
                ₹{metrics.totalCreditLimit.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={language === 'en' ? 'Search customers...' : 'ग्राहक खोजें...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                {searchQuery
                  ? language === 'en'
                    ? 'No customers found'
                    : 'कोई ग्राहक नहीं मिला'
                  : language === 'en'
                  ? 'No customers yet'
                  : 'अभी तक कोई ग्राहक नहीं'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setEditingCustomer(customer)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{customer.name}</h3>
                      {customer.is_regular && (
                        <Badge variant="secondary" className="shrink-0 bg-amber-500/10 text-amber-600">
                          <Star className="mr-1 h-3 w-3" />
                          {language === 'en' ? 'Regular' : 'नियमित'}
                        </Badge>
                      )}
                    </div>

                    {customer.phone && (
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{customer.phone}</span>
                      </div>
                    )}

                    {customer.address && (
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavourite(customer);
                      }}
                    >
                      {customer.is_regular ? (
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? 'Balance' : 'बकाया'}
                      </p>
                      <p
                        className={cn(
                          'font-semibold',
                          Number(customer.current_balance) > 0
                            ? 'text-destructive'
                            : 'text-green-600'
                        )}
                      >
                        ₹{Number(customer.current_balance || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingCustomer && (
        <CustomerEditModal
          customer={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
        />
      )}

      {/* Add Modal */}
      <CustomerEditModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}
