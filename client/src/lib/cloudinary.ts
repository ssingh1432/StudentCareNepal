// This file handles Cloudinary API integration

// The Cloudinary API key will come from the environment variables
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Types for Cloudinary response
export type CloudinaryUploadResponse = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
};

// Function to upload an image to Cloudinary
export const uploadImage = async (file: File): Promise<CloudinaryUploadResponse> => {
  // Create form data for the upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'students');
  formData.append('folder', 'students');
  
  // Upload the image to Cloudinary
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload image: ${errorText}`);
  }
  
  return response.json();
};

// Function to delete an image from Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  // In a real application, this would call a backend endpoint
  // that would make the Cloudinary delete API call with proper authentication
  // We don't call Cloudinary directly from the frontend for deletion
  // as it would require exposing the API secret
  const response = await fetch(`/api/cloudinary/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicId }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete image: ${errorText}`);
  }
};
