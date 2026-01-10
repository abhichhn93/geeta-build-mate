import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, User, Phone, Mail, Shield, Check, TrendingUp, Key, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { UPIQRUpload } from '@/components/settings/UPIQRUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function AccountPage() {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { user, role, isAdmin, signOut } = useAuth();
  const { language, t } = useLanguage();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              {t('Profile', 'प्रोफाइल')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Change Password Card */}
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

        {isAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('Theme Preview', 'थीम प्रीव्यू')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
                      theme === t.name ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'
                    }`}
                  >
                    <div
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="flex-1 text-xs font-medium">{t.label}</span>
                    {theme === t.name && <Check className="h-4 w-4 text-primary" />}
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
