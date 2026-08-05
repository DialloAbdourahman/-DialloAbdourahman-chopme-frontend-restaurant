import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ArrowLeft, Store } from "lucide-react";
import {
  EnumRestaurantMemberRole,
  EnumStatusCode,
  EnumStatusResponse,
  type IRestaurantEntity,
} from "chopme-frontend-common";
import type { RootState } from "../store";
import { RestaurantService } from "../services/restaurant.service";
import { KEYS } from "../utils/keys";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";
import Navbar from "../components/Navbar";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import RestaurantCoverSection from "../components/restaurant-details/RestaurantCoverSection";
import RestaurantGallerySection from "../components/restaurant-details/RestaurantGallerySection";
import RestaurantInfoSection from "../components/restaurant-details/RestaurantInfoSection";
import RestaurantDeliveryPricingSection from "../components/restaurant-details/RestaurantDeliveryPricingSection";
import RestaurantAvailabilitySection from "../components/restaurant-details/RestaurantAvailabilitySection";
import RestaurantClosedSection from "../components/restaurant-details/RestaurantClosedSection";
import RestaurantWalletSection from "../components/restaurant-details/RestaurantWalletSection";

const MAX_RESTAURANT_IMAGES = Number(KEYS.MAX_RESTAURANT_IMAGES) || 5;
const MAX_RESTAURANT_IMAGE_SIZE_IN_MB =
  Number(KEYS.MAX_RESTAURANT_IMAGE_SIZE_IN_MB) || 5;
const MAX_IMAGE_SIZE_BYTES = MAX_RESTAURANT_IMAGE_SIZE_IN_MB * 1024 * 1024;

const RestaurantDetails = () => {
  const { t } = useTranslation();
  const { restaurantMember } = useSelector((state: RootState) => state.user);

  const isOwner = restaurantMember?.role === EnumRestaurantMemberRole.OWNER;

  const [restaurant, setRestaurant] = useState<IRestaurantEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingClosed, setTogglingClosed] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingCover, setDeletingCover] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const [coverDeleteModalOpen, setCoverDeleteModalOpen] = useState(false);
  const [imageDeleteModalOpen, setImageDeleteModalOpen] = useState(false);
  const [imageKeyToDelete, setImageKeyToDelete] = useState<string | null>(null);
  const [closedModalOpen, setClosedModalOpen] = useState(false);

  useEffect(() => {
    const id = restaurantMember?.restaurant?.id;
    if (!id) return;

    const fetchRestaurant = async () => {
      setLoading(true);
      try {
        const { data } = await RestaurantService.findOnePrivate(id);
        if (
          data.code === EnumStatusResponse.SUCCESS &&
          data.statusCode === EnumStatusCode.RECOVERED_SUCCESSFULLY &&
          data.data
        ) {
          setRestaurant(data.data);
        }
      } catch {
        showErrorToast(t("restaurantDetails.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantMember?.restaurant?.id]);

  const handleUpdate = (updated: IRestaurantEntity) => {
    setRestaurant(updated);
  };

  const validateImageFile = (file: File) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showWarningToast(
        t("restaurantDetails.imageTooLarge", {
          value: MAX_RESTAURANT_IMAGE_SIZE_IN_MB,
        }),
      );
      return false;
    }
    return true;
  };

  const onUploadCover = async (file: File) => {
    if (!restaurant || !validateImageFile(file)) return;
    setUploadingCover(true);
    try {
      const { data } = await RestaurantService.uploadCoverImage(
        restaurant.id,
        file,
      );
      if (data.data) {
        setRestaurant(data.data);
        showSuccessToast(t("restaurantDetails.uploadSuccess"));
      }
    } catch {
      showErrorToast(t("restaurantDetails.uploadError"));
    } finally {
      setUploadingCover(false);
    }
  };

  const onUploadImage = async (file: File) => {
    if (!restaurant) return;
    if (restaurant.pictures.length >= MAX_RESTAURANT_IMAGES) {
      showWarningToast(t("restaurantDetails.maxImagesReached"));
      return;
    }
    if (!validateImageFile(file)) return;
    setUploadingImage(true);
    try {
      const { data } = await RestaurantService.uploadImage(restaurant.id, file);
      if (data.data) {
        setRestaurant(data.data);
        showSuccessToast(t("restaurantDetails.uploadSuccess"));
      }
    } catch {
      showErrorToast(t("restaurantDetails.uploadError"));
    } finally {
      setUploadingImage(false);
    }
  };

  const onDeleteCover = async () => {
    if (!restaurant) return;
    setDeletingCover(true);
    try {
      const { data } = await RestaurantService.deleteCoverImage(restaurant.id);
      if (data.data) {
        setRestaurant(data.data);
        showSuccessToast(t("restaurantDetails.imageDeleteSuccess"));
      }
    } catch {
      showErrorToast(t("restaurantDetails.imageDeleteError"));
    } finally {
      setDeletingCover(false);
      setCoverDeleteModalOpen(false);
    }
  };

  const onDeleteImage = async (key: string) => {
    if (!restaurant) return;
    setDeletingKey(key);
    try {
      const { data } = await RestaurantService.deleteImage(restaurant.id, key);
      if (data.data) {
        setRestaurant(data.data);
        showSuccessToast(t("restaurantDetails.imageDeleteSuccess"));
      }
    } catch {
      showErrorToast(t("restaurantDetails.imageDeleteError"));
    } finally {
      setDeletingKey(null);
      setImageDeleteModalOpen(false);
    }
  };

  const openImageDeleteModal = (key: string) => {
    setImageKeyToDelete(key);
    setImageDeleteModalOpen(true);
  };

  const handleToggleClosed = async () => {
    if (!restaurant) return;
    setTogglingClosed(true);
    try {
      const { data } = await RestaurantService.toggleClosed(restaurant.id);
      if (data.data) {
        setRestaurant(data.data);
        showSuccessToast(t("restaurantDetails.toggleClosedSuccess"));
        setClosedModalOpen(false);
      }
    } catch {
      showErrorToast(t("restaurantDetails.toggleClosedError"));
    } finally {
      setTogglingClosed(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <div className="h-6 w-1/3 bg-card rounded-xl animate-pulse" />
          <div className="h-56 sm:h-72 bg-card animate-pulse rounded-2xl" />
          <div className="h-40 bg-card rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="bg-card rounded-full p-4 mb-4">
            <Store size={28} className="text-primary" />
          </div>
          <h3 className="font-semibold text-text">
            {t("restaurantDetails.notFound")}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t("restaurantDetails.notFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between py-4">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} />
            {t("common.back")}
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                restaurant.isClosed
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {restaurant.isClosed
                ? t("restaurantDetails.closedStatus")
                : t("restaurantDetails.openStatus")}
            </span>
          </div>
        </div>

        {restaurant.isClosed && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-sm text-red-800">
            {t("restaurantDetails.closedNotice")}
          </div>
        )}

        <RestaurantCoverSection
          coverImage={restaurant.coverImage}
          name={restaurant.name}
          uploadingCover={uploadingCover}
          deletingCover={deletingCover}
          onUpload={onUploadCover}
          onDelete={() => setCoverDeleteModalOpen(true)}
        />

        <RestaurantGallerySection
          pictures={restaurant.pictures}
          name={restaurant.name}
          uploadingImage={uploadingImage}
          deletingKey={deletingKey}
          onUpload={onUploadImage}
          onDelete={openImageDeleteModal}
        />

        <RestaurantInfoSection
          restaurant={restaurant}
          onUpdate={handleUpdate}
        />

        <RestaurantDeliveryPricingSection
          restaurant={restaurant}
          onUpdate={handleUpdate}
        />

        <RestaurantAvailabilitySection
          restaurant={restaurant}
          onUpdate={handleUpdate}
        />

        <RestaurantWalletSection
          restaurantId={restaurant.id}
          isOwner={isOwner}
        />

        <RestaurantClosedSection
          isClosed={restaurant.isClosed}
          togglingClosed={togglingClosed}
          onOpenModal={() => setClosedModalOpen(true)}
        />
      </main>

      <DeleteModal
        open={coverDeleteModalOpen}
        setOpen={setCoverDeleteModalOpen}
        title={t("restaurantDetails.deleteCoverImageTitle")}
        description={t("restaurantDetails.deleteCoverImageDescription")}
        confirmText={t("common.delete")}
        loading={deletingCover}
        onConfirm={onDeleteCover}
      />

      <DeleteModal
        open={imageDeleteModalOpen}
        setOpen={setImageDeleteModalOpen}
        title={t("restaurantDetails.deleteImageTitle")}
        description={t("restaurantDetails.deleteImageDescription")}
        confirmText={t("common.delete")}
        loading={deletingKey !== null}
        onConfirm={() => imageKeyToDelete && onDeleteImage(imageKeyToDelete)}
      />

      <ConfirmModal
        open={closedModalOpen}
        setOpen={setClosedModalOpen}
        title={
          restaurant.isClosed
            ? t("restaurantDetails.openTitle")
            : t("restaurantDetails.closeTitle")
        }
        description={
          restaurant.isClosed
            ? t("restaurantDetails.openDescription", { name: restaurant.name })
            : t("restaurantDetails.closeDescription", { name: restaurant.name })
        }
        confirmText={
          restaurant.isClosed
            ? t("restaurantDetails.open")
            : t("restaurantDetails.close")
        }
        variant={restaurant.isClosed ? "success" : "danger"}
        loading={togglingClosed}
        onConfirm={handleToggleClosed}
      />
    </div>
  );
};

export default RestaurantDetails;
