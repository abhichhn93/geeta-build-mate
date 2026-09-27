import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Loader2, MessageCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { fetchCatalog, todayISO } from "@/lib/catalog";
import { buildRateMessage, orderLink, waLink } from "@/lib/message";

type Settings = Record<string, string>;
type VipCustomer = { id: string; name: string | null; link_token: string; phone: string | null };

async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase.from("app_settings").select("key, value");
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.key, r.value ?? ""]));
}

async function fetchVipCustomers(): Promise<VipCustomer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, link_token, customer_phones(phone, is_primary)")
    .eq("tier", "vip")
    .eq("opted_out", false)
    .order("created_at");
  if (error) throw error;
  return data.map((c) => {
    const phones = c.customer_phones as { phone: string; is_primary: boolean }[];
    const primary = phones.find((p) => p.is_primary) ?? phones[0];
    return { id: c.id, name: c.name, link_token: c.link_token, phone: primary?.phone ?? null };
  });
}

async function fetchTodaySends(): Promise<{ vip: Set<string>; broadcastSent: boolean }> {
  const { data, error } = await supabase
    .from("sends")
    .select("customer_id, kind")
    .eq("send_date", todayISO());
  if (error) throw error;
  return {
    vip: new Set(data.filter((r) => r.kind === "vip" && r.customer_id).map((r) => r.customer_id as string)),
    broadcastSent: data.some((r) => r.kind === "broadcast"),
  };
}

const Send = () => {
  const { t } = useI18n();
  const qc = useQueryClient();

  const catalog = useQuery({ queryKey: ["catalog"], queryFn: fetchCatalog });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const vips = useQuery({ queryKey: ["vip-customers"], queryFn: fetchVipCustomers });
  const sends = useQuery({ queryKey: ["sends", todayISO()], queryFn: fetchTodaySends });

  const loading = catalog.isLoading || settings.isLoading || vips.isLoading || sends.isLoading;
  const loadError = catalog.error || settings.error || vips.error || sends.error;

  // --------------------------------------------------------- broadcast

  const [copied, setCopied] = useState(false);
  const [loggingBroadcast, setLoggingBroadcast] = useState(false);

  const broadcastMessage = useMemo(() => {
    if (!catalog.data || !settings.data) return "";
    return buildRateMessage({
      greeting: "प्रिय ग्राहक, नमस्ते 🙏",
      link: orderLink("public"),
      closingLine: settings.data.closing_line || "आपका दिन शुभ हो 🙏",
      categories: catalog.data.categories,
      variants: catalog.data.variants,
    });
  }, [catalog.data, settings.data]);

  const logBroadcastOnce = async () => {
    if (sends.data?.broadcastSent || loggingBroadcast) return;
    setLoggingBroadcast(true);
    const { error } = await supabase.from("sends").insert({ kind: "broadcast", send_date: todayISO() });
    setLoggingBroadcast(false);
    if (!error) qc.invalidateQueries({ queryKey: ["sends", todayISO()] });
  };

  const copyBroadcast = async () => {
    try {
      await navigator.clipboard.writeText(broadcastMessage);
    } catch {
      toast.error(t("कॉपी नहीं हुआ", "Copy failed"), {
        description: t("मैसेज को दबाकर खुद कॉपी करें", "Press and hold the message to copy it"),
      });
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    logBroadcastOnce();
  };

  // --------------------------------------------------------- VIP queue

  const vipList = vips.data ?? [];
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (vips.data && selected === null) setSelected(new Set(vips.data.map((c) => c.id)));
  }, [vips.data, selected]);

  const sentIds = sends.data?.vip ?? new Set<string>();
  const activeSelected = selected ?? new Set(vipList.map((c) => c.id));
  const sentCount = vipList.filter((c) => sentIds.has(c.id)).length;
  const allSelected = vipList.length > 0 && activeSelected.size === vipList.length;

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(vipList.map((c) => c.id)));

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev ?? vipList.map((c) => c.id));
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const sendToCustomer = async (customer: VipCustomer) => {
    if (!customer.phone) {
      toast.error(t("इस ग्राहक का नंबर नहीं है", "This customer has no phone number"));
      return;
    }
    if (!catalog.data || !settings.data) return;

    const message = buildRateMessage({
      greeting: `${customer.name ?? "ग्राहक"} जी, नमस्ते 🙏`,
      link: orderLink(customer.link_token),
      closingLine: settings.data.closing_line || "आपका दिन शुभ हो 🙏",
      categories: catalog.data.categories,
      variants: catalog.data.variants,
    });
    window.open(waLink(customer.phone, message), "_blank");

    if (!sentIds.has(customer.id)) {
      setBusyId(customer.id);
      const { error } = await supabase
        .from("sends")
        .insert({ customer_id: customer.id, kind: "vip", send_date: todayISO() });
      setBusyId(null);
      if (error) {
        toast.error(t("भेजा गया दर्ज नहीं हुआ", "Could not mark as sent"), { description: error.message });
        return;
      }
      qc.invalidateQueries({ queryKey: ["sends", todayISO()] });
    }

    // Scroll the next pending, selected customer into view.
    const idx = vipList.findIndex((c) => c.id === customer.id);
    const next = vipList.slice(idx + 1).find((c) => activeSelected.has(c.id) && !sentIds.has(c.id));
    if (next) rowRefs.current[next.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const resetToday = async () => {
    if (!window.confirm(t("आज के सभी VIP भेजे हुए रीसेट करें?", "Reset all VIP sends for today?"))) return;
    const { error } = await supabase.from("sends").delete().eq("send_date", todayISO()).eq("kind", "vip");
    if (error) toast.error(t("रीसेट नहीं हुआ", "Reset failed"), { description: error.message });
    else qc.invalidateQueries({ queryKey: ["sends", todayISO()] });
  };

  // --------------------------------------------------------- render

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 text-center space-y-3">
        <p>{t("लोड नहीं हुआ", "Could not load")}</p>
        <p className="text-sm text-muted-foreground">{(loadError as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Block A — Broadcast */}
      <section className="bg-card rounded-2xl shadow-sm border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">{t("ब्रॉडकास्ट (सभी ग्राहक)", "Broadcast (all customers)")}</h2>
          {sends.data?.broadcastSent && (
            <span className="text-[13px] text-success font-medium">{t("✓ आज भेजा गया", "✓ Sent today")}</span>
          )}
        </div>

        <pre className="whitespace-pre-wrap text-[14px] leading-relaxed bg-muted rounded-xl p-3 max-h-48 overflow-y-auto font-sans">
          {broadcastMessage}
        </pre>

        <Button onClick={copyBroadcast} className={cn("w-full h-12 text-[16px]", copied && "bg-success hover:bg-success")}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? t("कॉपी हो गया ✓", "Copied ✓") : t("मैसेज कॉपी करें", "Copy message")}
        </Button>
        {copied && (
          <p className="text-[13px] text-muted-foreground text-center">
            {t("WhatsApp खोलें → ब्रॉडकास्ट लिस्ट → पेस्ट करें", "Open WhatsApp → Broadcast list → Paste")}
          </p>
        )}

        <Button variant="outline" asChild className="w-full h-11">
          <a href="https://wa.me/" target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" /> {t("WhatsApp खोलें", "Open WhatsApp")}
          </a>
        </Button>
      </section>

      {/* Block B — VIP queue */}
      <section className="bg-card rounded-2xl shadow-sm border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">
            {t(`VIP — ${sentCount} / ${vipList.length} भेजा गया`, `VIP — ${sentCount} / ${vipList.length} sent`)}
          </h2>
          {sentCount > 0 && (
            <button onClick={resetToday} className="text-[13px] text-muted-foreground flex items-center gap-1 min-h-11 px-1">
              <RotateCcw className="h-3.5 w-3.5" /> {t("रीसेट", "Reset")}
            </button>
          )}
        </div>

        {vipList.length === 0 ? (
          <p className="text-[15px] text-muted-foreground py-2">
            {t("अभी कोई VIP ग्राहक नहीं है। ", "No VIP customers yet. ")}
            <Link to="/customers" className="text-primary underline">
              {t("ग्राहक तैयार करें", "Add customers")}
            </Link>
          </p>
        ) : (
          <>
            <p className="text-[13px] text-muted-foreground">
              {t(
                "एक-एक करके भेजना होगा — WhatsApp खुलेगा, भेजें दबाएँ, वापस आएँ",
                "You'll send them one by one — WhatsApp opens, tap send, come back",
              )}
            </p>

            <label className="flex items-center gap-2 py-1 min-h-11">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              <span className="text-[15px]">{t("सभी चुनें", "Select all")}</span>
            </label>

            <div className="divide-y -mx-1">
              {vipList.map((c) => {
                const isSent = sentIds.has(c.id);
                const isSelected = activeSelected.has(c.id);
                return (
                  <div
                    key={c.id}
                    ref={(el) => (rowRefs.current[c.id] = el)}
                    className={cn("flex items-center gap-3 px-1 py-2.5", !isSelected && "opacity-50")}
                  >
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(c.id)} />
                    <button
                      className="flex-1 min-w-0 text-left disabled:pointer-events-none"
                      disabled={!isSelected || !c.phone || busyId === c.id}
                      onClick={() => sendToCustomer(c)}
                    >
                      <p className="text-[16px] font-medium truncate">{c.name || t("नाम नहीं", "No name")}</p>
                      <p className="text-[13px] text-muted-foreground">{c.phone || t("नंबर नहीं", "No number")}</p>
                    </button>
                    {busyId === c.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
                    ) : (
                      <span
                        className={cn(
                          "text-[13px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap shrink-0",
                          isSent ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isSent ? t("✓ भेजा", "✓ Sent") : t("बाकी", "Pending")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Send;
