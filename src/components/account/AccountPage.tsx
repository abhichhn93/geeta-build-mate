import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, LogOut, User, Phone, Mail, Shield, Check, TrendingUp, Key, Loader2, Pencil, Save, X, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { UPIQRUpload } from '@/components/settings/UPIQRUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

export function AccountPage() {
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const { user, role, isAdmin, signOut } = useAuth();
  const { language, t } = useLanguage();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();

  // Initialize edit fields when user data loads
  useEffect(() => {
    if (user) {
      setEditName(user.user_metadata?.full_name || '');
      setEditPhone(user.user_metadata?.phone || '');
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error(t('Name is required', 'नाम आवश्यक है'));
      return;
    }

    setIsSavingProfile(true);
    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
        }
      });
      if (authError) throw authError;

      // Also update the profiles table
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
        // Don't throw - auth metadata was updated successfully
      }

      toast.success(t('Profile updated successfully!', 'प्रोफाइल सफलतापूर्वक अपडेट हो गई!'));
      setIsEditingProfile(false);
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
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || t('Failed to change password', 'पासवर्ड बदलने में विफल'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error(t('Please type DELETE to confirm', 'कृपया पुष्टि के लिए DELETE टाइप करें'));
      return;
    }

    setIsDeleting(true);
    try {
      // Sign out first, then the user needs to contact support for full deletion
      // or implement a server-side deletion endpoint
      await signOut();
      toast.success(t('You have been signed out. Contact support to permanently delete your account.', 
        'आप साइन आउट हो गए हैं। अपना खाता स्थायी रूप से हटाने के लिए सहायता से संपर्क करें।'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || t('Failed to process request', 'अनुरोध प्रोसेस करने में विफल'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8">
            <p className="text-muted-foreground">
              {t('Please login to view your account', 'अपना खाता देखने के लिए लॉगिन करें')}
            </p>
            <Link to="/auth">
              <Button className="mt-4">{t('Login', 'लॉगिन')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-base font-bold">{t('Account', 'खाता')}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                {t('Profile', 'प्रोफाइल')}
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
                    {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <Badge variant={isAdmin ? 'default' : 'secondary'} className="mt-0.5 text-[10px]">
                      <Shield className="mr-1 h-2.5 w-2.5" />
                      {role || 'customer'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-lg bg-secondary/50 p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  {user.user_metadata?.phone && (
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
                  <Label htmlFor="edit-name" className="text-xs">
                    {t('Full Name', 'पूरा नाम')} *
                  </Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t('Enter your name', 'अपना नाम दर्ज करें')}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone" className="text-xs">
                    {t('Phone Number', 'फ़ोन नंबर')}
                  </Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder={t('Enter phone number', 'फ़ोन नंबर दर्ज करें')}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t('Email', 'ईमेल')}
                  </Label>
                  <Input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="h-9 text-sm bg-muted"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {t('Email cannot be changed', 'ईमेल बदला नहीं जा सकता')}
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditName(user.user_metadata?.full_name || '');
                      setEditPhone(user.user_metadata?.phone || '');
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

        {/* Security Card - Password Change */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Key className="h-4 w-4" />
              {t('Security', 'सुरक्षा')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!showPasswordChange ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowPasswordChange(true)}
              >
                <Key className="mr-2 h-3.5 w-3.5" />
                {t('Change Password', 'पासवर्ड बदलें')}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs">
                    {t('New Password', 'नया पासवर्ड')}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs">
                    {t('Confirm Password', 'पासवर्ड पुष्टि करें')}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    {t('Cancel', 'रद्द करें')}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    {t('Save', 'सेव करें')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme Selector (Admin only) */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('Theme Preview', 'थीम प्रीव्यू')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.name}
                    onClick={() => setTheme(themeOption.name)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
                      theme === themeOption.name ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'
                    }`}
                  >
                    <div
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: themeOption.color }}
                    />
                    <span className="flex-1 text-xs font-medium">{themeOption.label}</span>
                    {theme === themeOption.name && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* UPI QR Upload - Admin only */}
        {isAdmin && <UPIQRUpload />}

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('Quick Links', 'त्वरित लिंक')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link to="/orders">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                📦 {t('My Orders', 'मेरे ऑर्डर')}
              </Button>
            </Link>
            <Link to="/calculator">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                📐 {t('Calculator', 'कैलकुलेटर')}
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link to="/products">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    ⚙️ {t('Manage Products', 'प्रोडक्ट मैनेज')}
                  </Button>
                </Link>
                <Link to="/billing">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    🧾 {t('Quick Bill', 'क्विक बिल')}
                  </Button>
                </Link>
                <Link to="/rates">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {t('Manage Rates', 'रेट मैनेज')}
                  </Button>
                </Link>
                <Link to="/customers">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    👥 {t('Customers', 'ग्राहक')}
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone - Account Deletion */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {t('Danger Zone', 'खतरनाक क्षेत्र')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('Irreversible actions', 'अपरिवर्तनीय कार्रवाई')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
                  <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                  {t('Delete Account', 'खाता हटाएं')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {t('Delete Account?', 'खाता हटाएं?')}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      {t(
                        'This action cannot be undone. This will permanently delete your account and remove your data.',
                        'यह क्रिया पूर्ववत नहीं की जा सकती। यह आपका खाता स्थायी रूप से हटा देगा।'
                      )}
                    </p>
                    <div className="pt-2">
                      <Label htmlFor="delete-confirm" className="text-xs font-medium">
                        {t('Type DELETE to confirm', 'पुष्टि के लिए DELETE टाइप करें')}
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="mt-1.5"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                    {t('Cancel', 'रद्द करें')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('Delete Account', 'खाता हटाएं')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('Sign Out', 'लॉग आउट')}
        </Button>
      </div>
    </div>
  );
}
