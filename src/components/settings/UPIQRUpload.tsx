import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Upload, QrCode, Trash2, Image } from 'lucide-react';

export function UPIQRUpload() {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const t = (en: string, hi: string) => language === 'hi' ? hi : en;
  
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch current UPI QR URL from settings
  const { data: qrUrl, isLoading } = useQuery({
    queryKey: ['settings', 'upi_qr_url'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'upi_qr_url')
        .maybeSingle();
      
      if (error) throw error;
      return data?.value || null;
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('Please upload an image file', 'कृपया एक इमेज फ़ाइल अपलोड करें'));
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('Image must be less than 2MB', 'इमेज 2MB से कम होनी चाहिए'));
      return;
    }
    
    setUploading(true);
    
    try {
      // Delete old QR if exists
      if (qrUrl) {
        const oldPath = qrUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('settings').remove([`upi-qr/${oldPath}`]);
        }
      }
      
      // Upload new QR
      const fileExt = file.name.split('.').pop();
      const fileName = `upi-qr-${Date.now()}.${fileExt}`;
      const filePath = `upi-qr/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('settings')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('settings')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Save URL to settings
      const { error: settingsError } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'upi_qr_url', 
          value: publicUrl,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'key' 
        });
      
      if (settingsError) throw settingsError;
      
      queryClient.invalidateQueries({ queryKey: ['settings', 'upi_qr_url'] });
      toast.success(t('UPI QR code uploaded', 'UPI QR कोड अपलोड किया'));
      
      // Reset input
      e.target.value = '';
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || t('Failed to upload QR code', 'QR कोड अपलोड करने में त्रुटि'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!qrUrl) return;
    if (!confirm(t('Delete UPI QR code?', 'UPI QR कोड हटाएं?'))) return;
    
    setDeleting(true);
    
    try {
      // Delete from storage
      const pathParts = qrUrl.split('/');
      const fileName = pathParts[pathParts.length - 1];
      if (fileName) {
        await supabase.storage.from('settings').remove([`upi-qr/${fileName}`]);
      }
      
      // Remove from settings
      await supabase
        .from('app_settings')
        .delete()
        .eq('key', 'upi_qr_url');
      
      queryClient.invalidateQueries({ queryKey: ['settings', 'upi_qr_url'] });
      toast.success(t('QR code deleted', 'QR कोड हटा दिया'));
    } catch (err: any) {
      toast.error(err.message || t('Failed to delete', 'हटाने में त्रुटि'));
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {t('UPI QR Code', 'UPI QR कोड')}
        </CardTitle>
        <CardDescription>
          {t('Upload your UPI payment QR code for customers', 'ग्राहकों के लिए अपना UPI पेमेंट QR कोड अपलोड करें')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-48 w-48 mx-auto" />
        ) : qrUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img 
                src={qrUrl} 
                alt="UPI QR Code" 
                className="max-w-48 max-h-48 rounded-lg border shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <Label className="cursor-pointer">
                <Button variant="outline" size="sm" disabled={uploading} asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    {uploading ? t('Uploading...', 'अपलोड हो रहा...') : t('Replace', 'बदलें')}
                  </span>
                </Button>
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </Label>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleting ? t('Deleting...', 'हटा रहे...') : t('Delete', 'हटाएं')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Image className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t('No QR code uploaded yet', 'अभी तक कोई QR कोड अपलोड नहीं किया')}
            </p>
            <Label className="cursor-pointer">
              <Button disabled={uploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  {uploading ? t('Uploading...', 'अपलोड हो रहा...') : t('Upload QR Code', 'QR कोड अपलोड करें')}
                </span>
              </Button>
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </Label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook to fetch UPI QR URL for use in Cart/Billing pages
export function useUPIQRCode() {
  return useQuery({
    queryKey: ['settings', 'upi_qr_url'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'upi_qr_url')
        .maybeSingle();
      
      if (error) throw error;
      return data?.value || null;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
