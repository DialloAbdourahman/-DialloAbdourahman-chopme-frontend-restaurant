import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  EnumRestaurantMemberRole,
  EnumStatusCode,
  EnumStatusResponse,
  type IRestaurantMemberEntity,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import {
  Plus,
  Search,
  Trash2,
  RefreshCcw,
  Shield,
  User,
  Loader2,
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
import { RestaurantMemberService } from "../services/restaurantMember.service";
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../utils/toasts";
import { ComputeUtils } from "../utils/compute-utils";

const LIMIT = 10;

const RestaurantMembers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { restaurantMember: currentMember } = useSelector(
    (state: RootState) => state?.user,
  );

  const initialPage = () => {
    const p = Number(searchParams.get("page"));
    return Number.isNaN(p) || p < 1 ? 1 : p;
  };
  const initialRole = () => {
    const r = searchParams.get("role");
    return Object.values(EnumRestaurantMemberRole).includes(
      r as EnumRestaurantMemberRole,
    )
      ? (r as EnumRestaurantMemberRole)
      : "";
  };

  const [members, setMembers] = useState<IRestaurantMemberEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [role, setRole] = useState<EnumRestaurantMemberRole | "">(initialRole);
  const [deleted, setDeleted] = useState(
    searchParams.get("deleted") === "true",
  );
  const isInitial = useRef(true);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<IRestaurantMemberEntity | null>(null);
  const [newRole, setNewRole] = useState<EnumRestaurantMemberRole>(
    EnumRestaurantMemberRole.MANAGER,
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] =
    useState<IRestaurantMemberEntity | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [memberToRestore, setMemberToRestore] =
    useState<IRestaurantMemberEntity | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canManage = useMemo(() => {
    return (
      currentMember?.role === EnumRestaurantMemberRole.OWNER ||
      currentMember?.role === EnumRestaurantMemberRole.MANAGER
    );
  }, [currentMember]);

  const fetchMembers = async (currentPage = page) => {
    setLoading(true);
    try {
      const { data } = await RestaurantMemberService.search({
        search: search || undefined,
        page: currentPage,
        limit: LIMIT,
        role: role || undefined,
        deleted,
      });
      if (data.data) {
        setMembers(data.data.items);
        setPage(data.data.page);
        setTotalPages(data.data.totalPages);
      }
    } catch {
      showErrorToast(t("members.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const onUpdateRole = async () => {
    if (!selectedMember) return;
    if (selectedMember.role === newRole) {
      setRoleModalOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      const { data } = await RestaurantMemberService.updateRole(
        selectedMember.id,
        newRole,
      );
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY
      ) {
        showSuccessToast(t("members.updateRoleSuccess"));
        setRoleModalOpen(false);
        if (data.data) {
          setMembers((prev) =>
            prev.map((m) => (m.id === data.data!.id ? data.data! : m)),
          );
        }
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("members.updateRoleNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("members.updateRoleNotFound"));
            break;
          default:
            showErrorToast(t("members.updateRoleError"));
        }
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("members.updateRoleNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("members.updateRoleNotFound"));
          break;
        case EnumStatusCode.INTERNAL_SERVER_ERROR:
        default:
          showErrorToast(t("members.updateRoleError"));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const onDelete = async () => {
    if (!memberToDelete) return;
    setActionLoading(true);
    try {
      const { data } = await RestaurantMemberService.remove(memberToDelete.id);
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.DELETED_SUCCESSFULLY
      ) {
        showSuccessToast(t("members.deleteSuccess"));
        setDeleteModalOpen(false);
        setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.CANNOT_DELETE_OWNER:
            showWarningToast(t("members.cannotDeleteOwner"));
            break;
          case EnumStatusCode.CANNOT_DELETE_SELF:
            showWarningToast(t("members.cannotDeleteSelf"));
            break;
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("members.deleteNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("members.deleteNotFound"));
            break;
          default:
            showErrorToast(t("members.deleteError"));
        }
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.CANNOT_DELETE_OWNER:
          showWarningToast(t("members.cannotDeleteOwner"));
          break;
        case EnumStatusCode.CANNOT_DELETE_SELF:
          showWarningToast(t("members.cannotDeleteSelf"));
          break;
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("members.deleteNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("members.deleteNotFound"));
          break;
        case EnumStatusCode.INTERNAL_SERVER_ERROR:
        default:
          showErrorToast(t("members.deleteError"));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const onRestore = async () => {
    if (!memberToRestore) return;
    setActionLoading(true);
    try {
      const { data } = await RestaurantMemberService.restore(
        memberToRestore.id,
      );
      if (
        data.code === EnumStatusResponse.SUCCESS &&
        data.statusCode === EnumStatusCode.UPDATED_SUCCESSFULLY
      ) {
        showSuccessToast(t("members.restoreSuccess"));
        setRestoreModalOpen(false);
        setMembers((prev) => prev.filter((m) => m.id !== memberToRestore.id));
      } else {
        switch (data.statusCode) {
          case EnumStatusCode.NOT_ALLOWED:
            showWarningToast(t("members.restoreNotAllowed"));
            break;
          case EnumStatusCode.NOT_FOUND:
            showWarningToast(t("members.restoreNotFound"));
            break;
          default:
            showErrorToast(t("members.restoreError"));
        }
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      switch (err?.response?.data?.statusCode) {
        case EnumStatusCode.NOT_ALLOWED:
          showWarningToast(t("members.restoreNotAllowed"));
          break;
        case EnumStatusCode.NOT_FOUND:
          showWarningToast(t("members.restoreNotFound"));
          break;
        case EnumStatusCode.INTERNAL_SERVER_ERROR:
        default:
          showErrorToast(t("members.restoreError"));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openRoleModal = (member: IRestaurantMemberEntity) => {
    setSelectedMember(member);
    setNewRole(
      member.role === EnumRestaurantMemberRole.OWNER
        ? EnumRestaurantMemberRole.MANAGER
        : EnumRestaurantMemberRole.MANAGER,
    );
    setRoleModalOpen(true);
  };

  const isProtected = (member: IRestaurantMemberEntity) => {
    return (
      member.id === currentMember?.id ||
      member.role === EnumRestaurantMemberRole.OWNER
    );
  };

  useEffect(() => {
    fetchMembers();
  }, [page]);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (page === 1) {
      fetchMembers(1);
    } else {
      setPage(1);
    }
  }, [search, role, deleted]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (deleted) params.set("deleted", "true");
    if (page > 1) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [search, role, deleted, page, setSearchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-text">{t("members.title")}</h1>
          {canManage && (
            <button
              type="button"
              onClick={() => navigate("/members/create")}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
              <Plus size={18} />
              {t("members.addMember")}
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t("members.searchPlaceholder")}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-text outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative w-full">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as EnumRestaurantMemberRole | "");
                    setPage(1);
                  }}
                  className="w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-text outline-none focus:border-primary"
                >
                  <option value="">{t("members.allRoles")}</option>
                  <option value={EnumRestaurantMemberRole.MANAGER}>
                    {t("members.roleManager")}
                  </option>
                  <option value={EnumRestaurantMemberRole.OWNER}>
                    {t("members.roleOwner")}
                  </option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              <div className="relative w-full">
                <select
                  value={deleted ? "deleted" : "active"}
                  onChange={(e) => {
                    setDeleted(e.target.value === "deleted");
                    setPage(1);
                  }}
                  className="w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-text outline-none focus:border-primary"
                >
                  <option value="active">{t("members.active")}</option>
                  <option value="deleted">{t("members.deleted")}</option>
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
          {loading && members.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <User size={48} className="mb-3 opacity-40" />
              <p className="text-sm">{t("members.empty")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => {
                  const isDeleted = member.deleted;
                  return (
                    <div
                      key={member.id}
                      className="bg-background rounded-2xl p-4 border border-border/50 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-text truncate">
                            {member?.user?.fullName ?? t("members.unknown")}
                          </p>
                          <p className="text-sm text-text/70 truncate">
                            {member?.user?.email ?? "-"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            member.role === EnumRestaurantMemberRole.OWNER
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          <Shield size={12} />
                          {ComputeUtils.formatRestaurantMemberRole(
                            t,
                            member.role,
                          )}
                        </span>
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
                            ? t("members.deleted")
                            : t("members.active")}
                        </span>
                        {canManage && !isProtected(member) && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openRoleModal(member)}
                              disabled={isDeleted}
                              className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-primary transition-colors disabled:opacity-40"
                              title={t("members.changeRole")}
                            >
                              <Shield size={18} />
                            </button>
                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setMemberToRestore(member);
                                  setRestoreModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-green-600 transition-colors"
                                title={t("members.restore")}
                              >
                                <RefreshCcw size={18} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setMemberToDelete(member);
                                  setDeleteModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-red-600 transition-colors"
                                title={t("members.delete")}
                              >
                                <Trash2 size={18} />
                              </button>
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
        open={roleModalOpen}
        setOpen={setRoleModalOpen}
        title={t("members.changeRoleTitle")}
        textButton={actionLoading ? t("common.loading") : t("members.save")}
        loading={actionLoading}
        onValidate={onUpdateRole}
        dontShowCancelButton={false}
        xlSize="1"
      >
        <div className="flex flex-col gap-3 text-left">
          <p className="text-sm text-text/70">
            {t("members.changeRoleDescription", {
              name: selectedMember?.user?.fullName ?? t("members.unknown"),
            })}
          </p>
          <select
            value={newRole}
            onChange={(e) =>
              setNewRole(e.target.value as EnumRestaurantMemberRole)
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          >
            <option value={EnumRestaurantMemberRole.MANAGER}>
              {t("members.roleManager")}
            </option>
          </select>
        </div>
      </Modal>

      <DeleteModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title={t("members.deleteTitle")}
        description={t("members.deleteDescription", {
          name: memberToDelete?.user?.fullName ?? t("members.unknown"),
        })}
        confirmText={t("members.delete")}
        loading={actionLoading}
        onConfirm={onDelete}
      />

      <ConfirmModal
        open={restoreModalOpen}
        setOpen={setRestoreModalOpen}
        title={t("members.restoreTitle")}
        description={t("members.restoreDescription", {
          name: memberToRestore?.user?.fullName ?? t("members.unknown"),
        })}
        confirmText={t("members.restore")}
        loading={actionLoading}
        onConfirm={onRestore}
      />
    </div>
  );
};

export default RestaurantMembers;
