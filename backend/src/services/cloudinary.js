import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: process.env.CLOUDINARY_SECURE !== 'false',
});

/**
 * Check if Cloudinary credentials are fully configured.
 * Does not throw; returns false to allow graceful fallback/mock in tests & local dev.
 */
export function isCloudinaryConfigured() {
  return Boolean(cloudName && apiKey && apiSecret);
}

/**
 * Generate a SHA-1 / SHA-256 signature for client-side direct uploads.
 * This guarantees CLOUDINARY_API_SECRET is NEVER sent to the client.
 *
 * @param {Object} paramsToSign - Parameters to sign (e.g., { timestamp, folder, tags })
 * @returns {string} Signed hash string
 */
export function generateSignature(paramsToSign) {
  const secret = process.env.CLOUDINARY_API_SECRET || apiSecret;
  if (!secret) {
    throw new Error('CLOUDINARY_API_SECRET is not configured on the server');
  }
  return cloudinary.utils.api_sign_request(paramsToSign, secret);
}

/**
 * Upload a file buffer / stream directly to Cloudinary (server-mediated upload).
 *
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options (folder, public_id, resource_type, etc.)
 * @returns {Promise<Object>} Cloudinary upload response object
 */
export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'chittech/documents',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete a media asset from Cloudinary by its public ID.
 *
 * @param {string} publicId - Cloudinary public ID of the asset
 * @param {Object} options - Resource type options
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export async function deleteAsset(publicId, options = {}) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: options.resource_type || 'image',
    ...options,
  });
}

export { cloudinary };
export default cloudinary;
