import {
  EnumOrderCancelledReason,
  EnumOrderStatus,
  EnumRefundStatus,
  type IMenuEntity,
  type IRestaurantEntity,
} from "chopme-frontend-common";
import type { TFunction } from "i18next";
import { KEYS } from "./keys";
import { getOrderStatusLabels } from "./constants";

export class ComputeUtils {
  static isRestaurantClosed(
    restaurant: Pick<IRestaurantEntity, "isClosed" | "availability">,
    date: Date = new Date(),
  ): boolean {
    // Manually closed
    if (restaurant.isClosed) {
      return true;
    }

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const today = days[date.getDay()];

    const schedule = restaurant.availability.find((a) => a.day === today);

    // No opening hours for today
    if (!schedule) {
      return true;
    }

    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    const [openHour, openMinute] = schedule.openTime.split(":").map(Number);

    const [closeHour, closeMinute] = schedule.closeTime.split(":").map(Number);

    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    return currentMinutes < openMinutes || currentMinutes >= closeMinutes;
  }

  static getMenuImageUrl = (menu: IMenuEntity | undefined) => {
    if (!menu) return null;
    const img = menu.coverImage ?? menu.pictures?.[0];
    return img ? `${KEYS.PUBLIC_S3_PREFIX}/${img}` : null;
  };

  static formatStatus(t: TFunction, status: EnumOrderStatus) {
    return (
      getOrderStatusLabels(t).find((s) => s.value === status)?.label ??
      t(status)
    );
  }

  static formatDate(date: Date | string | null | undefined) {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  }

  static formatCancelledReason(t: TFunction, reason: EnumOrderCancelledReason) {
    switch (reason) {
      case EnumOrderCancelledReason.TOO_LATE:
        return t("cancelledReason.tooLate");
      case EnumOrderCancelledReason.OUT_OF_STOCK:
        return t("cancelledReason.outOfStock");
      default:
        return reason;
    }
  }

  static formatRefundStatus(t: TFunction, status: EnumRefundStatus) {
    switch (status) {
      case EnumRefundStatus.SUCCESSFUL:
        return t("refundStatus.successful");
      case EnumRefundStatus.INITIATED:
        return t("refundStatus.initiated");
      case EnumRefundStatus.FAILED:
        return t("refundStatus.failed");
      case EnumRefundStatus.FAILED_TO_INITIATE:
        return t("refundStatus.failedToInitiate");
      default:
        return status;
    }
  }
}
