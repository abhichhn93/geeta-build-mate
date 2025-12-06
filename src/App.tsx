import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ThemeProvider } from "@/hooks/useTheme";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/components/home/HomePage";
import { ProductsPage } from "@/components/products/ProductsPage";
import { TMTCalculatorPage } from "@/components/calculator/TMTCalculatorPage";
import { AuthPage } from "@/components/auth/AuthPage";
import { AccountPage } from "@/components/account/AccountPage";
import { OrdersPage } from "@/components/orders/OrdersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
                <Route path="/products" element={<AppLayout><ProductsPage /></AppLayout>} />
                <Route path="/calculator" element={<AppLayout><TMTCalculatorPage /></AppLayout>} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/account" element={<AppLayout><AccountPage /></AppLayout>} />
                <Route path="/cart" element={<AppLayout><div className="p-4 text-center text-muted-foreground">Cart coming soon</div></AppLayout>} />
                <Route path="/orders" element={<AppLayout><OrdersPage /></AppLayout>} />
                <Route path="/billing" element={<AppLayout><div className="p-4 text-center text-muted-foreground">Quick Billing coming soon</div></AppLayout>} />
                <Route path="/admin" element={<AppLayout><div className="p-4 text-center text-muted-foreground">Admin Panel coming soon</div></AppLayout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
