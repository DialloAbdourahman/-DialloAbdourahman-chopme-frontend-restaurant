import type {
  EmailPasswordLoginDto,
  IAuthEntity,
  IOrchestrationResult,
  IUserEntity,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";
import axios from "axios";
import { KEYS } from "../utils/keys";

export const AuthService = {
  emailPasswordLogin: (dto: EmailPasswordLoginDto) => {
    return axiosBaseClient.post<IOrchestrationResult<IAuthEntity>>(
      "/users/email-password-login",
      dto,
    );
  },

  refreshToken: (token: string) => {
    return axios.get<IOrchestrationResult<IAuthEntity>>(
      `${KEYS.BASE_URL}/users/token`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  },

  getMyProfile: () => {
    return axiosBaseClient.get<IOrchestrationResult<IUserEntity>>("/users/me");
  },

  logout: () => {
    return axiosBaseClient.post<IOrchestrationResult<string>>("/users/logout");
  },
};
