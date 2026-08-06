import { EnumOrderStatus, EnumRestaurantType } from "chopme-frontend-common";
import type { TFunction } from "i18next";

export const RESTAURANT_VISIBLE_ORDER_STATUSES = [
  EnumOrderStatus.PAID,
  EnumOrderStatus.CANCELLED_BY_RESTAURANT,
  EnumOrderStatus.PREPARING_ORDER,
  EnumOrderStatus.IN_DELIVERY,
  EnumOrderStatus.DELIVERED,
  EnumOrderStatus.DISBURSED,
];

export const getRestaurantTypes = (t: TFunction) => [
  { title: t("restaurantTypes.fastFood"), type: EnumRestaurantType.FAST_FOOD },
  { title: t("restaurantTypes.cafe"), type: EnumRestaurantType.CAFE },
];

export const getOrderStatusLabels = (t: TFunction) => [
  { value: EnumOrderStatus.CREATED, label: t("orderStatus.created") },
  {
    value: EnumOrderStatus.PAYMENT_INITIATED,
    label: t("orderStatus.paymentInitiated"),
  },
  {
    value: EnumOrderStatus.PAYMENT_FAILED,
    label: t("orderStatus.paymentFailed"),
  },
  { value: EnumOrderStatus.PAID, label: t("orderStatus.paid") },
  {
    value: EnumOrderStatus.CANCELLED_BY_CUSTOMER,
    label: t("orderStatus.cancelledByCustomer"),
  },
  {
    value: EnumOrderStatus.CANCELLED_BY_RESTAURANT,
    label: t("orderStatus.cancelledByRestaurant"),
  },
  {
    value: EnumOrderStatus.PREPARING_ORDER,
    label: t("orderStatus.preparingOrder"),
  },
  { value: EnumOrderStatus.IN_DELIVERY, label: t("orderStatus.inDelivery") },
  { value: EnumOrderStatus.DELIVERED, label: t("orderStatus.delivered") },
  { value: EnumOrderStatus.DISBURSED, label: t("orderStatus.disbursed") },
];
