import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCategorySchema,
  EnumStatusCode,
  EnumStatusResponse,
  type CreateCategoryDto,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import { ArrowLeft, Loader2, Tag } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { CategoryService } from "../services/category.service";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";
import Navbar from "../components/Navbar";

const CreateMenuCategory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryDto>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: CreateCategoryDto) => {
    try {
      const { data } = await CategoryService.create(values);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.CREATED_SUCCESSFULLY
      ) {
        showSuccessToast(t("categories.createSuccess"));
        navigate("/categories");
      } else {
        showErrorToast(data.message ?? t("categories.createError"));
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
        case EnumStatusCode.INTERNAL_SERVER_ERROR:
          showErrorToast(t("categories.createError"));
          break;
        default:
          showErrorToast(
            err.response?.data?.message ?? t("categories.createError"),
          );
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="py-4">
          <Link
            to="/categories"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} />
            {t("common.back")}
          </Link>
        </div>
        <div className="bg-card rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 rounded-xl p-2.5">
              <Tag className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">
                {t("categories.addCategory")}
              </h2>
              <p className="text-sm text-text/60">
                {t("categories.createDescription")}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("categories.name")}
              </label>
              <input
                type="text"
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
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("categories.description")}
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

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Link
                to="/categories"
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
                {t("categories.create")}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateMenuCategory;
