import { Toaster } from "@/components/ui/sonner";
import RequireAuth from "@/components/RequireAuth";
import { I18nProvider } from "@/lib/i18n";

const App = () => (
  <I18nProvider>
    <Toaster position="top-center" richColors />
    <RequireAuth>
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">गीता ट्रेडर्स v2</p>
      </div>
    </RequireAuth>
  </I18nProvider>
);

export default App;
