import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

/**
 * Uploads an image to Cloudinary and returns the URL
 * @param imagePath Path to the image file
 * @param folder Folder in Cloudinary where the image should be stored
 * @returns URL of the uploaded image
 */
export async function uploadImage(imagePath: string, folder: string = 'students'): Promise<string> {
  try {
    // Check if Cloudinary credentials are available
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary credentials not set, using local file path instead');
      return imagePath;
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 500, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    });

    // Delete temporary file
    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error('Failed to delete temporary file:', err);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Deletes an image from Cloudinary
 * @param url URL of the image to delete
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // Check if Cloudinary credentials are available
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary credentials not set, skipping image deletion');
      return;
    }

    // Extract public ID from URL
    const publicId = url.split('/').slice(-1)[0].split('.')[0];
    
    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
}
