import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { INotification } from "chopme-frontend-common";

export interface NotificationState {
  newNotification: INotification<any> | null;
}

const initialState: NotificationState = {
  newNotification: null,
};

export const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setNewNotification: (
      state,
      action: PayloadAction<INotification<any> | null>,
    ) => {
      state.newNotification = action.payload;
    },
  },
});

export const { setNewNotification } = notificationSlice.actions;

export default notificationSlice.reducer;
