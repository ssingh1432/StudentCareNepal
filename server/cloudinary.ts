import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

/**
 * Uploads a file buffer to Cloudinary
 * @param buffer - The file buffer to upload
 * @param folder - The folder to upload to
 * @returns The upload result with secure_url and public_id
 */
export async function cloudinaryUpload(
  buffer: Buffer,
  folder: string = 'students'
): Promise<{ secure_url: string; public_id: string }> {
  // Check if Cloudinary API key is configured
  if (!process.env.CLOUDINARY_API_KEY) {
    console.warn('Cloudinary API key not configured, using placeholder image');
    return {
      secure_url: 'https://via.placeholder.com/150',
      public_id: 'placeholder'
    };
  }

  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('No result from Cloudinary'));
          
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id
          });
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Deletes an image from Cloudinary by public_id
 * @param publicId - The public ID of the image to delete
 */
export async function cloudinaryDelete(publicId: string): Promise<void> {
  // Check if Cloudinary API key is configured
  if (!process.env.CLOUDINARY_API_KEY) {
    console.warn('Cloudinary API key not configured, skipping delete');
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}
