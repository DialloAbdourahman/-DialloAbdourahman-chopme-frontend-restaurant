import { io, type Socket } from "socket.io-client";
import { KEYS } from "../utils/keys";
import { TokensService } from "../services/tokens.service";
import type { RootState } from "../store";
import {
  EnumNotificationType,
  EnumOrderStatus,
  EnumWebSocketEventType,
  playNotificationSound,
  type INotification,
  type IOrderEntity,
} from "chopme-frontend-common";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { setNewNotification } from "../store/notification.slice";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { showSuccessToast } from "../utils/toasts";
import { useNavigate } from "react-router-dom";

const WebSocket = () => {
  const { user } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const navigate = useNavigate();

  const handleReceivedNotification = (newNotification: INotification<any>) => {
    dispatch(setNewNotification(newNotification));
    playNotificationSound();

    if (newNotification.type === EnumNotificationType.ORDER_STATUS_CHANGED) {
      const notification = newNotification as INotification<IOrderEntity>;
      switch (notification.data.status) {
        case EnumOrderStatus.PAID:
          showSuccessToast(t("notification.newOrder"), {
            onClick: () => {
              navigate(`/orders/${notification.data.id}`);
            },
          });
          break;
        default:
          break;
      }
    }
  };

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
      EnumWebSocketEventType.RESTAURANT_APPLICATION,
      (data: INotification<any>) => {
        handleReceivedNotification(data);
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return <></>;
};

export default WebSocket;
