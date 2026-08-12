import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, Smartphone, Wallet } from "lucide-react";
import { AxiosError } from "axios";
import {
  EnumStatusCode,
  EnumStatusResponse,
  EnumWalletTypes,
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
        <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 p-5 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm text-primary">
                <Wallet size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text tracking-tight">
                  {t("payments.title")}
                </h1>
                <p className="text-sm text-gray-500">
                  {t("payments.subtitle")}
                </p>
              </div>
            </div>
            {!loading && wallet && (
              <div className="inline-flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-sm shrink-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 size={16} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-text">
                    {wallet.type === EnumWalletTypes.MOBILE_WALLET
                      ? t("payments.walletTypeMobile")
                      : wallet.type}
                  </p>
                  {wallet.mobileData && (
                    <p className="text-xs text-gray-400">
                      {wallet.mobileData.network} — {wallet.mobileData.number}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <MoneyStatistics refreshSignal={moneyRefreshSignal} />

        <div className="mt-10">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : !wallet ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-10 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Smartphone size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">
                  {t("payments.noWalletTitle")}
                </h2>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  {t("payments.noWalletDescription")}
                </p>
              </div>
              <Link
                to="/restaurant"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
              >
                <Wallet size={18} />
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
