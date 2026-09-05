import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Eye, EyeOff, User } from "lucide-react";
import {
  EnumAuthType,
  EnumStatusCode,
  EnumStatusResponse,
  updatePasswordSchema,
  updateUserProfileSchema,
  type UpdatePasswordDto,
  type UpdateUserProfileDto,
} from "chopme-frontend-common";
import Navbar from "../components/Navbar";
import { UserService } from "../services/user.service";
import { setUser } from "../store/user.slice";
import type { RootState } from "../store";
import { ComputeUtils } from "../utils/compute-utils";
import { showErrorToast, showSuccessToast } from "../utils/toasts";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const navigationLocation = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const canUpdatePassword = user?.authType === EnumAuthType.EMAIL_PASSWORD;

  const {
    register: registerFullName,
    handleSubmit: handleSubmitFullName,
    reset: resetFullName,
    formState: {
      errors: fullNameErrors,
      isSubmitting: isSubmittingFullName,
      isDirty: isFullNameDirty,
    },
  } = useForm<UpdateUserProfileDto>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: { fullName: user?.fullName ?? "" },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: {
      errors: passwordErrors,
      isSubmitting: isSubmittingPassword,
      isDirty: isPasswordDirty,
    },
  } = useForm<UpdatePasswordDto>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleBack = () => {
    if (navigationLocation.state?.from) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const onSubmitFullName = async (values: UpdateUserProfileDto) => {
    try {
      const result = await UserService.updateMyProfile(values);
      if (
        result.data.code === EnumStatusResponse.SUCCESS &&
        result.data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY &&
        result.data.data
      ) {
        dispatch(setUser(result.data.data));
        resetFullName({ fullName: result.data.data.fullName });
        showSuccessToast(t("profile.fullNameUpdated"));
      } else {
        showErrorToast(
          result.data.message ?? t("profile.fullNameUpdateFailed"),
        );
      }
    } catch {
      showErrorToast(t("profile.fullNameUpdateError"));
    }
  };

  const onSubmitPassword = async (values: UpdatePasswordDto) => {
    try {
      const result = await UserService.updatePassword(values);
      if (
        result.data.code === EnumStatusResponse.SUCCESS &&
        result.data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY
      ) {
        resetPassword();
        showSuccessToast(t("profile.passwordUpdated"));
      } else {
        showErrorToast(
          result.data.message ?? t("profile.passwordUpdateFailed"),
        );
      }
    } catch {
      showErrorToast(t("profile.passwordUpdateError"));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t("common.back")}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">
              {t("profile.title")}
            </h1>
            <p className="text-xs text-gray-500">{t("profile.subtitle")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <form
            onSubmit={handleSubmitFullName(onSubmitFullName)}
            className="bg-card rounded-2xl p-4 shadow-sm space-y-4"
          >
            <h2 className="text-sm font-semibold text-text">
              {t("profile.personalInformation")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t("profile.fullName")}
                </label>
                <input
                  type="text"
                  {...registerFullName("fullName")}
                  className={`w-full bg-background border text-text text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                    fullNameErrors.fullName ? "border-red-400" : "border-border"
                  }`}
                />
                {fullNameErrors.fullName && (
                  <p className="text-xs text-red-500 mt-1">
                    {fullNameErrors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t("profile.email")}
                </label>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="w-full bg-gray-100 border border-border text-gray-500 text-sm rounded-xl px-3 py-2 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t("profile.memberSince")}
              </label>
              <input
                type="text"
                value={
                  user?.createdAt ? ComputeUtils.formatDate(user.createdAt) : ""
                }
                disabled
                className="w-full sm:w-1/2 bg-gray-100 border border-border text-gray-500 text-sm rounded-xl px-3 py-2 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingFullName || !isFullNameDirty}
              className="bg-primary text-white text-sm font-semibold rounded-xl px-4 py-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isSubmittingFullName
                ? t("profile.saving")
                : t("profile.saveFullName")}
            </button>
          </form>

          {canUpdatePassword && (
            <form
              onSubmit={handleSubmitPassword(onSubmitPassword)}
              className="bg-card rounded-2xl p-4 shadow-sm space-y-4"
            >
              <h2 className="text-sm font-semibold text-text">
                {t("profile.updatePassword")}
              </h2>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    {t("profile.currentPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      {...registerPassword("oldPassword")}
                      placeholder={t("profile.currentPassword")}
                      className={`w-full bg-background border text-text text-sm rounded-xl px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary ${
                        passwordErrors.oldPassword
                          ? "border-red-400"
                          : "border-border"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      aria-label={t("profile.toggleCurrentPassword")}
                    >
                      {showOldPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {passwordErrors.oldPassword && (
                    <p className="text-xs text-red-500">
                      {passwordErrors.oldPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    {t("profile.newPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      {...registerPassword("newPassword")}
                      placeholder={t("profile.newPassword")}
                      className={`w-full bg-background border text-text text-sm rounded-xl px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary ${
                        passwordErrors.newPassword
                          ? "border-red-400"
                          : "border-border"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      aria-label={t("profile.toggleNewPassword")}
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-red-500">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    {t("profile.confirmNewPassword")}
                  </label>
                  <input
                    type="password"
                    {...registerPassword("confirmPassword")}
                    placeholder={t("profile.confirmNewPassword")}
                    className={`w-full bg-background border text-text text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                      passwordErrors.confirmPassword
                        ? "border-red-400"
                        : "border-border"
                    }`}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPassword || !isPasswordDirty}
                className="bg-primary text-white text-sm font-semibold rounded-xl px-4 py-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isSubmittingPassword
                  ? t("profile.updating")
                  : t("profile.updatePasswordButton")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
