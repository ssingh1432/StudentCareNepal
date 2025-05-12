import { useState } from "react";

interface CloudinaryUploadProps {
  onSuccess: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "student_photos";
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "demo";

export function useCloudinaryUpload({ onSuccess, onError }: CloudinaryUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadImage = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      const error = new Error("Please upload a valid image file (JPG or PNG)");
      setUploadState({ ...uploadState, error });
      onError?.(error);
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      const error = new Error("Image size should not exceed 1MB");
      setUploadState({ ...uploadState, error });
      onError?.(error);
      return;
    }

    setUploadState({ isUploading: true, progress: 0, error: null });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "students");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setUploadState({ isUploading: false, progress: 100, error: null });
      onSuccess(data.secure_url);
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error("Unknown upload error");
      setUploadState({ isUploading: false, progress: 0, error: uploadError });
      onError?.(uploadError);
    }
  };

  return {
    uploadImage,
    ...uploadState,
  };
}
