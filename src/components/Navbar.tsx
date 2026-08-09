import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChefHat, ChevronDown, LogOut, Menu, X } from "lucide-react";
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
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { user, restaurantMember } = useSelector(
    (state: RootState) => state.user,
  );

  const canManage = useMemo(() => {
    return (
      restaurantMember?.role === EnumRestaurantMemberRole.OWNER ||
      restaurantMember?.role === EnumRestaurantMemberRole.MANAGER
    );
  }, [restaurantMember]);

  const isOwner = useMemo(() => {
    return restaurantMember?.role === EnumRestaurantMemberRole.OWNER;
  }, [restaurantMember]);

  const mainNavLinks = useMemo(() => {
    const links = [{ label: t("navbar.home"), href: "/" }];
    if (canManage) {
      links.push({ label: t("navbar.orders"), href: "/orders" });
      links.push({ label: t("navbar.menus"), href: "/menus" });
      links.push({ label: t("navbar.categories"), href: "/categories" });
    }
    return links;
  }, [t, canManage]);

  const settingsLinks = useMemo(() => {
    if (!canManage) return [];
    const links = [
      { label: t("navbar.restaurant"), href: "/restaurant" },
      { label: t("navbar.members"), href: "/members" },
    ];
    if (isOwner) {
      links.push({ label: t("navbar.payments"), href: "/payments" });
    }
    return links;
  }, [t, canManage, isOwner]);

  const isSettingsActive = useMemo(() => {
    return settingsLinks.some((link) =>
      location.pathname.startsWith(link.href),
    );
  }, [settingsLinks, location.pathname]);

  const handleLogout = async () => {
    try {
      const refreshToken = TokensService.getToken(KEYS.REFRESH_TOKEN_KEY);
      const response = await AuthService.logout(refreshToken ?? undefined);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSettingsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
            {mainNavLinks.map((link) => (
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
            {settingsLinks.length > 0 && (
              <div className="relative" ref={settingsRef}>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen((v) => !v)}
                  aria-expanded={isSettingsOpen}
                  className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
                    isSettingsActive
                      ? "text-primary"
                      : "text-gray-500 hover:text-primary"
                  }`}
                >
                  {t("navbar.settings")}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      isSettingsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    {settingsLinks.map((link) => (
                      <NavLink
                        key={link.label}
                        to={link.href}
                        onClick={() => setIsSettingsOpen(false)}
                        className={({ isActive }) =>
                          `block px-4 py-2.5 text-sm font-medium transition-colors ${
                            isActive
                              ? "text-primary bg-primary/5"
                              : "text-gray-500 hover:bg-muted hover:text-primary"
                          }`
                        }
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              {[...mainNavLinks, ...settingsLinks].map((link) => (
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
