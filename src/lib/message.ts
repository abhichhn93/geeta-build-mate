import type { Category, Variant } from "@/lib/catalog";
import { variantLabel } from "@/lib/catalog";

const hiMonths = [
  "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];
const hiDays = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];

export const hindiDate = (d = new Date()) =>
  `${d.getDate()} ${hiMonths[d.getMonth()]} ${d.getFullYear()}, ${hiDays[d.getDay()]}`;

const unitParen: Record<Category["unit"], string> = {
  bag: "प्रति बोरी",
  kg: "प्रति किलो",
  piece: "प्रति पीस",
};

/**
 * The morning rate message. Same for VIP and broadcast except the greeting/link —
 * this is the single flow the spec centres everything on.
 * Skips out-of-stock and unpriced variants; nothing here should confuse an order.
 */
export function buildRateMessage(args: {
  greeting: string;
  link: string;
  closingLine: string;
  categories: Category[];
  variants: Variant[];
}) {
  const { greeting, link, closingLine, categories, variants } = args;
  const lines: string[] = [greeting, "", "*गीता ट्रेडर्स* — आज का रेट", `📅 ${hindiDate()}`, "━━━━━━━━━━━━━━"];

  for (const c of categories) {
    if (!c.is_active) continue;
    const items = variants.filter(
      (v) => v.category_id === c.id && v.is_active && v.is_available && v.price !== null,
    );
    if (items.length === 0) continue;
    lines.push("", `*${c.name_hi}* (${unitParen[c.unit]})`);
    for (const v of items) lines.push(`• ${variantLabel(v, c.name_hi)} — ₹${v.price}`);
  }

  lines.push("", "━━━━━━━━━━━━━━", "ऑर्डर करें 👇", link, "", closingLine);
  return lines.join("\n");
}

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export const orderLink = (token: string) => `${window.location.origin}/o/${token}`;
