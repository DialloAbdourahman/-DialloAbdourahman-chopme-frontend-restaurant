import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  createCategorySchema,
  EnumRestaurantMemberRole,
  EnumStatusCode,
  EnumStatusResponse,
  type CreateCategoryDto,
  type ICategoryEntity,
  type IMenuEntity,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import { ArrowLeft, Loader2, UtensilsCrossed } from "lucide-react";
import type { RootState } from "../store";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import { MenuService } from "../services/menu.service";
import { CategoryService } from "../services/category.service";
import { KEYS } from "../utils/keys";
import MenuGallerySection from "../components/menu-details/MenuGallerySection";
import MenuDetailsForm from "../components/menu-details/MenuDetailsForm";
import MenuAvailabilitySection from "../components/menu-details/MenuAvailabilitySection";
import MenuDangerZone from "../components/menu-details/MenuDangerZone";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";

const ROUND_TO_NEAREST = Number(KEYS.ROUND_TO_NEAREST) || 5;
const MAX_RESTAURANT_IMAGES = Number(KEYS.MAX_RESTAURANT_IMAGES) || 5;
const MAX_RESTAURANT_IMAGE_SIZE_IN_MB =
  Number(KEYS.MAX_RESTAURANT_IMAGE_SIZE_IN_MB) || 5;
const MAX_IMAGE_SIZE_BYTES = MAX_RESTAURANT_IMAGE_SIZE_IN_MB * 1024 * 1024;

const MenuDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { menuId } = useParams<{ menuId: string }>();
  const { restaurantMember: currentMember } = useSelector(
    (state: RootState) => state.user,
  );

  const [menu, setMenu] = useState<IMenuEntity | null>(null);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<ICategoryEntity[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deletingCover, setDeletingCover] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageDeleteModalOpen, setImageDeleteModalOpen] = useState(false);
  const [imageKeyToDelete, setImageKeyToDelete] = useState<string | null>(null);
  const [coverDeleteModalOpen, setCoverDeleteModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  const canManage = useMemo(() => {
    return (
      currentMember?.role === EnumRestaurantMemberRole.OWNER ||
      currentMember?.role === EnumRestaurantMemberRole.MANAGER
    );
  }, [currentMember]);

  const isDeleted = !!menu?.deletedAt;

  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    reset: resetCategoryForm,
    formState: { errors: categoryErrors },
  } = useForm<CreateCategoryDto>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fetchMenu = async () => {
    if (!menuId) return;
    setLoading(true);
    try {
      const { data } = await MenuService.findOne(menuId);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.RECOVERED_SUCCESSFULLY &&
        data.data
      ) {
        setMenu(data.data);
      }
    } catch {
      showErrorToast(t("menus.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data } = await CategoryService.search({
        deleted: false,
        limit: 100,
      });
      if (data.data) {
        setCategories(data.data.items);
      }
    } catch {
      showErrorToast(t("categories.fetchError"));
    } finally {
      setCategoriesLoading(false);
    }
  };

  const onCreateCategory = async (values: CreateCategoryDto) => {
    setCreatingCategory(true);
    try {
      const { data } = await CategoryService.create(values);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.CREATED_SUCCESSFULLY &&
        data.data
      ) {
        showSuccessToast(t("categories.createSuccess"));
        setCategories((prev) => [...prev, data.data!]);
        setCreateCategoryModalOpen(false);
        resetCategoryForm();
      } else {
        showErrorToast(t("categories.createError"));
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("categories.createNotAllowed"));
          break;
        case EnumStatusCode.VALIDATION_ERROR:
          showWarningToast(t("categories.createValidation"));
          break;
        default:
          showErrorToast(t("categories.createError"));
      }
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleUploadError = (error: unknown) => {
    const err = error as AxiosError<IOrchestrationResult<string>>;
    switch (err?.response?.data?.statusCode) {
      case EnumStatusCode.ONLY_IMAGE_FILES_ALLOWED:
        showWarningToast(t("menus.onlyImageFilesAllowed"));
        break;
      case EnumStatusCode.MAX_IMAGES_REACHED:
        showWarningToast(t("menus.maxImagesReached"));
        break;
      case EnumStatusCode.NOT_ALLOWED:
        showWarningToast(t("menus.updateNotAllowed"));
        break;
      case EnumStatusCode.NOT_FOUND:
        showWarningToast(t("menus.updateNotFound"));
        break;
      default:
        showErrorToast(t("menus.uploadError"));
    }
  };

  const validateImageFile = (file: File) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showWarningToast(
        t("menus.imageTooLarge", { value: MAX_RESTAURANT_IMAGE_SIZE_IN_MB }),
      );
      return false;
    }
    return true;
  };

  const onUploadCover = async (file: File) => {
    if (!menu || !validateImageFile(file)) return;
    setUploadingCover(true);
    try {
      const { data } = await MenuService.uploadCoverImage(menu.id, file);
      if (data.data) {
        setMenu(data.data);
        showSuccessToast(t("menus.uploadSuccess"));
      }
    } catch (error) {
      handleUploadError(error);
    } finally {
      setUploadingCover(false);
    }
  };

  const onUploadImage = async (file: File) => {
    if (!menu) return;
    if (menu.pictures.length >= MAX_RESTAURANT_IMAGES) {
      showWarningToast(t("menus.maxImagesReached"));
      return;
    }
    if (!validateImageFile(file)) {
      return;
    }
    setUploadingImage(true);
    try {
      const { data } = await MenuService.uploadImage(menu.id, file);
      if (data.data) {
        setMenu(data.data);
        showSuccessToast(t("menus.uploadSuccess"));
      }
    } catch (error) {
      handleUploadError(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const onDeleteCover = async () => {
    if (!menu) return;
    setDeletingCover(true);
    try {
      const { data } = await MenuService.deleteCoverImage(menu.id);
      if (data.data) {
        setMenu(data.data);
        showSuccessToast(t("menus.imageDeleteSuccess"));
      }
    } catch {
      showErrorToast(t("menus.imageDeleteError"));
    } finally {
      setDeletingCover(false);
    }
  };

  const confirmCoverDelete = async () => {
    await onDeleteCover();
    setCoverDeleteModalOpen(false);
  };

  const openImageDeleteModal = (key: string) => {
    setImageKeyToDelete(key);
    setImageDeleteModalOpen(true);
  };

  const closeImageDeleteModal = () => {
    setImageDeleteModalOpen(false);
    setImageKeyToDelete(null);
  };

  const onDeleteImage = async (key: string) => {
    if (!menu) return;
    setDeletingKey(key);
    try {
      const { data } = await MenuService.deleteImage(menu.id, key);
      if (data.data) {
        setMenu(data.data);
        showSuccessToast(t("menus.imageDeleteSuccess"));
      }
    } catch {
      showErrorToast(t("menus.imageDeleteError"));
    } finally {
      setDeletingKey(null);
    }
  };

  const confirmImageDelete = async () => {
    if (!imageKeyToDelete) return;
    await onDeleteImage(imageKeyToDelete);
    closeImageDeleteModal();
  };

  const handleToggleAvailability = async () => {
    if (!menu || menu.deleted) return;
    setTogglingAvailability(true);
    try {
      const { data } = await MenuService.toggleAvailable(menu.id);
      if (data.data) {
        setMenu(data.data);
        showSuccessToast(t("menus.toggleAvailableSuccess"));
        setAvailabilityModalOpen(false);
      }
    } catch {
      showErrorToast(t("menus.toggleAvailableError"));
    } finally {
      setTogglingAvailability(false);
    }
  };

  const onDeleteMenu = async () => {
    if (!menu) return;
    setActionLoading(true);
    try {
      const { data } = await MenuService.remove(menu.id);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.DELETED_SUCCESSFULLY
      ) {
        showSuccessToast(t("menus.deleteSuccess"));
        navigate("/menus");
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("menus.deleteNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("menus.deleteNotFound"));
          break;
        default:
          showErrorToast(t("menus.deleteError"));
      }
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const onRestoreMenu = async () => {
    if (!menu) return;
    setActionLoading(true);
    try {
      const { data } = await MenuService.restore(menu.id);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY &&
        data.data
      ) {
        showSuccessToast(t("menus.restoreSuccess"));
        setMenu(data.data);
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("menus.restoreNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("menus.restoreNotFound"));
            break;
          default:
            showErrorToast(t("menus.restoreError"));
        }
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("menus.restoreNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("menus.restoreNotFound"));
          break;
        default:
          showErrorToast(t("menus.restoreError"));
      }
    } finally {
      setActionLoading(false);
      setRestoreModalOpen(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, [menuId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="bg-card rounded-full p-4 mb-4">
            <UtensilsCrossed size={28} className="text-primary" />
          </div>
          <h3 className="font-semibold text-text">{t("menus.notFound")}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t("menus.notFoundDesc")}
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
            to="/menus"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} />
            {t("menus.backToMenus")}
          </Link>
          <div className="flex items-center gap-2">
            {isDeleted ? (
              <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700">
                {t("menus.deleted")}
              </span>
            ) : (
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  menu.available
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {menu.available
                  ? t("menus.availableStatus")
                  : t("menus.unavailableStatus")}
              </span>
            )}
          </div>
        </div>

        {!isDeleted && !menu.available && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-800">
            {t("menus.unavailableNotice")}
          </div>
        )}

        {/* Gallery */}
        <MenuGallerySection
          menu={menu}
          canManage={canManage}
          uploadingCover={uploadingCover}
          deletingCover={deletingCover}
          uploadingImage={uploadingImage}
          deletingKey={deletingKey}
          onUploadCover={onUploadCover}
          onUploadImage={onUploadImage}
          onCoverDeleteClick={() => setCoverDeleteModalOpen(true)}
          onImageDeleteClick={openImageDeleteModal}
        />

        {/* Details form */}
        <MenuDetailsForm
          menu={menu}
          canManage={canManage}
          categories={categories}
          categoriesLoading={categoriesLoading}
          roundToNearest={ROUND_TO_NEAREST}
          onMenuUpdated={(updated) => setMenu(updated)}
          onAddCategoryClick={() => setCreateCategoryModalOpen(true)}
        />

        {/* Availability */}
        <MenuAvailabilitySection
          available={menu.available}
          canManage={canManage}
          toggling={togglingAvailability}
          onToggleClick={() => setAvailabilityModalOpen(true)}
        />

        {/* Danger zone */}
        {canManage && (
          <MenuDangerZone
            isDeleted={isDeleted}
            onRestoreClick={() => setRestoreModalOpen(true)}
            onDeleteClick={() => setDeleteModalOpen(true)}
          />
        )}
      </main>

      <Modal
        open={createCategoryModalOpen}
        setOpen={setCreateCategoryModalOpen}
        title={t("categories.addCategory")}
        textButton={
          creatingCategory ? t("common.loading") : t("categories.create")
        }
        loading={creatingCategory}
        onValidate={handleSubmitCategory(onCreateCategory)}
        dontShowCancelButton={false}
        xlSize="1"
      >
        <form className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wide">
              {t("categories.name")}
            </label>
            <input
              type="text"
              {...registerCategory("name")}
              className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-text outline-none focus:border-primary ${
                categoryErrors.name ? "border-red-400" : "border-border"
              }`}
            />
            {categoryErrors.name && (
              <p className="text-xs text-red-500">
                {categoryErrors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wide">
              {t("categories.description")}
            </label>
            <textarea
              {...registerCategory("description")}
              rows={3}
              className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-text outline-none focus:border-primary ${
                categoryErrors.description ? "border-red-400" : "border-border"
              }`}
            />
            {categoryErrors.description && (
              <p className="text-xs text-red-500">
                {categoryErrors.description.message}
              </p>
            )}
          </div>
        </form>
      </Modal>

      <DeleteModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title={t("menus.deleteTitle")}
        description={t("menus.deleteDescription", { name: menu.name })}
        confirmText={t("menus.delete")}
        loading={actionLoading}
        onConfirm={onDeleteMenu}
      />

      <ConfirmModal
        open={restoreModalOpen}
        setOpen={setRestoreModalOpen}
        title={t("menus.restoreTitle")}
        description={t("menus.restoreDescription", { name: menu.name })}
        confirmText={t("menus.restore")}
        loading={actionLoading}
        onConfirm={onRestoreMenu}
      />

      <DeleteModal
        open={imageDeleteModalOpen}
        setOpen={setImageDeleteModalOpen}
        title={t("menus.deleteImageTitle")}
        description={t("menus.deleteImageDescription")}
        confirmText={t("menus.delete")}
        loading={deletingKey !== null}
        onConfirm={confirmImageDelete}
      />

      <DeleteModal
        open={coverDeleteModalOpen}
        setOpen={setCoverDeleteModalOpen}
        title={t("menus.deleteCoverImageTitle")}
        description={t("menus.deleteCoverImageDescription")}
        confirmText={t("menus.delete")}
        loading={deletingCover}
        onConfirm={confirmCoverDelete}
      />

      <ConfirmModal
        open={availabilityModalOpen}
        setOpen={setAvailabilityModalOpen}
        title={
          menu.available ? t("menus.disableTitle") : t("menus.enableTitle")
        }
        description={
          menu.available
            ? t("menus.disableDescription", { name: menu.name })
            : t("menus.enableDescription", { name: menu.name })
        }
        confirmText={menu.available ? t("menus.disable") : t("menus.enable")}
        variant={menu.available ? "danger" : "success"}
        loading={togglingAvailability}
        onConfirm={handleToggleAvailability}
      />
    </div>
  );
};

export default MenuDetails;
