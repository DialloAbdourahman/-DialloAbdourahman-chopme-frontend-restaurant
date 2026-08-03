import type {
  CreateRestaurantMemberDto,
  EnumRestaurantMemberRole,
  IOrchestrationResult,
  IRestaurantMemberEntity,
  Pagination,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const RestaurantMemberService = {
  getMyProfile: () => {
    return axiosBaseClient.get<IOrchestrationResult<IRestaurantMemberEntity>>(
      "/restaurant-members/me",
    );
  },

  search: (params: {
    search?: string;
    page?: number;
    limit?: number;
    role?: EnumRestaurantMemberRole;
    deleted?: boolean;
  }) => {
    return axiosBaseClient.get<
      IOrchestrationResult<Pagination<IRestaurantMemberEntity>>
    >("/restaurant-members/search", { params });
  },

  create: (dto: Omit<CreateRestaurantMemberDto, "confirmPassword">) => {
    return axiosBaseClient.post<IOrchestrationResult<IRestaurantMemberEntity>>(
      "/restaurant-members",
      dto,
    );
  },

  updateRole: (id: string, role: EnumRestaurantMemberRole) => {
    return axiosBaseClient.patch<IOrchestrationResult<IRestaurantMemberEntity>>(
      `/restaurant-members/${id}/role`,
      null,
      { params: { role } },
    );
  },

  remove: (id: string) => {
    return axiosBaseClient.delete<
      IOrchestrationResult<IRestaurantMemberEntity>
    >(`/restaurant-members/${id}`);
  },

  restore: (id: string) => {
    return axiosBaseClient.patch<IOrchestrationResult<IRestaurantMemberEntity>>(
      `/restaurant-members/${id}/restore`,
    );
  },
};
