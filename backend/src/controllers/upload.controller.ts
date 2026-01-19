import { v2 as cloudinary } from "cloudinary";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../lib/prisma.ts";
import { API_KEY, API_SECRET, CLOUD_NAME } from "../Constants.ts";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/asynchandler.ts";
import { uploadOnCloudinary } from "../utils/cloudinary.ts";
import type { CloudinaryUploadResponse } from "../types/cloudinary.types.ts";

interface UploadFile {
  path: string;
  original_filename?: string;
}

interface FileMeta {
  filename: string;
}

// const uploadController = asyncHandler(
//   async (req: Request, res: Response): Promise<void> => {
//     const files = req.files as UploadFile[] | undefined;

//     if (!files || files.length === 0) {
//       throw new ApiError(400, "No files provided");
//     }

//     const filePaths = files.map((file) => file.path);

//     const cloudinaryFiles = await Promise.all(
//       filePaths.map(uploadOnCloudinary),
//     );

//     const dbFiles = cloudinaryFiles.map((file) => ({
//       name: file.original_filename,
//       publicId: file.public_id,
//       url: file.secure_url,
//       size: file.bytes,
//       format: file.format,
//       resourceType: file.resource_type,
//       width: file.width || null,
//       height: file.height || null,
//     }));

//     const storedFiles = await prisma.file.createManyAndReturn({
//       data: dbFiles,
//     });

//     if (!storedFiles || storedFiles.length === 0) {
//       throw new ApiError(500, "Failed to store file info in database");
//     }

//     res
//       .status(200)
//       .json(new ApiResponse(200, storedFiles, "Files uploaded successfully"));
//   },
// );

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

// helper: create a safe public_id suffix from a filename (optional)
function slugifyFilename(name: string = ""): string {
  return name
    .toLowerCase()
    .replace(/\.[^/.]+$/, "") // remove extension
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * POST /api/cloudinary/signuploadform
 * Body:
 *  {
 *    files: [{ filename: "a.png" }, { filename: "b.pdf" }],
 *    folder?: "signed_upload_demo_form"
 *  }
 *
 * Returns: signing bundle per file:
 *  [
 *    { filename, public_id, timestamp, signature, eager, folder, apikey, cloudname }
 *  ]
 */
const signUploadForm = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!API_SECRET || !CLOUD_NAME || !API_KEY) {
      throw new ApiError(
        500,
        "Cloudinary API credentials are not properly configured",
      );
    }

    const folder =
      typeof req.body?.folder === "string" && req.body.folder.trim()
        ? req.body.folder.trim()
        : "signed_upload_demo_form";

    const files = Array.isArray(req.body?.files)
      ? (req.body.files as FileMeta[])
      : [];
    if (files.length === 0) {
      throw new ApiError(400, "No files provided to sign");
    }

    // Per-file signature: timestamp + eager + folder + public_id
    const signed = files.map((f) => {
      const original = typeof f?.filename === "string" ? f.filename : "file";
      const base = slugifyFilename(original) || "file";
      const public_id = `${folder}/${base}-${uuidv4()}`; // unique + grouped under folder

      const timestamp = Math.round(Date.now() / 1000);

      const eager = "c_pad,h_300,w_400|c_crop,h_200,w_260";

      const params = { timestamp, folder, public_id, eager };

      const signature = cloudinary.utils.api_sign_request(
        params,
        API_SECRET as string,
      );

      return {
        filename: original,
        cloudname: CLOUD_NAME,
        apikey: API_KEY,
        timestamp,
        signature,
        eager,
        folder,
        public_id,
      };
    });

    res
      .status(200)
      .json(new ApiResponse(200, signed, "Signed upload forms generated"));
  },
);

const storeIntoDB = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const cloudinaryData: CloudinaryUploadResponse = req.body;

    const file = await prisma.file.create({
      data: {
        name: cloudinaryData.original_filename,
        publicId: cloudinaryData.public_id,
        url: cloudinaryData.secure_url,
        size: cloudinaryData.bytes,
        format: cloudinaryData.format,
        resourceType: cloudinaryData.resource_type,
        width: cloudinaryData.width,
        height: cloudinaryData.height,
        assetId: cloudinaryData.asset_id,
        displayName: cloudinaryData.display_name,
      },
    });

    console.log("Stored file in DB:", file);

    res.status(201).json(new ApiResponse(201, null, "File metadata stored"));
  },
);

export { signUploadForm, storeIntoDB };
