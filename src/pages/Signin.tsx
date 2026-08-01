import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EmailPasswordLoginDto } from "chopme-frontend-common";
import { Eye, EyeOff, Mail, Lock, ChefHat } from "lucide-react";
import { AxiosError } from "axios";
import type { IOrchestrationResult, IAuthEntity } from "chopme-frontend-common";
import {
  emailPasswordLoginSchema,
  EnumStatusCode,
  EnumStatusResponse,
} from "chopme-frontend-common";
import { AuthService } from "../services/auth.service";
import { TokensService } from "../services/tokens.service";
import { KEYS } from "../utils/keys";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";
import useInitializeAfterAuth from "../hooks/useInitializeAfterAuth";

const Signin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const { initialize, loading: loadingInitialize } = useInitializeAfterAuth({
    initialLoadingState: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailPasswordLoginDto>({
    resolver: zodResolver(emailPasswordLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: EmailPasswordLoginDto) => {
    try {
      const { data } = await AuthService.emailPasswordLogin(values);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.LOGGED_IN_SUCCESSFULLY
      ) {
        const { accessToken, refreshToken } = data.data as IAuthEntity;
        TokensService.setToken({
          property: KEYS.ACCESS_TOKEN_KEY,
          value: accessToken,
        });
        TokensService.setToken({
          property: KEYS.REFRESH_TOKEN_KEY,
          value: refreshToken,
        });
        await initialize();
        showSuccessToast(t("auth.welcomeBack"));
        const encoded = searchParams.get("redirect_url");
        const redirectTo = encoded ? decodeURIComponent(encoded) : "/";
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.INVALID_CREDENTIALS:
          showWarningToast(t("auth.invalidCredentials"));
          break;
        case EnumStatusCode.LOGIN_METHOD_NOT_ALLOWED:
          showWarningToast(t("auth.loginMethodNotAllowed"));
          break;
        case EnumStatusCode.VALIDATION_ERROR:
          showWarningToast(t("auth.checkInput"));
          break;
        case EnumStatusCode.INTERNAL_SERVER_ERROR:
          showErrorToast(t("auth.somethingWentWrong"));
          break;
        default:
          showErrorToast(t("auth.somethingWentWrong"));
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary rounded-2xl p-4 mb-3 shadow-lg">
            <ChefHat size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text tracking-tight">
            ChopMe
          </h1>
          <p className="text-sm text-gray-400 mt-1">{t("auth.signinTitle")}</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl shadow-md px-6 py-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("auth.email")}
              </label>
              <div
                className={`flex items-center border rounded-xl px-4 py-3 gap-3 bg-background transition-colors ${
                  errors.email
                    ? "border-red-400"
                    : "border-gray-200 focus-within:border-primary"
                }`}
              >
                <Mail size={18} className="text-gray-400 shrink-0" />
                <input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  {...register("email")}
                  className="flex-1 bg-transparent outline-none text-text text-sm placeholder-gray-400"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("auth.password")}
              </label>
              <div
                className={`flex items-center border rounded-xl px-4 py-3 gap-3 bg-background transition-colors ${
                  errors.password
                    ? "border-red-400"
                    : "border-gray-200 focus-within:border-primary"
                }`}
              >
                <Lock size={18} className="text-gray-400 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  {...register("password")}
                  className="flex-1 bg-transparent outline-none text-text text-sm placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || loadingInitialize}
              className="w-full bg-primary text-white font-semibold rounded-xl py-3.5 text-sm shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {isSubmitting || loadingInitialize
                ? t("auth.signingIn")
                : t("auth.signIn")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signin;
