import { useTranslation } from "react-i18next";
import { Eye, ExternalLink, Star, Store } from "lucide-react";
import { KEYS } from "../../utils/keys";

interface RestaurantPublicProfileBannerProps {
  slug: string;
  totalViews: number;
  ratingTotal: number;
}

const RestaurantPublicProfileBanner = ({
  slug,
  totalViews,
  ratingTotal,
}: RestaurantPublicProfileBannerProps) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm text-primary">
            <Store size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">
              {t("restaurantDetails.publicProfileTitle")}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <Eye size={16} />
                {totalViews} {t("restaurantDetails.views")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <Star size={16} className="text-amber-500" />
                {ratingTotal} {t("restaurantDetails.ratings")}
              </span>
            </div>
          </div>
        </div>
        <a
          href={`${KEYS.CLIENT_WEBSITE_URL}/restaurants/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all shrink-0"
        >
          {t("restaurantDetails.viewPublicProfile")}
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

export default RestaurantPublicProfileBanner;
