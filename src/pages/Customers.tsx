import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, ListChecks, Loader2, Plus, RotateCcw, Search, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { orderLink } from "@/lib/message";

type Phone = { id: string; phone: string; is_primary: boolean };
type Customer = {
  id: string;
  name: string | null;
  shop_name: string | null;
  address: string | null;
  tier: "vip" | "regular";
  opted_out: boolean;
  link_token: string;
  claimed_by: string | null;
  customer_phones: Phone[];
};

async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, shop_name, address, tier, opted_out, link_token, claimed_by, customer_phones(id, phone, is_primary)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Customer[];
}

const primaryPhone = (c: Customer) => c.customer_phones.find((p) => p.is_primary)?.phone ?? c.customer_phones[0]?.phone ?? "";

// ---------------------------------------------------------------- copy helper

const copyText = async (text: string, onDone: () => void) => {
  try {
    await navigator.clipboard.writeText(text);
    onDone();
  } catch {
    toast.error("कॉपी नहीं हुआ");
  }
};

// ---------------------------------------------------------------- reconcile sheet

const ReconcileSheet = ({ customers, open, onOpenChange }: { customers: Customer[]; open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const list = customers
    .filter((c) => !c.opted_out)
    .flatMap((c) => c.customer_phones.map((p) => `${p.phone}${c.name ? ` — ${c.name}` : ""}`));
  const text = list.join("\n");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("ब्रॉडकास्ट लिस्ट मिलाएँ", "Reconcile broadcast list")}</SheetTitle>
        </SheetHeader>
        <p className="text-[14px] text-muted-foreground py-2">
          {t(
            `${list.length} नंबर — इसे WhatsApp ब्रॉडकास्ट लिस्ट से मिलाएँ`,
            `${list.length} numbers — compare against your WhatsApp broadcast list`,
          )}
        </p>
        <pre className="whitespace-pre-wrap text-[14px] bg-muted rounded-xl p-3 max-h-[50vh] overflow-y-auto font-sans">{text}</pre>
        <SheetFooter>
          <Button className={cn("w-full h-12", copied && "bg-success hover:bg-success")} onClick={() => copyText(text, () => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("कॉपी हो गया ✓", "Copied ✓") : t("पूरी लिस्ट कॉपी करें", "Copy full list")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// ---------------------------------------------------------------- add sheet

const AddSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const reset = () => { setName(""); setShopName(""); setPhone(""); setAddress(""); setErr(""); };

  const save = async () => {
    if (phone.length !== 10) { setErr(t("सही 10 अंकों का नंबर डालें", "Enter a valid 10-digit number")); return; }
    setBusy(true);
    setErr("");
    const { data: cust, error } = await supabase
      .from("customers")
      .insert({ name: name.trim() || null, shop_name: shopName.trim() || null, address: address.trim() || null })
      .select()
      .single();
    if (error || !cust) {
      setBusy(false);
      setErr(error?.message ?? t("सेव नहीं हुआ", "Could not save"));
      return;
    }
    const { error: pErr } = await supabase.from("customer_phones").insert({ customer_id: cust.id, phone, is_primary: true });
    setBusy(false);
    if (pErr) {
      setErr(pErr.code === "23505" ? t("यह नंबर पहले से है", "This number already exists") : pErr.message);
      return;
    }
    reset();
    onOpenChange(false);
    qc.invalidateQueries({ queryKey: ["customers"] });
    toast.success(t("ग्राहक जोड़ा गया", "Customer added"));
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>{t("नया ग्राहक", "New customer")}</SheetTitle></SheetHeader>
        <div className="space-y-3 py-4">
          <Input placeholder={t("नाम", "Name")} value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" />
          <Input placeholder={t("दुकान का नाम", "Shop name")} value={shopName} onChange={(e) => setShopName(e.target.value)} className="h-12 text-base" />
          <Input inputMode="numeric" placeholder={t("मोबाइल नंबर *", "Mobile number *")} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-12 text-base" />
          <Input placeholder={t("पता", "Address")} value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 text-base" />
          {err && <p className="text-destructive text-[14px]">{err}</p>}
        </div>
        <SheetFooter>
          <Button className="w-full h-12" disabled={busy || phone.length !== 10} onClick={save}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("जोड़ें", "Add")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// ---------------------------------------------------------------- edit sheet

const EditSheet = ({ customer, onOpenChange }: { customer: Customer | null; onOpenChange: (v: boolean) => void }) => {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [name, setName] = useState(customer?.name ?? "");
  const [shopName, setShopName] = useState(customer?.shop_name ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [newPhone, setNewPhone] = useState("");
  const [addingPhone, setAddingPhone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!customer) return null;
  const c = customer;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["customers"] });

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("customers")
      .update({ name: name.trim() || null, shop_name: shopName.trim() || null, address: address.trim() || null })
      .eq("id", c.id);
    setBusy(false);
    if (error) return toast.error(t("सेव नहीं हुआ", "Could not save"), { description: error.message });
    invalidate();
    onOpenChange(false);
  };

  const addPhone = async () => {
    if (newPhone.length !== 10) return;
    setAddingPhone(true);
    const { error } = await supabase.from("customer_phones").insert({ customer_id: c.id, phone: newPhone, is_primary: false });
    setAddingPhone(false);
    if (error) {
      toast.error(error.code === "23505" ? t("यह नंबर पहले से है", "This number already exists") : t("जोड़ नहीं पाए", "Could not add"));
      return;
    }
    setNewPhone("");
    invalidate();
  };

  const resetLink = async () => {
    const { error } = await supabase.from("customers").update({ claimed_by: null }).eq("id", c.id);
    if (error) return toast.error(t("रीसेट नहीं हुआ", "Reset failed"));
    invalidate();
    toast.success(t("लिंक रीसेट हो गया", "Link reset"));
  };

  const toggleOptedOut = async (v: boolean) => {
    const { error } = await supabase.from("customers").update({ opted_out: v }).eq("id", c.id);
    if (error) return toast.error(t("बदल नहीं पाया", "Could not update"));
    invalidate();
  };

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>{t("ग्राहक बदलें", "Edit customer")}</SheetTitle></SheetHeader>
        <div className="space-y-3 py-4">
          <Input placeholder={t("नाम", "Name")} value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" />
          <Input placeholder={t("दुकान का नाम", "Shop name")} value={shopName} onChange={(e) => setShopName(e.target.value)} className="h-12 text-base" />
          <Input placeholder={t("पता", "Address")} value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 text-base" />

          <div>
            <p className="text-[13px] text-muted-foreground mb-1">{t("नंबर", "Numbers")}</p>
            <div className="space-y-1">
              {c.customer_phones.map((p) => (
                <p key={p.id} className="text-[15px]">{p.phone} {p.is_primary && <span className="text-muted-foreground">({t("मुख्य", "primary")})</span>}</p>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input inputMode="numeric" placeholder={t("दूसरा नंबर", "Another number")} value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-11" />
              <Button variant="outline" className="h-11" disabled={newPhone.length !== 10 || addingPhone} onClick={addPhone}>
                {addingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-[15px]">{t("ऑर्डर लिस्ट से हटाएँ", "Opted out")}</span>
            <Switch checked={c.opted_out} onCheckedChange={toggleOptedOut} />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => copyText(orderLink(c.link_token), () => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); })}>
              {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {t("लिंक कॉपी करें", "Copy link")}
            </Button>
            <Button variant="outline" className="flex-1 h-11" onClick={resetLink} disabled={!c.claimed_by}>
              <RotateCcw className="h-4 w-4" /> {t("लिंक रीसेट करें", "Reset link")}
            </Button>
          </div>
        </div>
        <SheetFooter>
          <Button className="w-full h-12" disabled={busy} onClick={save}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("सेव करें", "Save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// ---------------------------------------------------------------- row

const CustomerRow = ({ customer, onEdit }: { customer: Customer; onEdit: () => void }) => {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const toggleVip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    const next = customer.tier === "vip" ? "regular" : "vip";
    const { error } = await supabase.from("customers").update({ tier: next }).eq("id", customer.id);
    setBusy(false);
    if (error) return toast.error(t("बदल नहीं पाया", "Could not update"));
    qc.invalidateQueries({ queryKey: ["customers"] });
  };

  return (
    <button onClick={onEdit} className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left", customer.opted_out && "opacity-50")}>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-medium truncate">{customer.name || t("नाम नहीं", "No name")}</p>
        <p className="text-[13px] text-muted-foreground truncate">
          {[customer.shop_name, primaryPhone(customer)].filter(Boolean).join(" · ")}
          {customer.opted_out && ` · ${t("हटाया गया", "opted out")}`}
        </p>
      </div>
      <div onClick={toggleVip} className="h-11 w-11 flex items-center justify-center shrink-0">
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
          <Star className={cn("h-5 w-5", customer.tier === "vip" ? "fill-warning text-warning" : "text-muted-foreground/40")} />
        )}
      </div>
    </button>
  );
};

// ---------------------------------------------------------------- page

const Customers = () => {
  const { t } = useI18n();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.shop_name?.toLowerCase().includes(q) ||
        c.customer_phones.some((p) => p.phone.includes(q)),
    );
  }, [data, query]);

  if (isLoading) {
    return <div className="p-4 space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p>{t("ग्राहक लोड नहीं हुए", "Could not load customers")}</p>
        <Button onClick={() => refetch()} className="h-11">{t("दोबारा कोशिश करें", "Try again")}</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-8">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("नाम या नंबर खोजें", "Search name or number")} value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 pl-9" />
        </div>
        <Button variant="outline" className="h-11 px-3" onClick={() => setReconcileOpen(true)} aria-label={t("लिस्ट मिलाएँ", "Reconcile list")}>
          <ListChecks className="h-4 w-4" />
        </Button>
        <Button className="h-11 px-3" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{query ? t("कोई ग्राहक नहीं मिला", "No customers found") : t("अभी कोई ग्राहक नहीं है", "No customers yet")}</p>
      ) : (
        <div className="bg-card rounded-2xl border divide-y">
          {filtered.map((c) => (
            <CustomerRow key={c.id} customer={c} onEdit={() => setEditing(c)} />
          ))}
        </div>
      )}

      <AddSheet open={addOpen} onOpenChange={setAddOpen} />
      <ReconcileSheet customers={data ?? []} open={reconcileOpen} onOpenChange={setReconcileOpen} />
      {editing && <EditSheet customer={editing} onOpenChange={(v) => !v && setEditing(null)} />}
    </div>
  );
};

export default Customers;
