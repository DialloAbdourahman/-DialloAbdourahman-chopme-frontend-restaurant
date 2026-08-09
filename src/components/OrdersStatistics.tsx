import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  EnumNotificationType,
  EnumOrderStatus,
  type INotification,
  type IOrderEntity,
} from "chopme-frontend-common";
import { Bell, ChefHat, PackageCheck, RefreshCcw, Truck } from "lucide-react";
import { OrderService } from "../services/order.service";
import type { RootState } from "../store";

type StatBox = {
  status: EnumOrderStatus;
  labelKey: string;
  icon: React.ReactNode;
  accentClass: string;
  iconWrapperClass: string;
};

const STAT_BOXES: StatBox[] = [
  {
    status: EnumOrderStatus.PAID,
    labelKey: "home.newOrders",
    icon: <Bell size={20} />,
    accentClass: "bg-green-500",
    iconWrapperClass: "bg-green-100 text-green-600",
  },
  {
    status: EnumOrderStatus.PREPARING_ORDER,
    labelKey: "orderStatus.preparingOrder",
    icon: <ChefHat size={20} />,
    accentClass: "bg-amber-500",
    iconWrapperClass: "bg-amber-100 text-amber-600",
  },
  {
    status: EnumOrderStatus.IN_DELIVERY,
    labelKey: "orderStatus.inDelivery",
    icon: <Truck size={20} />,
    accentClass: "bg-blue-500",
    iconWrapperClass: "bg-blue-100 text-blue-600",
  },
  {
    status: EnumOrderStatus.DELIVERED,
    labelKey: "orderStatus.delivered",
    icon: <PackageCheck size={20} />,
    accentClass: "bg-purple-500",
    iconWrapperClass: "bg-purple-100 text-purple-600",
  },
];

const OrdersStatistics = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { newNotification } = useSelector(
    (state: RootState) => state.notification,
  );

  const [counts, setCounts] = useState<
    Partial<Record<EnumOrderStatus, number>>
  >({});
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        STAT_BOXES.map((box) => OrderService.countRestaurantOrders(box.status)),
      );

      const next: Partial<Record<EnumOrderStatus, number>> = {};
      results.forEach((res, index) => {
        next[STAT_BOXES[index].status] = res.data.data?.total ?? 0;
      });
      setCounts(next);
    } catch {
      // Silently ignore statistics fetch failures
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBoxClick = (status: EnumOrderStatus) => {
    navigate(`/orders?status=${status}`);
  };

  useEffect(() => {
    const notification = newNotification as INotification<IOrderEntity>;

    if (
      !notification ||
      notification.type !== EnumNotificationType.ORDER_STATUS_CHANGED ||
      notification.data.status !== EnumOrderStatus.PAID
    )
      return;

    setCounts((prev) => ({
      ...prev,
      [EnumOrderStatus.PAID]: (prev[EnumOrderStatus.PAID] ?? 0) + 1,
    }));
  }, [newNotification]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">{t("home.statistics")}</h2>
        <button
          type="button"
          onClick={fetchCounts}
          disabled={loading}
          className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-primary transition-colors disabled:opacity-60"
          aria-label="Refresh"
        >
          <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAT_BOXES.map((box) => {
          const isNewOrders = box.status === EnumOrderStatus.PAID;
          const count = counts[box.status] ?? 0;
          return (
            <button
              key={box.status}
              type="button"
              onClick={() => handleBoxClick(box.status)}
              className={`relative overflow-hidden flex flex-col gap-1 rounded-2xl bg-white p-5 text-left shadow-sm transition-all hover:shadow-md active:scale-95 ${
                isNewOrders && count > 0 ? "ring-2 ring-primary" : ""
              }`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-1 ${box.accentClass}`}
              />
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${box.iconWrapperClass}`}
              >
                {box.icon}
              </div>
              <p className="mt-3 text-2xl font-bold text-text tracking-tight">
                {loading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                ) : (
                  count
                )}
              </p>
              <p className="text-xs font-medium text-gray-400">
                {t(box.labelKey)}
              </p>
              {isNewOrders && count > 0 && (
                <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersStatistics;
