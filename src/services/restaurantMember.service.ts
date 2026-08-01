import type {
  IOrchestrationResult,
  IRestaurantMemberEntity,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const RestaurantMemberService = {
  getMyProfile: () => {
    return axiosBaseClient.get<IOrchestrationResult<IRestaurantMemberEntity>>(
      "/restaurant-members/me",
    );
  },
};
