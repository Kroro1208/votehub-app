import React from "react";

import { Label } from "../ui/label.tsx";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import { Card, CardContent } from "../ui/card.tsx";
import { ImageIcon, X } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage.ts";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormData } from "./ContentSection.tsx";

interface ImageUploadSectionProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  imagePreview: string | null;
  watchImage: FileList | null;
  onRemoveImage: () => void;
}

const ImageUploadSection = ({
  register,
  errors,
  imagePreview,
  watchImage,
  onRemoveImage,
}: ImageUploadSectionProps) => {
  const { t } = useLanguage();

  return (
    <div className="group">
      <Label
        htmlFor="image"
        className="flex items-center gap-3 text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4"
      >
        <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg group-hover:bg-rose-200 dark:group-hover:bg-rose-800/50 transition-colors">
          <ImageIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        {t("create.post.image.title")}
      </Label>

      <div className="relative">
        <Input
          id="image"
          type="file"
          accept="image/*"
          placeholder={t("create.post.image.placeholder")}
          {...register("image")}
        />
      </div>
      {errors.image && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {errors.image.message}
        </p>
      )}

      {imagePreview && (
        <Card className="mt-6 overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="relative group/image">
              <img
                src={imagePreview}
                alt={t("create.post.image.preview")}
                className="w-full h-auto rounded-xl object-contain max-h-96 transition-transform duration-300 group-hover/image:scale-[1.02]"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={onRemoveImage}
                className="absolute -top-3 -right-3 h-10 w-10 rounded-full shadow-xl hover:scale-110 transition-transform duration-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <ImageIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {watchImage?.[0]?.name}
                </span>
              </div>
              <span className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                {watchImage?.[0] ? Math.round(watchImage[0].size / 1024) : ""}
                KB
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageUploadSection;
