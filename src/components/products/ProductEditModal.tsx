import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCategories, useBrands, useUpdateProduct, useCreateProduct } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';

interface Product {
  id?: string;
  name_en: string;
  name_hi: string;
  price: number;
  unit: string;
  size?: string | null;
  stock_status?: string | null;
  stock_qty?: number | null;
  category_id?: string | null;
  brand_id?: string | null;
  image_url?: string | null;
}

interface ProductEditModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function ProductEditModal({ open, onClose, product }: ProductEditModalProps) {
  const { t } = useLanguage();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();

  const [formData, setFormData] = useState<Product>({
    name_en: '',
    name_hi: '',
    price: 0,
    unit: 'kg',
    size: '',
    stock_status: 'in_stock',
    stock_qty: 0,
    category_id: null,
    brand_id: null,
    image_url: null,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name_en: product.name_en || '',
        name_hi: product.name_hi || '',
        price: product.price || 0,
        unit: product.unit || 'kg',
        size: product.size || '',
        stock_status: product.stock_status || 'in_stock',
        stock_qty: product.stock_qty || 0,
        category_id: product.category_id || null,
        brand_id: product.brand_id || null,
        image_url: product.image_url || null,
      });
    } else {
      setFormData({
        name_en: '',
        name_hi: '',
        price: 0,
        unit: 'kg',
        size: '',
        stock_status: 'in_stock',
        stock_qty: 0,
        category_id: null,
        brand_id: null,
        image_url: null,
      });
    }
  }, [product, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success(t('Image uploaded', 'फोटो अपलोड हो गई'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('Failed to upload image', 'फोटो अपलोड नहीं हुई'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.name_hi) {
      toast.error(t('Please fill product names', 'कृपया प्रोडक्ट का नाम भरें'));
      return;
    }

    setSaving(true);
    try {
      if (product?.id) {
        await updateProduct.mutateAsync({
          id: product.id,
          updates: {
            name_en: formData.name_en,
            name_hi: formData.name_hi,
            price: formData.price,
            unit: formData.unit,
            size: formData.size || null,
            stock_status: formData.stock_status,
            stock_qty: formData.stock_qty,
            category_id: formData.category_id,
            brand_id: formData.brand_id,
            image_url: formData.image_url,
          },
        });
        toast.success(t('Product updated', 'प्रोडक्ट अपडेट हो गया'));
      } else {
        await createProduct.mutateAsync({
          name_en: formData.name_en,
          name_hi: formData.name_hi,
          price: formData.price,
          unit: formData.unit,
          size: formData.size || null,
          stock_status: formData.stock_status,
          stock_qty: formData.stock_qty,
          category_id: formData.category_id,
          brand_id: formData.brand_id,
          image_url: formData.image_url,
        });
        toast.success(t('Product added', 'प्रोडक्ट जोड़ दिया गया'));
      }
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('Failed to save', 'सेव नहीं हो पाया'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? t('Edit Product', 'प्रोडक्ट एडिट करें') : t('Add Product', 'प्रोडक्ट जोड़ें')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label>{t('Product Image', 'प्रोडक्ट फोटो')}</Label>
            <div className="mt-2 flex items-center gap-3">
              {formData.image_url ? (
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                  <img src={formData.image_url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setFormData((p) => ({ ...p, image_url: null }))}
                    className="absolute top-1 right-1 rounded-full bg-destructive p-1"
                  >
                    <X className="h-3 w-3 text-destructive-foreground" />
                  </button>
                </div>
              ) : (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                </label>
              )}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('Name (English)', 'नाम (अंग्रेज़ी)')}</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData((p) => ({ ...p, name_en: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t('Name (Hindi)', 'नाम (हिंदी)')}</Label>
              <Input
                value={formData.name_hi}
                onChange={(e) => setFormData((p) => ({ ...p, name_hi: e.target.value }))}
              />
            </div>
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('Category', 'श्रेणी')}</Label>
              <Select
                value={formData.category_id || ''}
                onValueChange={(v) => setFormData((p) => ({ ...p, category_id: v || null }))}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('Brand', 'ब्रांड')}</Label>
              <Select
                value={formData.brand_id || ''}
                onValueChange={(v) => setFormData((p) => ({ ...p, brand_id: v || null }))}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {brands?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('Price (₹)', 'कीमत (₹)')}</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((p) => ({ ...p, price: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>{t('Unit', 'इकाई')}</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => setFormData((p) => ({ ...p, unit: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="piece">piece</SelectItem>
                  <SelectItem value="bag">bag</SelectItem>
                  <SelectItem value="bundle">bundle</SelectItem>
                  <SelectItem value="meter">meter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Size */}
          <div>
            <Label>{t('Size', 'साइज़')}</Label>
            <Input
              value={formData.size || ''}
              placeholder="e.g. 10mm, 50kg, 20 gauge"
              onChange={(e) => setFormData((p) => ({ ...p, size: e.target.value }))}
            />
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('Stock Status', 'स्टॉक स्थिति')}</Label>
              <Select
                value={formData.stock_status || 'in_stock'}
                onValueChange={(v) => setFormData((p) => ({ ...p, stock_status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">{t('In Stock', 'स्टॉक में')}</SelectItem>
                  <SelectItem value="low_stock">{t('Low Stock', 'कम स्टॉक')}</SelectItem>
                  <SelectItem value="out_of_stock">{t('Out of Stock', 'स्टॉक खत्म')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('Stock Qty', 'स्टॉक मात्रा')}</Label>
              <Input
                type="number"
                value={formData.stock_qty || 0}
                onChange={(e) => setFormData((p) => ({ ...p, stock_qty: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>{t('Cancel', 'रद्द करें')}</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('Save', 'सेव करें')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
