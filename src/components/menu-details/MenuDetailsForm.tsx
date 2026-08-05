import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import {
  createMenuSchema,
  EnumStatusCode,
  EnumStatusResponse,
  type ICategoryEntity,
  type IMenuEntity,
  type IOrchestrationResult,
  type CreateMenuDto,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import { MenuService } from "../../services/menu.service";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../../utils/toasts";

interface MenuDetailsFormProps {
  menu: IMenuEntity;
  canManage: boolean;
  categories: ICategoryEntity[];
  categoriesLoading: boolean;
  roundToNearest: number;
  onMenuUpdated: (menu: IMenuEntity) => void;
  onAddCategoryClick: () => void;
}

const MenuDetailsForm = ({
  menu,
  canManage,
  categories,
  categoriesLoading,
  roundToNearest,
  onMenuUpdated,
  onAddCategoryClick,
}: MenuDetailsFormProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateMenuDto>({
    resolver: zodResolver(createMenuSchema(roundToNearest)),
    defaultValues: {
      name: menu.name,
      category: menu.category?.id ?? "",
      description: menu.description ?? "",
      price: menu.price,
      available: menu.available,
    },
  });

  useEffect(() => {
    reset({
      name: menu.name,
      category: menu.category?.id ?? "",
      description: menu.description ?? "",
      price: menu.price,
      available: menu.available,
    });
  }, [menu, reset]);

  const onSave = async (values: CreateMenuDto) => {
    try {
      const { data } = await MenuService.update(menu.id, values);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY &&
        data.data
      ) {
        showSuccessToast(t("menus.updateSuccess"));
        onMenuUpdated(data.data);
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("menus.updateNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("menus.updateNotFound"));
            break;
          case EnumStatusCode.CATEGORY_DOES_NOT_EXIST:
            showWarningToast(t("menus.categoryDoesNotExist"));
            break;
          default:
            showErrorToast(t("menus.updateError"));
        }
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("menus.updateNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("menus.updateNotFound"));
          break;
        case EnumStatusCode.CATEGORY_DOES_NOT_EXIST:
          showWarningToast(t("menus.categoryDoesNotExist"));
          break;
        default:
          showErrorToast(t("menus.updateError"));
      }
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
      <h2 className="text-sm font-semibold text-text mb-4">
        {t("menus.details")}
      </h2>
      <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text uppercase tracking-wide">
            {t("menus.name")}
          </label>
          <input
            type="text"
            disabled={!canManage}
            {...register("name")}
            className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors disabled:opacity-60 ${
              errors.name
                ? "border-red-400"
                : "border-border focus:border-primary"
            }`}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text uppercase tracking-wide">
              {t("menus.category")}
            </label>
            {canManage && (
              <button
                type="button"
                onClick={onAddCategoryClick}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
              >
                <Plus size={14} />
                {t("menus.addCategory")}
              </button>
            )}
          </div>
          <div className="relative">
            <select
              disabled={!canManage || categoriesLoading}
              {...register("category")}
              value={watch("category")}
              className={`w-full appearance-none rounded-xl border bg-background px-4 py-3 pr-10 text-sm text-text outline-none transition-colors disabled:opacity-60 ${
                errors.category
                  ? "border-red-400"
                  : "border-border focus:border-primary"
              }`}
            >
              <option value="">{t("menus.selectCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
          {errors.category && (
            <p className="text-xs text-red-500">{errors.category.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text uppercase tracking-wide">
            {t("menus.description")}
          </label>
          <textarea
            disabled={!canManage}
            {...register("description")}
            rows={3}
            className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors disabled:opacity-60 ${
              errors.description
                ? "border-red-400"
                : "border-border focus:border-primary"
            }`}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text uppercase tracking-wide">
            {t("menus.price")}
          </label>
          <input
            type="number"
            min={roundToNearest}
            step={roundToNearest}
            disabled={!canManage}
            {...register("price", { valueAsNumber: true })}
            className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors disabled:opacity-60 ${
              errors.price
                ? "border-red-400"
                : "border-border focus:border-primary"
            }`}
          />
          <p className="text-xs text-text/60">
            {t("menus.priceHelp", { value: roundToNearest })}
          </p>
          {errors.price && (
            <p className="text-xs text-red-500">{errors.price.message}</p>
          )}
        </div>

        {canManage && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            {isDirty && (
              <button
                type="button"
                onClick={() =>
                  reset({
                    name: menu.name,
                    category: menu.category?.id ?? "",
                    description: menu.description ?? "",
                    price: menu.price,
                    available: menu.available,
                  })
                }
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-text hover:bg-card transition-all"
              >
                {t("common.cancel")}
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {t("menus.save")}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default MenuDetailsForm;
