import { useI18n } from "@/lib/i18n";

// Placeholder — built in a later step.
const Customers = () => {
  const { t } = useI18n();
  return <div className="p-6 text-muted-foreground">{t("ग्राहक — जल्द आ रहा है", "Customers — coming soon")}</div>;
};

export default Customers;
