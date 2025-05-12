import axios from "axios";
import { apiRequest } from "./queryClient";

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  resourceType: string;
}

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export async function getCloudinarySignature(): Promise<CloudinarySignature> {
  const response = await apiRequest("GET", "/api/protected/cloudinary-signature");
  return await response.json();
}

export async function uploadToCloudinary(
  file: File,
  options?: {
    maxSizeMB?: number;
    folder?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<CloudinaryUploadResult> {
  const maxSizeMB = options?.maxSizeMB || 1; // 1MB default
  
  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }
  
  // Get upload signature
  const { signature, timestamp, cloudName, apiKey, folder } = await getCloudinarySignature();
  
  // Create form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);
  
  // Upload to Cloudinary
  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    formData,
    {
      onUploadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    }
  );
  
  // Parse response
  return {
    publicId: response.data.public_id,
    url: response.data.url,
    secureUrl: response.data.secure_url,
    format: response.data.format,
    width: response.data.width,
    height: response.data.height,
    resourceType: response.data.resource_type,
  };
}

// Helper to get optimized Cloudinary image URL with transformations
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    crop?: "fill" | "scale" | "fit" | "thumb";
    quality?: number;
    format?: "auto" | "jpg" | "png" | "webp";
  }
): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  
  const transformations = [] as string[];
  
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.format) transformations.push(`f_${options.format}`);
  
  if (transformations.length === 0) return url;
  
  // Insert transformations into URL
  const transformationString = transformations.join(",");
  return url.replace("/upload/", `/upload/${transformationString}/`);
}
