import type { IOrchestrationResult, IMenuEntity } from "chopme-frontend-common";
import { axiosBaseClient } from "../lib/axios";

export const MenuService = {
  findOne: (id: string) => {
    return axiosBaseClient.get<IOrchestrationResult<IMenuEntity>>(
      `/menus/${id}`,
    );
  },
};
