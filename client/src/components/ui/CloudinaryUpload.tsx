import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CloudinaryUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  maxSizeMB?: number;
}

export default function CloudinaryUpload({
  value,
  onChange,
  className = "",
  maxSizeMB = 1
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(value);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setImageUrl(value);
  }, [value]);

  // Function to handle file upload
  const uploadImage = async (file: File) => {
    // Check file size (max 1MB by default)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: `File size exceeds ${maxSizeMB}MB limit`
      });
      return;
    }

    // Check file type (only JPEG and PNG)
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPEG and PNG formats are allowed");
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Only JPEG and PNG formats are allowed"
      });
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "student_photos");
      formData.append("folder", "students");

      // In a real implementation, you would call the Cloudinary API
      // For this demo, we'll simulate an upload with a delay
      
      // Mock response - in a real app, this would come from the Cloudinary API
      setTimeout(() => {
        // Create a fake Cloudinary URL with a timestamp
        const timestamp = new Date().getTime();
        const mockCloudinaryUrl = `https://res.cloudinary.com/demo/image/upload/v${timestamp}/students/student_${timestamp}.jpg`;
        
        setImageUrl(mockCloudinaryUrl);
        onChange(mockCloudinaryUrl);
        setUploading(false);
        
        toast({
          title: "Upload successful",
          description: "Student photo has been uploaded"
        });
      }, 1500);
      
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload image. Please try again.");
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload image. Please try again."
      });
      setUploading(false);
    }
  };

  // File input change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  // Remove image handler
  const handleRemoveImage = () => {
    setImageUrl(undefined);
    onChange("");
  };

  return (
    <div className={`${className}`}>
      {imageUrl ? (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Student" 
            className="h-32 w-32 object-cover rounded-lg" 
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors hover:border-gray-400">
          <input
            type="file"
            id="cloudinary-upload"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label
            htmlFor="cloudinary-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-900">
              {uploading ? "Uploading..." : "Upload photo"}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              JPEG, PNG up to {maxSizeMB}MB
            </span>
          </label>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
