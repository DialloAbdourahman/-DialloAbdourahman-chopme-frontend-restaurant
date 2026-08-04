import type {
  CreateCategoryDto,
  ICategoryEntity,
  IOrchestrationResult,
  Pagination,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const CategoryService = {
  search: (params: {
    search?: string;
    page?: number;
    limit?: number;
    deleted?: boolean;
  }) => {
    return axiosBaseClient.get<
      IOrchestrationResult<Pagination<ICategoryEntity>>
    >("/categories/search", { params });
  },

  create: (dto: CreateCategoryDto) => {
    return axiosBaseClient.post<IOrchestrationResult<ICategoryEntity>>(
      "/categories",
      dto,
    );
  },

  update: (id: string, dto: Partial<CreateCategoryDto>) => {
    return axiosBaseClient.patch<IOrchestrationResult<ICategoryEntity>>(
      `/categories/${id}`,
      dto,
    );
  },

  remove: (id: string) => {
    return axiosBaseClient.delete<IOrchestrationResult<string>>(
      `/categories/${id}`,
    );
  },

  restore: (id: string) => {
    return axiosBaseClient.patch<IOrchestrationResult<ICategoryEntity>>(
      `/categories/${id}/restore`,
    );
  },
};
