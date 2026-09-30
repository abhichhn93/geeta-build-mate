import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, ChevronDown, ChevronRight, Loader2, Plus, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  fetchCatalog,
  productImage,
  todayISO,
  unitLabel,
  variantLabel,
  type Category,
  type Variant,
} from "@/lib/catalog";

type Catalog = Awaited<ReturnType<typeof fetchCatalog>>;

/** Patch one variant in the cached catalog so saves don't trigger a refetch/flicker. */
const usePatchVariant = () => {
  const qc = useQueryClient();
  return (id: string, patch: Partial<Variant>) =>
    qc.setQueryData<Catalog>(["catalog"], (old) =>
      old && { ...old, variants: old.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) },
    );
};

// ---------------------------------------------------------------- row

type SaveState = "idle" | "saving" | "saved" | "error";

const RateRow = ({ variant, fallbackLabel }: { variant: Variant; fallbackLabel: string }) => {
  const { t } = useI18n();
  const patch = usePatchVariant();
  const qc = useQueryClient();
  const [value, setValue] = useState(variant.price?.toString() ?? "");
  const [state, setState] = useState<SaveState>("idle");

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === "" && variant.price === null) return;
    const price = Number(trimmed);
    if (!trimmed || !Number.isFinite(price) || price <= 0) {
      toast.error(t("सही रेट डालें", "Enter a valid rate"));
      setValue(variant.price?.toString() ?? "");
      return;
    }
    if (price === variant.price) return;

    setState("saving");
    const today = todayISO();
    const { error } = await supabase
      .from("rates")
      .upsert({ variant_id: variant.id, rate_date: today, price, updated_at: new Date().toISOString() });
    if (error) {
      setState("error");
      toast.error(t("रेट सेव नहीं हुआ", "Rate not saved"), { description: error.message });
      return;
    }
    patch(variant.id, { price, rate_date: today });
    setState("saved");
    setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 2000);
  };

  const toggleAvailable = async (available: boolean) => {
    patch(variant.id, { is_available: available });
    const { error } = await supabase.from("variants").update({ is_available: available }).eq("id", variant.id);
    if (error) {
      patch(variant.id, { is_available: !available });
      toast.error(t("स्टॉक बदल नहीं पाया", "Could not change stock"), { description: error.message });
    }
  };

  const remove = async () => {
    const label = variantLabel(variant, fallbackLabel);
    if (!window.confirm(t(`"${label}" हटाएँ?`, `Remove "${label}"?`))) return;
    const { error } = await supabase.from("variants").update({ is_active: false }).eq("id", variant.id);
    if (error) toast.error(t("हटा नहीं पाए", "Could not remove"), { description: error.message });
    else qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  return (
    <div className={cn("flex items-center gap-2 py-2", !variant.is_available && "opacity-60")}>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-medium truncate">{variantLabel(variant, fallbackLabel)}</p>
        {!variant.is_available && <p className="text-[13px] text-destructive">{t("स्टॉक ख़त्म", "Out of stock")}</p>}
      </div>

      <div className="relative w-28 shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          placeholder="—"
          onChange={(e) => {
            setValue(e.target.value.replace(/[^\d.]/g, ""));
            if (state === "error") setState("idle");
          }}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={cn(
            "h-11 pl-7 pr-7 text-[17px] font-semibold text-right",
            state === "error" && "border-destructive",
          )}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {state === "saving" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {state === "saved" && <Check className="h-4 w-4 text-success" />}
          {state === "error" && (
            <button onClick={save} aria-label={t("दोबारा", "Retry")}>
              <RotateCw className="h-4 w-4 text-destructive" />
            </button>
          )}
        </span>
      </div>

      <Switch
        checked={variant.is_available}
        onCheckedChange={toggleAvailable}
        aria-label={t("स्टॉक में", "In stock")}
      />

      <button onClick={remove} className="h-11 w-8 flex items-center justify-center text-muted-foreground/60">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------- add item

const AddVariant = ({ category, nextSort }: { category: Category; nextSort: number }) => {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    const { error } = await supabase.from("variants").insert({
      category_id: category.id,
      brand: brand.trim() || null,
      size: size.trim() || null,
      sort_order: nextSort,
    });
    setBusy(false);
    if (error) {
      toast.error(t("जोड़ नहीं पाए", "Could not add"), { description: error.message });
      return;
    }
    setBrand("");
    setSize("");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  if (!open) {
    return (
      <Button variant="ghost" className="h-11 text-primary px-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {t("आइटम जोड़ें", "Add item")}
      </Button>
    );
  }

  return (
    <div className="flex gap-2 pt-2">
      <Input placeholder={t("ब्रांड", "Brand")} value={brand} onChange={(e) => setBrand(e.target.value)} className="h-11" />
      <Input placeholder={t("साइज़", "Size")} value={size} onChange={(e) => setSize(e.target.value)} className="h-11 w-24" />
      <Button className="h-11" disabled={busy || (!brand.trim() && !size.trim())} onClick={add}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("जोड़ें", "Add")}
      </Button>
    </div>
  );
};

// ---------------------------------------------------------------- add category

const unitChoices: { value: Category["unit"]; hi: string; en: string }[] = [
  { value: "kg", hi: "किलो में", en: "By kg" },
  { value: "bag", hi: "बोरी में", en: "By bag" },
  { value: "piece", hi: "पीस में", en: "By piece" },
];

const AddCategory = () => {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nameHi, setNameHi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [unit, setUnit] = useState<Category["unit"]>("kg");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!nameHi.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("categories").insert({
      name_hi: nameHi.trim(),
      name_en: nameEn.trim() || nameHi.trim(),
      unit,
      sort_order: 999,
    });
    setBusy(false);
    if (error) {
      toast.error(t("जोड़ नहीं पाए", "Could not add"), { description: error.message });
      return;
    }
    setNameHi("");
    setNameEn("");
    setUnit("kg");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["catalog"] });
    toast.success(t("नई कैटेगरी जुड़ गई", "New category added"));
  };

  if (!open) {
    return (
      <Button variant="outline" className="w-full h-12 text-primary border-dashed" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {t("नई कैटेगरी जोड़ें", "Add new category")}
      </Button>
    );
  }

  return (
    <div className="bg-card rounded-2xl border p-3 space-y-2">
      <Input placeholder={t("नाम (हिंदी में)", "Name (Hindi)")} value={nameHi} onChange={(e) => setNameHi(e.target.value)} className="h-11" />
      <Input placeholder={t("नाम (English, वैकल्पिक)", "Name (English, optional)")} value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="h-11" />
      <Select value={unit} onValueChange={(v) => setUnit(v as Category["unit"])}>
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {unitChoices.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {lang === "hi" ? u.hi : u.en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2 pt-1">
        <Button variant="ghost" className="flex-1 h-11" onClick={() => setOpen(false)}>
          {t("रद्द करें", "Cancel")}
        </Button>
        <Button className="flex-1 h-11" disabled={busy || !nameHi.trim()} onClick={save}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("जोड़ें", "Add")}
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- category card

const CategoryCard = ({
  category,
  variants,
  defaultOpen,
}: {
  category: Category;
  variants: Variant[];
  defaultOpen: boolean;
}) => {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const patch = usePatchVariant();
  const [open, setOpen] = useState(defaultOpen);
  const [confirming, setConfirming] = useState(false);

  const today = todayISO();
  const updatedToday = variants.some((v) => v.rate_date === today);
  const name = lang === "hi" ? category.name_hi : category.name_en;
  const stale = variants.filter((v) => v.price !== null && v.rate_date !== today);

  /** "Nothing moved today" — carry every price forward as today's row in one write. */
  const confirmAll = async () => {
    setConfirming(true);
    const rows = stale.map((v) => ({ variant_id: v.id, rate_date: today, price: v.price }));
    const { error } = await supabase.from("rates").upsert(rows);
    setConfirming(false);
    if (error) {
      toast.error(t("सेव नहीं हुआ", "Not saved"), { description: error.message });
      return;
    }
    stale.forEach((v) => patch(v.id, { rate_date: today }));
    toast.success(t(`${name} — आज के रेट पक्के`, `${name} — today's rates confirmed`));
  };

  const deactivate = async () => {
    if (!window.confirm(t(`"${name}" बंद करें? बाद में फिर चालू कर सकते हैं।`, `Turn off "${name}"? You can turn it back on later.`)))
      return;
    const { error } = await supabase.from("categories").update({ is_active: false }).eq("id", category.id);
    if (error) toast.error(t("बदल नहीं पाए", "Could not change"), { description: error.message });
    else qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  return (
    <section className="bg-card rounded-2xl shadow-sm border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-3 text-left min-h-16">
        <img
          src={productImage(category.image_key)}
          alt=""
          className="h-12 w-12 rounded-xl object-cover bg-muted shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-semibold leading-tight">{name}</h2>
          <p className="text-[14px] text-muted-foreground">{unitLabel(category.unit, t)}</p>
        </div>
        <span
          className={cn(
            "text-[13px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap",
            updatedToday ? "bg-success/15 text-success" : "bg-warning/15 text-[hsl(30_90%_35%)]",
          )}
        >
          {updatedToday ? t("✓ आज अपडेट", "✓ Updated") : t("⚠ अपडेट बाकी", "⚠ Pending")}
        </span>
        {open ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-3 pb-3 border-t">
          <div className="divide-y">
            {variants.map((v) => (
              <RateRow key={v.id} variant={v} fallbackLabel={name} />
            ))}
          </div>

          {stale.length > 0 && (
            <Button variant="outline" className="w-full h-11 mt-2" disabled={confirming} onClick={confirmAll}>
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t("बाकी सब रेट वही हैं", "Other rates unchanged")}
            </Button>
          )}

          <div className="flex items-center justify-between pt-1">
            <AddVariant category={category} nextSort={Math.max(0, ...variants.map((v) => v.sort_order)) + 1} />
            <Button variant="ghost" className="h-11 text-muted-foreground px-2" onClick={deactivate}>
              {t("कैटेगरी बंद करें", "Turn off category")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------- page

const Rates = () => {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["catalog"], queryFn: fetchCatalog });

  const activate = async (c: Category) => {
    const { error } = await supabase.from("categories").update({ is_active: true }).eq("id", c.id);
    if (error) toast.error(t("चालू नहीं हुआ", "Could not turn on"), { description: error.message });
    else qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p>{t("रेट लोड नहीं हुए", "Could not load rates")}</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message}</p>
        <Button onClick={() => refetch()} className="h-11">
          {t("दोबारा कोशिश करें", "Try again")}
        </Button>
      </div>
    );
  }

  const active = data.categories.filter((c) => c.is_active);
  const inactive = data.categories.filter((c) => !c.is_active);
  const today = todayISO();
  const pending = active.filter((c) => !data.variants.some((v) => v.category_id === c.id && v.rate_date === today)).length;

  return (
    <div className="p-4 space-y-3 pb-24">
      <p className="text-[15px] text-muted-foreground px-1">
        {pending === 0
          ? t("सारे रेट आज अपडेट हैं ✓", "All rates updated today ✓")
          : t(`${pending} कैटेगरी का रेट अपडेट बाकी`, `${pending} categories pending`)}
      </p>

      {active.map((c, i) => (
        <CategoryCard
          key={c.id}
          category={c}
          variants={data.variants.filter((v) => v.category_id === c.id)}
          defaultOpen={i === 0}
        />
      ))}

      <AddCategory />

      {inactive.length > 0 && (
        <div className="pt-4">
          <h3 className="text-[15px] font-medium text-muted-foreground px-1 pb-2">{t("बंद कैटेगरी", "Turned off")}</h3>
          <div className="bg-card rounded-2xl border divide-y">
            {inactive.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-3 min-h-14">
                <img src={productImage(c.image_key)} alt="" className="h-9 w-9 rounded-lg object-cover opacity-60" />
                <span className="flex-1 text-muted-foreground">{lang === "hi" ? c.name_hi : c.name_en}</span>
                <Switch checked={false} onCheckedChange={() => activate(c)} aria-label={t("चालू करें", "Turn on")} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky CTA above the bottom nav: the whole point of updating rates is sending them */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 px-4 pb-3 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <Button asChild className="w-full h-14 text-[17px] rounded-2xl shadow-lg">
            <Link to="/send">{t("आज का रेट भेजें →", "Send today's rates →")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Rates;
