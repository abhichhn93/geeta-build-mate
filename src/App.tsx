import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ThemeProvider } from "@/hooks/useTheme";
import { CartProvider } from "@/hooks/useCart";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/components/home/HomePage";
import { ProductsPage } from "@/components/products/ProductsPage";
import { TMTCalculatorPage } from "@/components/calculator/TMTCalculatorPage";
import { AuthPage } from "@/components/auth/AuthPage";
import { AccountPage } from "@/components/account/AccountPage";
import { OrdersPage } from "@/components/orders/OrdersPage";
import { CartPage } from "@/components/cart/CartPage";
import { CustomersPage } from "@/components/customers/CustomersPage";
import { BillingPage } from "@/components/billing/BillingPage";
import { RateManagementPage } from "@/components/rates/RateManagementPage";
import { BillScannerPage } from "@/components/admin/BillScannerPage";
import { AdminSettingsPage } from "@/components/admin/AdminSettingsPage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
                  <Route path="/dashboard" element={<AppLayout><AdminDashboard /></AppLayout>} />
                  <Route path="/products" element={<AppLayout><ProductsPage /></AppLayout>} />
                  <Route path="/calculator" element={<AppLayout><TMTCalculatorPage /></AppLayout>} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/account" element={<AppLayout><AccountPage /></AppLayout>} />
                  <Route path="/cart" element={<AppLayout><CartPage /></AppLayout>} />
                  <Route path="/orders" element={<AppLayout><OrdersPage /></AppLayout>} />
                  <Route path="/billing" element={<AppLayout><BillingPage /></AppLayout>} />
                  <Route path="/customers" element={<AppLayout><CustomersPage /></AppLayout>} />
                  <Route path="/rates" element={<AppLayout><RateManagementPage /></AppLayout>} />
                  <Route path="/bill-scanner" element={<AppLayout><BillScannerPage /></AppLayout>} />
                  <Route path="/admin" element={<AppLayout><AdminSettingsPage /></AppLayout>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;