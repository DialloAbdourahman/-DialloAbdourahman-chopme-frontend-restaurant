import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createCategorySchema,
  EnumRestaurantMemberRole,
  EnumStatusCode,
  EnumStatusResponse,
  type CreateCategoryDto,
  type ICategoryEntity,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AxiosError } from "axios";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Tag,
  Loader2,
  RefreshCcw,
  ChevronDown,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { RootState } from "../store";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import DeleteModal from "../components/DeleteModal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import { CategoryService } from "../services/category.service";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";

const LIMIT = 10;

const MenuCategories = () => {
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

  const [categories, setCategories] = useState<ICategoryEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [deleted, setDeleted] = useState(
    searchParams.get("deleted") === "true",
  );
  const isInitial = useRef(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ICategoryEntity | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: editErrors },
  } = useForm<CreateCategoryDto>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ICategoryEntity | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [categoryToRestore, setCategoryToRestore] =
    useState<ICategoryEntity | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canManage = useMemo(() => {
    return (
      currentMember?.role === EnumRestaurantMemberRole.OWNER ||
      currentMember?.role === EnumRestaurantMemberRole.MANAGER
    );
  }, [currentMember]);

  const fetchCategories = async (currentPage = page) => {
    setLoading(true);
    try {
      const { data } = await CategoryService.search({
        search: search || undefined,
        page: currentPage,
        limit: LIMIT,
        deleted,
      });
      if (data.data) {
        setCategories(data.data.items);
        setPage(data.data.page);
        setTotalPages(data.data.totalPages);
      }
    } catch {
      showErrorToast(t("categories.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (category: ICategoryEntity) => {
    setCategoryToEdit(category);
    reset({
      name: category.name,
      description: category.description ?? "",
    });
    setEditModalOpen(true);
  };

  const onUpdate = async (values: CreateCategoryDto) => {
    if (!categoryToEdit) return;
    setActionLoading(true);
    try {
      const { data } = await CategoryService.update(categoryToEdit.id, {
        name: values.name,
        description: values.description || undefined,
      });
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY
      ) {
        showSuccessToast(t("categories.updateSuccess"));
        setEditModalOpen(false);
        if (data.data) {
          setCategories((prev) =>
            prev.map((c) => (c.id === data.data!.id ? data.data! : c)),
          );
        }
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("categories.updateNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("categories.updateNotFound"));
            break;
          default:
            showErrorToast(t("categories.updateError"));
        }
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("categories.updateNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("categories.updateNotFound"));
          break;
        default:
          showErrorToast(t("categories.updateError"));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const onDelete = async () => {
    if (!categoryToDelete) return;
    setActionLoading(true);
    try {
      const { data } = await CategoryService.remove(categoryToDelete.id);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.DELETED_SUCCESSFULLY
      ) {
        showSuccessToast(t("categories.deleteSuccess"));
        setDeleteModalOpen(false);
        setCategories((prev) =>
          prev.filter((c) => c.id !== categoryToDelete.id),
        );
      } else if (data.statusCode === EnumStatusCode.CATEGORY_IN_USE) {
        showWarningToast(t("categories.inUseError"));
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("categories.deleteNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("categories.deleteNotFound"));
            break;
          default:
            showErrorToast(t("categories.deleteError"));
        }
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.CATEGORY_IN_USE:
          showWarningToast(t("categories.inUseError"));
          break;
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("categories.deleteNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("categories.deleteNotFound"));
          break;
        default:
          showErrorToast(t("categories.deleteError"));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const onRestore = async () => {
    if (!categoryToRestore) return;
    setActionLoading(true);
    try {
      const { data } = await CategoryService.restore(categoryToRestore.id);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY
      ) {
        showSuccessToast(t("categories.restoreSuccess"));
        setRestoreModalOpen(false);
        setCategories((prev) =>
          prev.filter((c) => c.id !== categoryToRestore.id),
        );
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("categories.restoreNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("categories.restoreNotFound"));
            break;
          default:
            showErrorToast(t("categories.restoreError"));
        }
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("categories.restoreNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("categories.restoreNotFound"));
          break;
        default:
          showErrorToast(t("categories.restoreError"));
      }
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (editModalOpen && categoryToEdit) {
      reset({
        name: categoryToEdit.name,
        description: categoryToEdit.description ?? "",
      });
    }
  }, [editModalOpen, categoryToEdit, reset]);

  useEffect(() => {
    fetchCategories();
  }, [page]);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (page === 1) {
      fetchCategories(1);
    } else {
      setPage(1);
    }
  }, [search, deleted]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (deleted) params.set("deleted", "true");
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [search, deleted, page, setSearchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-text">
            {t("categories.title")}
          </h1>
          {canManage && (
            <button
              type="button"
              onClick={() => navigate("/categories/create")}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              <Plus size={18} />
              {t("categories.addCategory")}
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
                placeholder={t("categories.searchPlaceholder")}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-text outline-none focus:border-primary"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <select
                value={deleted ? "deleted" : "active"}
                onChange={(e) => setDeleted(e.target.value === "deleted")}
                className="w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-text outline-none focus:border-primary"
              >
                <option value="active">{t("categories.active")}</option>
                <option value="deleted">{t("categories.deleted")}</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm p-4">
          {loading && categories.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Tag size={48} className="mb-3 opacity-40" />
              <p className="text-sm">{t("categories.empty")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const isDeleted = category.deleted;
                  return (
                    <div
                      key={category.id}
                      className="bg-background rounded-2xl p-4 border border-border/50 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                            <Tag className="text-primary" size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-text truncate">
                              {category.name}
                            </p>
                            {category.description && (
                              <p className="text-sm text-text/70 truncate">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            isDeleted
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isDeleted
                            ? t("categories.deleted")
                            : t("categories.active")}
                        </span>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCategoryToRestore(category);
                                  setRestoreModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-green-600 transition-colors"
                                title={t("categories.restore")}
                              >
                                <RefreshCcw size={18} />
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(category)}
                                  className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-primary transition-colors"
                                  title={t("categories.edit")}
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCategoryToDelete(category);
                                    setDeleteModalOpen(true);
                                  }}
                                  className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-red-600 transition-colors"
                                  title={t("categories.delete")}
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

      <Modal
        open={editModalOpen}
        setOpen={setEditModalOpen}
        title={t("categories.editTitle")}
        textButton={actionLoading ? t("common.loading") : t("common.save")}
        loading={actionLoading}
        onValidate={handleSubmit(onUpdate)}
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
              {...register("name")}
              className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-text outline-none focus:border-primary ${
                editErrors.name ? "border-red-400" : "border-border"
              }`}
            />
            {editErrors.name && (
              <p className="text-xs text-red-500">{editErrors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wide">
              {t("categories.description")}
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-text outline-none focus:border-primary ${
                editErrors.description ? "border-red-400" : "border-border"
              }`}
            />
            {editErrors.description && (
              <p className="text-xs text-red-500">
                {editErrors.description.message}
              </p>
            )}
          </div>
        </form>
      </Modal>

      <DeleteModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title={t("categories.deleteTitle")}
        description={t("categories.deleteDescription", {
          name: categoryToDelete?.name ?? "",
        })}
        confirmText={t("categories.delete")}
        loading={actionLoading}
        onConfirm={onDelete}
      />

      <ConfirmModal
        open={restoreModalOpen}
        setOpen={setRestoreModalOpen}
        title={t("categories.restoreTitle")}
        description={t("categories.restoreDescription", {
          name: categoryToRestore?.name ?? "",
        })}
        confirmText={t("categories.restore")}
        loading={actionLoading}
        onConfirm={onRestore}
      />
    </div>
  );
};

export default MenuCategories;
