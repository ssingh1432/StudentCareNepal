import { apiRequest } from './queryClient';

// Define the response type for Cloudinary uploads
interface CloudinaryUploadResponse {
  url: string;
  publicId: string;
}

// Cloudinary API for handling photo uploads
export const uploadPhoto = async (file: File): Promise<CloudinaryUploadResponse> => {
  // Create FormData for the file upload
  const formData = new FormData();
  formData.append('photo', file);

  // Make the API request
  const response = await fetch('/api/upload/photo', {
    method: 'POST',
    body: formData,
    credentials: 'include', // Include cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload photo');
  }

  return await response.json();
};

// Function to check if the file size is below 1MB
export const validateFileSize = (file: File, maxSizeInMB: number = 1): boolean => {
  const fileSizeInMB = file.size / (1024 * 1024);
  return fileSizeInMB <= maxSizeInMB;
};

// Function to check if the file type is acceptable (JPEG/PNG)
export const validateFileType = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  return allowedTypes.includes(file.type);
};

// Placeholder image URL for when no photo is available
export const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/demo/image/upload/v1693593728/avatar-placeholder_jjsrru.png';

// Component prop type for the Cloudinary photo upload component
export interface CloudinaryUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: Error) => void;
  initialImageUrl?: string;
  className?: string;
}

export default {
  uploadPhoto,
  validateFileSize,
  validateFileType,
  DEFAULT_AVATAR_URL
};
