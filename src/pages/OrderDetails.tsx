import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ChefHat,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  Utensils,
  XCircle,
} from "lucide-react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { KEYS } from "../utils/keys";
import {
  EnumOrderStatus,
  EnumOrderCancelledReason,
  EnumStatusCode,
  EnumStatusResponse,
  type IOrderEntity,
  type IMenuEntity,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import OrderStatusBadge from "../components/OrderStatusBadge";
import RefundStatusBadge from "../components/RefundStatusBadge";
import { OrderService } from "../services/order.service";
import { MenuService } from "../services/menu.service";
import { ComputeUtils } from "../utils/compute-utils";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();

  const [order, setOrder] = useState<IOrderEntity | null>(null);
  const [client, setClient] = useState<{
    name: string;
    phoneNumber: string;
    address?: { city: string; country: string; street?: string };
  } | null>(null);
  const [menus, setMenus] = useState<Record<string, IMenuEntity>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EnumOrderStatus | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState<EnumOrderCancelledReason>(
    EnumOrderCancelledReason.OUT_OF_STOCK,
  );

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: KEYS.GOOGLE_PLACE_API_KEY,
  });

  const fetchOrder = useCallback(async (): Promise<boolean> => {
    if (!orderId) {
      setError(t("order.invalidOrder"));
      setLoading(false);
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const orderRes = await OrderService.getRestaurantOrder(orderId);
      if (
        orderRes.data.code === EnumStatusResponse.SUCCESS &&
        orderRes.data.statusCode === EnumStatusCode.RECOVERED_SUCCESSFULLY &&
        orderRes.data.data
      ) {
        const orderData = orderRes.data.data;
        setOrder(orderData);

        try {
          const clientRes = await OrderService.getOrderClient(orderId);
          if (
            clientRes.data.code === EnumStatusResponse.SUCCESS &&
            clientRes.data.statusCode ===
              EnumStatusCode.RECOVERED_SUCCESSFULLY &&
            clientRes.data.data
          ) {
            const clientData = clientRes.data.data;
            setClient({
              name: clientData.user?.fullName ?? t("order.customer"),
              phoneNumber: clientData.phoneNumber,
              address: clientData.address,
            });
          }
        } catch {
          showErrorToast(t("order.failedToLoadClientDetails"));
        }

        const menusMap: Record<string, IMenuEntity> = {};
        await Promise.all(
          orderData.items.map(async (item) => {
            try {
              const menuRes = await MenuService.findOne(item.productId);
              if (
                menuRes.data.code === EnumStatusResponse.SUCCESS &&
                menuRes.data.statusCode ===
                  EnumStatusCode.RECOVERED_SUCCESSFULLY &&
                menuRes.data.data
              ) {
                menusMap[item.productId] = menuRes.data.data;
              }
            } catch {
              // Ignore individual menu failures
            }
          }),
        );
        setMenus(menusMap);
        return true;
      } else {
        const message = orderRes.data.message ?? t("order.orderNotFound");
        setError(message);
        showWarningToast(message);
        return false;
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      const statusCode = err.response?.data?.statusCode;

      switch (statusCode) {
        case EnumStatusCode.ORDER_NOT_FOUND:
        case EnumStatusCode.NOT_FOUND:
          setError(t("order.orderNotFound"));
          showWarningToast(t("order.orderNotFound"));
          break;
        case EnumStatusCode.VALIDATION_ERROR:
          setError(t("order.checkOrderInformation"));
          showWarningToast(t("order.checkOrderInformation"));
          break;
        case EnumStatusCode.INTERNAL_SERVER_ERROR:
          setError(t("common.somethingWentWrong"));
          showErrorToast(t("common.somethingWentWrong"));
          break;
        default:
          const message =
            err.response?.data?.message ?? t("common.somethingWentWrong");
          setError(message);
          showErrorToast(message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const handleUpdateStatus = (status: EnumOrderStatus) => {
    if (!order || !orderId) return;
    setPendingStatus(status);
    setShowStatusModal(true);
  };

  const statusUpdateMessages: Partial<Record<EnumOrderStatus, string>> = {
    [EnumOrderStatus.PREPARING_ORDER]: "notification.preparingOrder",
    [EnumOrderStatus.IN_DELIVERY]: "notification.inDelivery",
    [EnumOrderStatus.DELIVERED]: "notification.delivered",
  };

  const confirmUpdateStatus = async () => {
    if (!order || !orderId || !pendingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await OrderService.updateOrderStatus(orderId, pendingStatus);
      if (
        res.data.code === EnumStatusResponse.SUCCESS &&
        res.data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY &&
        res.data.data
      ) {
        setOrder(res.data.data);
        const messageKey = statusUpdateMessages[pendingStatus];
        showSuccessToast(messageKey ? t(messageKey) : t("order.statusUpdated"));
      } else {
        showWarningToast(res.data.message ?? t("order.couldNotUpdateStatus"));
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err.response?.data?.statusCode) {
        case EnumStatusCode.INVALID_STATUS_TRANSITION:
          showWarningToast(t("order.invalidStatusTransition"));
          break;
        case EnumStatusCode.ORDER_NOT_FOUND:
          showWarningToast(t("order.orderNotFound"));
          break;
        default:
          showErrorToast(t("order.couldNotUpdateStatus"));
      }
    } finally {
      setUpdatingStatus(false);
      setShowStatusModal(false);
      setPendingStatus(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!order || !orderId) return;
    setCancelling(true);
    try {
      const res = await OrderService.cancelOrderRestaurant(
        orderId,
        cancelReason,
      );
      if (
        res.data.code === EnumStatusResponse.SUCCESS &&
        res.data.statusCode === EnumStatusCode.CANCELLED_SUCCESSFULLY &&
        res.data.data
      ) {
        setOrder(res.data.data);
        showSuccessToast(t("order.orderCancelled"));
      } else {
        showWarningToast(res.data.message ?? t("order.couldNotCancelOrder"));
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err.response?.data?.statusCode) {
        case EnumStatusCode.ORDER_CANNOT_BE_UPDATED:
          showWarningToast(t("order.orderCanOnlyBeCancelledWhenPaid"));
          break;
        case EnumStatusCode.ORDER_NOT_FOUND:
          showWarningToast(t("order.orderNotFound"));
          break;
        default:
          showErrorToast(t("order.couldNotCancelOrder"));
      }
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const getAllowedNextStatuses = (status?: EnumOrderStatus) => {
    switch (status) {
      case EnumOrderStatus.PAID:
        return [
          EnumOrderStatus.PREPARING_ORDER,
          EnumOrderStatus.IN_DELIVERY,
          EnumOrderStatus.DELIVERED,
        ];
      case EnumOrderStatus.PREPARING_ORDER:
        return [EnumOrderStatus.IN_DELIVERY, EnumOrderStatus.DELIVERED];
      case EnumOrderStatus.IN_DELIVERY:
        return [EnumOrderStatus.DELIVERED];
      default:
        return [];
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-6 space-y-4">
          <div className="h-8 w-32 bg-card rounded-xl animate-pulse" />
          <div className="h-32 bg-card rounded-2xl animate-pulse" />
          <div className="h-48 bg-card rounded-2xl animate-pulse" />
          <div className="h-64 bg-card rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <Link
            to={"/orders"}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            {t("common.back")}
          </Link>
          <div className="bg-card rounded-2xl p-8 text-center shadow-sm">
            <p className="text-text font-semibold">
              {error ?? t("order.orderNotFound")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isCancelled =
    order.status === EnumOrderStatus.CANCELLED_BY_RESTAURANT ||
    order.status === EnumOrderStatus.CANCELLED_BY_CUSTOMER;

  const canCancel =
    !isCancelled &&
    (order.status === EnumOrderStatus.PAID ||
      order.status === EnumOrderStatus.PREPARING_ORDER ||
      order.status === EnumOrderStatus.IN_DELIVERY);

  const nextStatuses = getAllowedNextStatuses(order.status);

  const statusIcons: Partial<Record<EnumOrderStatus, React.ReactNode>> = {
    [EnumOrderStatus.PREPARING_ORDER]: <ChefHat size={18} />,
    [EnumOrderStatus.IN_DELIVERY]: <Truck size={18} />,
    [EnumOrderStatus.DELIVERED]: <PackageCheck size={18} />,
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <Link
          to={"/orders"}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <ShoppingBag size={22} className="text-primary" />
            {t("order.orderDetails")}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrder}
              disabled={loading || updatingStatus || cancelling}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-50 transition-colors"
              aria-label={t("order.refreshOrder")}
            >
              <RefreshCw size={18} />
            </button>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {isCancelled && (
          <div className="bg-card rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-red-700">
                {order.status === EnumOrderStatus.CANCELLED_BY_RESTAURANT
                  ? t("order.cancelledByRestaurant")
                  : t("order.cancelledByCustomer")}
              </p>
              {order.refundStatus && (
                <RefundStatusBadge status={order.refundStatus} />
              )}
            </div>
            {order.cancelledAt && (
              <p className="text-xs text-red-600/80 mt-0.5">
                {t("order.cancelledAt")}{" "}
                {ComputeUtils.formatDate(order.cancelledAt)}
              </p>
            )}
            {order.orderCancelReason && (
              <p className="text-xs text-red-600/80 mt-0.5">
                {t("order.reason")}{" "}
                {ComputeUtils.formatCancelledReason(t, order.orderCancelReason)}
              </p>
            )}
          </div>
        )}

        {client && (
          <div className="bg-card rounded-2xl p-4 shadow-sm mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
              {t("order.customer")}
            </p>
            <p className="text-sm font-semibold text-text">{client.name}</p>
            {client.phoneNumber && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <Phone size={12} />
                {client.phoneNumber}
              </p>
            )}
            {client.address && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <MapPin size={12} />
                {[
                  client.address.street,
                  client.address.city,
                  client.address.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4 mb-4">
          <h2 className="text-sm font-semibold text-text">
            {t("order.items")}
          </h2>
          {order.items.map((item) => {
            const menu = menus[item.productId];
            const unitPrice = item.priceWithPlatformPercentage ?? 0;
            const lineTotal = unitPrice * item.quantity;

            return (
              <div
                key={item.productId}
                className="flex items-center gap-4 border-b border-gray-100 last:border-0 pb-4 last:pb-0"
              >
                <div className="shrink-0 w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center">
                  <Utensils size={20} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {menu?.name ?? t("order.menuItem")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t("order.quantity", { qty: item.quantity })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text">
                    {lineTotal.toLocaleString()} FCFA
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("order.priceEach", {
                      price: unitPrice.toLocaleString(),
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-2 mb-4">
          <h2 className="text-sm font-semibold text-text mb-2">
            {t("order.pricing")}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("order.subtotal")}</span>
            <span className="text-sm font-medium text-text">
              {order.pricing.restaurantAmount.toLocaleString()} FCFA
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("order.delivery")}</span>
            <span className="text-sm font-medium text-text">
              {order.pricing.deliveryFeeAmount.toLocaleString()} FCFA
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-500">{t("order.total")}</span>
            <span className="text-lg font-bold text-text">
              {order.pricing.restaurantAmountWithDelivery.toLocaleString()} FCFA
            </span>
          </div>
        </div>

        {nextStatuses.length > 0 && (
          <div className="space-y-2 mb-4">
            {nextStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleUpdateStatus(status)}
                disabled={updatingStatus}
                className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {updatingStatus ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  (statusIcons[status] ?? null)
                )}
                {ComputeUtils.formatStatus(t, status)}
              </button>
            ))}
          </div>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            disabled={updatingStatus || cancelling}
            className="w-full mb-4 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <XCircle size={18} />
            {t("order.cancelOrder")}
          </button>
        )}

        {order.clientLocation?.coordinates?.length === 2 && (
          <div className="bg-card rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-primary" />
              <h2 className="font-semibold text-text">
                {t("order.clientLocation")}
              </h2>
            </div>

            {isLoaded && (
              <div className="h-64 sm:h-80 rounded-2xl overflow-hidden mb-3">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={{
                    lat: order.clientLocation.coordinates[1],
                    lng: order.clientLocation.coordinates[0],
                  }}
                  zoom={15}
                >
                  <Marker
                    position={{
                      lat: order.clientLocation.coordinates[1],
                      lng: order.clientLocation.coordinates[0],
                    }}
                  />
                </GoogleMap>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${order.clientLocation.coordinates[1]},${order.clientLocation.coordinates[0]}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Navigation size={18} />
              {t("order.showItinerary")}
            </button>
          </div>
        )}

        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-text mb-4">
            {t("order.orderHistory")}
          </h2>
          <div className="relative pl-4 space-y-6">
            <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gray-200" />
            {order.statusTransitions.map((transition, index) => (
              <div key={index} className="relative">
                <span
                  className={`absolute -left-[11px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                    index === order.statusTransitions.length - 1
                      ? "bg-primary"
                      : "bg-gray-300"
                  }`}
                />
                <p className="text-sm font-medium text-text">
                  {ComputeUtils.formatStatus(t, transition.status)}
                </p>
                <p className="text-xs text-gray-500">
                  {ComputeUtils.formatDate(transition.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showStatusModal}
        setOpen={setShowStatusModal}
        title={t("order.updateStatus")}
        description={
          pendingStatus
            ? t("order.updateStatusDescription", {
                status: ComputeUtils.formatStatus(t, pendingStatus),
              })
            : ""
        }
        confirmText={t("common.confirm")}
        loading={updatingStatus}
        onConfirm={confirmUpdateStatus}
      />

      <Modal
        open={showCancelModal}
        setOpen={setShowCancelModal}
        title={t("order.cancelOrder")}
        textButton={t("order.cancelOrder")}
        loading={cancelling}
        onValidate={handleConfirmCancel}
        xlSize="1"
      >
        <div className="space-y-4">
          <p className="text-sm text-text/70">
            {t("order.cancelRestaurantDescription")}
          </p>
          <div>
            <label className="block text-xs font-semibold text-text uppercase tracking-wide mb-1.5">
              {t("order.cancelReason")}
            </label>
            <select
              value={cancelReason}
              onChange={(e) =>
                setCancelReason(e.target.value as EnumOrderCancelledReason)
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary"
            >
              {Object.values(EnumOrderCancelledReason).map((reason) => (
                <option key={reason} value={reason}>
                  {ComputeUtils.formatCancelledReason(t, reason)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetails;
