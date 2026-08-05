import {
  EnumWalletTypes,
  type IOrchestrationResult,
  type IRestaurantEntity,
  type IRestaurantWallet,
  type UpdateRestaurantDto,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const RestaurantService = {
  findOnePrivate: (idOrSlug: string) => {
    return axiosBaseClient.get<IOrchestrationResult<IRestaurantEntity>>(
      `/restaurants/member/${idOrSlug}`,
    );
  },

  update: (id: string, dto: UpdateRestaurantDto) => {
    return axiosBaseClient.patch<IOrchestrationResult<IRestaurantEntity>>(
      `/restaurants/${id}`,
      dto,
    );
  },

  toggleClosed: (id: string) => {
    return axiosBaseClient.patch<IOrchestrationResult<IRestaurantEntity>>(
      `/restaurants/${id}/toggle-closed`,
    );
  },

  uploadImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosBaseClient.post<IOrchestrationResult<IRestaurantEntity>>(
      `/restaurants/${id}/upload-image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  uploadCoverImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosBaseClient.post<IOrchestrationResult<IRestaurantEntity>>(
      `/restaurants/${id}/upload-cover-image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  deleteImage: (id: string, key: string) => {
    return axiosBaseClient.delete<IOrchestrationResult<IRestaurantEntity>>(
      `/restaurants/${id}/images`,
      { params: { key } },
    );
  },

  deleteCoverImage: (id: string) => {
    return axiosBaseClient.delete<IOrchestrationResult<IRestaurantEntity>>(
      `/restaurants/${id}/cover-image`,
    );
  },

  getWallet: (id: string) => {
    return axiosBaseClient.get<IOrchestrationResult<IRestaurantWallet>>(
      `/restaurants/${id}/wallet`,
    );
  },

  addWallet: (id: string, dto: { type: EnumWalletTypes; number?: string }) => {
    return axiosBaseClient.post<IOrchestrationResult<IRestaurantWallet>>(
      `/restaurants/${id}/wallet`,
      dto,
    );
  },

  deleteWallet: (id: string) => {
    return axiosBaseClient.delete<IOrchestrationResult<IRestaurantEntity>>(
      `/restaurants/${id}/wallet`,
    );
  },
};
