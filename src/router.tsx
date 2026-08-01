import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Signin from "./pages/Signin";
import Home from "./pages/Home";
import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import { EnumRestaurantMemberRole } from "chopme-frontend-common";

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

const Router = () => {
  return (
    <BrowserRouter>
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
          path="/owner"
          element={
            <ProtectedRoute>
              <ProtectedRestaurantMemberRoute
                allowedRoles={[EnumRestaurantMemberRole.OWNER]}
              >
                <div>Owner</div>
              </ProtectedRestaurantMemberRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
