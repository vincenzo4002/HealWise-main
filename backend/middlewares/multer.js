// middlewares/multer.js
import multer from "multer";
import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import streamifier from "streamifier";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// CloudinaryStorage (optional) for direct image uploads (still usable)
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "healwise/images",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  },
});

// Exported if you ever want a multer instance that writes directly to Cloudinary (images)
export const uploadImage = multer({ storage: imageStorage });

// ---------- Combined upload (profileImage + resume) ----------
// Use memoryStorage so we can control how each file is uploaded (resume -> raw)
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profileImage") {
    // Validate image types
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Profile image must be an image file"));
    }
  } else if (file.fieldname === "resume") {
    // Validate resume types (pdf/doc/docx/txt)
    const allowed = [
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "text/plain",
    ];
    if (file.mimetype && (allowed.includes(file.mimetype) || file.mimetype.includes("msword") || file.mimetype.includes("officedocument"))) {
      cb(null, true);
    } else {
      cb(new Error("Resume must be a PDF or document file"));
    }
  } else {
    cb(null, false);
  }
};

export const uploadJobApplication = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit — adjust as needed
  },
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "resume", maxCount: 1 },
]);

// ---------- Robust upload helper (supports disk path OR buffer) ----------
export const uploadToCloudinary = async (file, folder = "healwise", resourceType = "image") => {
  // file: either { path } (disk) OR { buffer, originalname, mimetype } (memory)
  if (!file) throw new Error("No file provided to uploadToCloudinary");

  // If file.path exists (disk-based), use uploader.upload
  if (file.path) {
    const res = await cloudinary.v2.uploader.upload(file.path, {
      folder,
      resource_type: resourceType, // 'image' | 'raw' | 'auto'
    });
    return {
      url: res.secure_url,
      publicId: res.public_id,
      resource_type: res.resource_type,
      raw: res,
    };
  }

  // If buffer exists, upload via upload_stream
  if (file.buffer) {
    return new Promise((resolve, reject) => {
      const opts = {
        folder,
        resource_type: resourceType,
        // you can add more options here: public_id, transformation, etc.
      };
      const uploadStream = cloudinary.v2.uploader.upload_stream(opts, (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resource_type: result.resource_type,
          raw: result,
        });
      });

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  throw new Error("Unsupported file object passed to uploadToCloudinary");
};

// Convenience direct resume storage if you still want CloudinaryStorage for resumes:
export const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "healwise/resumes",
    resource_type: "raw", // <-- important to use 'raw' here
    allowed_formats: ["pdf", "doc", "docx", "txt"],
  },
});

// If you want a multer instance that directly streams resumes to Cloudinary:
export const uploadResumeDirect = multer({ storage: resumeStorage });

export default uploadImage;
