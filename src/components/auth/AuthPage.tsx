import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  phone: z.string().optional(),
});

const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const normalizeEmail = (email: string) => email.trim().toLowerCase();


export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  React.useEffect(() => {
    document.title = isRecoveryMode ? 'Reset Password | Geeta Traders' : 'Login | Geeta Traders';
  }, [isRecoveryMode]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';

    if (params.get('mode') === 'recovery' || hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if already logged in (but never during password recovery)
  React.useEffect(() => {
    if (user && !isRecoveryMode) {
      navigate('/');
    }
  }, [user, isRecoveryMode, navigate]);

  // Show nothing while redirecting
  if (user && !isRecoveryMode) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = normalizeEmail((formData.get('email') as string) || '');
    const password = (formData.get('password') as string) || '';

    // Validate inputs
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(result.data.email, result.data.password);

    if (error) {
      const msg = /invalid login credentials/i.test(error.message)
        ? 'Wrong email or password. Use “Forgot Password” to reset it.'
        : error.message;

      toast({
        title: 'Login Failed',
        description: msg,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome!',
        description: 'Login successful',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = normalizeEmail((formData.get('email') as string) || '');
    const password = (formData.get('password') as string) || '';
    const fullName = ((formData.get('fullName') as string) || '').trim();
    const phone = (formData.get('phone') as string) || '';

    // Validate inputs with Zod
    const result = signupSchema.safeParse({ email, password, fullName, phone: phone || undefined });
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(
      result.data.email,
      result.data.password,
      result.data.fullName,
      result.data.phone || ''
    );

    if (error) {
      toast({
        title: 'Signup Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created!',
        description: 'Please check your email to confirm, then login.',
      });
    }

    setIsLoading(false);
  };

  const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = (formData.get('newPassword') as string) || '';
    const confirmPassword = (formData.get('confirmPassword') as string) || '';

    const result = setPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: result.data.password });

    if (error) {
      toast({
        title: 'Reset Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Clean up URL params/hash so refresh doesn't stay in recovery mode
      window.history.replaceState({}, document.title, '/auth');
      toast({
        title: 'Password Updated',
        description: 'You can now use the new password to login.',
      });
      setIsRecoveryMode(false);
    }

    setIsLoading(false);
  };

  const handleSendLoginLink = async () => {
    const emailInput = (document.getElementById('login-email') as HTMLInputElement | null)?.value || '';
    const email = normalizeEmail(emailInput);

    const emailCheck = z.string().email().safeParse(email);
    if (!emailCheck.success) {
      toast({
        title: 'Enter a valid email',
        description: 'Please enter your email address first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: 'Could not send login link',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Login link sent',
        description: 'Open the email and click the link to sign in (no password needed).',
      });
    }

    setIsLoading(false);
  };

  if (isRecoveryMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <h1 className="sr-only">Reset password</h1>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>Open the reset link from your email, then set a new password here.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="8+ chars, uppercase, number"
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={() => {
                  window.history.replaceState({}, document.title, '/auth');
                  setIsRecoveryMode(false);
                }}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-primary/10 p-4">
            <span className="text-4xl">🏗️</span>
          </div>
          <CardTitle className="text-2xl">गीता ट्रेडर्स</CardTitle>
          <CardDescription>Geeta Traders</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login / लॉगिन</TabsTrigger>
              <TabsTrigger value="signup">Signup / साइनअप</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email / ईमेल</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password / पासवर्ड</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs text-muted-foreground"
                      onClick={async () => {
                        const email = (document.getElementById('login-email') as HTMLInputElement)?.value;
                        if (!email || !email.includes('@')) {
                          toast({
                            title: 'Enter Email First',
                            description: 'Please enter your email address above',
                            variant: 'destructive',
                          });
                          return;
                        }
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/auth`,
                        });
                        if (error) {
                          toast({
                            title: 'Error',
                            description: error.message,
                            variant: 'destructive',
                          });
                        } else {
                          toast({
                            title: 'Reset Link Sent! / लिंक भेजा गया!',
                            description: 'Check your email for password reset link',
                          });
                        }
                      }}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Login / लॉगिन करें'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name / पूरा नाम</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Your name"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone / फोन (Optional)</Label>
                  <Input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email / ईमेल</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password / पासवर्ड</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="8+ chars, uppercase, number"
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account / खाता बनाएं'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}