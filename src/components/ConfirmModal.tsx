import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { Fragment, useRef } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  description?: string;
  loading?: boolean;
  confirmText?: string;
  onConfirm: () => void;
  variant?: "success" | "danger";
};

const ConfirmModal = ({
  open,
  setOpen,
  title,
  description,
  loading = false,
  confirmText,
  onConfirm,
  variant = "success",
}: Props) => {
  const { t } = useTranslation();
  const cancelButtonRef = useRef(null);

  const close = () => {
    if (!loading) setOpen(false);
  };

  const isDanger = variant === "danger";

  return (
    <Transition show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        initialFocus={cancelButtonRef}
        onClose={close}
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-text/50 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform rounded-2xl bg-card px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isDanger
                        ? "bg-red-100 text-red-600"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isDanger ? (
                      <AlertTriangle size={21} aria-hidden="true" />
                    ) : (
                      <Check size={21} aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle
                      as="h3"
                      className="text-lg font-semibold leading-6 text-text"
                    >
                      {title}
                    </DialogTitle>
                    {description && (
                      <p className="mt-2 text-sm text-text/70">{description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={close}
                    className="rounded-md text-text/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <span className="sr-only">{t("common.close")}</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    ref={cancelButtonRef}
                    disabled={loading}
                    onClick={close}
                    className="inline-flex w-full justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text hover:bg-background disabled:opacity-50 sm:w-auto"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onConfirm}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 sm:w-auto ${
                      isDanger ? "bg-red-600 hover:bg-red-500" : "bg-primary"
                    }`}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {confirmText ?? t("common.confirm")}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ConfirmModal;
