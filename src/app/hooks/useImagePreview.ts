import { useState, useEffect } from "react";

export const useImagePreview = (watchImage: FileList | null) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!watchImage || watchImage.length === 0) {
      setImagePreview(null);
      return;
    }

    // 画像が選択された場合、プレビューを表示
    const file = watchImage[0];
    if (file) {
      const objUrl = URL.createObjectURL(file);
      setImagePreview(objUrl);

      // コンポーネントのアンマウント時にオブジェクトURLを解放
      return () => URL.revokeObjectURL(objUrl);
    }

    return () => {};
  }, [watchImage]);

  const handleRemoveImage = (
    setValue: (name: string, value: FileList) => void,
  ) => {
    setValue(
      "image",
      (typeof window !== "undefined"
        ? new DataTransfer().files
        : null) as FileList,
    );
    setImagePreview(null);
  };

  return {
    imagePreview,
    handleRemoveImage,
  };
};
