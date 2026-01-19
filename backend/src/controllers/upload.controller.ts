import { v2 as cloudinary } from "cloudinary";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../lib/prisma.ts";
import { API_KEY, API_SECRET, CLOUD_NAME } from "../Constants.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

interface UploadFile {
  path: string;
  original_filename?: string;
}

interface FileMeta {
  filename: string;
}

const uploadController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const files = req.files as UploadFile[] | undefined;

    if (!files || files.length === 0) {
      throw new ApiError(400, "No files provided");
    }

    const filePaths = files.map((file) => file.path);

    const cloudinaryFiles = await Promise.all(
      filePaths.map(uploadOnCloudinary)
    );

    const dbFiles = cloudinaryFiles.map((file) => ({
      name: file.original_filename,
      publicId: file.public_id,
      url: file.secure_url,
      size: file.bytes,
      format: file.format,
      resourceType: file.resource_type,
      width: file.width || null,
      height: file.height || null,
    }));

    const storedFiles = await prisma.file.createManyAndReturn({
      data: dbFiles,
    });

    if (!storedFiles || storedFiles.length === 0) {
      throw new ApiError(500, "Failed to store file info in database");
    }

    res
      .status(200)
      .json(new ApiResponse(200, storedFiles, "Files uploaded successfully"));
  }
);

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
        "Cloudinary API credentials are not properly configured"
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
        API_SECRET as string
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
  }
);

export { signUploadForm, uploadController };
