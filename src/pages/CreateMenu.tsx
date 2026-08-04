import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCategorySchema,
  createMenuSchema,
  EnumStatusCode,
  EnumStatusResponse,
  type CreateCategoryDto,
  type CreateMenuDto,
  type ICategoryEntity,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Plus,
  UtensilsCrossed,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { CategoryService } from "../services/category.service";
import { MenuService } from "../services/menu.service";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import { KEYS } from "../utils/keys";

const ROUND_TO_NEAREST = Number(KEYS.ROUND_TO_NEAREST) || 5;

const CreateMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ICategoryEntity[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateMenuDto>({
    resolver: zodResolver(createMenuSchema(ROUND_TO_NEAREST)),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: 0,
      available: true,
    },
  });

  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    reset: resetCategoryForm,
    formState: { errors: categoryErrors },
  } = useForm<CreateCategoryDto>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data } = await CategoryService.search({
        deleted: false,
        limit: 100,
      });
      if (data.data) {
        setCategories(data.data.items);
      }
    } catch {
      showErrorToast(t("categories.fetchError"));
    } finally {
      setCategoriesLoading(false);
    }
  };

  const onCreateCategory = async (values: CreateCategoryDto) => {
    setCreatingCategory(true);
    try {
      const { data } = await CategoryService.create(values);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.CREATED_SUCCESSFULLY &&
        data.data
      ) {
        showSuccessToast(t("categories.createSuccess"));
        setCategories((prev) => [...prev, data.data!]);
        setValue("category", data.data.id);
        setCreateCategoryModalOpen(false);
        resetCategoryForm();
      } else {
        showErrorToast(t("categories.createError"));
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("categories.createNotAllowed"));
          break;
        case EnumStatusCode.VALIDATION_ERROR:
          showWarningToast(t("categories.createValidation"));
          break;
        default:
          showErrorToast(t("categories.createError"));
      }
    } finally {
      setCreatingCategory(false);
    }
  };

  const onSubmit = async (values: CreateMenuDto) => {
    try {
      const { data } = await MenuService.create(values);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.CREATED_SUCCESSFULLY &&
        data.data
      ) {
        showSuccessToast(t("menus.createSuccess"));
        navigate(`/menus/${data.data.id}`);
      } else {
        showErrorToast(t("menus.createError"));
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("menus.createNotAllowed"));
          break;
        case EnumStatusCode.VALIDATION_ERROR:
          showWarningToast(t("menus.createValidation"));
          break;
        case EnumStatusCode.CATEGORY_DOES_NOT_EXIST:
          showWarningToast(t("menus.categoryDoesNotExist"));
          break;
        case EnumStatusCode.RESTAURANT_NOT_FOUND:
          showWarningToast(t("menus.restaurantNotFound"));
          break;
        default:
          showErrorToast(t("menus.createError"));
      }
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="py-4">
          <Link
            to="/menus"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} />
            {t("common.back")}
          </Link>
        </div>
        <div className="bg-card rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 rounded-xl p-2.5">
              <UtensilsCrossed className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">
                {t("menus.createTitle")}
              </h2>
              <p className="text-sm text-text/60">
                {t("menus.createDescription")}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("menus.name")}
              </label>
              <input
                type="text"
                placeholder={t("menus.namePlaceholder")}
                {...register("name")}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors ${
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
                <button
                  type="button"
                  onClick={() => setCreateCategoryModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                >
                  <Plus size={14} />
                  {t("menus.addCategory")}
                </button>
              </div>
              <div className="relative">
                <select
                  {...register("category")}
                  value={watch("category")}
                  disabled={categoriesLoading}
                  className={`w-full appearance-none rounded-xl border bg-background px-4 py-3 pr-10 text-sm text-text outline-none transition-colors ${
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
              {categories.length === 0 && !categoriesLoading && (
                <p className="text-xs text-text/60">
                  {t("menus.noCategories")}
                </p>
              )}
              {errors.category && (
                <p className="text-xs text-red-500">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("menus.description")}
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors ${
                  errors.description
                    ? "border-red-400"
                    : "border-border focus:border-primary"
                }`}
              />
              {errors.description && (
                <p className="text-xs text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("menus.price")}
              </label>
              <input
                type="number"
                min={ROUND_TO_NEAREST}
                step={ROUND_TO_NEAREST}
                {...register("price", { valueAsNumber: true })}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors ${
                  errors.price
                    ? "border-red-400"
                    : "border-border focus:border-primary"
                }`}
              />
              <p className="text-xs text-text/60">
                {t("menus.priceHelp", { value: ROUND_TO_NEAREST })}
              </p>
              {errors.price && (
                <p className="text-xs text-red-500">{errors.price.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register("available")}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-text">{t("menus.available")}</span>
            </label>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Link
                to="/menus"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-text hover:bg-background transition-colors"
              >
                {t("common.cancel")}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {t("menus.create")}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Modal
        open={createCategoryModalOpen}
        setOpen={setCreateCategoryModalOpen}
        title={t("categories.addCategory")}
        textButton={
          creatingCategory ? t("common.loading") : t("categories.create")
        }
        loading={creatingCategory}
        onValidate={handleSubmitCategory(onCreateCategory)}
        dontShowCancelButton={false}
        xlSize="1"
      >
        <form className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wide">
              {t("categories.name")}
            </label>
            <input
              type="text"
              {...registerCategory("name")}
              className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-text outline-none focus:border-primary ${
                categoryErrors.name ? "border-red-400" : "border-border"
              }`}
            />
            {categoryErrors.name && (
              <p className="text-xs text-red-500">
                {categoryErrors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wide">
              {t("categories.description")}
            </label>
            <textarea
              {...registerCategory("description")}
              rows={3}
              className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-text outline-none focus:border-primary ${
                categoryErrors.description ? "border-red-400" : "border-border"
              }`}
            />
            {categoryErrors.description && (
              <p className="text-xs text-red-500">
                {categoryErrors.description.message}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CreateMenu;
