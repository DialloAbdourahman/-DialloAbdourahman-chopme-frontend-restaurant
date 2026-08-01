import type {
  IOrchestrationResult,
  IOrderEntity,
  Pagination,
} from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const OrderService = {
  getMyOrders: (params: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    return axiosBaseClient.get<IOrchestrationResult<Pagination<IOrderEntity>>>(
      `/orders/my-orders?${searchParams.toString()}`,
    );
  },

  findOne: (orderId: string) => {
    return axiosBaseClient.get<IOrchestrationResult<IOrderEntity>>(
      `/orders/${orderId}`,
    );
  },
};
