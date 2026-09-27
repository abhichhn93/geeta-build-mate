import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, IndianRupee, Send, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo-mark.png";

const tabs = [
  { to: "/", hi: "रेट", en: "Rates", icon: IndianRupee },
  { to: "/send", hi: "भेजें", en: "Send", icon: Send },
  { to: "/orders", hi: "ऑर्डर", en: "Orders", icon: ClipboardList },
  { to: "/customers", hi: "ग्राहक", en: "Customers", icon: Users },
];

async function fetchNewOrderCount() {
  const { count, error } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new");
  if (error) throw error;
  return count ?? 0;
}

const AppShell = () => {
  const { t, toggle } = useI18n();
  // Polls rather than realtime — a shop with a handful of orders/day doesn't need a socket.
  const { data: newOrders } = useQuery({ queryKey: ["new-orders-count"], queryFn: fetchNewOrderCount, refetchInterval: 30_000 });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 bg-card border-b pt-[env(safe-area-inset-top)]">
        <div className="h-16 px-4 flex items-center gap-3 max-w-2xl mx-auto">
          <img src={logo} alt="" className="h-11 w-11 shrink-0" />
          <div className="flex-1 min-w-0 leading-tight">
            <h1 className="font-display text-[26px] leading-none text-[#3d6b2a] pt-1">
              {t("गीता ट्रेडर्स", "Geeta Traders")}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1 tracking-wide">
              {t("सरिया · सीमेंट · एंगल", "Sariya · Cement · Angle")}
            </p>
          </div>
          <button
            onClick={toggle}
            className="min-h-11 min-w-11 px-3 rounded-full bg-muted text-sm font-medium active:bg-border"
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
              <span className="relative">
                <Icon className="h-6 w-6" />
                {to === "/orders" && !!newOrders && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-4 text-center font-semibold">
                    {newOrders}
                  </span>
                )}
              </span>
              {t(hi, en)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;
