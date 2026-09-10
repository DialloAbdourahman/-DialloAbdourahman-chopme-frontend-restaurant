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
  {
    title: t("restaurantTypes.restaurant"),
    type: EnumRestaurantType.RESTAURANT,
  },
  { title: t("restaurantTypes.fastFood"), type: EnumRestaurantType.FAST_FOOD },
  { title: t("restaurantTypes.snack"), type: EnumRestaurantType.SNACK },
  { title: t("restaurantTypes.cafe"), type: EnumRestaurantType.CAFE },
  {
    title: t("restaurantTypes.cameroonian"),
    type: EnumRestaurantType.CAMEROONIAN,
  },
  { title: t("restaurantTypes.african"), type: EnumRestaurantType.AFRICAN },
  { title: t("restaurantTypes.maquis"), type: EnumRestaurantType.MAQUIS },
  { title: t("restaurantTypes.gargote"), type: EnumRestaurantType.GARGOTE },
  { title: t("restaurantTypes.grill"), type: EnumRestaurantType.GRILL },
  {
    title: t("restaurantTypes.rotisserie"),
    type: EnumRestaurantType.ROTISSERIE,
  },
  { title: t("restaurantTypes.pizzeria"), type: EnumRestaurantType.PIZZERIA },
  { title: t("restaurantTypes.burger"), type: EnumRestaurantType.BURGER },
  { title: t("restaurantTypes.shawarma"), type: EnumRestaurantType.SHAWARMA },
  { title: t("restaurantTypes.chinese"), type: EnumRestaurantType.CHINESE },
  { title: t("restaurantTypes.indian"), type: EnumRestaurantType.INDIAN },
  { title: t("restaurantTypes.lebanese"), type: EnumRestaurantType.LEBANESE },
  { title: t("restaurantTypes.french"), type: EnumRestaurantType.FRENCH },
  { title: t("restaurantTypes.italian"), type: EnumRestaurantType.ITALIAN },
  { title: t("restaurantTypes.bakery"), type: EnumRestaurantType.BAKERY },
  { title: t("restaurantTypes.dessert"), type: EnumRestaurantType.DESSERT },
  { title: t("restaurantTypes.juiceBar"), type: EnumRestaurantType.JUICE_BAR },
  { title: t("restaurantTypes.bar"), type: EnumRestaurantType.BAR },
  { title: t("restaurantTypes.lounge"), type: EnumRestaurantType.LOUNGE },
  {
    title: t("restaurantTypes.fineDining"),
    type: EnumRestaurantType.FINE_DINING,
  },
  {
    title: t("restaurantTypes.hotelRestaurant"),
    type: EnumRestaurantType.HOTEL_RESTAURANT,
  },
  { title: t("restaurantTypes.homeCook"), type: EnumRestaurantType.HOME_COOK },
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
