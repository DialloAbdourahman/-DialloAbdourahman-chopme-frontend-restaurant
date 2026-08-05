import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Trash2, Truck } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type IRestaurantEntity,
  type UpdateRestaurantDto,
  updateRestaurantSchema,
} from "chopme-frontend-common";
import { RestaurantService } from "../../services/restaurant.service";
import { showErrorToast, showSuccessToast } from "../../utils/toasts";

interface RestaurantDeliveryPricingSectionProps {
  restaurant: IRestaurantEntity;
  onUpdate: (restaurant: IRestaurantEntity) => void;
}

const RestaurantDeliveryPricingSection = ({
  restaurant,
  onUpdate,
}: RestaurantDeliveryPricingSectionProps) => {
  const { t } = useTranslation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState,
  } = useForm<UpdateRestaurantDto>({
    resolver: zodResolver(updateRestaurantSchema),
    defaultValues: {
      deliveryPricingKm:
        restaurant.deliveryPricingKm?.map((tier) => ({
          from: tier.from,
          to: tier.to,
          price: tier.price,
        })) ?? [],
    },
  });
  const { errors, isSubmitting, isDirty } = formState;

  const [rangeWarning, setRangeWarning] = useState<string | null>(null);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "deliveryPricingKm",
  });

  const validateTiers = (tiers: UpdateRestaurantDto["deliveryPricingKm"]) => {
    let hasError = false;
    clearErrors("deliveryPricingKm");
    setRangeWarning(null);

    if (!tiers) return true;

    tiers.forEach((tier, index) => {
      if (Number.isNaN(tier.from) || tier.from < 0) {
        setError(`deliveryPricingKm.${index}.from`, {
          type: "manual",
          message: t("restaurantDetails.fromMustBeGreaterOrEqualToZero"),
        });
        hasError = true;
      }
      if (index === 0 && !Number.isNaN(tier.from) && tier.from !== 0) {
        setError(`deliveryPricingKm.${index}.from`, {
          type: "manual",
          message: t("restaurantDetails.firstFromMustBeZero"),
        });
        hasError = true;
      }
      if (Number.isNaN(tier.to) || tier.to <= tier.from) {
        setError(`deliveryPricingKm.${index}.to`, {
          type: "manual",
          message: t("restaurantDetails.toMustBeGreaterThanFrom"),
        });
        hasError = true;
      }
      if (Number.isNaN(tier.price) || tier.price <= 0) {
        setError(`deliveryPricingKm.${index}.price`, {
          type: "manual",
          message: t("restaurantDetails.priceMustBePositive"),
        });
        hasError = true;
      }
    });

    for (let i = 1; i < tiers.length; i++) {
      const prev = tiers[i - 1];
      const curr = tiers[i];
      if (curr.price <= prev.price) {
        setError(`deliveryPricingKm.${i}.price`, {
          type: "manual",
          message: t("restaurantDetails.priceMustIncrease"),
        });
        hasError = true;
      }
    }

    for (let i = 1; i < tiers.length; i++) {
      const prev = tiers[i - 1];
      const curr = tiers[i];
      if (curr.from < prev.to) {
        setError(`deliveryPricingKm.${i}.from`, {
          type: "manual",
          message: t("restaurantDetails.rangesCannotOverlap"),
        });
        hasError = true;
      } else if (curr.from > prev.to) {
        setError(`deliveryPricingKm.${i}.from`, {
          type: "manual",
          message: t("restaurantDetails.rangesMustBeContinuous"),
        });
        hasError = true;
      }
    }

    if (hasError) {
      setRangeWarning(t("restaurantDetails.deliveryPricingRangeWarning"));
    }

    return !hasError;
  };

  const onSubmit = async (values: UpdateRestaurantDto) => {
    if (!validateTiers(values.deliveryPricingKm)) return;

    try {
      const { data } = await RestaurantService.update(restaurant.id, {
        deliveryPricingKm: values.deliveryPricingKm,
      });
      if (data.data) {
        onUpdate(data.data);
        reset({
          deliveryPricingKm:
            data.data.deliveryPricingKm?.map((tier) => ({
              from: tier.from,
              to: tier.to,
              price: tier.price,
            })) ?? [],
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
      className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Truck size={18} className="text-primary" />
        <h2 className="text-sm font-semibold text-text">
          {t("restaurantDetails.deliveryPricing")}
        </h2>
      </div>
      {rangeWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3 text-sm text-yellow-800">
          {rangeWarning}
        </div>
      )}
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4 mb-4 border-b border-border items-end"
        >
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {t("restaurantDetails.fromKm")}
            </label>
            <input
              type="number"
              {...register(`deliveryPricingKm.${index}.from`, {
                valueAsNumber: true,
              })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            {errors.deliveryPricingKm?.[index]?.from && (
              <p className="text-xs text-red-500 mt-1">
                {errors.deliveryPricingKm[index].from.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {t("restaurantDetails.toKm")}
            </label>
            <input
              type="number"
              {...register(`deliveryPricingKm.${index}.to`, {
                valueAsNumber: true,
              })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            {errors.deliveryPricingKm?.[index]?.to && (
              <p className="text-xs text-red-500 mt-1">
                {errors.deliveryPricingKm[index].to.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {t("restaurantDetails.price")}
            </label>
            <input
              type="number"
              {...register(`deliveryPricingKm.${index}.price`, {
                valueAsNumber: true,
              })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            {errors.deliveryPricingKm?.[index]?.price && (
              <p className="text-xs text-red-500 mt-1">
                {errors.deliveryPricingKm[index].price.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto col-span-2 sm:col-span-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 sm:border-0 rounded-xl self-end"
            title={t("common.delete")}
          >
            <Trash2 size={16} />
            <span className="sm:hidden">{t("common.delete")}</span>
          </button>
        </div>
      ))}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => append({ from: 0, to: 0, price: 0 })}
          className="inline-flex items-center justify-center gap-1.5 self-start text-sm font-medium text-primary hover:underline"
        >
          <Plus size={16} />
          {t("restaurantDetails.addDeliveryPricing")}
        </button>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 items-stretch sm:items-center">
          {isDirty && (
            <button
              type="button"
              onClick={() => {
                reset();
                setRangeWarning(null);
              }}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-text hover:bg-card transition-all"
            >
              {t("common.cancel")}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {t("common.save")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default RestaurantDeliveryPricingSection;
