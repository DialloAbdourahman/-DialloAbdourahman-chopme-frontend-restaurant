import { useTranslation } from "react-i18next";
import { Info, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type IRestaurantEntity,
  type UpdateRestaurantDto,
  updateRestaurantSchema,
} from "chopme-frontend-common";
import { RestaurantService } from "../../services/restaurant.service";
import { showErrorToast, showSuccessToast } from "../../utils/toasts";

interface RestaurantInfoSectionProps {
  restaurant: IRestaurantEntity;
  onUpdate: (restaurant: IRestaurantEntity) => void;
}

const RestaurantInfoSection = ({
  restaurant,
  onUpdate,
}: RestaurantInfoSectionProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateRestaurantDto>({
    resolver: zodResolver(updateRestaurantSchema),
    defaultValues: {
      slogan: restaurant.slogan ?? "",
      description: restaurant.description ?? "",
      phone: restaurant.phone ?? "",
      restaurantEmail: restaurant.email ?? "",
    },
  });

  const onSubmit = async (values: UpdateRestaurantDto) => {
    const payload: UpdateRestaurantDto = {};
    if (values.slogan !== "") payload.slogan = values.slogan;
    if (values.description !== "") payload.description = values.description;
    if (values.phone !== "") payload.phone = values.phone;
    if (values.restaurantEmail !== "")
      payload.restaurantEmail = values.restaurantEmail;

    try {
      const { data } = await RestaurantService.update(restaurant.id, payload);
      if (data.data) {
        onUpdate(data.data);
        reset({
          slogan: data.data.slogan ?? "",
          description: data.data.description ?? "",
          phone: data.data.phone ?? "",
          restaurantEmail: data.data.email ?? "",
        });
        showSuccessToast(t("restaurantDetails.updateSuccess"));
      }
    } catch {
      showErrorToast(t("restaurantDetails.updateError"));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 mb-6 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Info size={18} className="text-primary" />
        <h2 className="text-sm font-semibold text-text">
          {t("restaurantDetails.information")}
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1">
          {t("restaurantDetails.name")}
        </label>
        <input
          type="text"
          value={restaurant.name}
          disabled
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1">
          {t("restaurantDetails.slogan")}
        </label>
        <input
          type="text"
          {...register("slogan")}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {errors.slogan && (
          <p className="text-xs text-red-500 mt-1">{errors.slogan.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1">
          {t("restaurantDetails.description")}
        </label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {errors.description && (
          <p className="text-xs text-red-500 mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1">
          {t("restaurantDetails.phone")}
        </label>
        <input
          type="tel"
          {...register("phone")}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {errors.phone && (
          <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1">
          {t("restaurantDetails.restaurantEmail")}
        </label>
        <input
          type="email"
          {...register("restaurantEmail")}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {errors.restaurantEmail && (
          <p className="text-xs text-red-500 mt-1">
            {errors.restaurantEmail.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {t("common.save")}
      </button>
    </form>
  );
};

export default RestaurantInfoSection;
