import { supabase } from "@/lib/supabase";

export type Unit = "bag" | "kg" | "piece";

export type Category = {
  id: string;
  name_hi: string;
  name_en: string;
  unit: Unit;
  image_key: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Variant = {
  id: string;
  category_id: string;
  brand: string | null;
  size: string | null;
  is_available: boolean;
  sort_order: number;
  is_active: boolean;
  /** Latest price on any date — carries forward until changed. */
  price: number | null;
  rate_date: string | null;
};

const images = import.meta.glob<string>("@/assets/products/*.png", {
  eager: true,
  import: "default",
});

export const productImage = (key: string | null) =>
  key ? images[`/src/assets/products/${key}.png`] : undefined;

export const unitLabel = (unit: Unit, t: (hi: string, en: string) => string) =>
  ({
    bag: t("प्रति बोरी", "per bag"),
    kg: t("प्रति किलो", "per kg"),
    piece: t("प्रति पीस", "per piece"),
  })[unit];

export const variantLabel = (v: Pick<Variant, "brand" | "size">, fallback: string) =>
  [v.brand, v.size].filter(Boolean).join(" ") || fallback;

/**
 * Today's date in the phone's local time zone, as YYYY-MM-DD.
 * Sent explicitly instead of relying on Postgres current_date, which is UTC —
 * between midnight and 5:30am IST that would still be yesterday.
 */
export const todayISO = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export async function fetchCatalog() {
  const [cats, vars, rates] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("variants").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("latest_rates").select("variant_id, rate_date, price"),
  ]);
  const error = cats.error ?? vars.error ?? rates.error;
  if (error) throw error;

  const latest = new Map(rates.data.map((r) => [r.variant_id, r]));
  const variants: Variant[] = vars.data.map((v) => ({
    ...v,
    price: latest.get(v.id)?.price ?? null,
    rate_date: latest.get(v.id)?.rate_date ?? null,
  }));

  return { categories: cats.data as Category[], variants };
}
