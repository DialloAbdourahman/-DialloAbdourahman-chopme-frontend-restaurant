import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Loader2, Wallet } from "lucide-react";
import { AxiosError } from "axios";
import {
  EnumStatusCode,
  EnumStatusResponse,
  type IOrchestrationResult,
  type IRestaurantWallet,
} from "chopme-frontend-common";
import Navbar from "../components/Navbar";
import MoneyStatistics from "../components/MoneyStatistics";
import TransfersSection from "../components/TransfersSection";
import { RestaurantService } from "../services/restaurant.service";
import type { RootState } from "../store";

const Payments = () => {
  const { t } = useTranslation();
  const { restaurantMember } = useSelector((state: RootState) => state.user);
  const restaurantId = restaurantMember?.restaurant?.id;

  const [wallet, setWallet] = useState<IRestaurantWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [moneyRefreshSignal, setMoneyRefreshSignal] = useState(0);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchWallet = async () => {
      setLoading(true);
      try {
        const { data } = await RestaurantService.getWallet(restaurantId);
        if (
          data.code === EnumStatusResponse.SUCCESS &&
          data.statusCode === EnumStatusCode.RECOVERED_SUCCESSFULLY &&
          data.data
        ) {
          setWallet(data.data);
        } else {
          setWallet(null);
        }
      } catch (error) {
        const err = error as AxiosError<IOrchestrationResult<unknown>>;
        if (
          err?.response?.status === 404 ||
          err?.response?.data?.statusCode === EnumStatusCode.NOT_FOUND
        ) {
          setWallet(null);
        } else {
          setWallet(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [restaurantId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <MoneyStatistics refreshSignal={moneyRefreshSignal} />
        <div className="mt-10">
          {" "}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : !wallet ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-8 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wallet size={22} />
              </div>
              <h2 className="text-lg font-bold text-text">
                {t("payments.noWalletTitle")}
              </h2>
              <p className="max-w-sm text-sm text-gray-500">
                {t("payments.noWalletDescription")}
              </p>
              <Link
                to="/restaurant"
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
              >
                {t("payments.setUpWallet")}
              </Link>
            </div>
          ) : (
            <TransfersSection
              onTransferCreated={() =>
                setMoneyRefreshSignal((prev) => prev + 1)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
