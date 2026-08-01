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

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, { ...defaultOptions, ...options });
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
  toast.error(message, { ...defaultOptions, ...options });
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, { ...defaultOptions, ...options });
};

export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, { ...defaultOptions, ...options });
};

export const showPersistentInfoToast = (
  message: string | JSX.Element,
  options?: ToastOptions,
) => {
  toast.info(message, {
    ...defaultOptions,
    autoClose: false,
    closeOnClick: false,
    ...options,
  });
};
