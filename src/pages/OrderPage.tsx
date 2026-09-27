import { useI18n } from "@/lib/i18n";

// Placeholder — built in a later step.
const OrderPage = () => {
  const { t } = useI18n();
  return <div className="p-6 text-muted-foreground">{t("ऑर्डर पेज — जल्द आ रहा है", "Order page — coming soon")}</div>;
};

export default OrderPage;
