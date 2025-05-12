import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CloudinaryUploadProps {
  studentId: number;
  currentPhotoUrl?: string | null;
  onUploadComplete: (photoUrl: string) => void;
}

export function CloudinaryUpload({ studentId, currentPhotoUrl, onUploadComplete }: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Photo must be less than 1MB in size.",
        variant: "destructive"
      });
      return;
    }

    // File type validation
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG and PNG images are allowed.",
        variant: "destructive"
      });
      return;
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload the file
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`/api/students/${studentId}/photo`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      onUploadComplete(result.photoUrl);
      
      toast({
        title: "Upload successful",
        description: "Student photo has been updated.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
      
      // Reset preview if upload failed
      if (currentPhotoUrl) {
        setPreviewUrl(currentPhotoUrl);
      } else {
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 relative">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Student" 
            className="h-32 w-32 rounded-full object-cover border-4 border-purple-100"
          />
        ) : (
          <div className="h-32 w-32 rounded-full bg-purple-100 flex items-center justify-center">
            <Camera className="h-12 w-12 text-purple-400" />
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png"
        className="hidden"
      />
      
      <Button 
        type="button" 
        variant="outline" 
        size="sm"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="flex items-center"
      >
        <Upload className="mr-2 h-4 w-4" />
        {previewUrl ? "Change Photo" : "Upload Photo"}
      </Button>
      
      <p className="mt-2 text-xs text-gray-500">
        Max size: 1MB. Formats: JPEG, PNG
      </p>
    </div>
  );
}
