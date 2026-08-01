import { EnumRefundStatus } from "chopme-frontend-common";
import { useTranslation } from "react-i18next";
import { ComputeUtils } from "../utils/compute-utils";

type Props = {
  status: EnumRefundStatus;
};

const RefundStatusBadge = ({ status }: Props) => {
  const { t } = useTranslation();
  const label = ComputeUtils.formatRefundStatus(t, status);

  const colorClass =
    status === EnumRefundStatus.SUCCESSFUL
      ? "bg-green-100 text-green-700"
      : status === EnumRefundStatus.INITIATED
        ? "bg-yellow-100 text-yellow-700"
        : status === EnumRefundStatus.FAILED ||
            status === EnumRefundStatus.FAILED_TO_INITIATE
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700";

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {t("refundStatus.title")}: {label}
    </span>
  );
};

export default RefundStatusBadge;
