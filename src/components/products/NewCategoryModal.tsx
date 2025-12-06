import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

// Available icons from Lucide
const ICON_OPTIONS = [
  { value: 'circle-dot', label: 'Circle Dot (TMT)' },
  { value: 'box', label: 'Box (Cement)' },
  { value: 'link', label: 'Link (Wire)' },
  { value: 'triangle', label: 'Triangle (Angles)' },
  { value: 'square', label: 'Square (Channels)' },
  { value: 'circle', label: 'Circle (Stirrups)' },
  { value: 'wrench', label: 'Wrench (Fasteners)' },
  { value: 'package', label: 'Package (General)' },
];

interface NewCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCategoryCreated: (categoryId: string) => void;
}

export function NewCategoryModal({ open, onClose, onCategoryCreated }: NewCategoryModalProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [icon, setIcon] = useState('package');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!nameEn.trim() || !nameHi.trim()) {
      toast.error(t('Please fill both names', 'कृपया दोनों नाम भरें'));
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name_en: nameEn.trim(),
          name_hi: nameHi.trim(),
          icon: icon,
          sort_order: 99, // Put at end
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t('Category created', 'श्रेणी बनाई गई'));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onCategoryCreated(data.id);
      onClose();
      
      // Reset form
      setNameEn('');
      setNameHi('');
      setIcon('package');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(t('Failed to create category', 'श्रेणी नहीं बनी'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('New Category', 'नई श्रेणी')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t('Name (English)', 'नाम (अंग्रेज़ी)')}</Label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. TMT Sariya"
            />
          </div>
          
          <div>
            <Label>{t('Name (Hindi)', 'नाम (हिंदी)')}</Label>
            <Input
              value={nameHi}
              onChange={(e) => setNameHi(e.target.value)}
              placeholder="जैसे टीएमटी सरिया"
            />
          </div>

          <div>
            <Label>{t('Icon', 'आइकन')}</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
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
