import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string) => void;
  currentImageUrl?: string;
}

export function CloudinaryUpload({ onUploadSuccess, currentImageUrl }: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image less than 1MB in size.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG or PNG image.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      onUploadSuccess(data.url);
      
      toast({
        title: "Upload successful",
        description: "The image has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
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
    <div className="flex flex-col items-center">
      {currentImageUrl && (
        <div className="mb-3">
          <img 
            src={currentImageUrl} 
            alt="Current" 
            className="h-24 w-24 rounded-full object-cover border-2 border-white shadow"
          />
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        accept="image/jpeg,image/png"
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
            Upload Photo
          </>
        )}
      </Button>
    </div>
  );
}
