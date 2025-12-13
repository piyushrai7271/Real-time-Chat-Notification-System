import dotenv from "dotenv";
dotenv.config();

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

// 🔐 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Allowed image MIME types
const allowedImageTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

// 🌥️ Cloudinary storage for IMAGES ONLY
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Chattify/profile-images",
    resource_type: "image", // 🚨 force image only
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
  },
});

// 📦 Multer middleware
const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only image files (png, jpg, jpeg, webp) are allowed"),
        false
      );
    }
    cb(null, true);
  },
});

export { uploadImage, cloudinary };
