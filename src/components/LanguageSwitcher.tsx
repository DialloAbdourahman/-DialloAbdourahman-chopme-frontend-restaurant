import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { mapI18nToUserLanguage } from "chopme-frontend-common";
import { AuthService } from "../services/auth.service";
import { setUser } from "../store/user.slice";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  const active = i18n.language?.startsWith("fr") ? "fr" : "en";

  const handleChangeLanguage = async (lang: "fr" | "en") => {
    i18n.changeLanguage(lang);

    if (!user) return;

    const targetLanguage = mapI18nToUserLanguage(lang);
    if (user.language === targetLanguage) return;

    try {
      const { data } = await AuthService.updateMyProfile({
        language: targetLanguage,
      });
      if (data?.data) {
        dispatch(setUser(data.data));
      }
    } catch {
      // Silently ignore language sync failures
    }
  };

  return (
    <div className="inline-flex items-center bg-background rounded-full p-1 border border-gray-100 shadow-sm">
      <button
        onClick={() => handleChangeLanguage("fr")}
        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${
          active === "fr"
            ? "bg-primary text-white"
            : "text-gray-500 hover:text-primary"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => handleChangeLanguage("en")}
        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${
          active === "en"
            ? "bg-primary text-white"
            : "text-gray-500 hover:text-primary"
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
