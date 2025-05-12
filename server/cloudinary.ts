import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables or defaults
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/**
 * Upload an image to Cloudinary
 * @param base64Image - Base64 encoded image data
 * @returns Promise resolving to upload result
 */
export async function uploadImage(base64Image: string): Promise<CloudinaryUploadResult> {
  try {
    // Upload to the students folder in Cloudinary
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image,
        {
          folder: 'students',
          resource_type: 'image',
          use_filename: false,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        }
      );
    });
    
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise resolving to deletion result
 */
export async function deleteImage(publicId: string): Promise<{ result: string }> {
  try {
    return await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as { result: string });
          }
        }
      );
    });
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Get the public ID from a Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns The public ID
 */
export function getPublicIdFromUrl(url: string): string | null {
  // URLs are like: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image_id.jpg
  try {
    const urlParts = url.split('/');
    const filenamePart = urlParts[urlParts.length - 1];
    const folderPart = urlParts[urlParts.length - 2];
    return `${folderPart}/${filenamePart.split('.')[0]}`;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}
