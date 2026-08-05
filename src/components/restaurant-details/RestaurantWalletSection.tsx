import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2, Wallet } from "lucide-react";
import { AxiosError } from "axios";
import { z } from "zod";
import {
  EnumStatusCode,
  EnumStatusResponse,
  EnumWalletTypes,
  type IOrchestrationResult,
  type IRestaurantWallet,
} from "chopme-frontend-common";
import { RestaurantService } from "../../services/restaurant.service";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../../utils/toasts";
import DeleteModal from "../DeleteModal";

interface RestaurantWalletSectionProps {
  restaurantId: string;
  isOwner: boolean;
}

const addRestaurantWalletSchema = z.object({
  type: z.nativeEnum(EnumWalletTypes),
  number: z
    .string()
    .regex(
      /^\+2376\d{8}$/,
      "Phone number must be a valid Cameroonian number in the format +237620487789",
    )
    .optional(),
});

type AddRestaurantWalletDto = z.infer<typeof addRestaurantWalletSchema>;

const RestaurantWalletSection = ({
  restaurantId,
  isOwner,
}: RestaurantWalletSectionProps) => {
  const { t } = useTranslation();

  const [wallet, setWallet] = useState<IRestaurantWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<AddRestaurantWalletDto>({
    resolver: zodResolver(addRestaurantWalletSchema),
    defaultValues: {
      type: EnumWalletTypes.MOBILE_WALLET,
      number: "",
    },
  });

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const { data } = await RestaurantService.getWallet(restaurantId);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.RECOVERED_SUCCESSFULLY &&
        data.data
      ) {
        setWallet(data.data);
      } else {
        setWallet(null);
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<unknown>>;
      if (
        err?.response?.status === 404 ||
        err?.response?.data?.statusCode === EnumStatusCode.NOT_FOUND
      ) {
        setWallet(null);
      } else {
        showErrorToast(t("restaurantDetails.walletFetchError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: AddRestaurantWalletDto) => {
    setSubmitting(true);
    try {
      const { data } = await RestaurantService.addWallet(restaurantId, values);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY &&
        data.data
      ) {
        showSuccessToast(t("restaurantDetails.walletAddSuccess"));
        setWallet(data.data);
        reset();
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<unknown>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.WALLET_EXISTS_ALREADY:
          showWarningToast(t("restaurantDetails.walletExists"));
          break;
        case EnumStatusCode.INVALID_PHONE_NUMBER:
          showWarningToast(t("restaurantDetails.invalidPhoneNumber"));
          break;
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("restaurantDetails.walletNotAllowed"));
          break;
        default:
          showErrorToast(t("restaurantDetails.walletAddError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await RestaurantService.deleteWallet(restaurantId);
      showSuccessToast(t("restaurantDetails.walletDeleteSuccess"));
      setWallet(null);
    } catch {
      showErrorToast(t("restaurantDetails.walletDeleteError"));
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 mb-6 flex items-center justify-center h-32">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Wallet size={18} className="text-primary" />
        <h2 className="text-sm font-semibold text-text">
          {t("restaurantDetails.walletTitle")}
        </h2>
      </div>

      {wallet ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-text">
              {wallet.type === EnumWalletTypes.MOBILE_WALLET
                ? t("restaurantDetails.walletTypeMobile")
                : wallet.type}
            </p>
            {wallet.mobileData && (
              <p className="text-xs text-text/70">
                {wallet.mobileData.network} — {wallet.mobileData.number}
              </p>
            )}
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} />
              {t("common.delete")}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <input
            type="hidden"
            {...register("type")}
            value={EnumWalletTypes.MOBILE_WALLET}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wide">
              {t("restaurantDetails.walletNumberLabel")}
            </label>
            <Controller
              control={control}
              name="number"
              render={({ field: { value, onChange } }) => {
                const suffix =
                  typeof value === "string" && value.startsWith("+237")
                    ? value.slice(4)
                    : "";
                return (
                  <div
                    className={`flex rounded-xl border bg-background overflow-hidden transition-colors ${
                      errors.number
                        ? "border-red-400"
                        : "border-border focus-within:border-primary"
                    }`}
                  >
                    <span className="flex items-center px-4 py-3 text-sm text-text/60 border-r border-border select-none">
                      +237
                    </span>
                    <input
                      type="tel"
                      disabled={!isOwner}
                      value={suffix}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 9);
                        onChange(`+237${digits}`);
                      }}
                      placeholder="677452310"
                      className="w-full px-4 py-3 text-sm text-text bg-background outline-none disabled:opacity-60"
                    />
                  </div>
                );
              }}
            />
            {errors.number && (
              <p className="text-xs text-red-500">{errors.number.message}</p>
            )}
          </div>

          {isOwner && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || !isDirty}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {t("restaurantDetails.addWallet")}
              </button>
            </div>
          )}
        </form>
      )}

      <DeleteModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title={t("restaurantDetails.deleteWalletTitle")}
        description={t("restaurantDetails.deleteWalletDescription")}
        confirmText={t("common.delete")}
        loading={deleting}
        onConfirm={onDelete}
      />
    </div>
  );
};

export default RestaurantWalletSection;
