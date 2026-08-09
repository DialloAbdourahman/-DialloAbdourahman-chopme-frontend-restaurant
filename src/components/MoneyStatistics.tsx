import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  EnumNotificationType,
  EnumOrderStatus,
  EnumRestaurantMemberRole,
  type INotification,
  type IOrderEntity,
} from "chopme-frontend-common";
import { Wallet, Clock, HandCoins, RefreshCcw } from "lucide-react";
import { OrderService } from "../services/order.service";
import type { RootState } from "../store";

type MoneyBox = {
  key: "collected" | "collectibleNow" | "collectibleAfterDelivery";
  labelKey: string;
  descriptionKey: string;
  statuses: EnumOrderStatus[];
  excludeTransferred?: boolean;
  icon: React.ReactNode;
  accentClass: string;
  iconWrapperClass: string;
};

const MONEY_BOXES: MoneyBox[] = [
  {
    key: "collected",
    labelKey: "money.collected",
    descriptionKey: "money.collectedDesc",
    statuses: [EnumOrderStatus.DISBURSED],
    icon: <Wallet size={22} />,
    accentClass: "bg-green-500",
    iconWrapperClass: "bg-green-100 text-green-600",
  },
  {
    key: "collectibleNow",
    labelKey: "money.collectibleNow",
    descriptionKey: "money.collectibleNowDesc",
    statuses: [EnumOrderStatus.DELIVERED],
    excludeTransferred: true,
    icon: <HandCoins size={22} />,
    accentClass: "bg-blue-500",
    iconWrapperClass: "bg-blue-100 text-blue-600",
  },
  {
    key: "collectibleAfterDelivery",
    labelKey: "money.collectibleAfterDelivery",
    descriptionKey: "money.collectibleAfterDeliveryDesc",
    statuses: [
      EnumOrderStatus.PAID,
      EnumOrderStatus.PREPARING_ORDER,
      EnumOrderStatus.IN_DELIVERY,
    ],
    icon: <Clock size={22} />,
    accentClass: "bg-amber-500",
    iconWrapperClass: "bg-amber-100 text-amber-600",
  },
];

type Props = {
  refreshSignal?: number;
};

const MoneyStatistics = ({ refreshSignal }: Props) => {
  const { t } = useTranslation();
  const { restaurantMember } = useSelector((state: RootState) => state.user);
  const { newNotification } = useSelector(
    (state: RootState) => state.notification,
  );

  const [amounts, setAmounts] = useState<
    Partial<Record<MoneyBox["key"], number>>
  >({});
  const [loading, setLoading] = useState(true);

  const canView = useMemo(() => {
    return restaurantMember?.role === EnumRestaurantMemberRole.OWNER;
  }, [restaurantMember]);

  const fetchAmounts = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        MONEY_BOXES.map((box) =>
          OrderService.sumRestaurantOrdersAmount(
            box.statuses,
            box.excludeTransferred,
          ),
        ),
      );

      const next: Partial<Record<MoneyBox["key"], number>> = {};
      results.forEach((res, index) => {
        next[MONEY_BOXES[index].key] = res.data.data?.total ?? 0;
      });
      setAmounts(next);
    } catch {
      // Silently ignore statistics fetch failures
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) {
      fetchAmounts();
    }
  }, [canView, fetchAmounts]);

  useEffect(() => {
    if (canView && refreshSignal !== undefined) {
      fetchAmounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  useEffect(() => {
    const notification = newNotification as INotification<IOrderEntity>;

    if (
      !notification ||
      notification.type !== EnumNotificationType.ORDER_STATUS_CHANGED ||
      notification.data.status !== EnumOrderStatus.PAID
    )
      return;

    setAmounts((prev) => ({
      ...prev,
      collectibleAfterDelivery:
        (prev.collectibleAfterDelivery ?? 0) +
        notification.data.pricing.restaurantAmountWithDelivery,
    }));
  }, [newNotification]);

  if (!canView) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">{t("money.title")}</h2>
        <button
          type="button"
          onClick={fetchAmounts}
          disabled={loading}
          className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-primary transition-colors disabled:opacity-60"
          aria-label="Refresh"
        >
          <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MONEY_BOXES.map((box) => {
          const amount = amounts[box.key] ?? 0;
          return (
            <div
              key={box.key}
              className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className={`absolute inset-x-0 top-0 h-1 ${box.accentClass}`}
              />
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${box.iconWrapperClass}`}
                >
                  {box.icon}
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-text tracking-tight">
                {loading ? (
                  <span className="inline-block h-7 w-28 animate-pulse rounded bg-gray-200" />
                ) : (
                  <>
                    {amount.toLocaleString()}{" "}
                    <span className="text-sm font-semibold text-gray-400">
                      FCFA
                    </span>
                  </>
                )}
              </p>
              <p className="mt-1 text-sm font-semibold text-text/80">
                {t(box.labelKey)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {t(box.descriptionKey)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoneyStatistics;
