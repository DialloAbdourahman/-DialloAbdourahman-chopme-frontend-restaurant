import { EnumOrderStatus } from "chopme-frontend-common";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  HandCoins,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { ComputeUtils } from "../utils/compute-utils";

type Props = {
  status: EnumOrderStatus;
};

const STATUS_ICONS: Record<EnumOrderStatus, React.ReactNode> = {
  [EnumOrderStatus.CREATED]: <Clock size={12} />,
  [EnumOrderStatus.PAYMENT_INITIATED]: <CreditCard size={12} />,
  [EnumOrderStatus.PAYMENT_FAILED]: <XCircle size={12} />,
  [EnumOrderStatus.PAID]: <CheckCircle2 size={12} />,
  [EnumOrderStatus.PREPARING_ORDER]: <ChefHat size={12} />,
  [EnumOrderStatus.IN_DELIVERY]: <Truck size={12} />,
  [EnumOrderStatus.DELIVERED]: <PackageCheck size={12} />,
  [EnumOrderStatus.DISBURSED]: <HandCoins size={12} />,
  [EnumOrderStatus.CANCELLED_BY_CUSTOMER]: <XCircle size={12} />,
  [EnumOrderStatus.CANCELLED_BY_RESTAURANT]: <XCircle size={12} />,
};

const OrderStatusBadge = ({ status }: Props) => {
  const { t } = useTranslation();
  const label = ComputeUtils.formatStatus(t, status);

  const colorClass =
    status === EnumOrderStatus.CREATED
      ? "bg-yellow-100 text-yellow-700"
      : status === EnumOrderStatus.PAID ||
          status === EnumOrderStatus.DELIVERED ||
          status === EnumOrderStatus.DISBURSED
        ? "bg-green-100 text-green-700"
        : status === EnumOrderStatus.CANCELLED_BY_CUSTOMER ||
            status === EnumOrderStatus.CANCELLED_BY_RESTAURANT ||
            status === EnumOrderStatus.PAYMENT_FAILED
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {STATUS_ICONS[status]}
      {label}
    </span>
  );
};

export default OrderStatusBadge;
