import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCategories } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface NewBrandModalProps {
  open: boolean;
  onClose: () => void;
  onBrandCreated: (brandId: string) => void;
}

export function NewBrandModal({ open, onClose, onBrandCreated }: NewBrandModalProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t('Please enter brand name', 'कृपया ब्रांड नाम डालें'));
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert({
          name: name.trim(),
          category_id: categoryId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t('Brand created', 'ब्रांड बनाया गया'));
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      onBrandCreated(data.id);
      onClose();
      
      // Reset form
      setName('');
      setCategoryId(null);
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error(t('Failed to create brand', 'ब्रांड नहीं बना'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('New Brand', 'नया ब्रांड')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t('Brand Name', 'ब्रांड नाम')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kamdhenu, ACC"
            />
          </div>
          
          <div>
            <Label>{t('Category (optional)', 'श्रेणी (वैकल्पिक)')}</Label>
            <Select 
              value={categoryId || 'none'} 
              onValueChange={(v) => setCategoryId(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select category', 'श्रेणी चुनें')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('No category', 'कोई श्रेणी नहीं')}</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            {t('Cancel', 'रद्द करें')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('Create', 'बनाएं')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
