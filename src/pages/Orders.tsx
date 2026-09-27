import { useI18n } from "@/lib/i18n";

// Placeholder — built in a later step.
const Orders = () => {
  const { t } = useI18n();
  return <div className="p-6 text-muted-foreground">{t("ऑर्डर — जल्द आ रहा है", "Orders — coming soon")}</div>;
};

export default Orders;
