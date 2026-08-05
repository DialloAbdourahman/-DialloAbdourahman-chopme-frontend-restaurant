import { useTranslation } from "react-i18next";
import { Loader2, Power } from "lucide-react";

interface MenuAvailabilitySectionProps {
  available: boolean;
  canManage: boolean;
  toggling: boolean;
  onToggleClick: () => void;
}

const MenuAvailabilitySection = ({
  available,
  canManage,
  toggling,
  onToggleClick,
}: MenuAvailabilitySectionProps) => {
  const { t } = useTranslation();

  if (!canManage) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Power size={18} className="text-amber-700" />
        <h2 className="text-sm font-semibold text-amber-900">
          {t("menus.availabilityTitle")}
        </h2>
      </div>
      <p className="text-sm text-amber-800 mb-4">
        {t("menus.availabilityDescription")}
      </p>
      <button
        type="button"
        onClick={onToggleClick}
        disabled={toggling}
        className={`inline-flex items-center justify-center w-full sm:w-auto gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
          available
            ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
            : "bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"
        }`}
      >
        {toggling && <Loader2 size={16} className="animate-spin" />}
        {available ? t("menus.disable") : t("menus.enable")}
      </button>
    </div>
  );
};

export default MenuAvailabilitySection;
