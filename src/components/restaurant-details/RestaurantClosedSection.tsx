import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2 } from "lucide-react";

interface RestaurantClosedSectionProps {
  isClosed: boolean;
  togglingClosed: boolean;
  onOpenModal: () => void;
}

const RestaurantClosedSection = ({
  isClosed,
  togglingClosed,
  onOpenModal,
}: RestaurantClosedSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={18} className="text-red-800" />
        <h2 className="text-sm font-semibold text-red-800">
          {t("restaurantDetails.dangerZone")}
        </h2>
      </div>
      <p className="text-sm text-red-700 mb-3">
        {t("restaurantDetails.closedDescription")}
      </p>
      <button
        type="button"
        onClick={onOpenModal}
        disabled={togglingClosed}
        className={`inline-flex items-center justify-center w-full sm:w-auto rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          isClosed
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
      >
        {togglingClosed && <Loader2 size={16} className="animate-spin" />}
        {isClosed ? t("restaurantDetails.open") : t("restaurantDetails.close")}
      </button>
    </div>
  );
};

export default RestaurantClosedSection;
