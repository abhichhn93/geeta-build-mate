import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import logo from "@/assets/geeta-traders-logo.png";

/**
 * One-time admin login. The email carries both a link and a 6-digit code.
 * The code matters on iPhone: a home-screen PWA doesn't share storage with Safari,
 * so tapping the link would log in Safari, not the installed app.
 */
const Login = () => {
  const { t, toggle } = useI18n();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
    });
    setBusy(false);
    if (error) {
      toast.error(t("ईमेल नहीं भेजा जा सका", "Could not send email"), { description: error.message });
      return;
    }
    setSent(true);
    toast.success(t("ईमेल भेज दिया गया", "Email sent"));
  };

  const verify = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) toast.error(t("कोड गलत है", "Wrong code"), { description: error.message });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6 bg-background">
      <button onClick={toggle} className="absolute top-4 right-4 text-sm text-muted-foreground min-h-11 px-3">
        {t("English", "हिंदी")}
      </button>
      <img src={logo} alt="" className="h-20 w-20 rounded-2xl" />
      <h1 className="text-2xl font-semibold">{t("गीता ट्रेडर्स", "Geeta Traders")}</h1>

      <div className="w-full max-w-sm space-y-3">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("आपका ईमेल", "Your email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={sent}
          className="h-12 text-base"
        />

        {sent && (
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t("ईमेल में आया कोड", "Code from email")}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            maxLength={8}
            className="h-12 text-base tracking-widest text-center"
          />
        )}

        <Button
          className="w-full h-12 text-base"
          disabled={busy || !email.includes("@") || (sent && code.length < 6)}
          onClick={sent ? verify : sendCode}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {sent ? t("लॉगिन करें", "Log in") : t("कोड भेजें", "Send code")}
        </Button>

        {sent && (
          <button onClick={() => { setSent(false); setCode(""); }} className="w-full text-sm text-muted-foreground min-h-11">
            {t("दूसरा ईमेल डालें", "Use a different email")}
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
