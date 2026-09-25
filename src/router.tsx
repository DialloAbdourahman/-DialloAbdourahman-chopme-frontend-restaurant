import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import Signin from "./pages/Signin";
import Home from "./pages/Home";
import RestaurantMembers from "./pages/RestaurantMembers";
import CreateRestaurantMember from "./pages/CreateRestaurantMember";
import MenuCategories from "./pages/MenuCategories";
import CreateMenuCategory from "./pages/CreateMenuCategory";
import MenusList from "./pages/MenusList";
import CreateMenu from "./pages/CreateMenu";
import MenuDetails from "./pages/MenuDetails";
import RestaurantDetails from "./pages/RestaurantDetails";
import OrdersList from "./pages/OrdersList";
import OrderDetails from "./pages/OrderDetails";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import { EnumRestaurantMemberRole } from "chopme-frontend-common";
import WebSocket from "./components/WebSocket";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, restaurantMember } = useSelector(
    (state: RootState) => state.user,
  );
  const location = useLocation();
  const redirectUrl = encodeURIComponent(location.pathname + location.search);
  return user && restaurantMember ? (
    <>{children}</>
  ) : (
    <Navigate to={`/signin?redirect_url=${redirectUrl}`} replace />
  );
};

const ProtectedRestaurantMemberRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: EnumRestaurantMemberRole[];
}) => {
  const { restaurantMember } = useSelector((state: RootState) => state.user);
  const isAllowed =
    restaurantMember && allowedRoles.includes(restaurantMember.role);
  return isAllowed ? <>{children}</> : <Navigate to="/" replace />;
};

const AppContent = () => {
  const { pathname } = useLocation();
  const showFooter = pathname !== "/signin";

  return (
    <>
      <WebSocket />
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <ProtectedRestaurantMemberRoute
                allowedRoles={[
                  EnumRestaurantMemberRole.OWNER,
                  EnumRestaurantMemberRole.MANAGER,
                ]}
              >
                <Outlet />
              </ProtectedRestaurantMemberRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<RestaurantMembers />} />
          <Route path="create" element={<CreateRestaurantMember />} />
        </Route>

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <ProtectedRestaurantMemberRoute
                allowedRoles={[
                  EnumRestaurantMemberRole.OWNER,
                  EnumRestaurantMemberRole.MANAGER,
                ]}
              >
                <Outlet />
              </ProtectedRestaurantMemberRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<MenuCategories />} />
          <Route path="create" element={<CreateMenuCategory />} />
        </Route>

        <Route
          path="/menus"
          element={
            <ProtectedRoute>
              <ProtectedRestaurantMemberRoute
                allowedRoles={[
                  EnumRestaurantMemberRole.OWNER,
                  EnumRestaurantMemberRole.MANAGER,
                ]}
              >
                <Outlet />
              </ProtectedRestaurantMemberRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<MenusList />} />
          <Route path="create" element={<CreateMenu />} />
          <Route path=":menuId" element={<MenuDetails />} />
        </Route>

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <ProtectedRestaurantMemberRoute
                allowedRoles={[
                  EnumRestaurantMemberRole.OWNER,
                  EnumRestaurantMemberRole.MANAGER,
                ]}
              >
                <Outlet />
              </ProtectedRestaurantMemberRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<OrdersList />} />
          <Route path=":orderId" element={<OrderDetails />} />
        </Route>

        <Route
          path="/restaurant"
          element={
            <ProtectedRoute>
              <ProtectedRestaurantMemberRoute
                allowedRoles={[
                  EnumRestaurantMemberRole.OWNER,
                  EnumRestaurantMemberRole.MANAGER,
                ]}
              >
                <RestaurantDetails />
              </ProtectedRestaurantMemberRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <ProtectedRestaurantMemberRoute
                allowedRoles={[EnumRestaurantMemberRole.OWNER]}
              >
                <Payments />
              </ProtectedRestaurantMemberRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showFooter && <Footer />}
    </>
  );
};

const Router = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent />
    </BrowserRouter>
  );
};

export default Router;
