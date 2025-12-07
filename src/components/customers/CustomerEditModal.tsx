import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phone: z.string().trim().max(15, 'Phone number is too long').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Address is too long').optional().or(z.literal('')),
  customer_type: z.enum(['individual', 'business']),
  credit_limit: z.number().min(0, 'Credit limit cannot be negative'),
  current_balance: z.number(),
  is_regular: z.boolean(),
});

interface CustomerEditModalProps {
  customer?: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerEditModal({ customer, open, onOpenChange }: CustomerEditModalProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { updateCustomer, createCustomer, deleteCustomer } = useCustomers();
  const isEditing = !!customer;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    customer_type: 'individual' as 'individual' | 'business',
    credit_limit: 0,
    current_balance: 0,
    is_regular: false,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        address: customer.address || '',
        customer_type: (customer.customer_type as 'individual' | 'business') || 'individual',
        credit_limit: Number(customer.credit_limit) || 0,
        current_balance: Number(customer.current_balance) || 0,
        is_regular: customer.is_regular || false,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        customer_type: 'individual',
        credit_limit: 0,
        current_balance: 0,
        is_regular: false,
      });
    }
  }, [customer, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = customerSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }

    if (isEditing) {
      updateCustomer.mutate(
        {
          id: customer.id,
          updates: {
            name: formData.name,
            phone: formData.phone || null,
            address: formData.address || null,
            customer_type: formData.customer_type,
            credit_limit: formData.credit_limit,
            current_balance: formData.current_balance,
            is_regular: formData.is_regular,
          },
        },
        {
          onSuccess: () => {
            toast({
              title: language === 'en' ? 'Updated' : 'अपडेट किया',
              description: language === 'en' ? 'Customer updated successfully' : 'ग्राहक अपडेट हो गया',
            });
            onOpenChange(false);
          },
        }
      );
    } else {
      createCustomer.mutate(
        {
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          customer_type: formData.customer_type,
          credit_limit: formData.credit_limit,
          current_balance: formData.current_balance,
          is_regular: formData.is_regular,
          user_id: null,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (customer) {
      deleteCustomer.mutate(customer.id, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isSubmitting = updateCustomer.isPending || createCustomer.isPending;
  const isDeleting = deleteCustomer.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? language === 'en'
                ? 'Edit Customer'
                : 'ग्राहक संपादित करें'
              : language === 'en'
              ? 'Add Customer'
              : 'ग्राहक जोड़ें'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'en' ? 'Name' : 'नाम'} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'en' ? 'Customer name' : 'ग्राहक का नाम'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {language === 'en' ? 'Phone' : 'फोन'}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              {language === 'en' ? 'Address' : 'पता'}
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={language === 'en' ? 'Customer address' : 'ग्राहक का पता'}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_type">
              {language === 'en' ? 'Customer Type' : 'ग्राहक प्रकार'}
            </Label>
            <Select
              value={formData.customer_type}
              onValueChange={(value: 'individual' | 'business') =>
                setFormData({ ...formData, customer_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">
                  {language === 'en' ? 'Individual' : 'व्यक्तिगत'}
                </SelectItem>
                <SelectItem value="business">
                  {language === 'en' ? 'Business' : 'व्यापार'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit_limit">
                {language === 'en' ? 'Credit Limit (₹)' : 'क्रेडिट लिमिट (₹)'}
              </Label>
              <Input
                id="credit_limit"
                type="number"
                value={formData.credit_limit}
                onChange={(e) =>
                  setFormData({ ...formData, credit_limit: Number(e.target.value) })
                }
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_balance">
                {language === 'en' ? 'Current Balance (₹)' : 'बकाया राशि (₹)'}
              </Label>
              <Input
                id="current_balance"
                type="number"
                value={formData.current_balance}
                onChange={(e) =>
                  setFormData({ ...formData, current_balance: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="is_regular" className="cursor-pointer">
              {language === 'en' ? 'Mark as Regular Customer' : 'नियमित ग्राहक के रूप में चिह्नित करें'}
            </Label>
            <Switch
              id="is_regular"
              checked={formData.is_regular}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_regular: checked })
              }
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:w-auto"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {language === 'en' ? 'Delete' : 'हटाएं'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {language === 'en' ? 'Delete Customer?' : 'ग्राहक हटाएं?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === 'en'
                        ? 'This action cannot be undone. This will permanently delete the customer record.'
                        : 'यह क्रिया पूर्ववत नहीं की जा सकती। यह ग्राहक रिकॉर्ड स्थायी रूप से हटा देगा।'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {language === 'en' ? 'Cancel' : 'रद्द करें'}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {language === 'en' ? 'Delete' : 'हटाएं'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing
                ? language === 'en'
                  ? 'Save Changes'
                  : 'परिवर्तन सहेजें'
                : language === 'en'
                ? 'Add Customer'
                : 'ग्राहक जोड़ें'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
