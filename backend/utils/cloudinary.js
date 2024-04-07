const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, public_id) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      public_id,
    });
    return response.secure_url;
  } catch (error) {
    throw error;
  }
};

const deleteFromCloudinary = async (public_id) => {
  try {
    const response = await cloudinary.uploader.destroy(public_id);
    return response;
  } catch (error) {
    throw error;
  }
};

module.exports = { uploadOnCloudinary, deleteFromCloudinary };
