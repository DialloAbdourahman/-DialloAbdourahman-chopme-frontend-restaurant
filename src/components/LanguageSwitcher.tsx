import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const active = i18n.language?.startsWith("fr") ? "fr" : "en";

  return (
    <div className="inline-flex items-center bg-background rounded-full p-1 border border-gray-100 shadow-sm">
      <button
        onClick={() => i18n.changeLanguage("fr")}
        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${
          active === "fr"
            ? "bg-primary text-white"
            : "text-gray-500 hover:text-primary"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => i18n.changeLanguage("en")}
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
