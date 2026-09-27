import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import logo from "@/assets/geeta-traders-logo.png";

/**
 * One-time admin login with email + password. The session then persists indefinitely.
 * Not a magic link: free-tier Supabase can't customise the email to include a code, and a
 * link opens Safari rather than the installed iPhone PWA (separate storage).
 * Accounts are created in the Supabase dashboard; public signup is disabled.
 */
const Login = () => {
  const { t, toggle } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) toast.error(t("लॉगिन नहीं हुआ", "Login failed"), { description: error.message });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6 bg-background">
      <button onClick={toggle} className="absolute top-4 right-4 text-sm text-muted-foreground min-h-11 px-3">
        {t("English", "हिंदी")}
      </button>
      <img src={logo} alt="" className="h-20 w-20 rounded-2xl" />
      <h1 className="text-2xl font-semibold">{t("गीता ट्रेडर्स", "Geeta Traders")}</h1>

      <form onSubmit={login} className="w-full max-w-sm space-y-3">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("ईमेल", "Email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 text-base"
        />
        <Input
          type="password"
          autoComplete="current-password"
          placeholder={t("पासवर्ड", "Password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 text-base"
        />
        <Button type="submit" className="w-full h-12 text-base" disabled={busy || !email.includes("@") || !password}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("लॉगिन करें", "Log in")}
        </Button>
      </form>
    </div>
  );
};

export default Login;
