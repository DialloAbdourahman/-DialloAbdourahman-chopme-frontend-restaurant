import { io, type Socket } from "socket.io-client";
import { KEYS } from "../utils/keys";
import { TokensService } from "../services/tokens.service";
import type { RootState } from "../store";
import {
  EnumWebSocketEventType,
  type IOrderEntity,
} from "chopme-frontend-common";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { setOrderStatusUpdate } from "../store/notification.slice";
import { useEffect } from "react";

const WebSocket = () => {
  const { user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const token = TokensService.getToken(KEYS.ACCESS_TOKEN_KEY);

    if (!token || !user) {
      return;
    }

    const socket: Socket = io(KEYS.WEB_SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on(
      EnumWebSocketEventType.ORDER_STATUS_CHANGED,
      (data: IOrderEntity) => {
        dispatch(setOrderStatusUpdate(data));
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return <></>;
};

export default WebSocket;
