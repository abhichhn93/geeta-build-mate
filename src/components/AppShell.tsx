import { NavLink, Outlet } from "react-router-dom";
import { ClipboardList, IndianRupee, Send, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import logo from "@/assets/geeta-traders-logo.png";

const tabs = [
  { to: "/", hi: "रेट", en: "Rates", icon: IndianRupee },
  { to: "/send", hi: "भेजें", en: "Send", icon: Send },
  { to: "/orders", hi: "ऑर्डर", en: "Orders", icon: ClipboardList },
  { to: "/customers", hi: "ग्राहक", en: "Customers", icon: Users },
];

const AppShell = () => {
  const { t, toggle } = useI18n();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 bg-card border-b pt-[env(safe-area-inset-top)]">
        <div className="h-14 px-4 flex items-center gap-3 max-w-2xl mx-auto">
          <img src={logo} alt="" className="h-8 w-8 rounded-lg" />
          <h1 className="text-lg font-semibold flex-1">{t("गीता ट्रेडर्स", "Geeta Traders")}</h1>
          <button
            onClick={toggle}
            className="min-h-11 px-3 rounded-full border text-sm font-medium active:bg-muted"
          >
            {t("EN", "हिं")}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-card border-t pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 max-w-2xl mx-auto">
          {tabs.map(({ to, hi, en, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "h-16 flex flex-col items-center justify-center gap-1 text-[15px]",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-6 w-6" />
              {t(hi, en)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;
