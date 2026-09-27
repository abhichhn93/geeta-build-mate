import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import RequireAuth from "@/components/RequireAuth";
import AppShell from "@/components/AppShell";
import { I18nProvider } from "@/lib/i18n";
import Rates from "@/pages/Rates";
import Send from "@/pages/Send";
import Orders from "@/pages/Orders";
import Customers from "@/pages/Customers";
import OrderPage from "@/pages/OrderPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          {/* Public: customers arrive here from WhatsApp, no login */}
          <Route path="/o/:token" element={<OrderPage />} />

          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Rates />} />
            <Route path="send" element={<Send />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
