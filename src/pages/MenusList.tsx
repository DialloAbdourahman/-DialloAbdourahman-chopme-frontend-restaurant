import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  EnumRestaurantMemberRole,
  EnumStatusCode,
  EnumStatusResponse,
  type ICategoryEntity,
  type IMenuEntity,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import {
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { RootState } from "../store";
import Navbar from "../components/Navbar";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import { CategoryService } from "../services/category.service";
import { MenuService } from "../services/menu.service";
import { KEYS } from "../utils/keys";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";

const LIMIT = 10;

const MenusList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { restaurantMember: currentMember } = useSelector(
    (state: RootState) => state.user,
  );

  const initialPage = () => {
    const p = Number(searchParams.get("page"));
    return Number.isNaN(p) || p < 1 ? 1 : p;
  };

  const [menus, setMenus] = useState<IMenuEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [deleted, setDeleted] = useState(
    searchParams.get("deleted") === "true",
  );
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") ?? "",
  );
  const [categories, setCategories] = useState<ICategoryEntity[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const isInitial = useRef(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<IMenuEntity | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [menuToRestore, setMenuToRestore] = useState<IMenuEntity | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [menuToToggleAvailability, setMenuToToggleAvailability] =
    useState<IMenuEntity | null>(null);

  const canManage = useMemo(() => {
    return (
      currentMember?.role === EnumRestaurantMemberRole.OWNER ||
      currentMember?.role === EnumRestaurantMemberRole.MANAGER
    );
  }, [currentMember]);

  const fetchMenus = async (currentPage = page) => {
    if (!currentMember?.restaurant?.id) return;
    setLoading(true);
    try {
      const { data } = await MenuService.search({
        restaurantId: currentMember.restaurant.id,
        search: search || undefined,
        page: currentPage,
        limit: LIMIT,
        categoryId: categoryId || undefined,
        deleted,
      });
      if (data.data) {
        setMenus(data.data.items);
        setPage(data.data.page);
        setTotalPages(data.data.totalPages);
      }
    } catch {
      showErrorToast(t("menus.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!menuToDelete) return;
    setActionLoading(true);
    try {
      const { data } = await MenuService.remove(menuToDelete.id);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.DELETED_SUCCESSFULLY
      ) {
        showSuccessToast(t("menus.deleteSuccess"));
        setDeleteModalOpen(false);
        setMenus((prev) => prev.filter((m) => m.id !== menuToDelete.id));
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("menus.deleteNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("menus.deleteNotFound"));
            break;
          default:
            showErrorToast(t("menus.deleteError"));
        }
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
    }
  };

  const onRestore = async () => {
    if (!menuToRestore) return;
    setActionLoading(true);
    try {
      const { data } = await MenuService.restore(menuToRestore.id);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY
      ) {
        showSuccessToast(t("menus.restoreSuccess"));
        setRestoreModalOpen(false);
        setMenus((prev) => prev.filter((m) => m.id !== menuToRestore.id));
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
    }
  };

  const openAvailabilityModal = (menu: IMenuEntity) => {
    if (!canManage || menu.deleted) return;
    setMenuToToggleAvailability(menu);
    setAvailabilityModalOpen(true);
  };

  const handleToggleAvailable = async () => {
    if (!menuToToggleAvailability) return;
    setTogglingId(menuToToggleAvailability.id);
    try {
      const { data } = await MenuService.toggleAvailable(
        menuToToggleAvailability.id,
      );
      if (data.data) {
        setMenus((prev) =>
          prev.map((m) =>
            m.id === menuToToggleAvailability.id ? data.data! : m,
          ),
        );
        showSuccessToast(t("menus.toggleAvailableSuccess"));
        setAvailabilityModalOpen(false);
      }
    } catch {
      showErrorToast(t("menus.toggleAvailableError"));
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [page, currentMember?.restaurant?.id]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentMember?.restaurant?.id) return;
      setCategoriesLoading(true);
      try {
        const { data } = await CategoryService.search({
          limit: 1000,
          deleted: false,
        });
        if (data.data) {
          setCategories(data.data.items);
        }
      } catch {
        showErrorToast(t("menus.fetchCategoriesError"));
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [currentMember?.restaurant?.id, t]);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (page === 1) {
      fetchMenus(1);
    } else {
      setPage(1);
    }
  }, [search, deleted, categoryId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (deleted) params.set("deleted", "true");
    if (categoryId) params.set("categoryId", categoryId);
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [search, deleted, categoryId, page, setSearchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-text">{t("menus.title")}</h1>
          {canManage && (
            <button
              type="button"
              onClick={() => navigate("/menus/create")}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              <Plus size={18} />
              {t("menus.addMenu")}
            </button>
          )}
        </div>

        <div className="bg-card rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("menus.searchPlaceholder")}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-text outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={categoriesLoading}
                  className="w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-text outline-none focus:border-primary disabled:opacity-60"
                >
                  <option value="">{t("menus.allCategories")}</option>
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
              <div className="relative">
                <select
                  value={deleted ? "deleted" : "active"}
                  onChange={(e) => setDeleted(e.target.value === "deleted")}
                  className="w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-text outline-none focus:border-primary"
                >
                  <option value="active">{t("menus.activeMenus")}</option>
                  <option value="deleted">{t("menus.deletedMenus")}</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm p-4">
          {loading && menus.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : menus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <UtensilsCrossed size={48} className="mb-3 opacity-40" />
              <p className="text-sm">{t("menus.empty")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menus.map((menu) => {
                  const isDeleted = menu.deleted;
                  const image = menu.coverImage ?? menu.pictures?.[0];
                  return (
                    <div
                      key={menu.id}
                      className={`bg-background rounded-2xl p-4 border flex flex-col gap-3 ${
                        isDeleted
                          ? "border-red-200 opacity-75"
                          : !menu.available
                            ? "border-amber-200"
                            : "border-border/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/menus/${menu.id}`)}
                        className="flex items-start gap-3 text-left"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-card shrink-0 flex items-center justify-center">
                          {image ? (
                            <img
                              src={`${KEYS.PUBLIC_S3_PREFIX}/${image}`}
                              alt={menu.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UtensilsCrossed
                              size={20}
                              className="text-primary/50"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text truncate">
                            {menu.name}
                          </p>
                          {menu.category && (
                            <p className="text-xs text-gray-500 truncate">
                              {menu.category.name}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-primary mt-0.5">
                            {menu.price.toLocaleString()} FCFA
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isDeleted ? (
                            <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700">
                              {t("menus.deleted")}
                            </span>
                          ) : canManage ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAvailabilityModal(menu);
                              }}
                              disabled={togglingId === menu.id}
                              title={t("menus.toggleAvailability")}
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                menu.available
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              } disabled:opacity-60`}
                            >
                              {togglingId === menu.id && (
                                <Loader2
                                  size={12}
                                  className="animate-spin mr-1"
                                />
                              )}
                              {menu.available
                                ? t("menus.availableStatus")
                                : t("menus.unavailableStatus")}
                            </button>
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
                        {canManage && (
                          <div className="flex items-center gap-1">
                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuToRestore(menu);
                                  setRestoreModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-green-600 transition-colors"
                                title={t("menus.restore")}
                              >
                                <RefreshCcw size={18} />
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/menus/${menu.id}`)}
                                  className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-primary transition-colors"
                                  title={t("menus.edit")}
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuToDelete(menu);
                                    setDeleteModalOpen(true);
                                  }}
                                  className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-red-600 transition-colors"
                                  title={t("menus.delete")}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 mt-4 border-t border-border">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <DeleteModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title={t("menus.deleteTitle")}
        description={t("menus.deleteDescription", {
          name: menuToDelete?.name ?? "",
        })}
        confirmText={t("menus.delete")}
        loading={actionLoading}
        onConfirm={onDelete}
      />

      <ConfirmModal
        open={restoreModalOpen}
        setOpen={setRestoreModalOpen}
        title={t("menus.restoreTitle")}
        description={t("menus.restoreDescription", {
          name: menuToRestore?.name ?? "",
        })}
        confirmText={t("menus.restore")}
        loading={actionLoading}
        onConfirm={onRestore}
      />

      <ConfirmModal
        open={availabilityModalOpen}
        setOpen={setAvailabilityModalOpen}
        title={
          menuToToggleAvailability?.available
            ? t("menus.disableTitle")
            : t("menus.enableTitle")
        }
        description={
          menuToToggleAvailability?.available
            ? t("menus.disableDescription", {
                name: menuToToggleAvailability?.name ?? "",
              })
            : t("menus.enableDescription", {
                name: menuToToggleAvailability?.name ?? "",
              })
        }
        confirmText={
          menuToToggleAvailability?.available
            ? t("menus.disable")
            : t("menus.enable")
        }
        variant={menuToToggleAvailability?.available ? "danger" : "success"}
        loading={togglingId === menuToToggleAvailability?.id}
        onConfirm={handleToggleAvailable}
      />
    </div>
  );
};

export default MenusList;
