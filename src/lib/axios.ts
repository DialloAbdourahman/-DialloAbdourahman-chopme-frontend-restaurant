import axios, { type AxiosError, type AxiosInstance } from "axios";
import { KEYS } from "../utils/keys";
import { EnumStatusCode } from "chopme-frontend-common";
import { TokensService } from "../services/tokens.service";
import { AuthService } from "../services/auth.service";
import { store } from "../store";
import { setRestaurantMember, setUser } from "../store/user.slice";

export const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
  });

  let refreshPromise: Promise<string> | null = null;

  client.interceptors.request.use((config) => {
    const token = TokensService.getToken(KEYS.ACCESS_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        (error.response.data as any).statusCode === EnumStatusCode.TOKEN_EXPIRED
      ) {
        originalRequest._retry = true;

        try {
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const refreshToken = TokensService.getToken(
                KEYS.REFRESH_TOKEN_KEY,
              );

              const response = await AuthService.refreshToken(refreshToken!);

              const newAccessToken = response.data.data!.accessToken;
              const newRefreshToken = response.data.data!.refreshToken;

              TokensService.setToken({
                property: KEYS.ACCESS_TOKEN_KEY,
                value: newAccessToken,
              });

              TokensService.setToken({
                property: KEYS.REFRESH_TOKEN_KEY,
                value: newRefreshToken,
              });

              return newAccessToken;
            })();

            // Reset once finished (success or failure)
            refreshPromise.finally(() => {
              refreshPromise = null;
            });
          }

          const newAccessToken = await refreshPromise;

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return client(originalRequest);
        } catch {
          // TokensService.removeToken(KEYS.ACCESS_TOKEN_KEY);
          // TokensService.removeToken(KEYS.REFRESH_TOKEN_KEY);
          store.dispatch(setUser(null));
          store.dispatch(setRestaurantMember(null));

          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
};

export const axiosBaseClient = createApiClient(KEYS.BASE_URL);
