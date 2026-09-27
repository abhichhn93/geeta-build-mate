import { useI18n } from "@/lib/i18n";

// Placeholder — built in a later step.
const Send = () => {
  const { t } = useI18n();
  return <div className="p-6 text-muted-foreground">{t("भेजें — जल्द आ रहा है", "Send — coming soon")}</div>;
};

export default Send;
