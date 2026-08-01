import { useDispatch } from "react-redux";
import {
  EnumStatusCode,
  EnumStatusResponse,
  type IOrchestrationResult,
} from "chopme-frontend-common";
import { AxiosError } from "axios";
import { useState } from "react";
import { AuthService } from "../services/auth.service";
import { RestaurantMemberService } from "../services/restaurantMember.service";
import { setRestaurantMember, setUser } from "../store/user.slice";

const useInitializeAfterAuth = ({
  initialLoadingState,
}: {
  initialLoadingState: boolean;
}) => {
  const [loading, setLoading] = useState(initialLoadingState);
  const dispatch = useDispatch();

  const initialize = async () => {
    if (!initialLoadingState) {
      setLoading(true);
    }

    try {
      const [userResponse, restaurantMemberResponse] = await Promise.all([
        AuthService.getMyProfile(),
        RestaurantMemberService.getMyProfile(),
      ]);

      const userData = userResponse.data;
      if (
        userData.code === EnumStatusResponse.SUCCESS &&
        userData.statusCode === EnumStatusCode.RECOVERED_SUCCESSFULLY &&
        userData.data
      ) {
        dispatch(setUser(userData.data));
      }

      const restaurantMemberData = restaurantMemberResponse.data;
      if (
        restaurantMemberData.code === EnumStatusResponse.SUCCESS &&
        restaurantMemberData.statusCode ===
          EnumStatusCode.RECOVERED_SUCCESSFULLY &&
        restaurantMemberData.data
      ) {
        dispatch(setRestaurantMember(restaurantMemberData.data));
      }
    } catch (error) {
      const err = error as AxiosError<IOrchestrationResult<string>>;
      const statusCode = err.response?.data?.statusCode;
      console.log("statusCode", statusCode);
      dispatch(setUser(null));
      dispatch(setRestaurantMember(null));
    } finally {
      setLoading(false);
    }
  };

  return { loading, initialize };
};

export default useInitializeAfterAuth;
