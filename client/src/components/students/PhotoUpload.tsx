import { useState } from "react";
import { useCloudinaryUpload } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, User } from "lucide-react";

interface PhotoUploadProps {
  initialImageUrl?: string;
  initialPublicId?: string;
  onPhotoChange: (url: string, publicId: string) => void;
}

const PhotoUpload = ({ initialImageUrl, initialPublicId, onPhotoChange }: PhotoUploadProps) => {
  const [imageUrl, setImageUrl] = useState(initialImageUrl || "");
  const [publicId, setPublicId] = useState(initialPublicId || "");
  const { uploadImage, deleteImage, uploading } = useCloudinaryUpload();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // First, remove existing image if any
    if (publicId) {
      await handleRemoveImage();
    }
    
    const result = await uploadImage(file);
    if (result) {
      setImageUrl(result.url);
      setPublicId(result.publicId);
      onPhotoChange(result.url, result.publicId);
    }
    
    // Clear the input
    e.target.value = '';
  };
  
  const handleRemoveImage = async () => {
    if (publicId) {
      await deleteImage(publicId);
      setImageUrl("");
      setPublicId("");
      onPhotoChange("", "");
    }
  };
  
  return (
    <div className="mt-1 flex flex-col items-center">
      <div className="flex justify-center mb-4">
        {imageUrl ? (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Student photo" 
              className="h-32 w-32 rounded-full object-cover border-2 border-purple-100"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
              onClick={handleRemoveImage}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="mt-2">
        <label htmlFor="photo-upload" className="cursor-pointer">
          <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            {uploading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {imageUrl ? "Change Photo" : "Upload Photo"}
              </>
            )}
          </span>
          <input
            id="photo-upload"
            name="photo-upload"
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        <p className="mt-1 text-xs text-gray-500">JPG or PNG, max 1MB</p>
      </div>
    </div>
  );
};

export default PhotoUpload;
