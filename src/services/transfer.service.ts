import type {
  EnumTransferStatuses,
  IOrchestrationResult,
  ITransferEntity,
  Pagination,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const TransferService = {
  getRestaurantTransfers: (params: {
    page?: number;
    limit?: number;
    status?: EnumTransferStatuses;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.status) searchParams.set("status", params.status);

    return axiosBaseClient.get<
      IOrchestrationResult<Pagination<ITransferEntity>>
    >(`/transfers/restaurant-transfers?${searchParams.toString()}`);
  },

  create: () => {
    return axiosBaseClient.post<IOrchestrationResult<ITransferEntity>>(
      "/transfers",
    );
  },
};
