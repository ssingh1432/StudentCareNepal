import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadIcon, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageUploadProps {
  initialImage?: string;
  onImageUpload: (imageUrl: string) => void;
  className?: string;
}

export function ImageUpload({
  initialImage,
  onImageUpload,
  className
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 1MB",
        variant: "destructive"
      });
      return;
    }

    // File type validation
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG and PNG images are allowed",
        variant: "destructive"
      });
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);

    try {
      // Convert file to base64
      const base64Image = await fileToBase64(file);
      
      // Upload to server
      const response = await apiRequest('POST', '/api/upload', { image: base64Image });
      const data = await response.json();
      
      // Update with the Cloudinary URL
      onImageUpload(data.url);
      setPreviewUrl(data.url);
      
      toast({
        title: "Image uploaded successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const clearImage = () => {
    setPreviewUrl(null);
    onImageUpload('');
  };

  return (
    <div className={className}>
      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border">
          {isUploading ? (
            <Skeleton className="w-full h-full rounded-full" />
          ) : previewUrl ? (
            <div className="relative w-full h-full">
              <img 
                src={previewUrl} 
                alt="Student" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 m-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="text-gray-400">
              <UploadIcon className="h-8 w-8" />
            </div>
          )}
        </div>
        
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            {isUploading ? "Uploading..." : "Upload Photo"}
          </Button>
          <p className="mt-1 text-xs text-gray-500">
            JPEG or PNG. Max 1MB.
          </p>
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>
    </div>
  );
}
