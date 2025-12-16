import dotenv from "dotenv";
dotenv.config();

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Allowed MIME types
const IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const DOCUMENT_MIMES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
  "application/x-7z-compressed",
  "application/vnd.rar",
];

// Limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB (for raw/files)
const GLOBAL_MAX_SIZE = MAX_FILE_SIZE; // multer global limit

const isImage = (mimetype) => IMAGE_MIMES.includes(mimetype);
const isDocument = (mimetype) => DOCUMENT_MIMES.includes(mimetype);

// helper for public id
const makePublicId = (file) =>
  `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

// Dynamic Cloudinary storage: image => resource_type image; others => raw
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const img = isImage(file.mimetype);
    const folderBase = (req.body && req.body.folderBase) || "Chattify";
    const folder = img ? `${folderBase}/chat-images` : `${folderBase}/chat-files`;
    return {
      folder,
      resource_type: img ? "image" : "raw",
      public_id: makePublicId(file),
    };
  },
});

// Multer middleware accepting images and documents
const uploadAny = multer({
  storage,
  limits: { fileSize: GLOBAL_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (isImage(file.mimetype) || isDocument(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Allowed image or document types only."));
    }
  },
});

// Helper to delete a file from Cloudinary by public_id and resource_type
async function deleteUploadedFile(public_id, resource_type = "raw") {
  try {
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type,
    });
    return result;
  } catch (err) {
    // propagate error or log as needed
    throw err;
  }
}

export {
  cloudinary,
  uploadAny,
  deleteUploadedFile,
  isImage,
  MAX_IMAGE_SIZE,
  MAX_FILE_SIZE,
  IMAGE_MIMES,
  DOCUMENT_MIMES,
};














// import dotenv from "dotenv";
// dotenv.config();

// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { v2 as cloudinary } from "cloudinary";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Allowed MIME types
// const IMAGE_MIMES = [
//   "image/png",
//   "image/jpeg",
//   "image/jpg",
//   "image/webp",
//   "image/gif",
// ];

// const DOCUMENT_MIMES = [
//   "application/pdf",
//   "application/msword", // .doc
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
//   "application/vnd.ms-excel",
//   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//   "text/plain",
//   "application/zip",
//   "application/x-7z-compressed",
//   "application/vnd.rar",
// ];

// // Limits
// const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
// const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB (for raw/files)
// const GLOBAL_MAX_SIZE = MAX_FILE_SIZE; // multer global limit

// const isImage = (mimetype) => IMAGE_MIMES.includes(mimetype);
// const isDocument = (mimetype) => DOCUMENT_MIMES.includes(mimetype);

// // helper for public id
// const makePublicId = (file) =>
//   `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

// // Dynamic Cloudinary storage: image => resource_type image; others => raw
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: (req, file) => {
//     const img = isImage(file.mimetype);
//     const folderBase = (req.body && req.body.folderBase) || "Chattify";
//     const folder = img ? `${folderBase}/chat-images` : `${folderBase}/chat-files`;
//     return {
//       folder,
//       resource_type: img ? "image" : "raw",
//       public_id: makePublicId(file),
//     };
//   },
// });

// // Multer middleware accepting images and documents
// const uploadAny = multer({
//   storage,
//   limits: { fileSize: GLOBAL_MAX_SIZE },
//   fileFilter: (req, file, cb) => {
//     if (isImage(file.mimetype) || isDocument(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Unsupported file type. Allowed image or document types only."));
//     }
//   },
// });

// // Helper to delete a file from Cloudinary by public_id and resource_type
// async function deleteUploadedFile(public_id, resource_type = "raw") {
//   try {
//     const result = await cloudinary.uploader.destroy(public_id, {
//       resource_type,
//     });
//     return result;
//   } catch (err) {
//     // propagate error or log as needed
//     throw err;
//   }
// }

// export {
//   cloudinary,
//   uploadAny,
//   deleteUploadedFile,
//   isImage,
//   MAX_IMAGE_SIZE,
//   MAX_FILE_SIZE,
//   IMAGE_MIMES,
//   DOCUMENT_MIMES,
// };