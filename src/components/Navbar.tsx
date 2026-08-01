// import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  // const navigate = useNavigate();
  // const dispatch = useDispatch();
  // const { t } = useTranslation();

  // const [isOpen, setIsOpen] = useState(false);
  // const { user } = useSelector((state: RootState) => state.user);

  // const handleLogout = async () => {
  //   try {
  //     const response = await AuthService.logout();
  //     if (
  //       response.data.code !== EnumStatusResponse.SUCCESS ||
  //       response.data.statusCode !== EnumStatusCode.LOGGED_OUT_SUCCESSFULLY
  //     ) {
  //       showErrorToast(
  //         response.data.message ?? "Unable to log out. Please try again.",
  //       );
  //       return;
  //     }

  //     TokensService.removeToken(KEYS.ACCESS_TOKEN_KEY);
  //     TokensService.removeToken(KEYS.REFRESH_TOKEN_KEY);
  //     dispatch(clearUser());
  //     setIsOpen(false);
  //     showSuccessToast("You have been logged out.");
  //     navigate("/");
  //   } catch (error) {
  //     console.error("Failed to log out:", error);
  //     showErrorToast("Unable to log out. Please try again.");
  //   }
  // };

  // const publicLinks = [{ label: t("navbar.home"), href: "/" }];

  // const authLinks = user
  //   ? [
  //       { label: t("navbar.orders"), href: "/orders" },
  //       { label: t("navbar.profile"), href: "/profile" },
  //     ]
  //   : [];

  // const navLinks = [...publicLinks, ...authLinks];

  return (
    <>
      <LanguageSwitcher />
    </>
  );
};

export default Navbar;
