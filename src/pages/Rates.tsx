import { useI18n } from "@/lib/i18n";

// Placeholder — built in a later step.
const Rates = () => {
  const { t } = useI18n();
  return <div className="p-6 text-muted-foreground">{t("रेट — जल्द आ रहा है", "Rates — coming soon")}</div>;
};

export default Rates;
