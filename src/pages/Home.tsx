import { useSelector } from "react-redux";
import { EnumRestaurantMemberRole } from "chopme-frontend-common";
import Navbar from "../components/Navbar";
import OrdersStatistics from "../components/OrdersStatistics";
import MenuOrderStatistics from "../components/MenuOrderStatistics";
import MoneyStatistics from "../components/MoneyStatistics";
import type { RootState } from "../store";

const Home = () => {
  const { restaurantMember } = useSelector((state: RootState) => state.user);
  const isOwner = restaurantMember?.role === EnumRestaurantMemberRole.OWNER;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <OrdersStatistics />
        {isOwner && (
          <div className="mt-6 space-y-6">
            <MoneyStatistics />
          </div>
        )}
        <MenuOrderStatistics />
      </div>
    </div>
  );
};

export default Home;
