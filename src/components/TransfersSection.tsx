import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import {
  EnumNotificationType,
  EnumOrderStatus,
  EnumStatusCode,
  EnumStatusResponse,
  EnumTransferStatuses,
  type INotification,
  type IOrchestrationResult,
  type ITransferEntity,
} from "chopme-frontend-common";
import {
  ArrowRightLeft,
  ChevronDown,
  Loader2,
  RefreshCcw,
  Send,
} from "lucide-react";
import { TransferService } from "../services/transfer.service";
import { OrderService } from "../services/order.service";
import { ComputeUtils } from "../utils/compute-utils";
import { showErrorToast, showSuccessToast } from "../utils/toasts";
import Pagination from "./Pagination";
import ConfirmModal from "./ConfirmModal";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

const LIMIT = 10;

const STATUS_CONFIG: Record<
  EnumTransferStatuses,
  { badgeClass: string; dotClass: string }
> = {
  [EnumTransferStatuses.CREATED]: {
    badgeClass: "bg-gray-100 text-gray-700",
    dotClass: "bg-gray-500",
  },
  [EnumTransferStatuses.INITIATED]: {
    badgeClass: "bg-blue-100 text-blue-700",
    dotClass: "bg-blue-500",
  },
  [EnumTransferStatuses.FAILED_TO_INITIATE]: {
    badgeClass: "bg-red-100 text-red-700",
    dotClass: "bg-red-500",
  },
  [EnumTransferStatuses.COMPLETED]: {
    badgeClass: "bg-green-100 text-green-700",
    dotClass: "bg-green-500",
  },
  [EnumTransferStatuses.FAILED]: {
    badgeClass: "bg-red-100 text-red-700",
    dotClass: "bg-red-500",
  },
};

type Props = {
  onTransferCreated?: () => void;
  hasWallet?: boolean;
};

const TransfersSection = ({ onTransferCreated, hasWallet = true }: Props) => {
  const { t } = useTranslation();

  const [transfers, setTransfers] = useState<ITransferEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<EnumTransferStatuses | "">(
    "",
  );

  const { newNotification } = useSelector(
    (state: RootState) => state.notification,
  );

  const [collectibleAmount, setCollectibleAmount] = useState(0);
  const [amountLoading, setAmountLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchTransfers = useCallback(
    async (currentPage = page, currentStatus = statusFilter) => {
      setLoading(true);
      try {
        const { data } = await TransferService.getRestaurantTransfers({
          page: currentPage,
          limit: LIMIT,
          status: currentStatus || undefined,
        });
        if (data.data) {
          setTransfers(data.data.items);
          setPage(data.data.page);
          setTotalPages(data.data.totalPages);
        }
      } catch {
        showErrorToast(t("transfers.fetchError"));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fetchCollectibleAmount = useCallback(async () => {
    setAmountLoading(true);
    try {
      const { data } = await OrderService.sumRestaurantOrdersAmount(
        [EnumOrderStatus.DELIVERED],
        true,
      );
      setCollectibleAmount(data.data?.total ?? 0);
    } catch {
      setCollectibleAmount(0);
    } finally {
      setAmountLoading(false);
    }
  }, []);

  const onRequestTransfer = async () => {
    setCreating(true);
    try {
      const { data } = await TransferService.create();
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.CREATED_SUCCESSFULLY &&
        data.data
      ) {
        showSuccessToast(t("transfers.createSuccess"));
        setConfirmOpen(false);
        setCollectibleAmount(0);
        setTransfers((prev) => [data.data!, ...prev]);
        onTransferCreated?.();
        fetchCollectibleAmount();
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<unknown>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.RESTAURANT_NOT_FOUND:
          showErrorToast(t("restaurantDetails.notFound"));
          break;
        case EnumStatusCode.NO_WALLET:
          showErrorToast(t("transfers.noWallet"));
          break;
        case EnumStatusCode.UNABLE_TO_CREATE_TRANSFER:
          showErrorToast(t("transfers.noEligibleOrders"));
          break;
        default:
          showErrorToast(t("transfers.createError"));
      }
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchTransfers(page, statusFilter);
  }, [page, statusFilter, fetchTransfers]);

  useEffect(() => {
    fetchCollectibleAmount();
  }, [fetchCollectibleAmount]);

  useEffect(() => {
    const notification = newNotification as INotification<ITransferEntity>;

    if (!notification) return;

    if (notification.type === EnumNotificationType.TRANSFER_STATUS_CHANGED) {
      const updated = notification.data;

      setTransfers((prev) => {
        const matchesFilter = !statusFilter || updated.status === statusFilter;
        const existed = prev.some((item) => item.id === updated.id);
        const next = prev
          .filter((item) => item.id !== updated.retriedFromTransferId)
          .flatMap((item) =>
            item.id === updated.id ? (matchesFilter ? [updated] : []) : [item],
          );
        if (!existed && matchesFilter) {
          next.unshift(updated);
        }
        return next;
      });

      onTransferCreated?.();
      fetchCollectibleAmount();
    } else if (
      notification.type === EnumNotificationType.ORDER_STATUS_CHANGED
    ) {
      fetchCollectibleAmount();
    }
  }, [newNotification]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-text">{t("transfers.title")}</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setConfirmOpen(true);
              fetchCollectibleAmount();
            }}
            disabled={!hasWallet || amountLoading || collectibleAmount <= 0}
            title={!hasWallet ? t("transfers.noWallet") : undefined}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
          >
            <Send size={18} />
            {t("transfers.requestTransfer")}
          </button>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as EnumTransferStatuses | "");
                  setPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-border bg-white py-2.5 pl-4 pr-10 text-sm text-text outline-none focus:border-primary"
              >
                <option value="">{t("transfers.allStatuses")}</option>
                <option value={EnumTransferStatuses.CREATED}>
                  {t("transfers.statusCreated")}
                </option>
                <option value={EnumTransferStatuses.INITIATED}>
                  {t("transfers.statusInitiated")}
                </option>
                <option value={EnumTransferStatuses.FAILED_TO_INITIATE}>
                  {t("transfers.statusFailedToInitiate")}
                </option>
                <option value={EnumTransferStatuses.COMPLETED}>
                  {t("transfers.statusCompleted")}
                </option>
                <option value={EnumTransferStatuses.FAILED}>
                  {t("transfers.statusFailed")}
                </option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                fetchCollectibleAmount();
                fetchTransfers(page, statusFilter);
              }}
              disabled={amountLoading || loading}
              className="shrink-0 rounded-lg p-2 text-text/70 hover:bg-card hover:text-primary transition-colors disabled:opacity-60"
              aria-label="Refresh"
            >
              <RefreshCcw
                size={20}
                className={amountLoading || loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      <div>
        {loading && transfers.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 py-16 text-gray-500 shadow-sm">
            <ArrowRightLeft size={48} className="mb-3 opacity-40" />
            <p className="text-sm">{t("transfers.empty")}</p>
          </div>
        ) : (
          <>
            <div
              className={`overflow-x-auto rounded-2xl bg-white shadow-sm transition-opacity ${
                loading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-card/60 border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3.5">{t("transfers.amount")}</th>
                    <th className="px-5 py-3.5">{t("transfers.orders")}</th>
                    <th className="px-5 py-3.5">{t("transfers.date")}</th>
                    <th className="px-5 py-3.5">{t("transfers.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => {
                    const statusConfig = STATUS_CONFIG[transfer.status];
                    return (
                      <tr
                        key={transfer.id}
                        className="border-b border-border last:border-0 hover:bg-card/40 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="text-lg font-extrabold text-text tabular-nums tracking-tight">
                            {transfer?.amount?.toLocaleString()}
                          </span>{" "}
                          <span className="text-xs font-semibold uppercase text-primary">
                            FCFA
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-text/80">
                          {t("transfers.ordersCount", {
                            count: transfer.totalOrders,
                          })}
                        </td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                          {ComputeUtils.formatDate(transfer.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.badgeClass}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`}
                            />
                            {ComputeUtils.formatTransferStatus(
                              t,
                              transfer.status,
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="pt-4 mt-4 border-t border-border">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        setOpen={setConfirmOpen}
        title={t("transfers.confirmTitle")}
        description={t("transfers.confirmDescription", {
          amount: collectibleAmount.toLocaleString(),
        })}
        confirmText={t("transfers.requestTransfer")}
        loading={creating || amountLoading}
        onConfirm={onRequestTransfer}
      />
    </div>
  );
};

export default TransfersSection;
