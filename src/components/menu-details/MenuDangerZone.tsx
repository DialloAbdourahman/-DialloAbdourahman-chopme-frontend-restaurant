import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCcw, Trash2 } from "lucide-react";

interface MenuDangerZoneProps {
  isDeleted: boolean;
  onRestoreClick: () => void;
  onDeleteClick: () => void;
}

const MenuDangerZone = ({
  isDeleted,
  onRestoreClick,
  onDeleteClick,
}: MenuDangerZoneProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-red-100">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-red-600" />
        <h2 className="text-sm font-semibold text-red-600">
          {t("menus.dangerZone")}
        </h2>
      </div>
      {isDeleted ? (
        <button
          type="button"
          onClick={onRestoreClick}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-green-600 hover:bg-green-50 transition-colors"
        >
          <RefreshCcw size={16} />
          {t("menus.restore")}
        </button>
      ) : (
        <button
          type="button"
          onClick={onDeleteClick}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
          {t("menus.delete")}
        </button>
      )}
    </div>
  );
};

export default MenuDangerZone;
