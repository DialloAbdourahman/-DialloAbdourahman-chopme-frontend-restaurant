import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  createCategorySchema,
  createMenuSchema,
  EnumRestaurantMemberRole,
  EnumStatusCode,
  EnumStatusResponse,
  type CreateCategoryDto,
  type CreateMenuDto,
  type ICategoryEntity,
  type IMenuEntity,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  ChevronDown,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { RootState } from "../store";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import { MenuService } from "../services/menu.service";
import { CategoryService } from "../services/category.service";
import { KEYS } from "../utils/keys";
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
  const [saving, setSaving] = useState(false);

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

  const coverInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const canManage = useMemo(() => {
    return (
      currentMember?.role === EnumRestaurantMemberRole.OWNER ||
      currentMember?.role === EnumRestaurantMemberRole.MANAGER
    );
  }, [currentMember]);

  const isDeleted = !!menu?.deletedAt;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateMenuDto>({
    resolver: zodResolver(createMenuSchema(ROUND_TO_NEAREST)),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: 0,
      available: true,
    },
  });

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
        reset({
          name: data.data.name,
          category: data.data.category?.id ?? "",
          description: data.data.description ?? "",
          price: data.data.price,
          available: data.data.available,
        });
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

  const onSave = async (values: CreateMenuDto) => {
    if (!menu) return;
    setSaving(true);
    try {
      const { data } = await MenuService.update(menu.id, values);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY &&
        data.data
      ) {
        showSuccessToast(t("menus.updateSuccess"));
        setMenu(data.data);
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("menus.updateNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("menus.updateNotFound"));
            break;
          case EnumStatusCode.CATEGORY_DOES_NOT_EXIST:
            showWarningToast(t("menus.categoryDoesNotExist"));
            break;
          default:
            showErrorToast(t("menus.updateError"));
        }
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("menus.updateNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("menus.updateNotFound"));
          break;
        case EnumStatusCode.CATEGORY_DOES_NOT_EXIST:
          showWarningToast(t("menus.categoryDoesNotExist"));
          break;
        default:
          showErrorToast(t("menus.updateError"));
      }
    } finally {
      setSaving(false);
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
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const onUploadImage = async (file: File) => {
    if (!menu) return;
    if (menu.pictures.length >= MAX_RESTAURANT_IMAGES) {
      showWarningToast(t("menus.maxImagesReached"));
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    if (!validateImageFile(file)) {
      if (imageInputRef.current) imageInputRef.current.value = "";
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
      if (imageInputRef.current) imageInputRef.current.value = "";
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
        reset({
          name: data.data.name,
          category: data.data.category?.id ?? "",
          description: data.data.description ?? "",
          price: data.data.price,
          available: data.data.available,
        });
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
            {canManage && !isDeleted && (
              <button
                type="button"
                onClick={() => setAvailabilityModalOpen(true)}
                disabled={togglingAvailability}
                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  menu.available
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                } disabled:opacity-60`}
              >
                {menu.available ? t("menus.disable") : t("menus.enable")}
              </button>
            )}
          </div>
        </div>

        {!isDeleted && !menu.available && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-800">
            {t("menus.unavailableNotice")}
          </div>
        )}

        {/* Gallery */}
        <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-text mb-3">
            {t("menus.coverImage")}
          </h2>
          <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-background flex items-center justify-center mb-3">
            {menu.coverImage ? (
              <img
                src={`${KEYS.PUBLIC_S3_PREFIX}/${menu.coverImage}`}
                alt={menu.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UtensilsCrossed size={40} className="text-primary/30" />
            )}
            {(uploadingCover || deletingCover) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={28} />
              </div>
            )}
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadCover(file);
                }}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-text hover:bg-card transition-colors disabled:opacity-60"
              >
                <ImagePlus size={16} />
                {t("menus.uploadCoverImage")}
              </button>
              {menu.coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverDeleteModalOpen(true)}
                  disabled={deletingCover}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {t("menus.removeCoverImage")}
                </button>
              )}
            </div>
          )}

          <h2 className="text-sm font-semibold text-text mt-6 mb-3">
            {t("menus.images")}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
            {menu.pictures.map((picture) => (
              <div
                key={picture}
                className="relative aspect-square rounded-xl overflow-hidden bg-background group"
              >
                <img
                  src={`${KEYS.PUBLIC_S3_PREFIX}/${picture}`}
                  alt={menu.name}
                  className="w-full h-full object-cover"
                />
                {deletingKey === picture && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={20} />
                  </div>
                )}
                {canManage && deletingKey !== picture && (
                  <button
                    type="button"
                    onClick={() => openImageDeleteModal(picture)}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white transition-opacity"
                    title={t("menus.removeImage")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {menu.pictures.length === 0 && (
              <div className="col-span-full text-sm text-gray-500 py-4 text-center">
                {t("menus.noImages")}
              </div>
            )}
          </div>
          {canManage && (
            <>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadImage(file);
                }}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-text hover:bg-card transition-colors disabled:opacity-60"
              >
                {uploadingImage ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ImagePlus size={16} />
                )}
                {t("menus.uploadImage")}
              </button>
            </>
          )}
        </div>

        {/* Details form */}
        <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-semibold text-text mb-4">
            {t("menus.details")}
          </h2>
          <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("menus.name")}
              </label>
              <input
                type="text"
                disabled={!canManage}
                {...register("name")}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors disabled:opacity-60 ${
                  errors.name
                    ? "border-red-400"
                    : "border-border focus:border-primary"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text uppercase tracking-wide">
                  {t("menus.category")}
                </label>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setCreateCategoryModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                  >
                    <Plus size={14} />
                    {t("menus.addCategory")}
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  disabled={!canManage || categoriesLoading}
                  {...register("category")}
                  value={watch("category")}
                  className={`w-full appearance-none rounded-xl border bg-background px-4 py-3 pr-10 text-sm text-text outline-none transition-colors disabled:opacity-60 ${
                    errors.category
                      ? "border-red-400"
                      : "border-border focus:border-primary"
                  }`}
                >
                  <option value="">{t("menus.selectCategory")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              {errors.category && (
                <p className="text-xs text-red-500">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("menus.description")}
              </label>
              <textarea
                disabled={!canManage}
                {...register("description")}
                rows={3}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors disabled:opacity-60 ${
                  errors.description
                    ? "border-red-400"
                    : "border-border focus:border-primary"
                }`}
              />
              {errors.description && (
                <p className="text-xs text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text uppercase tracking-wide">
                {t("menus.price")}
              </label>
              <input
                type="number"
                min={ROUND_TO_NEAREST}
                step={ROUND_TO_NEAREST}
                disabled={!canManage}
                {...register("price", { valueAsNumber: true })}
                className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-text outline-none transition-colors disabled:opacity-60 ${
                  errors.price
                    ? "border-red-400"
                    : "border-border focus:border-primary"
                }`}
              />
              <p className="text-xs text-text/60">
                {t("menus.priceHelp", { value: ROUND_TO_NEAREST })}
              </p>
              {errors.price && (
                <p className="text-xs text-red-500">{errors.price.message}</p>
              )}
            </div>

            {canManage && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {t("menus.save")}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Danger zone */}
        {canManage && (
          <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 border border-red-100">
            <h2 className="text-sm font-semibold text-red-600 mb-4">
              {t("menus.dangerZone")}
            </h2>
            {isDeleted ? (
              <button
                type="button"
                onClick={() => setRestoreModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-green-600 hover:bg-green-50 transition-colors"
              >
                <RefreshCcw size={16} />
                {t("menus.restore")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                {t("menus.delete")}
              </button>
            )}
          </div>
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
