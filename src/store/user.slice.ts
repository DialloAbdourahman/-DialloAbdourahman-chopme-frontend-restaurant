import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  IRestaurantMemberEntity,
  IUserEntity,
} from "chopme-frontend-common";

export interface UserState {
  user: IUserEntity | null;
  restaurantMember: IRestaurantMemberEntity | null;
}

const initialState: UserState = {
  user: null,
  restaurantMember: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<IUserEntity | null>) => {
      state.user = action.payload;
    },

    setRestaurantMember: (
      state,
      action: PayloadAction<IRestaurantMemberEntity | null>,
    ) => {
      state.restaurantMember = action.payload;
    },
  },
});

export const { setUser, setRestaurantMember } = userSlice.actions;

export default userSlice.reducer;
