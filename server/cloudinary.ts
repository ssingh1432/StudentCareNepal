import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Upload an image to Cloudinary
 * @param imageBuffer The image buffer to upload
 * @returns Cloudinary upload result
 */
export async function uploadImage(imageBuffer: Buffer) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary API credentials not configured');
    }
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:image/jpeg;base64,${base64Image}`,
        {
          folder: 'students', // Store in the 'students' folder
          resource_type: 'image',
          transformation: [
            { width: 200, height: 200, crop: 'fill' }, // Resize to 200x200
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
    
    return result;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId Cloudinary public ID of the image
 * @returns Cloudinary delete result
 */
export async function deleteImage(publicId: string) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary API credentials not configured');
    }
    
    // Delete from Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        {},
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
    
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}
