import type {
  IOrchestrationResult,
  IRestaurantEntity,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const RestaurantService = {
  findOne: (
    idOrSlug: string,
    coordinates?: { longitude: number; latitude: number },
  ) => {
    return axiosBaseClient.get<IOrchestrationResult<IRestaurantEntity>>(
      `/restaurants/${idOrSlug}`,
      {
        params: coordinates,
      },
    );
  },
};
