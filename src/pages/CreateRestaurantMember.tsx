import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnumRestaurantMemberRole,
  createRestaurantMemberSchema,
  EnumStatusCode,
  EnumStatusResponse,
  type CreateRestaurantMemberDto,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import { ArrowLeft, Eye, EyeOff, Loader2, Users } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { RestaurantMemberService } from "../services/restaurantMember.service";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";
import Navbar from "../components/Navbar";

const CreateRestaurantMember = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRestaurantMemberDto>({
    resolver: zodResolver(createRestaurantMemberSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: EnumRestaurantMemberRole.MANAGER,
    },
  });

  const onSubmit = async (values: CreateRestaurantMemberDto) => {
    const { confirmPassword: _, ...payload } = values;
    try {
      const { data } = await RestaurantMemberService.create(payload);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.CREATED_SUCCESSFULLY
      ) {
        showSuccessToast(t("members.createSuccess"));
        navigate("/members");
      } else {
        showErrorToast(data.message ?? t("members.createError"));
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.EXISTS_ALREADY:
          showWarningToast(t("members.createExists"));
          break;
        case EnumStatusCode.CANNOT_CREATE_OWNER:
          showWarningToast(t("members.createCannotOwner"));
          break;
        case EnumStatusCode.VALIDATION_ERROR:
          showWarningToast(t("members.createValidation"));
          break;
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("members.createNotAllowed"));
          break;
        case EnumStatusCode.UNABLE_TO_CREATE_ACCOUNT:
        case EnumStatusCode.INTERNAL_SERVER_ERROR:
          showErrorToast(t("members.createError"));
          break;
        default:
          showErrorToast(
            err.response?.data?.message ?? t("members.createError"),
          );
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="py-4">
          {" "}
          <Link
            to="/members"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} />
            {t("common.back")}
          </Link>
        </div>
        <div className="bg-card rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 rounded-xl p-2.5">
              <Users className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">
                {t("members.addMember")}
              </h2>
              <p className="text-sm text-text/60">
                {t("members.createDescription")}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("members.fullName")}
              </label>
              <input
                type="text"
                {...register("fullName")}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors ${
                  errors.fullName
                    ? "border-red-400"
                    : "border-border focus:border-primary"
                }`}
              />
              {errors.fullName && (
                <p className="text-xs text-red-500">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("members.email")}
              </label>
              <input
                type="email"
                {...register("email")}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors ${
                  errors.email
                    ? "border-red-400"
                    : "border-border focus:border-primary"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("members.role")}
              </label>
              <select
                {...register("role")}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors ${
                  errors.role
                    ? "border-red-400"
                    : "border-border focus:border-primary"
                }`}
              >
                <option value={EnumRestaurantMemberRole.MANAGER}>
                  {t("members.roleManager")}
                </option>
              </select>
              {errors.role && (
                <p className="text-xs text-red-500">{errors.role.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("members.password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`w-full rounded-xl border bg-background px-4 py-3 pr-11 text-sm text-text outline-none transition-colors ${
                    errors.password
                      ? "border-red-400"
                      : "border-border focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("members.confirmPassword")}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className={`w-full rounded-xl border bg-background px-4 py-3 pr-11 text-sm text-text outline-none transition-colors ${
                    errors.confirmPassword
                      ? "border-red-400"
                      : "border-border focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Link
                to="/members"
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
                {t("members.create")}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateRestaurantMember;
