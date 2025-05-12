import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCloudinaryUpload } from "@/lib/cloudinary";

interface CloudinaryUploadProps {
  onImageUploaded: (url: string) => void;
  defaultImage?: string;
  className?: string;
}

export default function CloudinaryUpload({
  onImageUploaded,
  defaultImage,
  className = "",
}: CloudinaryUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(defaultImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadImage, isUploading, error } = useCloudinaryUpload({
    onSuccess: (url) => {
      setImageUrl(url);
      onImageUploaded(url);
    },
  });

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png"
        className="hidden"
      />

      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="h-32 w-32 object-cover rounded-full border-2 border-purple-200"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className="h-32 w-32 border-2 border-dashed rounded-full flex items-center justify-center bg-gray-50 cursor-pointer"
          onClick={handleButtonClick}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          ) : (
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <span className="text-xs text-gray-500 mt-1 block">Upload Photo</span>
            </div>
          )}
        </div>
      )}

      {!isUploading && (
        <Button
          type="button"
          onClick={handleButtonClick}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          {imageUrl ? "Change Photo" : "Upload Photo"}
        </Button>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
      )}
      
      <p className="text-xs text-gray-500 mt-1">Max size: 1MB (JPG/PNG)</p>
    </div>
  );
}
