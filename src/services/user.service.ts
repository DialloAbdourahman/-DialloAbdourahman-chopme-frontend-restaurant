import type {
  IOrchestrationResult,
  IUserEntity,
  UpdatePasswordDto,
  UpdateUserProfileDto,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const UserService = {
  updateMyProfile: (dto: UpdateUserProfileDto) => {
    return axiosBaseClient.patch<IOrchestrationResult<IUserEntity>>(
      "/users/me",
      dto,
    );
  },

  updatePassword: (dto: UpdatePasswordDto) => {
    return axiosBaseClient.patch<IOrchestrationResult<IUserEntity>>(
      "/users/me/password",
      dto,
    );
  },
};
