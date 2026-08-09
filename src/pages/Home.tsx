import Navbar from "../components/Navbar";
import OrdersStatistics from "../components/OrdersStatistics";
import MenuOrderStatistics from "../components/MenuOrderStatistics";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <OrdersStatistics />
        <MenuOrderStatistics />
      </div>
    </div>
  );
};

export default Home;
