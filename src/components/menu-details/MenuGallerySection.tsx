import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, Trash2, UtensilsCrossed, X } from "lucide-react";
import type { IMenuEntity } from "chopme-frontend-common";
import { KEYS } from "../../utils/keys";

interface MenuGallerySectionProps {
  menu: IMenuEntity;
  canManage: boolean;
  uploadingCover: boolean;
  deletingCover: boolean;
  uploadingImage: boolean;
  deletingKey: string | null;
  onUploadCover: (file: File) => void;
  onUploadImage: (file: File) => void;
  onCoverDeleteClick: () => void;
  onImageDeleteClick: (key: string) => void;
}

const MenuGallerySection = ({
  menu,
  canManage,
  uploadingCover,
  deletingCover,
  uploadingImage,
  deletingKey,
  onUploadCover,
  onUploadImage,
  onCoverDeleteClick,
  onImageDeleteClick,
}: MenuGallerySectionProps) => {
  const { t } = useTranslation();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!previewImage) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [previewImage]);

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
      <h2 className="text-sm font-semibold text-text mb-3">
        {t("menus.coverImage")}
      </h2>
      <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-background flex items-center justify-center mb-3">
        {menu.coverImage ? (
          <img
            onClick={() => setPreviewImage(menu.coverImage ?? null)}
            src={`${KEYS.PUBLIC_S3_PREFIX}/${menu.coverImage}`}
            alt={menu.name}
            className="w-full h-full object-cover cursor-pointer transition-transform duration-200 hover:scale-105 hover:opacity-90"
          />
        ) : (
          <UtensilsCrossed size={40} className="text-primary/30" />
        )}
        {(uploadingCover || deletingCover) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={28} />
          </div>
        )}
      </div>
      {canManage && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadCover(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-text hover:bg-card transition-colors disabled:opacity-60"
          >
            <ImagePlus size={16} />
            {t("menus.uploadCoverImage")}
          </button>
          {menu.coverImage && (
            <button
              type="button"
              onClick={onCoverDeleteClick}
              disabled={deletingCover}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              <Trash2 size={16} />
              {t("menus.removeCoverImage")}
            </button>
          )}
        </div>
      )}

      <h2 className="text-sm font-semibold text-text mt-6 mb-3">
        {t("menus.images")}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {menu.pictures.map((picture) => (
          <div
            key={picture}
            onClick={() => setPreviewImage(picture)}
            className="relative aspect-square rounded-xl overflow-hidden bg-background group cursor-pointer"
          >
            <img
              src={`${KEYS.PUBLIC_S3_PREFIX}/${picture}`}
              alt={menu.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 group-hover:opacity-90"
            />
            {deletingKey === picture && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={20} />
              </div>
            )}
            {canManage && deletingKey !== picture && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageDeleteClick(picture);
                }}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white transition-opacity"
                title={t("menus.removeImage")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {menu.pictures.length === 0 && (
          <div className="col-span-full text-sm text-gray-500 py-4 text-center">
            {t("menus.noImages")}
          </div>
        )}
      </div>
      {canManage && (
        <>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadImage(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-text hover:bg-card transition-colors disabled:opacity-60"
          >
            {uploadingImage ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImagePlus size={16} />
            )}
            {t("menus.uploadImage")}
          </button>
        </>
      )}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label={t("common.close")}
          >
            <X size={24} />
          </button>
          <img
            src={`${KEYS.PUBLIC_S3_PREFIX}/${previewImage}`}
            alt={menu.name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default MenuGallerySection;
