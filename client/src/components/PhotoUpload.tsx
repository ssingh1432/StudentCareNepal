import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { getImageThumbnail } from '@/lib/cloudinary';
import { Camera, Upload } from 'lucide-react';

interface PhotoUploadProps {
  existingImageUrl?: string;
  onFileSelected: (file: File | null) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  existingImageUrl, 
  onFileSelected 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(
    existingImageUrl ? getImageThumbnail(existingImageUrl, 100, 100) : ''
  );
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setError('File size must be less than 1MB');
      onFileSelected(null);
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPEG, JPG, and PNG images are allowed');
      onFileSelected(null);
      return;
    }
    
    // Reset error
    setError('');
    
    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Pass the file to parent component
    onFileSelected(file);
    
    // Clean up the object URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center justify-center w-full">
        <div className="flex flex-col items-center justify-center">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Student preview"
                className="h-32 w-32 rounded-full object-cover border-2 border-gray-300"
              />
              
              <Button
                type="button"
                size="sm"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                onClick={handleUploadClick}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="h-32 w-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={handleUploadClick}
            >
              <div className="flex flex-col items-center">
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="mt-2 text-xs text-gray-500">Upload Photo</span>
              </div>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg"
          />
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      <p className="text-xs text-gray-500">
        Upload a photo of the student (max 1MB, JPEG/PNG)
      </p>
    </div>
  );
};

export default PhotoUpload;
