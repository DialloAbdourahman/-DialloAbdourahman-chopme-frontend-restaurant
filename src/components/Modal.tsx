import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: ReactNode;
  title: string | ReactNode;
  textButton?: string;
  xlSize?: string;
  dontShowButton?: boolean;
  dontShowCancelButton?: boolean;
  clickOutside?: boolean;
  loading?: boolean;
  besideTitleComponent?: ReactNode;

  onValidate?: () => void;
};

const Modal = ({
  open,
  setOpen,
  title,
  textButton,
  children,
  dontShowButton,
  dontShowCancelButton = true,
  clickOutside = true,
  loading,
  xlSize,
  onValidate = () => {},
  besideTitleComponent,
}: Props) => {
  const { t } = useTranslation();
  const cancelButtonRef = useRef(null);

  const maxWidthClass = {
    "-2": "sm:max-w-xs",
    "-1": "sm:max-w-sm",
    "0": "sm:max-w-lg",
    "1": "sm:max-w-xl",
    "2": "sm:max-w-2xl",
    "3": "sm:max-w-3xl",
    "4": "sm:max-w-4xl",
    "5": "sm:max-w-5xl",
    "6": "sm:max-w-6xl",
    "7": "sm:max-w-7xl",
  }[xlSize ?? "3"];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        initialFocus={cancelButtonRef}
        onClose={(value: boolean) => {
          if (!clickOutside) return;
          setOpen(value);
        }}
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
              <DialogPanel
                className={`relative transform rounded-2xl bg-card px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full ${maxWidthClass} sm:p-6`}
              >
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left flex-grow w-full">
                    <DialogTitle
                      as="h3"
                      className="text-base font-semibold leading-6 text-primary flex justify-between items-center"
                    >
                      <span className="text-lg truncate">{title}</span>
                      <div className="flex gap-3">
                        {besideTitleComponent}
                        <button
                          type="button"
                          className="rounded-md bg-card text-text/50 hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          onClick={() => setOpen(false)}
                        >
                          <span className="sr-only">{t("common.close")}</span>
                          <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </DialogTitle>
                    <div className="mt-2 w-full">
                      <div className="text-sm text-text/70">{children}</div>
                    </div>
                  </div>
                </div>
                {!dontShowButton && (
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 sm:ml-3 sm:w-auto"
                      onClick={() => {
                        onValidate();
                      }}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {textButton}
                    </button>

                    {!!dontShowCancelButton && (
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-card px-3 py-2 text-sm font-semibold text-text shadow-sm ring-1 ring-inset ring-border hover:bg-background sm:mt-0 sm:w-auto"
                        onClick={() => setOpen(false)}
                        ref={cancelButtonRef}
                      >
                        {t("common.cancel")}
                      </button>
                    )}
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
