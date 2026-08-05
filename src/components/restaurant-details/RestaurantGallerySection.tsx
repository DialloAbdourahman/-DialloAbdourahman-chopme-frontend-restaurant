import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, X } from "lucide-react";
import { KEYS } from "../../utils/keys";

interface RestaurantGallerySectionProps {
  pictures: string[];
  name: string;
  uploadingImage: boolean;
  deletingKey: string | null;
  onUpload: (file: File) => void;
  onDelete: (key: string) => void;
}

const RestaurantGallerySection = ({
  pictures,
  name,
  uploadingImage,
  deletingKey,
  onUpload,
  onDelete,
}: RestaurantGallerySectionProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
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
        {t("restaurantDetails.images")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
        {pictures.map((picture) => (
          <div
            key={picture}
            onClick={() => setPreviewImage(picture)}
            className="relative aspect-square rounded-xl overflow-hidden bg-background group cursor-pointer"
          >
            <img
              src={`${KEYS.PUBLIC_S3_PREFIX}/${picture}`}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 group-hover:opacity-90"
            />
            {deletingKey === picture && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={20} />
              </div>
            )}
            {deletingKey !== picture && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(picture);
                }}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-opacity"
                title={t("restaurantDetails.removeImage")}
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        {pictures.length === 0 && (
          <div className="col-span-full text-sm text-gray-500 py-4 text-center">
            {t("restaurantDetails.noImages")}
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUpload(file);
            e.target.value = "";
          }
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploadingImage}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-text hover:bg-card transition-colors disabled:opacity-60"
      >
        {uploadingImage ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ImagePlus size={16} />
        )}
        {t("restaurantDetails.uploadImage")}
      </button>

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
            alt={name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default RestaurantGallerySection;
