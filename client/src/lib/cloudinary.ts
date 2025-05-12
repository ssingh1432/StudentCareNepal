import { apiRequest } from "@/lib/queryClient";

// Function to upload an image to Cloudinary
export async function uploadImage(file: File): Promise<string> {
  // First, get the signed upload params from our backend
  const getUploadParams = async () => {
    const response = await apiRequest('GET', '/api/cloudinary/signature', undefined);
    return await response.json();
  };

  try {
    // Get the upload parameters
    const { signature, timestamp, apiKey, cloudName } = await getUploadParams();
    
    // Create form data for the upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'students'); // Upload to the students folder
    
    // Upload directly to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Function to handle file input and upload, with fallback for offline mode
export async function handleImageUpload(file: File, fallbackUrl?: string): Promise<string> {
  try {
    // Check if we're online
    if (navigator.onLine) {
      return await uploadImage(file);
    } else {
      // If offline and fallback URL exists, return it
      if (fallbackUrl) {
        return fallbackUrl;
      }
      // Otherwise, create a data URL for local use
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  } catch (error) {
    console.error('Error handling image upload:', error);
    
    // If there's an error but we have a fallback URL, use it
    if (fallbackUrl) {
      return fallbackUrl;
    }
    
    // Otherwise, throw the error
    throw error;
  }
}

// Function to validate image before upload
export function validateImage(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.match(/image\/(jpeg|jpg|png)/i)) {
    return { 
      valid: false, 
      error: 'Only JPEG and PNG images are allowed.' 
    };
  }
  
  // Check file size (1MB maximum)
  if (file.size > 1024 * 1024) {
    return { 
      valid: false, 
      error: 'Image size must be less than 1MB.' 
    };
  }
  
  return { valid: true };
}
