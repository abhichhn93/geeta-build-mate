import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { productImage, variantLabel } from "@/lib/catalog";
import { hindiDate } from "@/lib/message";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-mark.png";

type Item = {
  variant_id: string;
  category_hi: string;
  category_en: string;
  unit: "bag" | "kg" | "piece";
  image_key: string | null;
  brand: string | null;
  size: string | null;
  available: boolean;
  price: number | null;
};

type PageData = { customer_name: string | null; customer_phone: string | null; shop_phone: string; items: Item[] };
type Phase = "loading" | "catalog" | "invalid" | "claimed" | "success";

const unitParen: Record<Item["unit"], string> = { bag: "प्रति बोरी", kg: "प्रति किलो", piece: "प्रति पीस" };

const deviceId = () => {
  try {
    let id = localStorage.getItem("gt_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("gt_device_id", id);
    }
    return id;
  } catch {
    return crypto.randomUUID(); // private browsing — claim still works for this visit
  }
};

const downloadVCard = (phone: string) => {
  const tel = phone.startsWith("+") ? phone : `+${phone}`;
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:गीता ट्रेडर्स\nN:;गीता ट्रेडर्स;;;\nTEL;TYPE=CELL:${tel}\nEND:VCARD\n`;
  const url = URL.createObjectURL(new Blob([vcard], { type: "text/vcard" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "गीता-ट्रेडर्स.vcf";
  a.click();
  URL.revokeObjectURL(url);
};

const OrderPage = () => {
  const { token } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<PageData | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetched right on load, no tap-through. Safe: WhatsApp's link-preview
  // fetch only reads static HTML/meta tags — it never runs this app's JS,
  // so it can never trigger the device claim below.
  useEffect(() => {
    if (!token) return setPhase("invalid");
    (async () => {
      const { data: res, error } = await supabase.rpc("get_order_page", {
        p_token: token,
        p_device: deviceId(),
      });
      if (error) return setPhase("invalid");
      const payload = res as PageData & { error?: string };
      if (payload.error === "claimed") return setPhase("claimed");
      if (payload.error === "invalid") return setPhase("invalid");
      setData(payload);
      setName(payload.customer_name ?? "");
      setPhone(payload.customer_phone ?? "");
      setPhase("catalog");
    })();
  }, [token]);

  const orderable = useMemo(() => (data?.items ?? []).filter((i) => i.price !== null), [data]);
  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of orderable) {
      if (!map.has(item.category_hi)) map.set(item.category_hi, []);
      map.get(item.category_hi)!.push(item);
    }
    return [...map.entries()];
  }, [orderable]);

  const setQty = (id: string, qty: number) =>
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  const lines = orderable.filter((i) => cart[i.variant_id] > 0);
  const total = lines.reduce((sum, i) => sum + i.price! * cart[i.variant_id], 0);
  const itemCount = lines.length;

  const submitOrder = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setFormError("सही 10 अंकों का नंबर डालें");
      return;
    }
    setFormError("");
    setPlacing(true);

    const items = lines.map((i) => ({
      variant_id: i.variant_id,
      label: variantLabel(i, i.category_hi),
      unit: i.unit,
      qty: cart[i.variant_id],
      price: i.price,
    }));

    const { error } = await supabase.rpc("place_order", {
      p_token: token,
      p_name: name.trim() || null,
      p_phone: digits,
      p_note: note.trim() || null,
      p_items: items,
    });

    setPlacing(false);
    if (error) {
      setFormError("ऑर्डर सेव नहीं हुआ, दोबारा कोशिश करें");
      return;
    }

    const summary = [
      "*नया ऑर्डर* — गीता ट्रेडर्स",
      `${name.trim() || "ग्राहक"} — ${digits}`,
      "",
      ...lines.map((i) => `• ${variantLabel(i, i.category_hi)} x ${cart[i.variant_id]} — ₹${i.price! * cart[i.variant_id]}`),
      "",
      `कुल: ₹${total}`,
      note.trim() ? `\nनोट: ${note.trim()}` : "",
    ].join("\n");
    if (data?.shop_phone) {
      window.open(`https://wa.me/${data.shop_phone.replace(/\D/g, "")}?text=${encodeURIComponent(summary)}`, "_blank");
    }
    setSheetOpen(false);
    setPhase("success");
  };

  // ---------------------------------------------------------- screens

  if (phase === "invalid") {
    return (
      <Centered>
        <p className="text-lg">यह लिंक सही नहीं है।</p>
        <p className="text-muted-foreground">गीता ट्रेडर्स से नया लिंक माँगें।</p>
      </Centered>
    );
  }

  if (phase === "claimed") {
    return (
      <Centered>
        <p className="text-lg">यह लिंक किसी और फ़ोन पर खुल चुका है।</p>
        <p className="text-muted-foreground">गीता ट्रेडर्स से नया लिंक माँगें।</p>
      </Centered>
    );
  }

  if (phase === "success") {
    return (
      <Centered>
        <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center text-3xl">✓</div>
        <p className="text-xl font-semibold">ऑर्डर भेज दिया गया</p>
        <p className="text-muted-foreground text-center">
          आपका ऑर्डर दर्ज हो गया है। गीता ट्रेडर्स जल्द आपसे संपर्क करेंगे।
        </p>
        {data?.shop_phone && (
          <Button className="h-12 mt-2" onClick={() => downloadVCard(data.shop_phone)}>
            हमारा नंबर सेव करें
          </Button>
        )}
      </Centered>
    );
  }

  if (phase === "loading") {
    return (
      <Centered>
        <img src={logo} alt="" className="h-20 w-20" />
        <h1 className="text-2xl font-display text-[#3d6b2a]">गीता ट्रेडर्स</h1>
        <p className="text-muted-foreground">आज का रेट · {hindiDate()}</p>
        <Loader2 className="h-6 w-6 animate-spin text-primary mt-2" />
      </Centered>
    );
  }

  // ---------------------------------------------------------- catalog

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-10 bg-card border-b pt-[env(safe-area-inset-top)]">
        <div className="h-16 px-4 flex items-center gap-3 max-w-2xl mx-auto">
          <img src={logo} alt="" className="h-10 w-10" />
          <div>
            <h1 className="font-display text-[20px] leading-none text-[#3d6b2a]">गीता ट्रेडर्स</h1>
            <p className="text-[13px] text-muted-foreground">आज का रेट · {hindiDate()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-3 space-y-5">
        {grouped.map(([catHi, items]) => (
          <section key={catHi}>
            <h2 className="text-[16px] font-semibold px-1 pb-1.5">
              {catHi} <span className="text-muted-foreground font-normal text-[14px]">({unitParen[items[0].unit]})</span>
            </h2>
            <div className="bg-card rounded-2xl border divide-y">
              {items.map((item) => (
                <div key={item.variant_id} className={cn("flex items-center gap-3 px-3 py-2.5", !item.available && "opacity-60")}>
                  <img src={productImage(item.image_key)} alt="" className="h-8 w-8 rounded-lg object-cover bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium truncate">{variantLabel(item, catHi)}</p>
                    {item.available ? (
                      <p className="text-[15px] font-semibold text-primary">₹{item.price}</p>
                    ) : (
                      <p className="text-[13px] text-destructive">स्टॉक ख़त्म</p>
                    )}
                  </div>
                  {item.available && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="h-9 w-9 rounded-full border flex items-center justify-center active:bg-muted disabled:opacity-30"
                        disabled={!cart[item.variant_id]}
                        onClick={() => setQty(item.variant_id, (cart[item.variant_id] ?? 0) - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-7 text-center text-[16px] font-medium">{cart[item.variant_id] ?? 0}</span>
                      <button
                        className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:opacity-80"
                        onClick={() => setQty(item.variant_id, (cart[item.variant_id] ?? 0) + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-card border-t pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-2xl mx-auto p-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[13px] text-muted-foreground">{itemCount} आइटम</p>
              <p className="text-[18px] font-semibold">₹{total}</p>
            </div>
            <Button className="h-13 px-6 text-[16px]" onClick={() => setSheetOpen(true)}>
              ऑर्डर भेजें
            </Button>
          </div>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>अपनी जानकारी दें</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 py-4">
            <Input placeholder="आपका नाम" value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" />
            <Input
              inputMode="numeric"
              placeholder="मोबाइल नंबर *"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="h-12 text-base"
            />
            <Textarea placeholder="कोई नोट? (वैकल्पिक)" value={note} onChange={(e) => setNote(e.target.value)} />
            {formError && <p className="text-destructive text-[14px]">{formError}</p>}
          </div>
          <SheetFooter>
            <Button className="w-full h-12 text-[16px]" disabled={placing} onClick={submitOrder}>
              {placing && <Loader2 className="h-4 w-4 animate-spin" />}
              ऑर्डर पक्का करें — ₹{total}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center bg-background">
    {children}
  </div>
);

export default OrderPage;
