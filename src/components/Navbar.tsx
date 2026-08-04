import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChefHat, LogOut, Menu, X } from "lucide-react";
import {
  EnumRestaurantMemberRole,
  EnumStatusCode,
  EnumStatusResponse,
} from "chopme-frontend-common";
import type { RootState } from "../store";
import { setUser, setRestaurantMember } from "../store/user.slice";
import { AuthService } from "../services/auth.service";
import { TokensService } from "../services/tokens.service";
import { KEYS } from "../utils/keys";
import { showErrorToast, showSuccessToast } from "../utils/toasts";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, restaurantMember } = useSelector(
    (state: RootState) => state.user,
  );

  const canManage = useMemo(() => {
    return (
      restaurantMember?.role === EnumRestaurantMemberRole.OWNER ||
      restaurantMember?.role === EnumRestaurantMemberRole.MANAGER
    );
  }, [restaurantMember]);

  const navLinks = useMemo(() => {
    const links = [{ label: t("navbar.home"), href: "/" }];
    if (canManage) {
      links.push({ label: t("navbar.menus"), href: "/menus" });
      links.push({ label: t("navbar.categories"), href: "/categories" });
      links.push({ label: t("navbar.members"), href: "/members" });
    }
    return links;
  }, [t, canManage]);

  const handleLogout = async () => {
    try {
      const response = await AuthService.logout();
      if (
        response.data.code !== EnumStatusResponse.SUCCESS ||
        response.data.statusCode !== EnumStatusCode.LOGGED_OUT_SUCCESSFULLY
      ) {
        showErrorToast(response.data.message ?? t("common.somethingWentWrong"));
        return;
      }

      TokensService.removeToken(KEYS.ACCESS_TOKEN_KEY);
      TokensService.removeToken(KEYS.REFRESH_TOKEN_KEY);
      dispatch(setUser(null));
      dispatch(setRestaurantMember(null));
      setIsOpen(false);
      showSuccessToast(t("navbar.logoutSuccess"));
    } catch (error) {
      console.error("Failed to log out:", error);
      showErrorToast(t("common.somethingWentWrong"));
    }
  };

  return (
    <>
      <nav className="bg-card shadow-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-xl p-2">
              <ChefHat size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-text tracking-tight">
              ChopMe
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <LanguageSwitcher />
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.href}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-primary"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-red-600"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">{t("common.logout")}</span>
              </button>
            ) : (
              <Link
                to="/signin"
                className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                {t("common.login")}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="p-2 text-text"
              aria-label={t("common.language")}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-border px-4 pb-4 bg-card">
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-gray-500 hover:text-primary"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                  <LogOut size={17} />
                  {t("common.logout")}
                </button>
              ) : (
                <Link
                  to="/signin"
                  className="w-full bg-primary text-white rounded-xl px-4 py-3 text-sm font-semibold mt-2 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {t("common.login")}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
