import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { IOrderEntity } from "chopme-frontend-common";

export interface NotificationState {
  orderStatusUpdate: IOrderEntity | null;
}

const initialState: NotificationState = {
  orderStatusUpdate: null,
};

export const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setOrderStatusUpdate: (
      state,
      action: PayloadAction<IOrderEntity | null>,
    ) => {
      state.orderStatusUpdate = action.payload;
    },
  },
});

export const { setOrderStatusUpdate } = notificationSlice.actions;

export default notificationSlice.reducer;
