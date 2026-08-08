import { toast, type ToastOptions } from "react-toastify";
import type { JSX } from "react/jsx-runtime";

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showSuccessToast = (
  message: string,
  options?: ToastOptions,
  onClick?: () => void,
) => {
  toast.success(message, {
    ...defaultOptions,
    ...options,
    ...(onClick !== undefined && { onClick }),
  });
};

export const showErrorToast = (
  message: string,
  options?: ToastOptions,
  onClick?: () => void,
) => {
  toast.error(message, {
    ...defaultOptions,
    ...options,
    ...(onClick !== undefined && { onClick }),
  });
};

export const showInfoToast = (
  message: string,
  options?: ToastOptions,
  onClick?: () => void,
) => {
  toast.info(message, {
    ...defaultOptions,
    ...options,
    ...(onClick !== undefined && { onClick }),
  });
};

export const showWarningToast = (
  message: string,
  options?: ToastOptions,
  onClick?: () => void,
) => {
  toast.warning(message, {
    ...defaultOptions,
    ...options,
    ...(onClick !== undefined && { onClick }),
  });
};

export const showPersistentInfoToast = (
  message: string | JSX.Element,
  options?: ToastOptions,
  onClick?: () => void,
) => {
  toast.info(message, {
    ...defaultOptions,
    autoClose: false,
    closeOnClick: false,
    ...options,
    ...(onClick !== undefined && { onClick }),
  });
};
