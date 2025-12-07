import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useDailyRates, useUpdateDailyRate } from '@/hooks/useDailyRates';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, TrendingUp, Package } from 'lucide-react';

interface RateFormData {
  category: string;
  brand: string;
  size: string;
  price: string;
  unit: string;
}

const initialFormData: RateFormData = {
  category: 'sariya',
  brand: '',
  size: '',
  price: '',
  unit: 'kg',
};

export function RateManagementPage() {
  const { language } = useLanguage();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { data: rates, isLoading: ratesLoading } = useDailyRates();
  const updateRate = useUpdateDailyRate();
  const queryClient = useQueryClient();
  
  const t = (en: string, hi: string) => language === 'hi' ? hi : en;
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RateFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleEdit = (rate: any) => {
    setEditingId(rate.id);
    setFormData({
      category: rate.category,
      brand: rate.brand,
      size: rate.size || '',
      price: rate.price.toString(),
      unit: rate.unit,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this rate?', 'क्या आप इस रेट को हटाना चाहते हैं?'))) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('daily_rates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['daily_rates'] });
      toast.success(t('Rate deleted', 'रेट हटा दिया'));
    } catch (err) {
      toast.error(t('Failed to delete rate', 'रेट हटाने में त्रुटि'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.brand || !formData.price) {
      toast.error(t('Please fill all required fields', 'कृपया सभी आवश्यक फ़ील्ड भरें'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('daily_rates')
          .update({
            category: formData.category,
            brand: formData.brand,
            size: formData.size || null,
            price: parseFloat(formData.price),
            unit: formData.unit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success(t('Rate updated', 'रेट अपडेट किया'));
      } else {
        // Insert new
        const { error } = await supabase
          .from('daily_rates')
          .insert({
            category: formData.category,
            brand: formData.brand,
            size: formData.size || null,
            price: parseFloat(formData.price),
            unit: formData.unit,
            rate_date: today,
          });
        
        if (error) throw error;
        toast.success(t('Rate added', 'रेट जोड़ा'));
      }
      
      queryClient.invalidateQueries({ queryKey: ['daily_rates'] });
      setShowModal(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || t('Failed to save rate', 'रेट सेव करने में त्रुटि'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">{t('Access denied', 'एक्सेस अस्वीकृत')}</p>
      </div>
    );
  }

  const sariyaRates = rates?.filter(r => r.category === 'sariya') || [];
  const cementRates = rates?.filter(r => r.category === 'cement') || [];

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            {t("Today's Rates", 'आज के रेट')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-1" />
          {t('Add Rate', 'रेट जोड़ें')}
        </Button>
      </div>

      {/* Sariya Rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            {t('TMT Sariya Rates', 'TMT सरिया रेट')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ratesLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sariyaRates.length === 0 ? (
            <p className="p-4 text-muted-foreground text-center">
              {t('No sariya rates for today', 'आज के लिए कोई सरिया रेट नहीं')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Brand', 'ब्रांड')}</TableHead>
                  <TableHead>{t('Size', 'साइज़')}</TableHead>
                  <TableHead className="text-right">{t('Price', 'कीमत')}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sariyaRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.brand}</TableCell>
                    <TableCell>{rate.size || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{rate.price}/{rate.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(rate)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rate.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cement Rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            {t('Cement Rates', 'सीमेंट रेट')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ratesLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : cementRates.length === 0 ? (
            <p className="p-4 text-muted-foreground text-center">
              {t('No cement rates for today', 'आज के लिए कोई सीमेंट रेट नहीं')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Brand', 'ब्रांड')}</TableHead>
                  <TableHead>{t('Size', 'साइज़')}</TableHead>
                  <TableHead className="text-right">{t('Price', 'कीमत')}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cementRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.brand}</TableCell>
                    <TableCell>{rate.size || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{rate.price}/{rate.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(rate)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rate.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t('Edit Rate', 'रेट संपादित करें') : t('Add New Rate', 'नया रेट जोड़ें')}
            </DialogTitle>
            <DialogDescription>
              {t('Enter the rate details below', 'नीचे रेट विवरण दर्ज करें')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Category', 'श्रेणी')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v, unit: v === 'cement' ? 'bag' : 'kg' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sariya">{t('TMT Sariya', 'TMT सरिया')}</SelectItem>
                    <SelectItem value="cement">{t('Cement', 'सीमेंट')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t('Unit', 'इकाई')}</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(v) => setFormData({ ...formData, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="bag">bag</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('Brand', 'ब्रांड')} *</Label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder={t('e.g. Kamdhenu, ACC', 'जैसे कामधेनु, ACC')}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Size (optional)', 'साइज़ (वैकल्पिक)')}</Label>
                <Input
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder={t('e.g. 12mm, 50kg', 'जैसे 12mm, 50kg')}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('Price', 'कीमत')} (₹) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                {t('Cancel', 'रद्द करें')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('Saving...', 'सेव हो रहा...') : t('Save', 'सेव करें')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
