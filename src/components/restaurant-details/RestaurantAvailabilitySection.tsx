import { useTranslation } from "react-i18next";
import { Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type IRestaurantEntity,
  type UpdateRestaurantDto,
  updateRestaurantSchema,
} from "chopme-frontend-common";
import { RestaurantService } from "../../services/restaurant.service";
import { showErrorToast, showSuccessToast } from "../../utils/toasts";

const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

interface RestaurantAvailabilitySectionProps {
  restaurant: IRestaurantEntity;
  onUpdate: (restaurant: IRestaurantEntity) => void;
}

const RestaurantAvailabilitySection = ({
  restaurant,
  onUpdate,
}: RestaurantAvailabilitySectionProps) => {
  const { t } = useTranslation();

  const { control, register, handleSubmit, reset, formState } =
    useForm<UpdateRestaurantDto>({
      resolver: zodResolver(updateRestaurantSchema),
      defaultValues: {
        availability: (restaurant.availability ?? []).map((a) => ({
          ...a,
          day: a.day.toLowerCase(),
        })),
      },
    });
  const { errors, isSubmitting, isDirty } = formState;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "availability",
  });

  const watchedAvailability = useWatch({ control, name: "availability" });

  const selectedDays = (watchedAvailability ?? []).map((a) =>
    a.day.toLowerCase(),
  );

  const availableDays = DAYS_ORDER.filter((day) => !selectedDays.includes(day));

  const onSubmit = async (values: UpdateRestaurantDto) => {
    const sorted = [...(values.availability ?? [])]
      .sort(
        (a, b) =>
          DAYS_ORDER.indexOf(
            a.day.toLowerCase() as (typeof DAYS_ORDER)[number],
          ) -
          DAYS_ORDER.indexOf(
            b.day.toLowerCase() as (typeof DAYS_ORDER)[number],
          ),
      )
      .map((entry) => ({
        ...entry,
        day: entry.day.charAt(0).toUpperCase() + entry.day.slice(1),
      }));

    try {
      const { data } = await RestaurantService.update(restaurant.id, {
        availability: sorted,
      });
      if (data.data) {
        onUpdate(data.data);
        reset({
          availability: (data.data.availability ?? []).map((a) => ({
            ...a,
            day: a.day.toLowerCase(),
          })),
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
        <Clock size={18} className="text-primary" />
        <h2 className="text-sm font-semibold text-text">
          {t("restaurantDetails.availability")}
        </h2>
      </div>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-4 mb-4 border-b border-border items-end"
        >
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {t("restaurantDetails.day")}
            </label>
            <select
              {...register(`availability.${index}.day`)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>
                {t("restaurantDetails.selectDay")}
              </option>
              {DAYS_ORDER.filter(
                (day) =>
                  day === watchedAvailability?.[index]?.day?.toLowerCase() ||
                  !selectedDays.includes(day),
              ).map((day) => (
                <option key={day} value={day}>
                  {t(`days.${day}`)}
                </option>
              ))}
            </select>
            {errors.availability?.[index]?.day && (
              <p className="text-xs text-red-500 mt-1">
                {errors.availability[index].day.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {t("restaurantDetails.openTime")}
            </label>
            <input
              type="time"
              {...register(`availability.${index}.openTime`)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            {errors.availability?.[index]?.openTime && (
              <p className="text-xs text-red-500 mt-1">
                {errors.availability[index].openTime.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {t("restaurantDetails.closeTime")}
            </label>
            <input
              type="time"
              {...register(`availability.${index}.closeTime`)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            {errors.availability?.[index]?.closeTime && (
              <p className="text-xs text-red-500 mt-1">
                {errors.availability[index].closeTime.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="inline-flex items-center justify-center gap-2 w-full lg:w-auto px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 lg:border-0 rounded-xl self-end"
            title={t("common.delete")}
          >
            <Trash2 size={16} />
            <span className="lg:hidden">{t("common.delete")}</span>
          </button>
        </div>
      ))}
      <div className="flex flex-col gap-3">
        {availableDays.length > 0 && (
          <button
            type="button"
            onClick={() =>
              append({
                day: availableDays[0],
                openTime: "09:00",
                closeTime: "17:00",
              })
            }
            className="inline-flex items-center justify-center gap-1.5 self-start text-sm font-medium text-primary hover:underline"
          >
            <Plus size={16} />
            {t("restaurantDetails.addAvailability")}
          </button>
        )}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 items-stretch sm:items-center">
          {isDirty && (
            <button
              type="button"
              onClick={() => reset()}
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

export default RestaurantAvailabilitySection;
