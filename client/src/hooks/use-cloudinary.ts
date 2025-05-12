import { useState } from 'react';

interface CloudinaryUploadOptions {
  maxSize?: number; // maximum file size in bytes (default: 1MB)
  acceptedTypes?: string[]; // accepted file types (default: ['image/jpeg', 'image/png'])
}

interface CloudinaryUploadResult {
  isUploading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<string | null>;
}

/**
 * Hook for handling file uploads (for Cloudinary)
 */
export function useCloudinaryUpload(options?: CloudinaryUploadOptions): CloudinaryUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultOptions: CloudinaryUploadOptions = {
    maxSize: 1024 * 1024, // 1MB
    acceptedTypes: ['image/jpeg', 'image/png']
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const uploadFile = async (file: File): Promise<string | null> => {
    // Reset state
    setError(null);
    
    // Validate file
    if (!file) {
      setError('No file selected');
      return null;
    }

    // Validate file type
    if (mergedOptions.acceptedTypes && !mergedOptions.acceptedTypes.includes(file.type)) {
      setError(`Invalid file type. Accepted types: ${mergedOptions.acceptedTypes.join(', ')}`);
      return null;
    }

    // Validate file size
    if (mergedOptions.maxSize && file.size > mergedOptions.maxSize) {
      setError(`File is too large. Maximum size: ${mergedOptions.maxSize / 1024 / 1024}MB`);
      return null;
    }

    // Create form data for upload
    const formData = new FormData();
    formData.append('photo', file);

    try {
      setIsUploading(true);
      
      // This is a placeholder - in a real implementation, you would upload the file
      // directly to the backend which will handle the Cloudinary upload
      // The backend route would look something like '/api/upload-image'
      
      return file.name;
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, error, uploadFile };
}
