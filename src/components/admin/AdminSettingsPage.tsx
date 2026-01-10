import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, Users, TrendingUp, Calculator, ScanLine, 
  ShoppingCart, ClipboardList, LogOut, User, Key, 
  Loader2, Pencil, Save, X, Mail, Phone, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const adminTools = [
  { to: '/products', icon: Package, label: 'Manage Products', labelHi: 'प्रोडक्ट्स प्रबंधन', desc: 'Add, edit, delete products', descHi: 'प्रोडक्ट जोड़ें, बदलें, हटाएं' },
  { to: '/customers', icon: Users, label: 'Customers', labelHi: 'ग्राहक', desc: 'View & manage customers', descHi: 'ग्राहक देखें व प्रबंधित करें' },
  { to: '/rates', icon: TrendingUp, label: 'Daily Rates', labelHi: 'दैनिक रेट', desc: 'Update TMT & Cement rates', descHi: 'TMT और सीमेंट के रेट अपडेट करें' },
  { to: '/orders', icon: ClipboardList, label: 'All Orders', labelHi: 'सभी ऑर्डर', desc: 'View all customer orders', descHi: 'सभी ग्राहकों के ऑर्डर देखें' },
  { to: '/billing', icon: ShoppingCart, label: 'POS Billing', labelHi: 'बिलिंग', desc: 'Create bills for walk-in', descHi: 'वॉक-इन ग्राहकों के लिए बिल बनाएं' },
  { to: '/bill-scanner', icon: ScanLine, label: 'Bill OCR Scanner', labelHi: 'बिल OCR स्कैनर', desc: 'Scan bills to extract data', descHi: 'बिल स्कैन करके डेटा निकालें' },
  { to: '/calculator', icon: Calculator, label: 'TMT Calculator', labelHi: 'TMT कैलकुलेटर', desc: 'Calculate TMT requirements', descHi: 'TMT आवश्यकता कैलकुलेट करें' },
];

export function AdminSettingsPage() {
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state (inline)
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { user, signOut, isAdmin, role } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (en: string, hi: string) => language === 'en' ? en : hi;

  // Initialize edit fields when user data loads
  useEffect(() => {
    if (user) {
      setEditName(user.user_metadata?.full_name || '');
      setEditPhone(user.user_metadata?.phone || '');
    }
  }, [user]);

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error(t('Name is required', 'नाम आवश्यक है'));
      return;
    }

    setIsSavingProfile(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
        }
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      toast.success(t('Profile updated successfully!', 'प्रोफाइल सफलतापूर्वक अपडेट हो गई!'));
      setIsEditingProfile(false);
      setShowPasswordFields(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || t('Failed to update profile', 'प्रोफाइल अपडेट करने में विफल'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error(t('Password must be at least 6 characters', 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('Passwords do not match', 'पासवर्ड मेल नहीं खाते'));
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast.success(t('Password changed successfully!', 'पासवर्ड सफलतापूर्वक बदल दिया गया!'));
      setShowPasswordFields(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || t('Failed to change password', 'पासवर्ड बदलने में विफल'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {t('Admin Panel', 'एडमिन पैनल')}
            </h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile Card with inline password change */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                {t('Account', 'खाता')}
              </CardTitle>
              {!isEditingProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  {t('Edit', 'संपादित करें')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isEditingProfile ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {user?.user_metadata?.full_name || 'Admin User'}
                    </p>
                    <Badge variant="default" className="mt-0.5 text-[10px]">
                      <Shield className="mr-1 h-2.5 w-2.5" />
                      {role || 'admin'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-lg bg-secondary/50 p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{user?.email}</span>
                  </div>
                  {user?.user_metadata?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{user.user_metadata.phone}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-edit-name" className="text-xs">
                    {t('Full Name', 'पूरा नाम')} *
                  </Label>
                  <Input
                    id="admin-edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t('Enter your name', 'अपना नाम दर्ज करें')}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-edit-phone" className="text-xs">
                    {t('Phone Number', 'फ़ोन नंबर')}
                  </Label>
                  <Input
                    id="admin-edit-phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder={t('Enter phone number', 'फ़ोन नंबर दर्ज करें')}
                    className="h-9 text-sm"
                  />
                </div>
                
                {/* Inline password change toggle */}
                {!showPasswordFields ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-muted-foreground"
                    onClick={() => setShowPasswordFields(true)}
                  >
                    <Key className="mr-2 h-3.5 w-3.5" />
                    {t('Change Password', 'पासवर्ड बदलें')}
                  </Button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{t('Change Password', 'पासवर्ड बदलें')}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setShowPasswordFields(false);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('New password', 'नया पासवर्ड')}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('Confirm password', 'पासवर्ड पुष्टि करें')}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      className="w-full h-8"
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword || !newPassword || !confirmPassword}
                    >
                      {isChangingPassword ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Key className="mr-1 h-3.5 w-3.5" />
                      )}
                      {t('Update Password', 'पासवर्ड अपडेट करें')}
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setShowPasswordFields(false);
                      setEditName(user?.user_metadata?.full_name || '');
                      setEditPhone(user?.user_metadata?.phone || '');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    {t('Cancel', 'रद्द करें')}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-3.5 w-3.5" />
                    )}
                    {t('Save', 'सेव करें')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Tools Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('Admin Tools', 'एडमिन टूल्स')}</CardTitle>
            <CardDescription className="text-xs">
              {t('Manage your store from here', 'यहाँ से अपनी दुकान प्रबंधित करें')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {adminTools.map((tool) => (
                <Card 
                  key={tool.to}
                  className="cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98] border-muted"
                  onClick={() => navigate(tool.to)}
                >
                  <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      <tool.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">
                        {t(tool.label, tool.labelHi)}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">
                        {t(tool.desc, tool.descHi)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('Sign Out', 'साइन आउट')}
        </Button>
      </div>
    </div>
  );
}
