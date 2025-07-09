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
    const objUrl = URL.createObjectURL(file);
    setImagePreview(objUrl);

    // コンポーネントのアンマウント時にオブジェクトURLを解放
    return () => URL.revokeObjectURL(objUrl);
  }, [watchImage]);

  const handleRemoveImage = (
    setValue: (name: string, value: FileList) => void,
  ) => {
    setValue("image", new DataTransfer().files as FileList);
    setImagePreview(null);
  };

  return {
    imagePreview,
    handleRemoveImage,
  };
};
