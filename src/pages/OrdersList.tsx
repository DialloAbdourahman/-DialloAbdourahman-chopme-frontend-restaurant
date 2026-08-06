import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  EnumNotificationType,
  EnumStatusCode,
  EnumStatusResponse,
  type INotification,
  type IOrderEntity,
} from "chopme-frontend-common";
import { ChevronRight, ShoppingBag } from "lucide-react";
import Navbar from "../components/Navbar";
import OrderStatusBadge from "../components/OrderStatusBadge";
import Pagination from "../components/Pagination";
import { OrderService } from "../services/order.service";
import { ComputeUtils } from "../utils/compute-utils";
import { RESTAURANT_VISIBLE_ORDER_STATUSES } from "../utils/constants";
import { showErrorToast } from "../utils/toasts";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

const LIMIT = 10;

const OrdersList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const { newNotification } = useSelector(
    (state: RootState) => state.notification,
  );

  const statusOptions = [
    { value: "", label: t("common.all") },
    ...RESTAURANT_VISIBLE_ORDER_STATUSES.map((status) => ({
      value: status,
      label: ComputeUtils.formatStatus(t, status),
    })),
  ];

  const [orders, setOrders] = useState<IOrderEntity[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const handleStatusChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set("status", value);
    } else {
      nextParams.delete("status");
    }
    setSearchParams(nextParams);
    setPage(1);
  };

  const status = searchParams.get("status") ?? "";

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await OrderService.getRestaurantOrders({
          status: status || undefined,
          page,
          limit: LIMIT,
        });

        if (
          data.code === EnumStatusResponse.SUCCESS &&
          data.statusCode === EnumStatusCode.RECOVERED_SUCCESSFULLY &&
          data.data
        ) {
          const orderItems = data.data.items;
          setOrders(orderItems);
          setTotalPages(data.data.totalPages);

          const names: Record<string, string> = {};
          await Promise.all(
            orderItems.map(async (order) => {
              try {
                const res = await OrderService.getOrderClient(order.id);
                if (
                  res.data.code === EnumStatusResponse.SUCCESS &&
                  res.data.statusCode ===
                    EnumStatusCode.RECOVERED_SUCCESSFULLY &&
                  res.data.data
                ) {
                  names[order.id] =
                    res.data.data.user?.fullName ?? t("order.customer");
                }
              } catch {
                // Ignore missing client names
              }
            }),
          );
          setClientNames(names);
        } else {
          showErrorToast(data.message ?? t("order.couldNotLoadOrders"));
        }
      } catch {
        showErrorToast(t("common.somethingWentWrong"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [status, page]);

  useEffect(() => {
    const notification = newNotification as INotification<IOrderEntity>;

    if (
      !notification ||
      notification.type !== EnumNotificationType.ORDER_STATUS_CHANGED
    )
      return;

    setOrders((prev) => [notification.data, ...prev]);

    // dispatch(setOrderStatusUpdate(null));
  }, [newNotification]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <ShoppingBag size={22} className="text-primary" />
            {t("order.orders")}
          </h1>

          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full sm:w-auto bg-card border border-border text-text text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">{t("order.noOrdersFound")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const itemCount = order.items.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="w-full flex items-center gap-3 sm:gap-4 p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag
                      size={18}
                      className="text-primary sm:w-5 sm:h-5"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-text truncate">
                        {t("order.orderHash", {
                          id: order.id.slice(-6).toUpperCase(),
                        })}
                      </p>
                      <p className="text-xs text-gray-500 text-right shrink-0">
                        {ComputeUtils.formatDate(order.createdAt)}
                      </p>
                    </div>

                    <p className="text-xs text-text/80 truncate">
                      {clientNames[order.id] ?? t("order.customer")}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-text">
                          {order.pricing.restaurantAmountWithDelivery.toLocaleString()}{" "}
                          FCFA
                        </p>
                        <span className="text-xs text-gray-500">
                          • {t("order.itemCount", { count: itemCount })}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    size={20}
                    className="text-gray-400 shrink-0 self-center hidden sm:block"
                  />
                </button>
              );
            })}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default OrdersList;
