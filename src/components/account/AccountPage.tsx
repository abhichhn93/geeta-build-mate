import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, User, Phone, Mail, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function AccountPage() {
  const { user, role, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8">
            <p className="text-muted-foreground">Please login to view your account</p>
            <p className="text-sm text-muted-foreground hindi-text">
              अपना खाता देखने के लिए लॉगिन करें
            </p>
            <Link to="/auth">
              <Button className="mt-4">Login / लॉगिन</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Account / खाता</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              Profile / प्रोफाइल
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={isAdmin ? 'default' : 'secondary'}>
                    <Shield className="mr-1 h-3 w-3" />
                    {role || 'customer'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.user_metadata?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.user_metadata.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Links / त्वरित लिंक</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link to="/orders">
              <Button variant="outline" className="w-full justify-start">
                📦 My Orders
              </Button>
            </Link>
            <Link to="/calculator">
              <Button variant="outline" className="w-full justify-start">
                📐 Calculator
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin">
                  <Button variant="outline" className="w-full justify-start">
                    ⚙️ Admin Panel
                  </Button>
                </Link>
                <Link to="/billing">
                  <Button variant="outline" className="w-full justify-start">
                    🧾 Quick Bill
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out / लॉग आउट
        </Button>
      </div>
    </div>
  );
}