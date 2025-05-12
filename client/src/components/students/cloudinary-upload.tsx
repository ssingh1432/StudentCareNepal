import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/cloudinary";

interface CloudinaryUploadProps {
  onSuccess: (url: string, publicId: string) => void;
}

export function CloudinaryUpload({ onSuccess }: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "The image must be less than 1MB in size.",
        variant: "destructive",
      });
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Check file type (only JPEG and PNG)
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG and PNG images are allowed.",
        variant: "destructive",
      });
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFileName(file.name);
    setIsUploading(true);

    try {
      // Upload to Cloudinary
      const result = await uploadImage(file);
      
      toast({
        title: "Upload Successful",
        description: "The image has been uploaded successfully.",
      });
      
      onSuccess(result.secure_url, result.public_id);
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Photo
          </>
        )}
      </Button>
      {fileName && !isUploading && (
        <span className="text-sm text-gray-500">{fileName}</span>
      )}
    </div>
  );
}
