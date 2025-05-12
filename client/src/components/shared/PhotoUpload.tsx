import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadPhoto, validateFileSize, validateFileType, DEFAULT_AVATAR_URL } from '@/lib/cloudinary';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  initialUrl?: string;
  onPhotoUploaded: (url: string) => void;
  className?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  initialUrl, 
  onPhotoUploaded, 
  className 
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(initialUrl || DEFAULT_AVATAR_URL);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 1MB)
    if (!validateFileSize(file)) {
      toast({
        title: "File size exceeded",
        description: "Photo must be less than 1MB in size",
        variant: "destructive"
      });
      return;
    }

    // Validate file type (JPEG/PNG only)
    if (!validateFileType(file)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG and PNG images are allowed",
        variant: "destructive"
      });
      return;
    }

    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadPhoto(file);
      setPhotoUrl(result.url);
      onPhotoUploaded(result.url);
      toast({
        title: "Upload successful",
        description: "Photo has been successfully uploaded",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearPhoto = () => {
    setPhotoUrl(DEFAULT_AVATAR_URL);
    onPhotoUploaded('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-purple-200 bg-purple-50 flex items-center justify-center">
          {photoUrl && photoUrl !== DEFAULT_AVATAR_URL ? (
            <img 
              src={photoUrl} 
              alt="Student" 
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-10 w-10 text-purple-300" />
          )}
        </div>
        
        {photoUrl && photoUrl !== DEFAULT_AVATAR_URL && (
          <button 
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            onClick={clearPhoto}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/jpeg,image/png"
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={triggerFileInput}
        disabled={isUploading}
      >
        {isUploading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </span>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </>
        )}
      </Button>
    </div>
  );
};

export default PhotoUpload;
