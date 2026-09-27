import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, ChevronDown, ChevronRight, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type OrderItem = { id: string; label: string; unit: string; ordered_qty: number; unit_price_at_order: number | null };
type Order = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  note: string | null;
  status: "new" | "done";
  created_at: string;
  order_items: OrderItem[];
};

async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_name, customer_phone, note, status, created_at, order_items(id, label, unit, ordered_qty, unit_price_at_order)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as Order[];
}

/** "2 घंटे पहले" style, no library — the whole vocabulary is 5 words. */
function timeAgoHi(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "अभी";
  if (mins < 60) return `${mins} मिनट पहले`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} घंटे पहले`;
  const days = Math.round(hrs / 24);
  return `${days} दिन पहले`;
}

const OrderCard = ({ order }: { order: Order }) => {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isDone = order.status === "done";

  const markDone = async () => {
    setBusy(true);
    const { error } = await supabase.from("orders").update({ status: "done" }).eq("id", order.id);
    setBusy(false);
    if (error) {
      toast.error(t("बदल नहीं पाया", "Could not update"), { description: error.message });
      return;
    }
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["new-orders-count"] });
  };

  const items = order.order_items;
  const preview = items
    .slice(0, 3)
    .map((i) => `${i.label} x${i.ordered_qty}`)
    .join(", ") + (items.length > 3 ? ` +${items.length - 3}` : "");

  return (
    <div
      className={cn(
        "bg-card rounded-2xl shadow-sm border-l-4 overflow-hidden",
        isDone ? "border-l-border opacity-60" : "border-l-warning",
      )}
    >
      <button onClick={() => setOpen(!open)} className="w-full text-left p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[16px] font-semibold truncate">{order.customer_name || t("नाम नहीं", "No name")}</p>
            <p className="text-[13px] text-muted-foreground">{order.customer_phone}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[13px] text-muted-foreground">{timeAgoHi(order.created_at)}</p>
            <p className="text-[13px] text-muted-foreground">{t(`${items.length} आइटम`, `${items.length} items`)}</p>
          </div>
        </div>
        <p className="text-[14px] text-muted-foreground mt-1 truncate">{preview}</p>
        <div className="flex justify-center pt-1">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t pt-2 space-y-2">
          <div className="space-y-1">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-[15px]">
                <span>{i.label} x {i.ordered_qty}</span>
                {i.unit_price_at_order !== null && <span className="text-muted-foreground">₹{i.unit_price_at_order * i.ordered_qty}</span>}
              </div>
            ))}
          </div>
          {order.note && <p className="text-[14px] bg-muted rounded-lg p-2">{order.note}</p>}
          <div className="flex gap-2 pt-1">
            {order.customer_phone && (
              <Button variant="outline" asChild className="flex-1 h-11">
                <a href={`https://wa.me/${order.customer_phone}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> {t("WhatsApp पर जवाब दें", "Reply on WhatsApp")}
                </a>
              </Button>
            )}
            {!isDone && (
              <Button className="flex-1 h-11" disabled={busy} onClick={markDone}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t("पूरा हुआ", "Done")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Orders = () => {
  const { t } = useI18n();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p>{t("ऑर्डर लोड नहीं हुए", "Could not load orders")}</p>
        <Button onClick={() => refetch()} className="h-11">{t("दोबारा कोशिश करें", "Try again")}</Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="p-6 text-center text-muted-foreground">{t("अभी कोई ऑर्डर नहीं है", "No orders yet")}</div>;
  }

  return (
    <div className="p-4 space-y-3 pb-8">
      {data.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </div>
  );
};

export default Orders;
