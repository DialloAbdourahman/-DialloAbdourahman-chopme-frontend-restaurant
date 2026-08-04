import type {
  CreateMenuDto,
  IMenuEntity,
  IOrchestrationResult,
  Pagination,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const MenuService = {
  search: (params: {
    restaurantId: string;
    search?: string;
    page?: number;
    limit?: number;
    categoryId?: string;
    deleted?: boolean;
  }) => {
    return axiosBaseClient.get<IOrchestrationResult<Pagination<IMenuEntity>>>(
      "/menus/restaurant/search",
      { params },
    );
  },

  findOne: (id: string) => {
    return axiosBaseClient.get<IOrchestrationResult<IMenuEntity>>(
      `/menus/restaurant/${id}`,
    );
  },

  create: (dto: CreateMenuDto) => {
    return axiosBaseClient.post<IOrchestrationResult<IMenuEntity>>(
      "/menus",
      dto,
    );
  },

  update: (id: string, dto: Partial<CreateMenuDto>) => {
    return axiosBaseClient.patch<IOrchestrationResult<IMenuEntity>>(
      `/menus/${id}`,
      dto,
    );
  },

  remove: (id: string) => {
    return axiosBaseClient.delete<IOrchestrationResult<string>>(`/menus/${id}`);
  },

  restore: (id: string) => {
    return axiosBaseClient.patch<IOrchestrationResult<IMenuEntity>>(
      `/menus/${id}/restore`,
    );
  },

  toggleAvailable: (id: string) => {
    return axiosBaseClient.patch<IOrchestrationResult<IMenuEntity>>(
      `/menus/${id}/toggle-available`,
    );
  },

  uploadImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosBaseClient.post<IOrchestrationResult<IMenuEntity>>(
      `/menus/${id}/upload-image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  uploadCoverImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosBaseClient.post<IOrchestrationResult<IMenuEntity>>(
      `/menus/${id}/upload-cover-image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  deleteImage: (id: string, key: string) => {
    return axiosBaseClient.delete<IOrchestrationResult<IMenuEntity>>(
      `/menus/${id}/images`,
      { params: { key } },
    );
  },

  deleteCoverImage: (id: string) => {
    return axiosBaseClient.delete<IOrchestrationResult<IMenuEntity>>(
      `/menus/${id}/cover-image`,
    );
  },
};
