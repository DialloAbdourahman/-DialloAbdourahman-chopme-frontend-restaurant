import { EnumOrderStatus } from "chopme-frontend-common";
import { useTranslation } from "react-i18next";
import { ComputeUtils } from "../utils/compute-utils";

type Props = {
  status: EnumOrderStatus;
};

const OrderStatusBadge = ({ status }: Props) => {
  const { t } = useTranslation();
  const label = ComputeUtils.formatStatus(t, status);

  const colorClass =
    status === EnumOrderStatus.CREATED
      ? "bg-yellow-100 text-yellow-700"
      : status === EnumOrderStatus.PAID
        ? "bg-green-100 text-green-700"
        : status === EnumOrderStatus.CANCELLED_BY_CUSTOMER ||
            status === EnumOrderStatus.CANCELLED_BY_RESTAURANT
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {label}
    </span>
  );
};

export default OrderStatusBadge;
